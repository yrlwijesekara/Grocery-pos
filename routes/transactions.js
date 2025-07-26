const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      items, 
      customer, 
      payments, 
      couponsUsed = [], 
      loyaltyPointsUsed = 0,
      notes 
    } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Transaction must have at least one item' });
    }
    
    if (!payments || payments.length === 0) {
      return res.status(400).json({ message: 'Transaction must have at least one payment method' });
    }
    
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const processedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          message: `Product not found: ${item.product}` 
        });
      }
      
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}` 
        });
      }
      
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = product.taxable ? itemTotal * product.taxRate : 0;
      
      processedItems.push({
        product: product._id,
        name: product.name,
        barcode: product.barcode,
        plu: product.plu,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        weight: item.weight || 0,
        taxAmount: itemTax,
        discountAmount: item.discountAmount || 0
      });
      
      subtotal += itemTotal;
      totalTax += itemTax;
      totalDiscount += item.discountAmount || 0;
      
      product.stockQuantity -= item.quantity;
      await product.save();
    }
    
    let couponDiscount = 0;
    const processedCoupons = [];
    
    for (const couponCode of couponsUsed) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const customerDoc = customer ? await Customer.findById(customer) : null;
        const validation = coupon.isValid(customerDoc);
        
        if (validation.valid) {
          const discount = coupon.calculateDiscount(processedItems, subtotal);
          couponDiscount += discount;
          
          processedCoupons.push({
            couponId: coupon._id,
            code: coupon.code,
            discountAmount: discount
          });
          
          coupon.currentUsage += 1;
          await coupon.save();
        }
      }
    }
    
    totalDiscount += couponDiscount;
    
    const finalSubtotal = subtotal - totalDiscount;
    const finalTotal = finalSubtotal + totalTax;
    
    let loyaltyDiscount = 0;
    if (loyaltyPointsUsed > 0 && customer) {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc && customerDoc.loyaltyProgram.points >= loyaltyPointsUsed) {
        loyaltyDiscount = loyaltyPointsUsed * 0.01;
        customerDoc.loyaltyProgram.points -= loyaltyPointsUsed;
        await customerDoc.save();
      }
    }
    
    const finalAmount = finalTotal - loyaltyDiscount;
    
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const changeGiven = Math.max(0, totalPayments - finalAmount);
    
    if (totalPayments < finalAmount - 0.01) {
      return res.status(400).json({ 
        message: 'Insufficient payment amount',
        required: finalAmount,
        provided: totalPayments
      });
    }
    
    const transaction = new Transaction({
      items: processedItems,
      customer: customer || null,
      cashier: req.user._id,
      subtotal: subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount + loyaltyDiscount,
      totalAmount: finalAmount,
      payments: payments,
      changeGiven: changeGiven,
      couponsUsed: processedCoupons,
      loyaltyPointsUsed: loyaltyPointsUsed,
      notes: notes
    });
    
    await transaction.save();
    
    if (customer) {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        customerDoc.purchaseHistory.totalSpent += finalAmount;
        customerDoc.purchaseHistory.totalTransactions += 1;
        customerDoc.purchaseHistory.averageTransactionAmount = 
          customerDoc.purchaseHistory.totalSpent / customerDoc.purchaseHistory.totalTransactions;
        customerDoc.purchaseHistory.lastPurchaseDate = new Date();
        
        const pointsEarned = customerDoc.addPoints(finalAmount);
        customerDoc.updateLoyaltyTier();
        
        transaction.loyaltyPointsEarned = pointsEarned;
        
        await customerDoc.save();
        await transaction.save();
      }
    }
    
    req.user.performance.totalTransactions += 1;
    req.user.performance.totalSales += finalAmount;
    await req.user.save();
    
    const io = req.app.get('socketio');
    io.emit('transaction-completed', {
      transactionId: transaction.transactionId,
      cashier: req.user.firstName + ' ' + req.user.lastName,
      amount: finalAmount,
      items: processedItems.length
    });
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('items.product', 'name category')
      .populate('customer', 'firstName lastName loyaltyProgram')
      .populate('cashier', 'firstName lastName employeeId');
    
    res.status(201).json({
      message: 'Transaction completed successfully',
      transaction: populatedTransaction
    });
    
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ message: 'Server error during transaction processing' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      startDate, 
      endDate, 
      cashier, 
      status = 'completed' 
    } = req.query;
    
    let query = { status };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (cashier) {
      query.cashier = cashier;
    }
    
    const transactions = await Transaction.find(query)
      .populate('customer', 'firstName lastName loyaltyProgram')
      .populate('cashier', 'firstName lastName employeeId')
      .populate('items.product', 'name category')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Transactions list error:', error);
    res.status(500).json({ message: 'Server error during transactions list' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customer', 'firstName lastName loyaltyProgram email phone')
      .populate('cashier', 'firstName lastName employeeId')
      .populate('items.product', 'name category barcode plu')
      .populate('couponsUsed.couponId', 'name code discountType');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Transaction lookup error:', error);
    res.status(500).json({ message: 'Server error during transaction lookup' });
  }
});

router.put('/:id/void', authMiddleware, checkPermission('canVoidTransactions'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Void reason is required' });
    }
    
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed transactions can be voided' });
    }
    
    for (const item of transaction.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save();
      }
    }
    
    if (transaction.customer) {
      const customer = await Customer.findById(transaction.customer);
      if (customer) {
        customer.purchaseHistory.totalSpent -= transaction.totalAmount;
        customer.purchaseHistory.totalTransactions -= 1;
        customer.loyaltyProgram.points -= transaction.loyaltyPointsEarned;
        customer.loyaltyProgram.points += transaction.loyaltyPointsUsed;
        await customer.save();
      }
    }
    
    transaction.status = 'voided';
    transaction.voidedAt = new Date();
    transaction.notes = (transaction.notes || '') + `\nVoided: ${reason}`;
    
    await transaction.save();
    
    res.json({
      message: 'Transaction voided successfully',
      transaction: transaction
    });
  } catch (error) {
    console.error('Transaction void error:', error);
    res.status(500).json({ message: 'Server error during transaction void' });
  }
});

router.post('/:id/refund', authMiddleware, checkPermission('canProcessRefunds'), async (req, res) => {
  try {
    const { items, reason, refundMethod = 'original' } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Refund items are required' });
    }
    
    if (!reason) {
      return res.status(400).json({ message: 'Refund reason is required' });
    }
    
    const originalTransaction = await Transaction.findById(req.params.id);
    
    if (!originalTransaction) {
      return res.status(404).json({ message: 'Original transaction not found' });
    }
    
    if (originalTransaction.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed transactions can be refunded' });
    }
    
    let refundAmount = 0;
    const refundItems = [];
    
    for (const refundItem of items) {
      const originalItem = originalTransaction.items.find(
        item => item._id.toString() === refundItem.itemId
      );
      
      if (!originalItem) {
        return res.status(400).json({ 
          message: `Item not found in original transaction: ${refundItem.itemId}` 
        });
      }
      
      if (refundItem.quantity > originalItem.quantity) {
        return res.status(400).json({ 
          message: `Refund quantity exceeds original quantity for item: ${originalItem.name}` 
        });
      }
      
      const itemRefundAmount = (originalItem.totalPrice / originalItem.quantity) * refundItem.quantity;
      refundAmount += itemRefundAmount;
      
      refundItems.push({
        product: originalItem.product,
        name: originalItem.name,
        quantity: -refundItem.quantity,
        unitPrice: originalItem.unitPrice,
        totalPrice: -itemRefundAmount,
        taxAmount: -(originalItem.taxAmount / originalItem.quantity) * refundItem.quantity
      });
      
      const product = await Product.findById(originalItem.product);
      if (product) {
        product.stockQuantity += refundItem.quantity;
        await product.save();
      }
    }
    
    const refundTransaction = new Transaction({
      items: refundItems,
      customer: originalTransaction.customer,
      cashier: req.user._id,
      subtotal: -refundAmount,
      taxAmount: -refundItems.reduce((sum, item) => sum + item.taxAmount, 0),
      totalAmount: -refundAmount,
      payments: [{
        method: refundMethod,
        amount: -refundAmount
      }],
      status: 'completed',
      notes: `Refund for transaction ${originalTransaction.transactionId}. Reason: ${reason}`
    });
    
    await refundTransaction.save();
    
    res.json({
      message: 'Refund processed successfully',
      refundTransaction: refundTransaction,
      refundAmount: refundAmount
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ message: 'Server error during refund processing' });
  }
});

module.exports = router;
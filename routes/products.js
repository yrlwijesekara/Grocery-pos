const express = require('express');
const Product = require('../models/Product');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query, barcode, plu, category, lowStock } = req.query;
    let searchCriteria = { isActive: true };
    
    if (barcode) {
      searchCriteria.barcode = barcode;
    } else if (plu) {
      searchCriteria.plu = plu;
    } else if (query) {
      searchCriteria.$or = [
        { name: { $regex: query, $options: 'i' } },
        { barcode: { $regex: query, $options: 'i' } },
        { plu: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchCriteria.category = category;
    }
    
    if (lowStock === 'true') {
      searchCriteria.$expr = { $lte: ['$stockQuantity', '$lowStockThreshold'] };
    }
    
    const products = await Product.find(searchCriteria)
      .limit(50)
      .sort({ name: 1 });
    
    res.json(products);
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ message: 'Server error during product search' });
  }
});

router.get('/barcode/:barcode', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      barcode: req.params.barcode, 
      isActive: true 
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.stockQuantity <= 0) {
      return res.status(400).json({ 
        message: 'Product out of stock',
        product: product
      });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ message: 'Server error during barcode lookup' });
  }
});

router.get('/plu/:plu', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      plu: req.params.plu, 
      isActive: true 
    });
    
    if (!product) {
      return res.status(404).json({ message: 'PLU not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('PLU lookup error:', error);
    res.status(500).json({ message: 'Server error during PLU lookup' });
  }
});

router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.category,
      isActive: true
    }).sort({ name: 1 });
    
    res.json(products);
  } catch (error) {
    console.error('Category lookup error:', error);
    res.status(500).json({ message: 'Server error during category lookup' });
  }
});

router.get('/low-stock', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      isActive: true
    }).sort({ stockQuantity: 1 });
    
    res.json(lowStockProducts);
  } catch (error) {
    console.error('Low stock lookup error:', error);
    res.status(500).json({ message: 'Server error during low stock lookup' });
  }
});

router.post('/', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      message: 'Product created successfully',
      product: product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Product with this barcode or PLU already exists' 
      });
    }
    
    res.status(500).json({ message: 'Server error during product creation' });
  }
});

router.put('/:id', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const io = req.app.get('socketio');
    io.emit('inventory-updated', { 
      type: 'product-updated', 
      product: product 
    });
    
    res.json({
      message: 'Product updated successfully',
      product: product
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Server error during product update' });
  }
});

router.put('/:id/stock', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const { quantity, operation, reason, notes } = req.body;
    
    if (!quantity || !operation || !['add', 'subtract', 'set'].includes(operation)) {
      return res.status(400).json({ 
        message: 'Valid quantity and operation (add/subtract/set) are required' 
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({ 
        message: 'Quantity must be greater than 0' 
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const oldQuantity = product.stockQuantity;
    let newQuantity;
    
    switch (operation) {
      case 'add':
        newQuantity = product.stockQuantity + quantity;
        // Check if adding stock would exceed capacity
        if (newQuantity > product.stockCapacity) {
          return res.status(400).json({ 
            message: `Cannot add ${quantity} units. This would exceed the stock capacity of ${product.stockCapacity}. Current stock: ${product.stockQuantity}, Available capacity: ${product.stockCapacity - product.stockQuantity}`,
            currentStock: product.stockQuantity,
            capacity: product.stockCapacity,
            availableCapacity: product.stockCapacity - product.stockQuantity,
            requestedQuantity: quantity
          });
        }
        product.stockQuantity = newQuantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.stockQuantity - quantity);
        product.stockQuantity = newQuantity;
        break;
      case 'set':
        newQuantity = Math.max(0, quantity);
        // Check if setting stock would exceed capacity
        if (newQuantity > product.stockCapacity) {
          return res.status(400).json({ 
            message: `Cannot set stock to ${quantity}. This exceeds the stock capacity of ${product.stockCapacity}`,
            capacity: product.stockCapacity,
            requestedQuantity: quantity
          });
        }
        product.stockQuantity = newQuantity;
        break;
    }
    
    product.updatedAt = Date.now();
    await product.save();
    
    // Log the stock change
    console.log(`Stock ${operation}: ${product.name} (${product._id}) - ${oldQuantity} -> ${newQuantity} by user ${req.user.employeeId}. Reason: ${reason || 'Not specified'}`);
    
    // Send real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('inventory-updated', { 
        type: 'stock-updated', 
        product: {
          _id: product._id,
          name: product.name,
          stockQuantity: product.stockQuantity,
          stockCapacity: product.stockCapacity,
          lowStockThreshold: product.lowStockThreshold
        },
        operation: operation,
        quantity: quantity,
        oldQuantity: oldQuantity,
        newQuantity: newQuantity,
        updatedBy: req.user.firstName + ' ' + req.user.lastName,
        reason: reason || 'Stock adjustment'
      });
    }
    
    // Calculate stock status
    const stockPercentage = (product.stockQuantity / product.stockCapacity) * 100;
    const stockStatus = product.stockQuantity === 0 ? 'out_of_stock' :
                       product.stockQuantity <= product.lowStockThreshold ? 'low_stock' :
                       stockPercentage >= 90 ? 'near_capacity' : 'in_stock';
    
    res.json({
      message: 'Stock updated successfully',
      product: {
        _id: product._id,
        name: product.name,
        stockQuantity: product.stockQuantity,
        stockCapacity: product.stockCapacity,
        lowStockThreshold: product.lowStockThreshold,
        reorderPoint: product.reorderPoint,
        stockPercentage: Math.round(stockPercentage),
        stockStatus: stockStatus,
        availableCapacity: product.stockCapacity - product.stockQuantity
      },
      stockChange: {
        operation: operation,
        quantity: quantity,
        oldQuantity: oldQuantity,
        newQuantity: newQuantity,
        reason: reason || 'Stock adjustment',
        updatedBy: req.user.firstName + ' ' + req.user.lastName,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({ message: 'Server error during stock update' });
  }
});

router.delete('/:id', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Server error during product deletion' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, active = 'true' } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    if (category) {
      query.category = category;
    }
    
    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Products list error:', error);
    res.status(500).json({ message: 'Server error during products list' });
  }
});

module.exports = router;
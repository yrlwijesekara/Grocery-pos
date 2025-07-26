const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.get('/daily-sales', authMiddleware, checkPermission('canViewReports'), async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lt: endDate },
      status: 'completed'
    }).populate('cashier', 'firstName lastName employeeId');
    
    const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = transactions.length;
    const totalTax = transactions.reduce((sum, t) => sum + t.taxAmount, 0);
    const totalDiscounts = transactions.reduce((sum, t) => sum + t.discountAmount, 0);
    const totalItems = transactions.reduce((sum, t) => sum + t.items.length, 0);
    
    const paymentMethods = {};
    transactions.forEach(t => {
      t.payments.forEach(p => {
        paymentMethods[p.method] = (paymentMethods[p.method] || 0) + p.amount;
      });
    });
    
    const cashierStats = {};
    transactions.forEach(t => {
      const cashierId = t.cashier._id.toString();
      if (!cashierStats[cashierId]) {
        cashierStats[cashierId] = {
          name: `${t.cashier.firstName} ${t.cashier.lastName}`,
          employeeId: t.cashier.employeeId,
          transactions: 0,
          sales: 0
        };
      }
      cashierStats[cashierId].transactions += 1;
      cashierStats[cashierId].sales += t.totalAmount;
    });
    
    const hourlyStats = Array(24).fill(0).map((_, hour) => ({
      hour,
      transactions: 0,
      sales: 0
    }));
    
    transactions.forEach(t => {
      const hour = t.createdAt.getHours();
      hourlyStats[hour].transactions += 1;
      hourlyStats[hour].sales += t.totalAmount;
    });
    
    res.json({
      date,
      summary: {
        totalSales,
        totalTransactions,
        totalTax,
        totalDiscounts,
        totalItems,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0
      },
      paymentMethods,
      cashierStats: Object.values(cashierStats),
      hourlyStats: hourlyStats.filter(h => h.transactions > 0)
    });
  } catch (error) {
    console.error('Daily sales report error:', error);
    res.status(500).json({ message: 'Server error generating daily sales report' });
  }
});

router.get('/product-performance', authMiddleware, checkPermission('canViewReports'), async (req, res) => {
  try {
    const { startDate, endDate, category, limit = 50 } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const matchStage = { status: 'completed', ...dateFilter };
    
    const pipeline = [
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$productInfo.name' },
          category: { $first: '$productInfo.category' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          totalTransactions: { $sum: 1 },
          averagePrice: { $avg: '$items.unitPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ];
    
    if (category) {
      pipeline.splice(3, 0, { $match: { 'productInfo.category': category } });
    }
    
    const productStats = await Transaction.aggregate(pipeline);
    
    res.json(productStats);
  } catch (error) {
    console.error('Product performance report error:', error);
    res.status(500).json({ message: 'Server error generating product performance report' });
  }
});

router.get('/inventory-valuation', authMiddleware, checkPermission('canViewReports'), async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    
    let totalValue = 0;
    const categoryStats = {};
    
    products.forEach(product => {
      const value = product.stockQuantity * product.price;
      totalValue += value;
      
      if (!categoryStats[product.category]) {
        categoryStats[product.category] = {
          totalValue: 0,
          totalItems: 0,
          products: 0
        };
      }
      
      categoryStats[product.category].totalValue += value;
      categoryStats[product.category].totalItems += product.stockQuantity;
      categoryStats[product.category].products += 1;
    });
    
    const lowStockValue = await Product.aggregate([
      {
        $match: {
          $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      totalInventoryValue: totalValue,
      totalProducts: products.length,
      categoryBreakdown: categoryStats,
      lowStockSummary: lowStockValue[0] || { totalValue: 0, count: 0 }
    });
  } catch (error) {
    console.error('Inventory valuation report error:', error);
    res.status(500).json({ message: 'Server error generating inventory valuation report' });
  }
});

router.get('/sales-trends', authMiddleware, checkPermission('canViewReports'), async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    let groupBy;
    let dateFormat;
    
    switch (period) {
      case 'hourly':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateFormat = '%Y-W%U';
        break;
      case 'monthly':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateFormat = '%Y-%m';
        break;
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateFormat = '%Y-%m-%d';
    }
    
    const trends = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' },
          totalItems: { $sum: { $size: '$items' } },
          date: { $first: { $dateToString: { format: dateFormat, date: '$createdAt' } } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);
    
    res.json({
      period,
      dateRange: { startDate, endDate },
      trends
    });
  } catch (error) {
    console.error('Sales trends report error:', error);
    res.status(500).json({ message: 'Server error generating sales trends report' });
  }
});

router.get('/employee-performance', authMiddleware, checkPermission('canViewReports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const performanceStats = await Transaction.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      {
        $group: {
          _id: '$cashier',
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' },
          totalItems: { $sum: { $size: '$items' } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'cashierInfo'
        }
      },
      { $unwind: '$cashierInfo' },
      {
        $project: {
          cashier: {
            name: { $concat: ['$cashierInfo.firstName', ' ', '$cashierInfo.lastName'] },
            employeeId: '$cashierInfo.employeeId',
            role: '$cashierInfo.role'
          },
          totalSales: 1,
          totalTransactions: 1,
          averageTransaction: 1,
          totalItems: 1,
          itemsPerTransaction: { $divide: ['$totalItems', '$totalTransactions'] }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);
    
    res.json(performanceStats);
  } catch (error) {
    console.error('Employee performance report error:', error);
    res.status(500).json({ message: 'Server error generating employee performance report' });
  }
});

module.exports = router;
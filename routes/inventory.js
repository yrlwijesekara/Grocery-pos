const express = require('express');
const Product = require('../models/Product');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      isActive: true
    });
    const outOfStockCount = await Product.countDocuments({
      stockQuantity: 0,
      isActive: true
    });
    
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      { 
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const topProducts = await Product.find({ isActive: true })
      .sort({ stockQuantity: -1 })
      .limit(10)
      .select('name stockQuantity price category');
    
    const reorderAlerts = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$reorderPoint'] },
      isActive: true
    }).select('name stockQuantity reorderPoint supplier');
    
    res.json({
      summary: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalValue: categoryStats.reduce((sum, cat) => sum + cat.totalValue, 0)
      },
      categoryStats,
      topProducts,
      reorderAlerts
    });
  } catch (error) {
    console.error('Inventory dashboard error:', error);
    res.status(500).json({ message: 'Server error loading inventory dashboard' });
  }
});

router.post('/bulk-update', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required' });
    }
    
    const results = [];
    
    for (const update of updates) {
      try {
        const { productId, stockQuantity, price, lowStockThreshold, reorderPoint } = update;
        
        const updateData = { updatedAt: Date.now() };
        if (stockQuantity !== undefined) updateData.stockQuantity = Math.max(0, stockQuantity);
        if (price !== undefined) updateData.price = Math.max(0, price);
        if (lowStockThreshold !== undefined) updateData.lowStockThreshold = Math.max(0, lowStockThreshold);
        if (reorderPoint !== undefined) updateData.reorderPoint = Math.max(0, reorderPoint);
        
        const product = await Product.findByIdAndUpdate(
          productId,
          updateData,
          { new: true, runValidators: true }
        );
        
        if (product) {
          results.push({ productId, status: 'success', product });
        } else {
          results.push({ productId, status: 'error', message: 'Product not found' });
        }
      } catch (error) {
        results.push({ productId: update.productId, status: 'error', message: error.message });
      }
    }
    
    const io = req.app.get('socketio');
    io.emit('inventory-updated', { 
      type: 'bulk-update', 
      updatedCount: results.filter(r => r.status === 'success').length 
    });
    
    res.json({
      message: 'Bulk update completed',
      results: results,
      successCount: results.filter(r => r.status === 'success').length,
      errorCount: results.filter(r => r.status === 'error').length
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ message: 'Server error during bulk update' });
  }
});

router.post('/reorder/:id', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const { quantity, expectedDelivery } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const reorderData = {
      productId: product._id,
      productName: product.name,
      supplier: product.supplier,
      quantityOrdered: quantity,
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
      orderDate: new Date(),
      status: 'pending',
      orderedBy: req.user._id
    };
    
    res.json({
      message: 'Reorder request created successfully',
      reorder: reorderData
    });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ message: 'Server error during reorder request' });
  }
});

router.get('/expiring', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(days));
    
    const expiringProducts = await Product.find({
      expirationDate: { $lte: expirationDate, $gte: new Date() },
      isActive: true
    }).sort({ expirationDate: 1 });
    
    res.json(expiringProducts);
  } catch (error) {
    console.error('Expiring products error:', error);
    res.status(500).json({ message: 'Server error loading expiring products' });
  }
});

router.post('/stocktake', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Stocktake items are required' });
    }
    
    const discrepancies = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (product) {
        const systemQuantity = product.stockQuantity;
        const countedQuantity = item.countedQuantity;
        const difference = countedQuantity - systemQuantity;
        
        if (difference !== 0) {
          discrepancies.push({
            productId: product._id,
            productName: product.name,
            systemQuantity,
            countedQuantity,
            difference,
            valueImpact: difference * product.price
          });
          
          product.stockQuantity = countedQuantity;
          product.updatedAt = Date.now();
          await product.save();
        }
      }
    }
    
    const stocktakeRecord = {
      conductedBy: req.user._id,
      conductedAt: new Date(),
      itemsChecked: items.length,
      discrepancies: discrepancies,
      totalValueImpact: discrepancies.reduce((sum, d) => sum + d.valueImpact, 0)
    };
    
    res.json({
      message: 'Stocktake completed successfully',
      stocktake: stocktakeRecord
    });
  } catch (error) {
    console.error('Stocktake error:', error);
    res.status(500).json({ message: 'Server error during stocktake' });
  }
});

module.exports = router;
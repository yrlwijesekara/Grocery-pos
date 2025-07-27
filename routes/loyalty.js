const express = require('express');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get customer loyalty details
router.get('/customer/:customerId', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      customerId: req.params.customerId 
    }).select('customerId firstName lastName loyaltyProgram purchaseHistory');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Calculate points that will expire (if expiration date exists)
    let pointsExpiringSoon = 0;
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    if (customer.loyaltyProgram.expirationDate && 
        customer.loyaltyProgram.expirationDate <= oneMonthFromNow) {
      pointsExpiringSoon = customer.loyaltyProgram.points;
    }

    // Get recent point transactions
    const recentTransactions = await Transaction.find({
      customer: customer._id,
      $or: [
        { loyaltyPointsEarned: { $gt: 0 } },
        { loyaltyPointsUsed: { $gt: 0 } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('transactionId loyaltyPointsEarned loyaltyPointsUsed totalAmount createdAt');

    res.json({
      customer: {
        customerId: customer.customerId,
        name: `${customer.firstName} ${customer.lastName}`,
        loyaltyProgram: customer.loyaltyProgram,
        purchaseHistory: customer.purchaseHistory
      },
      pointsExpiringSoon,
      recentTransactions
    });
  } catch (error) {
    console.error('Error fetching loyalty details:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty details' });
  }
});

// Manual points adjustment (for customer service)
router.post('/adjust-points', authMiddleware, async (req, res) => {
  try {
    const { customerId, pointsAdjustment, reason, type } = req.body;
    
    console.log('Loyalty points adjustment request:', { customerId, pointsAdjustment, reason, type });
    
    if (!customerId || pointsAdjustment === undefined || pointsAdjustment === null || !reason || !type) {
      return res.status(400).json({ 
        message: 'Customer ID, points adjustment, reason, and type are required',
        received: { customerId, pointsAdjustment, reason, type }
      });
    }

    if (!['add', 'subtract', 'set'].includes(type)) {
      return res.status(400).json({ 
        message: 'Type must be add, subtract, or set' 
      });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      console.log(`Customer not found: ${customerId}`);
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customer.loyaltyProgram.membershipNumber) {
      console.log(`Customer ${customerId} is not enrolled in loyalty program`);
      return res.status(400).json({ message: 'Customer is not enrolled in loyalty program' });
    }

    const oldPoints = customer.loyaltyProgram.points || 0;
    const adjustmentValue = parseInt(pointsAdjustment);
    let newPoints;

    console.log(`Processing adjustment: ${oldPoints} points -> ${type} ${adjustmentValue}`);

    switch (type) {
      case 'add':
        newPoints = oldPoints + Math.abs(adjustmentValue);
        break;
      case 'subtract':
        newPoints = Math.max(0, oldPoints - Math.abs(adjustmentValue));
        break;
      case 'set':
        newPoints = Math.max(0, adjustmentValue);
        break;
    }

    customer.loyaltyProgram.points = newPoints;
    customer.updateLoyaltyTier();
    await customer.save();
    
    console.log(`Points adjusted successfully: ${oldPoints} -> ${newPoints}`);

    // Log the adjustment
    console.log(`Points adjustment: ${customer.customerId} - ${oldPoints} → ${newPoints} (${type}: ${pointsAdjustment}) - Reason: ${reason} - By: ${req.user.employeeId}`);

    res.json({
      message: 'Points adjusted successfully',
      customer: {
        customerId: customer.customerId,
        name: `${customer.firstName} ${customer.lastName}`,
        oldPoints,
        newPoints,
        adjustment: newPoints - oldPoints,
        newTier: customer.loyaltyProgram.tier
      }
    });
  } catch (error) {
    console.error('Error adjusting points:', error);
    res.status(500).json({ 
      message: 'Failed to adjust points',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get loyalty program statistics
router.get('/stats', authMiddleware, checkPermission('canViewReports'), async (req, res) => {
  try {
    const totalMembers = await Customer.countDocuments({ 
      'loyaltyProgram.membershipNumber': { $exists: true, $ne: null } 
    });

    const tierDistribution = await Customer.aggregate([
      { 
        $match: { 
          'loyaltyProgram.membershipNumber': { $exists: true, $ne: null } 
        } 
      },
      { 
        $group: { 
          _id: '$loyaltyProgram.tier', 
          count: { $sum: 1 },
          totalPoints: { $sum: '$loyaltyProgram.points' }
        } 
      }
    ]);

    const pointsRedemption = await Transaction.aggregate([
      {
        $match: {
          loyaltyPointsUsed: { $gt: 0 },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: null,
          totalPointsUsed: { $sum: '$loyaltyPointsUsed' },
          totalTransactions: { $sum: 1 },
          totalValueRedeemed: { $sum: { $multiply: ['$loyaltyPointsUsed', 0.01] } }
        }
      }
    ]);

    const pointsEarned = await Transaction.aggregate([
      {
        $match: {
          loyaltyPointsEarned: { $gt: 0 },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: null,
          totalPointsEarned: { $sum: '$loyaltyPointsEarned' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalMembers,
      tierDistribution,
      last30Days: {
        pointsRedeemed: pointsRedemption[0] || { totalPointsUsed: 0, totalTransactions: 0, totalValueRedeemed: 0 },
        pointsEarned: pointsEarned[0] || { totalPointsEarned: 0, totalTransactions: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty stats:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty statistics' });
  }
});

// Redeem points for discount
router.post('/redeem', authMiddleware, async (req, res) => {
  try {
    const { customerId, pointsToRedeem } = req.body;
    
    if (!customerId || !pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({ 
        message: 'Valid customer ID and points amount required' 
      });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customer.loyaltyProgram.membershipNumber) {
      return res.status(400).json({ 
        message: 'Customer is not enrolled in loyalty program' 
      });
    }

    if (customer.loyaltyProgram.points < pointsToRedeem) {
      return res.status(400).json({ 
        message: 'Insufficient points',
        available: customer.loyaltyProgram.points,
        requested: pointsToRedeem
      });
    }

    const discountValue = pointsToRedeem * 0.01; // 1 point = $0.01

    res.json({
      message: 'Points redemption calculated',
      pointsToRedeem,
      discountValue,
      remainingPoints: customer.loyaltyProgram.points - pointsToRedeem,
      customerName: `${customer.firstName} ${customer.lastName}`
    });
  } catch (error) {
    console.error('Error processing point redemption:', error);
    res.status(500).json({ message: 'Failed to process point redemption' });
  }
});

// Get tier benefits information
router.get('/tiers', authMiddleware, async (req, res) => {
  try {
    const tiers = [
      {
        name: 'bronze',
        displayName: 'Bronze',
        spendingRequirement: 0,
        pointsMultiplier: 1,
        benefits: [
          'Earn 1 point per $1 spent',
          'Birthday discount',
          'Exclusive member offers'
        ]
      },
      {
        name: 'silver',
        displayName: 'Silver',
        spendingRequirement: 1000,
        pointsMultiplier: 1.25,
        benefits: [
          'Earn 1.25 points per $1 spent',
          'Birthday discount',
          'Exclusive member offers',
          'Early access to sales'
        ]
      },
      {
        name: 'gold',
        displayName: 'Gold',
        spendingRequirement: 2500,
        pointsMultiplier: 1.5,
        benefits: [
          'Earn 1.5 points per $1 spent',
          'Birthday discount',
          'Exclusive member offers',
          'Early access to sales',
          'Free delivery on orders over $50'
        ]
      },
      {
        name: 'platinum',
        displayName: 'Platinum',
        spendingRequirement: 5000,
        pointsMultiplier: 2,
        benefits: [
          'Earn 2 points per $1 spent',
          'Birthday discount',
          'Exclusive member offers',
          'Early access to sales',
          'Free delivery on all orders',
          'Personal shopping assistance'
        ]
      }
    ];

    res.json({ tiers });
  } catch (error) {
    console.error('Error fetching tier information:', error);
    res.status(500).json({ message: 'Failed to fetch tier information' });
  }
});

module.exports = router;
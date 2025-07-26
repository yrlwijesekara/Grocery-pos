const express = require('express');
const Coupon = require('../models/Coupon');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { active = 'true', expired = 'false' } = req.query;
    let query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }
    
    if (expired === 'false') {
      query.validUntil = { $gte: new Date() };
    }
    
    const coupons = await Coupon.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(coupons);
  } catch (error) {
    console.error('Coupons list error:', error);
    res.status(500).json({ message: 'Server error loading coupons' });
  }
});

router.get('/validate/:code', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.query;
    
    const coupon = await Coupon.findOne({ 
      code: req.params.code.toUpperCase(),
      isActive: true
    });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    let customer = null;
    if (customerId) {
      const Customer = require('../models/Customer');
      customer = await Customer.findById(customerId);
    }
    
    const validation = coupon.isValid(customer);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        message: validation.reason,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          description: coupon.description
        }
      });
    }
    
    res.json({
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumPurchase: coupon.minimumPurchase,
        maximumDiscount: coupon.maximumDiscount,
        applicableCategories: coupon.applicableCategories,
        validUntil: coupon.validUntil
      }
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ message: 'Server error during coupon validation' });
  }
});

router.post('/', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const couponData = {
      ...req.body,
      createdBy: req.user._id,
      code: req.body.code.toUpperCase()
    };
    
    const coupon = new Coupon(couponData);
    await coupon.save();
    
    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: coupon
    });
  } catch (error) {
    console.error('Coupon creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    
    res.status(500).json({ message: 'Server error during coupon creation' });
  }
});

router.put('/:id', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.json({
      message: 'Coupon updated successfully',
      coupon: coupon
    });
  } catch (error) {
    console.error('Coupon update error:', error);
    res.status(500).json({ message: 'Server error during coupon update' });
  }
});

router.delete('/:id', authMiddleware, checkPermission('canManageInventory'), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.json({ message: 'Coupon deactivated successfully' });
  } catch (error) {
    console.error('Coupon deletion error:', error);
    res.status(500).json({ message: 'Server error during coupon deletion' });
  }
});

module.exports = router;
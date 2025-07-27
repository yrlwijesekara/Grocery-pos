const express = require('express');
const Customer = require('../models/Customer');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query, phone, email, membership } = req.query;
    let searchCriteria = { isActive: true };
    
    if (membership) {
      searchCriteria['loyaltyProgram.membershipNumber'] = membership;
    } else if (phone) {
      searchCriteria.phone = { $regex: phone.replace(/\D/g, ''), $options: 'i' };
    } else if (email) {
      searchCriteria.email = { $regex: email, $options: 'i' };
    } else if (query) {
      // Create a compound query to search across multiple fields
      const queryRegex = { $regex: query, $options: 'i' };
      const phoneQuery = query.replace(/\D/g, ''); // Remove non-digits for phone search
      
      searchCriteria.$or = [
        { firstName: queryRegex },
        { lastName: queryRegex },
        { customerId: queryRegex },
        { email: queryRegex },
        { 'loyaltyProgram.membershipNumber': queryRegex }
      ];
      
      // Add phone search only if there are digits in the query
      if (phoneQuery.length > 0) {
        searchCriteria.$or.push({ phone: { $regex: phoneQuery, $options: 'i' } });
      }
      
      // Add full name search (firstName + lastName combination)
      if (query.includes(' ')) {
        const nameParts = query.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          searchCriteria.$or.push({
            $and: [
              { firstName: { $regex: nameParts[0], $options: 'i' } },
              { lastName: { $regex: nameParts.slice(1).join(' '), $options: 'i' } }
            ]
          });
        }
      }
    }
    
    const customers = await Customer.find(searchCriteria)
      .limit(20)
      .sort({ lastName: 1, firstName: 1 });
    
    res.json(customers);
  } catch (error) {
    console.error('Customer search error:', error);
    res.status(500).json({ message: 'Server error during customer search' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Customer lookup error:', error);
    res.status(500).json({ message: 'Server error during customer lookup' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      joinLoyaltyProgram = false,
      preferences = {},
      taxExempt = false,
      taxExemptNumber,
      notes
    } = req.body;
    
    // Enhanced validation
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        message: 'First name and last name are required',
        fields: ['firstName', 'lastName']
      });
    }
    
    // Validate name lengths
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return res.status(400).json({ 
        message: 'First name and last name must be at least 2 characters long' 
      });
    }
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }
    
    // Validate phone format if provided
    if (phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(phone)) {
      return res.status(400).json({ 
        message: 'Please provide a valid phone number (at least 10 digits)' 
      });
    }
    
    // Check for existing customer with same email or phone
    const searchCriteria = [];
    if (email) searchCriteria.push({ email: email.toLowerCase(), isActive: true });
    if (phone) searchCriteria.push({ phone: phone.replace(/\D/g, ''), isActive: true });
    
    if (searchCriteria.length > 0) {
      const existingCustomer = await Customer.findOne({
        $or: searchCriteria
      });
      
      if (existingCustomer) {
        const conflictField = existingCustomer.email === email?.toLowerCase() ? 'email' : 'phone';
        return res.status(400).json({ 
          message: `Customer with this ${conflictField} already exists`,
          conflictField: conflictField,
          existingCustomer: {
            id: existingCustomer._id,
            name: `${existingCustomer.firstName} ${existingCustomer.lastName}`,
            email: existingCustomer.email,
            phone: existingCustomer.phone
          }
        });
      }
    }
    
    // Validate tax exempt requirements
    if (taxExempt && !taxExemptNumber) {
      return res.status(400).json({ 
        message: 'Tax exempt number is required for tax exempt customers' 
      });
    }
    
    // Create new customer with enhanced data processing
    const customer = new Customer({
      customerId: 'CUST' + Date.now() + Math.floor(Math.random() * 1000),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.toLowerCase()?.trim(),
      phone: phone?.replace(/\D/g, ''), // Store only digits
      address: {
        street: address?.street?.trim() || '',
        city: address?.city?.trim() || '',
        state: address?.state?.trim() || '',
        zipCode: address?.zipCode?.trim() || ''
      },
      preferences: {
        emailReceipts: preferences.emailReceipts ?? false,
        smsNotifications: preferences.smsNotifications ?? false,
        marketingEmails: preferences.marketingEmails ?? false,
        preferredPaymentMethod: preferences.preferredPaymentMethod || null
      },
      taxExempt: taxExempt,
      taxExemptNumber: taxExemptNumber?.trim() || null,
      notes: notes?.trim() || ''
    });
    
    // Handle loyalty program enrollment
    if (joinLoyaltyProgram) {
      customer.loyaltyProgram.membershipNumber = 'LP' + Date.now() + Math.floor(Math.random() * 10000);
      customer.loyaltyProgram.joinDate = new Date();
      customer.loyaltyProgram.tier = 'bronze';
    }
    
    await customer.save();
    
    // Log customer creation activity
    console.log(`Customer created: ${customer.customerId} - ${customer.firstName} ${customer.lastName} by user ${req.user.employeeId}`);
    
    // Send notification via WebSocket if available
    const io = req.app.get('socketio');
    if (io) {
      io.emit('customer-created', {
        customerId: customer.customerId,
        name: `${customer.firstName} ${customer.lastName}`,
        loyaltyMember: !!customer.loyaltyProgram.membershipNumber,
        createdBy: req.user.firstName + ' ' + req.user.lastName
      });
    }
    
    res.status(201).json({
      message: 'Customer created successfully',
      customer: {
        _id: customer._id,
        customerId: customer.customerId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        loyaltyProgram: customer.loyaltyProgram,
        preferences: customer.preferences,
        taxExempt: customer.taxExempt,
        isActive: customer.isActive,
        createdAt: customer.createdAt
      }
    });
  } catch (error) {
    console.error('Customer creation error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `Customer with this ${duplicateField} already exists`
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during customer creation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({
      message: 'Customer updated successfully',
      customer: customer
    });
  } catch (error) {
    console.error('Customer update error:', error);
    res.status(500).json({ message: 'Server error during customer update' });
  }
});

router.post('/:id/loyalty/enroll', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    if (customer.loyaltyProgram.membershipNumber) {
      return res.status(400).json({ message: 'Customer is already enrolled in loyalty program' });
    }
    
    customer.loyaltyProgram.membershipNumber = 'LP' + Date.now() + Math.floor(Math.random() * 10000);
    customer.loyaltyProgram.joinDate = new Date();
    customer.loyaltyProgram.points = 0;
    customer.loyaltyProgram.tier = 'bronze';
    
    await customer.save();
    
    res.json({
      message: 'Customer enrolled in loyalty program successfully',
      membershipNumber: customer.loyaltyProgram.membershipNumber
    });
  } catch (error) {
    console.error('Loyalty enrollment error:', error);
    res.status(500).json({ message: 'Server error during loyalty enrollment' });
  }
});

router.post('/:id/loyalty/redeem', authMiddleware, async (req, res) => {
  try {
    const { points } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Valid points amount is required' });
    }
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    if (!customer.loyaltyProgram.membershipNumber) {
      return res.status(400).json({ message: 'Customer is not enrolled in loyalty program' });
    }
    
    if (customer.loyaltyProgram.points < points) {
      return res.status(400).json({ 
        message: 'Insufficient points',
        available: customer.loyaltyProgram.points,
        requested: points
      });
    }
    
    const redeemed = customer.redeemPoints(points);
    
    if (redeemed) {
      await customer.save();
      
      res.json({
        message: 'Points redeemed successfully',
        pointsRedeemed: points,
        remainingPoints: customer.loyaltyProgram.points,
        discountValue: points * 0.01
      });
    } else {
      res.status(400).json({ message: 'Failed to redeem points' });
    }
  } catch (error) {
    console.error('Points redemption error:', error);
    res.status(500).json({ message: 'Server error during points redemption' });
  }
});

router.get('/:id/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const Transaction = require('../models/Transaction');
    
    const transactions = await Transaction.find({ 
      customer: req.params.id,
      status: 'completed'
    })
      .populate('cashier', 'firstName lastName')
      .populate('items.product', 'name category')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({
      customer: {
        name: customer.firstName + ' ' + customer.lastName,
        loyaltyProgram: customer.loyaltyProgram,
        purchaseHistory: customer.purchaseHistory
      },
      transactions: transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(customer.purchaseHistory.totalTransactions / limit)
      }
    });
  } catch (error) {
    console.error('Customer history error:', error);
    res.status(500).json({ message: 'Server error loading customer history' });
  }
});

// Enroll customer in loyalty program
router.post('/:id/enroll-loyalty', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    if (customer.loyaltyProgram.membershipNumber) {
      return res.status(400).json({ message: 'Customer is already enrolled in loyalty program' });
    }
    
    // Enroll in loyalty program
    customer.loyaltyProgram.membershipNumber = 'LP' + Date.now() + Math.floor(Math.random() * 10000);
    customer.loyaltyProgram.joinDate = new Date();
    customer.loyaltyProgram.tier = 'bronze';
    customer.loyaltyProgram.points = 0;
    customer.updatedAt = Date.now();
    
    await customer.save();
    
    console.log(`Customer enrolled in loyalty program: ${customer.customerId} - ${customer.firstName} ${customer.lastName} by user ${req.user.employeeId}`);
    
    res.json({
      message: 'Customer enrolled in loyalty program successfully',
      customer: {
        _id: customer._id,
        customerId: customer.customerId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        loyaltyProgram: customer.loyaltyProgram
      }
    });
  } catch (error) {
    console.error('Loyalty enrollment error:', error);
    res.status(500).json({ message: 'Server error during loyalty enrollment' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({ 
      message: 'Customer deactivated successfully',
      customer: customer
    });
  } catch (error) {
    console.error('Customer deletion error:', error);
    res.status(500).json({ message: 'Server error during customer deletion' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, tier, active = 'true' } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }
    if (tier) {
      query['loyaltyProgram.tier'] = tier;
    }
    
    const customers = await Customer.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastName: 1, firstName: 1 });
    
    const total = await Customer.countDocuments(query);
    
    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Customers list error:', error);
    res.status(500).json({ message: 'Server error during customers list' });
  }
});

module.exports = router;
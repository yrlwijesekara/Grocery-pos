const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    
    if (!employeeId || !password) {
      return res.status(400).json({ message: 'Employee ID and password are required' });
    }
    
    const user = await User.findOne({ employeeId, isActive: true });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const payload = {
      userId: user._id,
      employeeId: user.employeeId,
      role: user.role,
      permissions: user.permissions
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
    
    res.json({
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        shift: user.shift
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.shift.clockedIn) {
      user.shift.clockedIn = false;
      user.shift.clockOutTime = new Date();
      
      if (user.shift.clockInTime) {
        const hoursWorked = (user.shift.clockOutTime - user.shift.clockInTime) / (1000 * 60 * 60);
        user.shift.totalHours += hoursWorked;
      }
      
      await user.save();
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

router.post('/clock-in', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.shift.clockedIn) {
      return res.status(400).json({ message: 'Already clocked in' });
    }
    
    user.shift.clockedIn = true;
    user.shift.clockInTime = new Date();
    user.shift.clockOutTime = null;
    
    await user.save();
    
    res.json({ 
      message: 'Clocked in successfully',
      clockInTime: user.shift.clockInTime
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ message: 'Server error during clock in' });
  }
});

router.post('/clock-out', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.shift.clockedIn) {
      return res.status(400).json({ message: 'Not currently clocked in' });
    }
    
    user.shift.clockedIn = false;
    user.shift.clockOutTime = new Date();
    
    if (user.shift.clockInTime) {
      const hoursWorked = (user.shift.clockOutTime - user.shift.clockInTime) / (1000 * 60 * 60);
      user.shift.totalHours += hoursWorked;
    }
    
    await user.save();
    
    res.json({ 
      message: 'Clocked out successfully',
      clockOutTime: user.shift.clockOutTime,
      hoursWorked: user.shift.totalHours
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ message: 'Server error during clock out' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      employeeId: req.user.employeeId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      permissions: req.user.permissions,
      shift: req.user.shift
    }
  });
});

router.post('/register', authMiddleware, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { employeeId, firstName, lastName, email, password, role } = req.body;
    
    if (!employeeId || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const existingUser = await User.findOne({
      $or: [{ employeeId }, { email }]
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Employee ID or email already exists' });
    }
    
    const user = new User({
      employeeId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role || 'cashier'
    });
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

module.exports = router;
const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

let mockScaleWeight = 0;

router.get('/weight', authMiddleware, (req, res) => {
  try {
    const weight = mockScaleWeight + (Math.random() * 0.02 - 0.01);
    
    res.json({
      weight: Math.round(weight * 100) / 100,
      unit: 'lb',
      stable: Math.abs(weight - mockScaleWeight) < 0.005,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scale reading error:', error);
    res.status(500).json({ message: 'Error reading scale weight' });
  }
});

router.post('/tare', authMiddleware, (req, res) => {
  try {
    mockScaleWeight = 0;
    
    res.json({
      message: 'Scale tared successfully',
      weight: 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scale tare error:', error);
    res.status(500).json({ message: 'Error taring scale' });
  }
});

router.post('/test-weight', authMiddleware, (req, res) => {
  try {
    const { weight } = req.body;
    
    if (typeof weight !== 'number' || weight < 0) {
      return res.status(400).json({ message: 'Valid weight is required' });
    }
    
    mockScaleWeight = weight;
    
    res.json({
      message: 'Test weight set successfully',
      weight: weight,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scale test weight error:', error);
    res.status(500).json({ message: 'Error setting test weight' });
  }
});

router.get('/status', authMiddleware, (req, res) => {
  try {
    res.json({
      connected: true,
      calibrated: true,
      lastReading: new Date().toISOString(),
      unit: 'lb',
      capacity: 30,
      resolution: 0.01
    });
  } catch (error) {
    console.error('Scale status error:', error);
    res.status(500).json({ message: 'Error getting scale status' });
  }
});

module.exports = router;
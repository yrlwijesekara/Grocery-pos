const express = require('express');
const User = require('../models/User');
const TimeEntry = require('../models/TimeEntry');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get all employees' current status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const employees = await User.find({ 
      isActive: true,
      role: { $in: ['cashier', 'supervisor', 'manager'] }
    })
    .select('employeeId firstName lastName role shift performance')
    .sort({ lastName: 1, firstName: 1 });

    const currentlyWorking = employees.filter(emp => emp.shift.clockedIn);
    const totalOnDuty = currentlyWorking.length;

    res.json({
      employees,
      summary: {
        totalEmployees: employees.length,
        currentlyWorking: totalOnDuty,
        clockedOut: employees.length - totalOnDuty
      }
    });
  } catch (error) {
    console.error('Error fetching employee status:', error);
    res.status(500).json({ message: 'Failed to fetch employee status' });
  }
});

// Get work time history for all employees
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, employeeId, page = 1, limit = 50 } = req.query;
    
    let query = { isActive: true };
    
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const employees = await User.find(query)
      .select('employeeId firstName lastName shift')
      .sort({ lastName: 1, firstName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Calculate work history for each employee
    const workHistory = await Promise.all(employees.map(async (employee) => {
      // Get time entries within date range
      let timeQuery = { userId: employee._id };
      
      if (startDate || endDate) {
        timeQuery.date = {};
        if (startDate) timeQuery.date.$gte = new Date(startDate);
        if (endDate) timeQuery.date.$lte = new Date(endDate);
      } else {
        // Default to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        timeQuery.date = { $gte: thirtyDaysAgo };
      }

      const timeEntries = await TimeEntry.find(timeQuery).sort({ date: -1 });
      
      // Calculate statistics using totalHours from time entries
      const completedEntries = timeEntries.filter(entry => entry.totalHours > 0);
      const totalHours = completedEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
      const totalDays = completedEntries.length;
      const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

      return {
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          currentStatus: employee.shift.clockedIn ? 'clocked-in' : 'clocked-out',
          currentShiftStart: employee.shift.clockInTime
        },
        stats: {
          totalHours: parseFloat(totalHours.toFixed(2)),
          totalDays,
          averageHours: parseFloat(averageHours.toFixed(2)),
          currentWeekHours: calculateCurrentWeekHours(completedEntries),
          lastClockIn: employee.shift.clockInTime,
          lastClockOut: employee.shift.clockOutTime
        },
        recentEntries: timeEntries.slice(0, 7) // Last 7 entries
      };
    }));

    res.json({
      workHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await User.countDocuments(query)
      }
    });
  } catch (error) {
    console.error('Error fetching work history:', error);
    res.status(500).json({ message: 'Failed to fetch work history' });
  }
});

// Get detailed time tracking for specific employee
router.get('/employee/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const employee = await User.findOne({ employeeId, isActive: true })
      .select('employeeId firstName lastName role shift performance');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get time entries
    let timeQuery = { userId: employee._id };
    if (startDate || endDate) {
      timeQuery.date = {};
      if (startDate) timeQuery.date.$gte = new Date(startDate);
      if (endDate) timeQuery.date.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      timeQuery.date = { $gte: thirtyDaysAgo };
    }

    const timeEntries = await TimeEntry.find(timeQuery).sort({ date: -1 });

    // Calculate attendance metrics
    const metrics = calculateAttendanceMetrics(timeEntries);

    res.json({
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        currentStatus: employee.shift.clockedIn ? 'clocked-in' : 'clocked-out',
        currentShiftStart: employee.shift.clockInTime,
        performance: employee.performance
      },
      timeEntries,
      metrics
    });
  } catch (error) {
    console.error('Error fetching employee time tracking:', error);
    res.status(500).json({ message: 'Failed to fetch employee time tracking' });
  }
});

// Get time tracking analytics/reports
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, quarter
    
    // First, let's check what data exists in the database
    const allTimeEntries = await TimeEntry.find().limit(5).sort({ date: -1 });
    console.log('\n=== All Time Entries Sample ===');
    console.log('Total entries in DB:', await TimeEntry.countDocuments());
    allTimeEntries.forEach(entry => {
      console.log(`Date: ${entry.date.toISOString()}, Total Hours: ${entry.totalHours}`);
    });
    console.log('===============================\n');
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        // Calculate start of current week (Sunday)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0); // Start of day
        
        // Calculate end of current week (Saturday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999); // End of day
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    // Debug logging
    console.log(`\n=== Time Tracking Analytics Debug (${period}) ===`);
    console.log('Period:', period);
    console.log('Start Date:', startDate.toISOString());
    console.log('End Date:', endDate.toISOString());
    
    const timeEntries = await TimeEntry.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('userId', 'employeeId firstName lastName role');
    
    console.log('Found Time Entries:', timeEntries.length);
    if (timeEntries.length > 0) {
      console.log('Sample entries:', timeEntries.slice(0, 3).map(entry => ({
        date: entry.date,
        totalHours: entry.totalHours,
        user: entry.userId?.firstName + ' ' + entry.userId?.lastName
      })));
    }
    console.log('==========================================\n');

    // Filter to only entries with total hours for analytics
    const completedTimeEntries = timeEntries.filter(entry => entry.totalHours > 0);
    
    // Calculate analytics
    const analytics = {
      period: {
        name: period,
        startDate,
        endDate
      },
      summary: {
        totalHours: completedTimeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0),
        totalEntries: completedTimeEntries.length,
        uniqueEmployees: [...new Set(completedTimeEntries.map(entry => entry.userId._id.toString()))].length,
        averageHoursPerDay: 0,
        totalLaborCost: 0 // Can be calculated with hourly rates
      },
      byEmployee: {},
      byDay: {},
      trends: []
    };

    // Calculate average hours per day
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    analytics.summary.averageHoursPerDay = daysDiff > 0 ? analytics.summary.totalHours / daysDiff : 0;

    // Group by employee (using completed entries only)
    completedTimeEntries.forEach(entry => {
      const empId = entry.userId.employeeId;
      if (!analytics.byEmployee[empId]) {
        analytics.byEmployee[empId] = {
          employee: {
            employeeId: entry.userId.employeeId,
            firstName: entry.userId.firstName,
            lastName: entry.userId.lastName,
            role: entry.userId.role
          },
          totalHours: 0,
          totalDays: 0,
          averageHours: 0
        };
      }
      analytics.byEmployee[empId].totalHours += entry.totalHours || 0;
      analytics.byEmployee[empId].totalDays += 1;
    });

    // Calculate averages
    Object.values(analytics.byEmployee).forEach(emp => {
      emp.averageHours = emp.totalDays > 0 ? emp.totalHours / emp.totalDays : 0;
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching time tracking analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Manually adjust employee time (for corrections)
router.post('/adjust', authMiddleware, async (req, res) => {
  try {
    const { employeeId, date, clockIn, clockOut, reason } = req.body;

    if (!employeeId || !date || !clockIn || !clockOut || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const employee = await User.findOne({ employeeId, isActive: true });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const clockInTime = new Date(clockIn);
    const clockOutTime = new Date(clockOut);
    const hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60);

    if (hoursWorked <= 0) {
      return res.status(400).json({ message: 'Clock out time must be after clock in time' });
    }

    // Create or update time entry with single session adjustment
    const timeEntry = await TimeEntry.findOneAndUpdate(
      {
        userId: employee._id,
        date: new Date(date)
      },
      {
        userId: employee._id,
        date: new Date(date),
        sessions: [{
          clockIn: clockInTime,
          clockOut: clockOutTime,
          hoursWorked,
          sessionNumber: 1
        }],
        totalHours: hoursWorked,
        adjustedBy: req.user._id,
        adjustmentReason: reason,
        isAdjusted: true
      },
      { upsert: true, new: true }
    );

    console.log(`Time adjustment made by ${req.user.employeeId} for ${employeeId}: ${hoursWorked.toFixed(2)} hours on ${date}. Reason: ${reason}`);

    res.json({
      message: 'Time entry adjusted successfully',
      timeEntry
    });
  } catch (error) {
    console.error('Error adjusting time entry:', error);
    res.status(500).json({ message: 'Failed to adjust time entry' });
  }
});

// Helper functions
function calculateCurrentWeekHours(timeEntries) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0); // Start of day
  
  return timeEntries
    .filter(entry => entry.totalHours > 0 && new Date(entry.date) >= startOfWeek)
    .reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
}

function calculateAttendanceMetrics(timeEntries) {
  // Only use entries with total hours for calculations
  const completedEntries = timeEntries.filter(entry => entry.totalHours > 0);
  const totalHours = completedEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
  const totalDays = completedEntries.length;
  const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
  
  // Calculate on-time percentage (assuming 8 AM start time) - check first session
  const onTimeEntries = completedEntries.filter(entry => {
    if (!entry.sessions || entry.sessions.length === 0) return false;
    const firstSession = entry.sessions[0];
    if (!firstSession.clockIn) return false;
    const clockInHour = new Date(firstSession.clockIn).getHours();
    return clockInHour <= 8; // On time if first session started by 8 AM
  });
  
  const onTimePercentage = totalDays > 0 ? (onTimeEntries.length / totalDays) * 100 : 0;

  const hoursWorkedArray = completedEntries.map(entry => entry.totalHours || 0);

  return {
    totalHours: parseFloat(totalHours.toFixed(2)),
    totalDays,
    averageHours: parseFloat(averageHours.toFixed(2)),
    onTimePercentage: parseFloat(onTimePercentage.toFixed(1)),
    longestShift: hoursWorkedArray.length > 0 ? Math.max(...hoursWorkedArray) : 0,
    shortestShift: hoursWorkedArray.length > 0 ? Math.min(...hoursWorkedArray) : 0
  };
}

// Test route to create sample time entries (for debugging)
router.post('/create-sample-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'No active user found' });
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Create entries for this week
    const sampleEntries = [
      {
        userId: user._id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        sessions: [{
          clockIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
          clockOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0),
          hoursWorked: 8,
          sessionNumber: 1
        }],
        totalHours: 8
      },
      {
        userId: user._id,
        date: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        sessions: [{
          clockIn: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 8, 30, 0),
          clockOut: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 16, 30, 0),
          hoursWorked: 8,
          sessionNumber: 1
        }],
        totalHours: 8
      }
    ];

    for (const entryData of sampleEntries) {
      await TimeEntry.findOneAndUpdate(
        { userId: entryData.userId, date: entryData.date },
        entryData,
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Sample time entries created successfully', count: sampleEntries.length });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({ message: 'Failed to create sample data' });
  }
});

module.exports = router;
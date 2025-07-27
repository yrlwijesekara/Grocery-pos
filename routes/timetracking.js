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
        onBreak: 0, // Can be extended later
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
      
      const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
      const totalDays = timeEntries.length;
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
          currentWeekHours: calculateCurrentWeekHours(timeEntries),
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
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        endDate = new Date(now.setDate(startDate.getDate() + 6));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
    }

    const timeEntries = await TimeEntry.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('userId', 'employeeId firstName lastName role');

    // Calculate analytics
    const analytics = {
      period: {
        name: period,
        startDate,
        endDate
      },
      summary: {
        totalHours: timeEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0),
        totalEntries: timeEntries.length,
        uniqueEmployees: [...new Set(timeEntries.map(entry => entry.userId._id.toString()))].length,
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

    // Group by employee
    timeEntries.forEach(entry => {
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
      analytics.byEmployee[empId].totalHours += entry.hoursWorked || 0;
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

    // Create or update time entry
    const timeEntry = await TimeEntry.findOneAndUpdate(
      {
        userId: employee._id,
        date: new Date(date)
      },
      {
        userId: employee._id,
        date: new Date(date),
        clockIn: clockInTime,
        clockOut: clockOutTime,
        hoursWorked,
        adjustedBy: req.user._id,
        adjustmentReason: reason,
        isAdjusted: true
      },
      { upsert: true, new: true }
    );

    console.log(`Time adjustment made by ${req.user.employeeId} for ${employeeId}: ${hoursWorked} hours on ${date}. Reason: ${reason}`);

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
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  
  return timeEntries
    .filter(entry => new Date(entry.date) >= startOfWeek)
    .reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
}

function calculateAttendanceMetrics(timeEntries) {
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0);
  const totalDays = timeEntries.length;
  const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
  
  // Calculate on-time percentage (assuming 8 AM start time)
  const onTimeEntries = timeEntries.filter(entry => {
    const clockInHour = new Date(entry.clockIn).getHours();
    return clockInHour <= 8; // On time if clocked in by 8 AM
  });
  
  const onTimePercentage = totalDays > 0 ? (onTimeEntries.length / totalDays) * 100 : 0;

  return {
    totalHours: parseFloat(totalHours.toFixed(2)),
    totalDays,
    averageHours: parseFloat(averageHours.toFixed(2)),
    onTimePercentage: parseFloat(onTimePercentage.toFixed(1)),
    longestShift: Math.max(...timeEntries.map(entry => entry.hoursWorked || 0)),
    shortestShift: Math.min(...timeEntries.map(entry => entry.hoursWorked || 0))
  };
}

module.exports = router;
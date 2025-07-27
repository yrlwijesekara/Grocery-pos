const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  sessions: [{
    clockIn: {
      type: Date,
      required: true
    },
    clockOut: {
      type: Date,
      required: false
    },
    hoursWorked: {
      type: Number,
      required: false,
      min: 0
    },
    sessionNumber: {
      type: Number,
      required: true
    }
  }],
  totalHours: {
    type: Number,
    default: 0,
    min: 0
  },
  breakTime: {
    type: Number,
    default: 0,
    min: 0
  },
  overtime: {
    type: Number,
    default: 0,
    min: 0
  },
  isAdjusted: {
    type: Boolean,
    default: false
  },
  adjustedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adjustmentReason: {
    type: String
  },
  notes: {
    type: String
  },
  approved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one entry per user per date
timeEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

// Calculate total hours and overtime automatically
timeEntrySchema.pre('save', function(next) {
  // Calculate hours for each session and total hours
  let totalHours = 0;
  
  this.sessions.forEach(session => {
    if (session.clockOut && session.clockIn && !session.hoursWorked) {
      session.hoursWorked = (session.clockOut - session.clockIn) / (1000 * 60 * 60);
    }
    if (session.hoursWorked) {
      totalHours += session.hoursWorked;
    }
  });
  
  this.totalHours = totalHours;
  
  // Calculate overtime only if total hours exceed 8
  if (this.totalHours > 8) {
    this.overtime = this.totalHours - 8;
  } else {
    this.overtime = 0;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Helper method to get current session (in-progress)
timeEntrySchema.methods.getCurrentSession = function() {
  return this.sessions.find(session => !session.clockOut);
};

// Helper method to add new session
timeEntrySchema.methods.addSession = function(clockIn) {
  const sessionNumber = this.sessions.length + 1;
  this.sessions.push({
    clockIn,
    sessionNumber
  });
  return this.sessions[this.sessions.length - 1];
};

// Helper method to close current session
timeEntrySchema.methods.closeCurrentSession = function(clockOut) {
  const currentSession = this.getCurrentSession();
  if (currentSession) {
    currentSession.clockOut = clockOut;
    currentSession.hoursWorked = (clockOut - currentSession.clockIn) / (1000 * 60 * 60);
    return currentSession;
  }
  return null;
};

// Helper method to format time entry for display
timeEntrySchema.methods.toDisplayFormat = function() {
  const firstSession = this.sessions[0];
  const lastSession = this.sessions[this.sessions.length - 1];
  const currentSession = this.getCurrentSession();
  
  return {
    id: this._id,
    date: this.date.toISOString().split('T')[0],
    firstClockIn: firstSession ? firstSession.clockIn.toLocaleTimeString() : null,
    lastClockOut: !currentSession && lastSession ? lastSession.clockOut?.toLocaleTimeString() : null,
    totalHours: parseFloat((this.totalHours || 0).toFixed(2)),
    sessionsCount: this.sessions.length,
    sessions: this.sessions.map(session => ({
      sessionNumber: session.sessionNumber,
      clockIn: session.clockIn.toLocaleTimeString(),
      clockOut: session.clockOut ? session.clockOut.toLocaleTimeString() : null,
      hoursWorked: session.hoursWorked ? parseFloat(session.hoursWorked.toFixed(2)) : 0
    })),
    breakTime: parseFloat((this.breakTime || 0).toFixed(2)),
    overtime: parseFloat((this.overtime || 0).toFixed(2)),
    isAdjusted: this.isAdjusted,
    notes: this.notes,
    status: currentSession ? 'in-progress' : 'completed'
  };
};

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
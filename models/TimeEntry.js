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
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date,
    required: true
  },
  hoursWorked: {
    type: Number,
    required: true,
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

// Calculate overtime automatically
timeEntrySchema.pre('save', function(next) {
  if (this.hoursWorked > 8) {
    this.overtime = this.hoursWorked - 8;
  } else {
    this.overtime = 0;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Helper method to format time entry for display
timeEntrySchema.methods.toDisplayFormat = function() {
  return {
    id: this._id,
    date: this.date.toISOString().split('T')[0],
    clockIn: this.clockIn.toLocaleTimeString(),
    clockOut: this.clockOut.toLocaleTimeString(),
    hoursWorked: parseFloat(this.hoursWorked.toFixed(2)),
    breakTime: parseFloat(this.breakTime.toFixed(2)),
    overtime: parseFloat(this.overtime.toFixed(2)),
    isAdjusted: this.isAdjusted,
    notes: this.notes
  };
};

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['cashier', 'supervisor', 'manager', 'admin'],
    default: 'cashier'
  },
  permissions: {
    canVoidTransactions: {
      type: Boolean,
      default: false
    },
    canProcessRefunds: {
      type: Boolean,
      default: false
    },
    canManageInventory: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: false
    },
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canOverridePrices: {
      type: Boolean,
      default: false
    },
    maxDiscountPercent: {
      type: Number,
      default: 0
    }
  },
  shift: {
    clockedIn: {
      type: Boolean,
      default: false
    },
    clockInTime: Date,
    clockOutTime: Date,
    totalHours: {
      type: Number,
      default: 0
    }
  },
  performance: {
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    averageTransactionTime: {
      type: Number,
      default: 0
    },
    customerRating: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updatePermissions = function(role) {
  switch (role) {
    case 'manager':
    case 'admin':
      this.permissions = {
        canVoidTransactions: true,
        canProcessRefunds: true,
        canManageInventory: true,
        canViewReports: true,
        canManageUsers: role === 'admin',
        canOverridePrices: true,
        maxDiscountPercent: 50
      };
      break;
    case 'supervisor':
      this.permissions = {
        canVoidTransactions: true,
        canProcessRefunds: true,
        canManageInventory: false,
        canViewReports: true,
        canManageUsers: false,
        canOverridePrices: true,
        maxDiscountPercent: 20
      };
      break;
    default:
      this.permissions = {
        canVoidTransactions: false,
        canProcessRefunds: false,
        canManageInventory: false,
        canViewReports: false,
        canManageUsers: false,
        canOverridePrices: false,
        maxDiscountPercent: 0
      };
  }
};

userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.updatePermissions(this.role);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    required: true
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
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  loyaltyProgram: {
    membershipNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    points: {
      type: Number,
      default: 0
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    expirationDate: Date
  },
  preferences: {
    emailReceipts: {
      type: Boolean,
      default: false
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    marketingEmails: {
      type: Boolean,
      default: false
    },
    preferredPaymentMethod: String
  },
  purchaseHistory: {
    totalSpent: {
      type: Number,
      default: 0
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    averageTransactionAmount: {
      type: Number,
      default: 0
    },
    lastPurchaseDate: Date,
    frequentItems: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      purchaseCount: Number,
      lastPurchased: Date
    }]
  },
  taxExempt: {
    type: Boolean,
    default: false
  },
  taxExemptNumber: String,
  notes: String,
  isActive: {
    type: Boolean,
    default: true
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

customerSchema.pre('save', function(next) {
  if (!this.customerId) {
    this.customerId = 'CUST' + Date.now() + Math.floor(Math.random() * 1000);
  }
  
  if (!this.loyaltyProgram.membershipNumber && this.loyaltyProgram.points > 0) {
    this.loyaltyProgram.membershipNumber = 'LP' + Date.now() + Math.floor(Math.random() * 10000);
  }
  
  this.updatedAt = Date.now();
  next();
});

customerSchema.methods.updateLoyaltyTier = function() {
  const totalSpent = this.purchaseHistory.totalSpent;
  
  if (totalSpent >= 5000) {
    this.loyaltyProgram.tier = 'platinum';
  } else if (totalSpent >= 2500) {
    this.loyaltyProgram.tier = 'gold';
  } else if (totalSpent >= 1000) {
    this.loyaltyProgram.tier = 'silver';
  } else {
    this.loyaltyProgram.tier = 'bronze';
  }
};

customerSchema.methods.addPoints = function(amount) {
  // Get multiplier based on current tier
  let multiplier = 1;
  switch (this.loyaltyProgram.tier) {
    case 'silver':
      multiplier = 1.25;
      break;
    case 'gold':
      multiplier = 1.5;
      break;
    case 'platinum':
      multiplier = 2;
      break;
    default:
      multiplier = 1;
  }
  
  const basePoints = Math.floor(amount * 0.01);
  const pointsEarned = Math.floor(basePoints * multiplier);
  this.loyaltyProgram.points += pointsEarned;
  return pointsEarned;
};

customerSchema.methods.redeemPoints = function(points) {
  if (this.loyaltyProgram.points >= points) {
    this.loyaltyProgram.points -= points;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Customer', customerSchema);
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'bogo', 'buy_x_get_y'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumPurchase: {
    type: Number,
    default: 0
  },
  maximumDiscount: {
    type: Number
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String,
    enum: ['produce', 'dairy', 'meat', 'bakery', 'frozen', 'pantry', 'beverages', 'household', 'pharmacy', 'alcohol', 'tobacco']
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  usageLimit: {
    total: {
      type: Number,
      default: null
    },
    perCustomer: {
      type: Number,
      default: 1
    }
  },
  currentUsage: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  stackable: {
    type: Boolean,
    default: false
  },
  requiresLoyaltyMembership: {
    type: Boolean,
    default: false
  },
  minimumLoyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  dayOfWeekRestrictions: [{
    type: Number,
    min: 0,
    max: 6
  }],
  timeRestrictions: {
    startTime: String,
    endTime: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
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

couponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

couponSchema.methods.isValid = function(customer = null) {
  const now = new Date();
  
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  
  if (now < this.validFrom) return { valid: false, reason: 'Coupon not yet valid' };
  if (now > this.validUntil) return { valid: false, reason: 'Coupon has expired' };
  
  if (this.usageLimit.total && this.currentUsage >= this.usageLimit.total) {
    return { valid: false, reason: 'Usage limit exceeded' };
  }
  
  if (this.requiresLoyaltyMembership && (!customer || !customer.loyaltyProgram.membershipNumber)) {
    return { valid: false, reason: 'Requires loyalty membership' };
  }
  
  if (customer && this.minimumLoyaltyTier) {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const customerTierIndex = tierOrder.indexOf(customer.loyaltyProgram.tier);
    const requiredTierIndex = tierOrder.indexOf(this.minimumLoyaltyTier);
    
    if (customerTierIndex < requiredTierIndex) {
      return { valid: false, reason: `Requires ${this.minimumLoyaltyTier} tier or higher` };
    }
  }
  
  if (this.dayOfWeekRestrictions.length > 0) {
    const currentDay = now.getDay();
    if (!this.dayOfWeekRestrictions.includes(currentDay)) {
      return { valid: false, reason: 'Not valid on this day of the week' };
    }
  }
  
  if (this.timeRestrictions.startTime && this.timeRestrictions.endTime) {
    const currentTime = now.toTimeString().substr(0, 5);
    if (currentTime < this.timeRestrictions.startTime || currentTime > this.timeRestrictions.endTime) {
      return { valid: false, reason: 'Not valid at this time' };
    }
  }
  
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function(items, subtotal) {
  let discount = 0;
  
  switch (this.discountType) {
    case 'percentage':
      discount = subtotal * (this.discountValue / 100);
      if (this.maximumDiscount) {
        discount = Math.min(discount, this.maximumDiscount);
      }
      break;
      
    case 'fixed_amount':
      discount = Math.min(this.discountValue, subtotal);
      break;
      
    case 'bogo':
      const applicableItems = items.filter(item => 
        this.applicableProducts.length === 0 || 
        this.applicableProducts.includes(item.product) ||
        this.applicableCategories.includes(item.category)
      );
      
      applicableItems.forEach(item => {
        const freeItems = Math.floor(item.quantity / 2);
        discount += freeItems * item.unitPrice;
      });
      break;
      
    case 'buy_x_get_y':
      break;
  }
  
  return Math.round(discount * 100) / 100;
};

module.exports = mongoose.model('Coupon', couponSchema);
const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  barcode: String,
  plu: String,
  quantity: {
    type: Number,
    required: true,
    min: 0.001
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'credit', 'debit', 'ebt', 'gift_card', 'store_credit', 'mobile_payment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  cardLast4: String,
  authCode: String,
  referenceNumber: String
});

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  items: [transactionItemSchema],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  payments: [paymentSchema],
  changeGiven: {
    type: Number,
    default: 0
  },
  couponsUsed: [{
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    code: String,
    discountAmount: Number
  }],
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['completed', 'voided', 'refunded', 'pending'],
    default: 'completed'
  },
  refundReason: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  voidedAt: Date,
  refundedAt: Date
});

transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  }
  if (!this.receiptNumber) {
    this.receiptNumber = 'RCP' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
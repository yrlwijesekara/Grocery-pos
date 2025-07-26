const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  plu: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['produce', 'dairy', 'meat', 'bakery', 'frozen', 'pantry', 'beverages', 'household', 'pharmacy', 'alcohol', 'tobacco']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceType: {
    type: String,
    enum: ['fixed', 'weight'],
    default: 'fixed'
  },
  unit: {
    type: String,
    enum: ['piece', 'lb', 'kg', 'oz', 'gram'],
    default: 'piece'
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  stockCapacity: {
    type: Number,
    default: 1000,
    min: 1
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  reorderPoint: {
    type: Number,
    default: 5
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  taxable: {
    type: Boolean,
    default: true
  },
  taxRate: {
    type: Number,
    default: 0.0875
  },
  ageRestricted: {
    type: Boolean,
    default: false
  },
  minimumAge: {
    type: Number,
    default: 18
  },
  expirationDate: {
    type: Date
  },
  batchNumber: {
    type: String
  },
  nutritionalInfo: {
    calories: Number,
    fat: Number,
    protein: Number,
    carbs: Number,
    sodium: Number
  },
  image: {
    type: String
  },
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

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
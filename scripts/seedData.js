const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery-pos');
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Sample Users
const sampleUsers = [
  {
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Manager',
    email: 'john@grocerypos.com',
    password: 'password123',
    role: 'manager'
  },
  {
    employeeId: 'EMP002',
    firstName: 'Jane',
    lastName: 'Cashier',
    email: 'jane@grocerypos.com',
    password: 'password123',
    role: 'cashier'
  },
  {
    employeeId: 'EMP003',
    firstName: 'Bob',
    lastName: 'Supervisor',
    email: 'bob@grocerypos.com',
    password: 'password123',
    role: 'supervisor'
  }
];

// Sample Products
const sampleProducts = [
  // Produce
  {
    name: 'Bananas',
    barcode: '4011000000000',
    plu: '4011',
    category: 'produce',
    price: 0.68,
    priceType: 'weight',
    unit: 'lb',
    stockQuantity: 50,
    lowStockThreshold: 10,
    reorderPoint: 5,
    taxable: false,
    taxRate: 0,
    ageRestricted: false
  },
  {
    name: 'Granny Smith Apples',
    barcode: '4017000000000',
    plu: '4017',
    category: 'produce',
    price: 1.49,
    priceType: 'weight',
    unit: 'lb',
    stockQuantity: 30,
    lowStockThreshold: 8,
    reorderPoint: 4,
    taxable: false,
    taxRate: 0,
    ageRestricted: false
  },
  {
    name: 'Roma Tomatoes',
    barcode: '4087000000000',
    plu: '4087',
    category: 'produce',
    price: 1.29,
    priceType: 'weight',
    unit: 'lb',
    stockQuantity: 25,
    lowStockThreshold: 6,
    reorderPoint: 3,
    taxable: false,
    taxRate: 0,
    ageRestricted: false
  },
  {
    name: 'Green Bell Peppers',
    barcode: '4065000000000',
    plu: '4065',
    category: 'produce',
    price: 1.99,
    priceType: 'weight',
    unit: 'lb',
    stockQuantity: 20,
    lowStockThreshold: 5,
    reorderPoint: 3,
    taxable: false,
    taxRate: 0,
    ageRestricted: false
  },
  {
    name: 'Red Onions',
    barcode: '4082000000000',
    plu: '4082',
    category: 'produce',
    price: 0.99,
    priceType: 'weight',
    unit: 'lb',
    stockQuantity: 30,
    lowStockThreshold: 8,
    reorderPoint: 4,
    taxable: false,
    taxRate: 0,
    ageRestricted: false
  },
  {
    name: 'Broccoli Crowns',
    barcode: '4225000000000',
    plu: '4225',
    category: 'produce',
    price: 2.49,
    priceType: 'weight',
    unit: 'lb',
    stockQuantity: 15,
    lowStockThreshold: 4,
    reorderPoint: 2,
    taxable: false,
    taxRate: 0,
    ageRestricted: false
  },
  
  // Packaged goods
  {
    name: 'Coca-Cola 12 Pack',
    barcode: '049000028911',
    category: 'beverages',
    price: 4.99,
    priceType: 'fixed',
    unit: 'piece',
    stockQuantity: 48,
    lowStockThreshold: 12,
    reorderPoint: 6,
    taxable: true,
    taxRate: 0.0875,
    ageRestricted: false
  },
  {
    name: 'Wonder Bread',
    barcode: '072250002158',
    category: 'bakery',
    price: 2.49,
    priceType: 'fixed',
    unit: 'piece',
    stockQuantity: 24,
    lowStockThreshold: 6,
    reorderPoint: 3,
    taxable: true,
    taxRate: 0.0875,
    ageRestricted: false
  },
  {
    name: 'Milk - Whole Gallon',
    barcode: '070200000000',
    category: 'dairy',
    price: 3.79,
    priceType: 'fixed',
    unit: 'piece',
    stockQuantity: 36,
    lowStockThreshold: 8,
    reorderPoint: 4,
    taxable: false,
    taxRate: 0,
    ageRestricted: false
  },
  {
    name: 'Ground Beef 80/20',
    barcode: '123456780000',
    category: 'meat',
    price: 4.99,
    priceType: 'weight',
    unit: 'lb',
    stockQuantity: 20,
    lowStockThreshold: 5,
    reorderPoint: 3,
    taxable: false,
    taxRate: 0,
    ageRestricted: false,
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  
  // Age-restricted items
  {
    name: 'Budweiser 6-Pack',
    barcode: '018200000000',
    category: 'alcohol',
    price: 8.99,
    priceType: 'fixed',
    unit: 'piece',
    stockQuantity: 24,
    lowStockThreshold: 6,
    reorderPoint: 3,
    taxable: true,
    taxRate: 0.0875,
    ageRestricted: true,
    minimumAge: 21
  },
  {
    name: 'Marlboro Cigarettes',
    barcode: '028200000000',
    category: 'tobacco',
    price: 12.99,
    priceType: 'fixed',
    unit: 'piece',
    stockQuantity: 12,
    lowStockThreshold: 3,
    reorderPoint: 2,
    taxable: true,
    taxRate: 0.35, // High tobacco tax
    ageRestricted: true,
    minimumAge: 21
  },
  
  // Household items
  {
    name: 'Tide Laundry Detergent',
    barcode: '037000000000',
    category: 'household',
    price: 11.99,
    priceType: 'fixed',
    unit: 'piece',
    stockQuantity: 18,
    lowStockThreshold: 4,
    reorderPoint: 2,
    taxable: true,
    taxRate: 0.0875,
    ageRestricted: false
  }
];

// Sample Customers
const sampleCustomers = [
  {
    customerId: 'CUST001',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@email.com',
    phone: '555-0123',
    loyaltyProgram: {
      membershipNumber: 'LP001',
      points: 250,
      tier: 'silver',
      joinDate: new Date()
    },
    purchaseHistory: {
      totalSpent: 1250.50,
      totalTransactions: 28,
      averageTransactionAmount: 44.66
    }
  },
  {
    customerId: 'CUST002',
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@email.com',
    phone: '555-0456',
    loyaltyProgram: {
      membershipNumber: 'LP002',
      points: 850,
      tier: 'gold',
      joinDate: new Date()
    },
    purchaseHistory: {
      totalSpent: 3240.75,
      totalTransactions: 45,
      averageTransactionAmount: 72.02
    }
  },
  {
    customerId: 'CUST003',
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol@email.com',
    phone: '555-0789',
    loyaltyProgram: {
      membershipNumber: 'LP003',
      points: 1200,
      tier: 'platinum',
      joinDate: new Date()
    },
    purchaseHistory: {
      totalSpent: 6850.25,
      totalTransactions: 78,
      averageTransactionAmount: 87.82
    },
    taxExempt: true,
    taxExemptNumber: 'TX123456789'
  }
];

// Sample Coupons
const sampleCoupons = [
  {
    code: 'SAVE10',
    name: '10% Off Total Purchase',
    description: 'Get 10% off your total purchase of $50 or more',
    discountType: 'percentage',
    discountValue: 10,
    minimumPurchase: 50,
    maximumDiscount: 20,
    applicableCategories: [],
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    usageLimit: { total: 100, perCustomer: 1 },
    stackable: false,
    requiresLoyaltyMembership: false
  },
  {
    code: 'PRODUCE5',
    name: '$5 Off Produce',
    description: 'Save $5 on produce purchases of $25 or more',
    discountType: 'fixed_amount',
    discountValue: 5,
    minimumPurchase: 25,
    applicableCategories: ['produce'],
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    usageLimit: { total: 50, perCustomer: 1 },
    stackable: true,
    requiresLoyaltyMembership: true,
    minimumLoyaltyTier: 'bronze'
  },
  {
    code: 'BOGO-SODA',
    name: 'BOGO Beverages',
    description: 'Buy one get one free on all beverages',
    discountType: 'bogo',
    discountValue: 50,
    minimumPurchase: 0,
    applicableCategories: ['beverages'],
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    usageLimit: { total: 200, perCustomer: 2 },
    stackable: false,
    requiresLoyaltyMembership: false
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Coupon.deleteMany({});

    // Seed Users
    console.log('Seeding users...');
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
    }

    // Seed Products
    console.log('Seeding products...');
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
    }

    // Seed Customers
    console.log('Seeding customers...');
    for (const customerData of sampleCustomers) {
      const customer = new Customer(customerData);
      await customer.save();
    }

    // Seed Coupons
    console.log('Seeding coupons...');
    const adminUser = await User.findOne({ employeeId: 'EMP001' });
    for (const couponData of sampleCoupons) {
      couponData.createdBy = adminUser._id;
      const coupon = new Coupon(couponData);
      await coupon.save();
    }

    console.log('Database seeding completed successfully!');
    console.log('\nSample Login Credentials:');
    console.log('Employee ID: EMP001, Password: password123 (Manager)');
    console.log('Employee ID: EMP002, Password: password123 (Cashier)');
    console.log('Employee ID: EMP003, Password: password123 (Supervisor)');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
};

if (require.main === module) {
  runSeeder();
}

module.exports = { seedDatabase, connectDB };
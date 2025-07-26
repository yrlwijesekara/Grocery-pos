export interface User {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: 'cashier' | 'supervisor' | 'manager' | 'admin';
  permissions: {
    canVoidTransactions: boolean;
    canProcessRefunds: boolean;
    canManageInventory: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canOverridePrices: boolean;
    maxDiscountPercent: number;
  };
  shift: {
    clockedIn: boolean;
    clockInTime?: string;
    clockOutTime?: string;
    totalHours: number;
  };
}

export interface Product {
  _id: string;
  name: string;
  barcode?: string;
  plu?: string;
  category: string;
  price: number;
  priceType: 'fixed' | 'weight';
  unit: 'piece' | 'lb' | 'kg' | 'oz' | 'gram';
  stockQuantity: number;
  stockCapacity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  taxable: boolean;
  taxRate: number;
  ageRestricted: boolean;
  minimumAge: number;
  expirationDate?: string;
  batchNumber?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  loyaltyProgram: {
    membershipNumber?: string;
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    joinDate: string;
    expirationDate?: string;
  };
  preferences: {
    emailReceipts: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    preferredPaymentMethod?: string;
  };
  purchaseHistory: {
    totalSpent: number;
    totalTransactions: number;
    averageTransactionAmount: number;
    lastPurchaseDate?: string;
  };
  taxExempt: boolean;
  taxExemptNumber?: string;
  isActive: boolean;
}

export interface TransactionItem {
  product: string;
  name: string;
  barcode?: string;
  plu?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  taxAmount: number;
  discountAmount: number;
}

export interface Payment {
  method: 'cash' | 'credit' | 'debit' | 'ebt' | 'gift_card' | 'store_credit' | 'mobile_payment';
  amount: number;
  cardLast4?: string;
  authCode?: string;
  referenceNumber?: string;
}

export interface Transaction {
  _id: string;
  transactionId: string;
  items: TransactionItem[];
  customer?: Customer;
  cashier: User;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  payments: Payment[];
  changeGiven: number;
  couponsUsed: Array<{
    couponId: string;
    code: string;
    discountAmount: number;
  }>;
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  receiptNumber: string;
  status: 'completed' | 'voided' | 'refunded' | 'pending';
  notes?: string;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'bogo' | 'buy_x_get_y';
  discountValue: number;
  minimumPurchase: number;
  maximumDiscount?: number;
  applicableProducts: string[];
  applicableCategories: string[];
  excludedProducts: string[];
  usageLimit: {
    total?: number;
    perCustomer: number;
  };
  currentUsage: number;
  validFrom: string;
  validUntil: string;
  stackable: boolean;
  requiresLoyaltyMembership: boolean;
  minimumLoyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  isActive: boolean;
}

export interface ScaleReading {
  weight: number;
  unit: 'lb' | 'kg';
  stable: boolean;
  timestamp: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
  cartWeight?: number;
  cartDiscount?: number;
  cartTotalPrice: number;
}
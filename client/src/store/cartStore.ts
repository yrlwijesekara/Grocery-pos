import { create } from 'zustand';
import { CartItem, Product, Customer, ScaleReading } from '../types';

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponsApplied: string[];
  loyaltyPointsToUse: number;
  
  // Actions
  addItem: (product: Product, quantity?: number, weight?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  updateItemWeight: (productId: string, weight: number) => void;
  applyDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  applyCoupon: (couponCode: string) => void;
  removeCoupon: (couponCode: string) => void;
  setLoyaltyPointsToUse: (points: number) => void;
  calculateTotals: () => void;
  
  // Scale integration
  currentScaleReading: ScaleReading | null;
  isWeighingItem: boolean;
  weighingProductId: string | null;
  startWeighing: (productId: string) => void;
  stopWeighing: () => void;
  updateScaleReading: (reading: ScaleReading) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  subtotal: 0,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 0,
  couponsApplied: [],
  loyaltyPointsToUse: 0,
  currentScaleReading: null,
  isWeighingItem: false,
  weighingProductId: null,

  addItem: (product: Product, quantity = 1, weight?: number) => {
    const { items } = get();
    const existingItem = items.find(item => item._id === product._id);
    
    if (existingItem) {
      if (product.priceType === 'weight' && weight) {
        get().updateItemWeight(product._id, (existingItem.cartWeight || 0) + weight);
      } else {
        get().updateItemQuantity(product._id, existingItem.cartQuantity + quantity);
      }
    } else {
      const cartItem: CartItem = {
        ...product,
        cartQuantity: quantity,
        cartWeight: weight,
        cartDiscount: 0,
        cartTotalPrice: product.priceType === 'weight' && weight 
          ? weight * product.price 
          : quantity * product.price,
      };
      
      set({ items: [...items, cartItem] });
      get().calculateTotals();
    }
  },

  removeItem: (productId: string) => {
    const { items } = get();
    set({ items: items.filter(item => item._id !== productId) });
    get().calculateTotals();
  },

  updateItemQuantity: (productId: string, quantity: number) => {
    const { items } = get();
    const updatedItems = items.map(item => {
      if (item._id === productId) {
        const newQuantity = Math.max(0, quantity);
        const totalPrice = item.priceType === 'weight' && item.cartWeight
          ? item.cartWeight * item.price
          : newQuantity * item.price;
        
        return {
          ...item,
          cartQuantity: newQuantity,
          cartTotalPrice: totalPrice - (item.cartDiscount || 0),
        };
      }
      return item;
    }).filter(item => item.cartQuantity > 0);
    
    set({ items: updatedItems });
    get().calculateTotals();
  },

  updateItemWeight: (productId: string, weight: number) => {
    const { items } = get();
    const updatedItems = items.map(item => {
      if (item._id === productId && item.priceType === 'weight') {
        const totalPrice = weight * item.price;
        return {
          ...item,
          cartWeight: weight,
          cartTotalPrice: totalPrice - (item.cartDiscount || 0),
        };
      }
      return item;
    });
    
    set({ items: updatedItems });
    get().calculateTotals();
  },

  applyDiscount: (productId: string, discount: number) => {
    const { items } = get();
    const updatedItems = items.map(item => {
      if (item._id === productId) {
        return {
          ...item,
          cartDiscount: discount,
          cartTotalPrice: (item.priceType === 'weight' && item.cartWeight
            ? item.cartWeight * item.price
            : item.cartQuantity * item.price) - discount,
        };
      }
      return item;
    });
    
    set({ items: updatedItems });
    get().calculateTotals();
  },

  clearCart: () => {
    set({
      items: [],
      customer: null,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      couponsApplied: [],
      loyaltyPointsToUse: 0,
    });
  },

  setCustomer: (customer: Customer | null) => {
    set({ customer });
    get().calculateTotals();
  },

  applyCoupon: (couponCode: string) => {
    const { couponsApplied } = get();
    if (!couponsApplied.includes(couponCode)) {
      set({ couponsApplied: [...couponsApplied, couponCode] });
      get().calculateTotals();
    }
  },

  removeCoupon: (couponCode: string) => {
    const { couponsApplied } = get();
    set({ couponsApplied: couponsApplied.filter(code => code !== couponCode) });
    get().calculateTotals();
  },

  setLoyaltyPointsToUse: (points: number) => {
    const { customer } = get();
    const maxPoints = customer?.loyaltyProgram.points || 0;
    const pointsToUse = Math.min(Math.max(0, points), maxPoints);
    
    set({ loyaltyPointsToUse: pointsToUse });
    get().calculateTotals();
  },

  calculateTotals: () => {
    const { items, customer, loyaltyPointsToUse } = get();
    
    let subtotal = 0;
    let taxAmount = 0;
    let itemDiscounts = 0;
    
    items.forEach(item => {
      const itemTotal = item.cartTotalPrice;
      subtotal += itemTotal + (item.cartDiscount || 0);
      itemDiscounts += item.cartDiscount || 0;
      
      if (item.taxable) {
        const taxableAmount = customer?.taxExempt ? 0 : itemTotal;
        taxAmount += taxableAmount * item.taxRate;
      }
    });
    
    // Apply loyalty points discount
    const loyaltyDiscount = loyaltyPointsToUse * 0.01; // 1 cent per point
    const totalDiscount = itemDiscounts + loyaltyDiscount;
    
    const finalAmount = subtotal - totalDiscount + taxAmount;
    
    set({
      subtotal,
      taxAmount,
      discountAmount: totalDiscount,
      totalAmount: Math.max(0, finalAmount),
    });
  },

  // Scale integration methods
  startWeighing: (productId: string) => {
    set({
      isWeighingItem: true,
      weighingProductId: productId,
    });
  },

  stopWeighing: () => {
    set({
      isWeighingItem: false,
      weighingProductId: null,
      currentScaleReading: null,
    });
  },

  updateScaleReading: (reading: ScaleReading) => {
    set({ currentScaleReading: reading });
    
    const { weighingProductId } = get();
    if (weighingProductId && reading.stable) {
      get().updateItemWeight(weighingProductId, reading.weight);
    }
  },
}));
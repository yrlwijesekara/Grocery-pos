import axios from 'axios';
import { Product, Customer, Coupon } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (employeeId: string, password: string) =>
    api.post('/auth/login', { employeeId, password }),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
  
  clockIn: () => api.post('/auth/clock-in'),
  
  clockOut: () => api.post('/auth/clock-out'),
  
  register: (userData: any) => api.post('/auth/register', userData),
};

// Product APIs
export const productAPI = {
  search: (params: any) => api.get('/products/search', { params }),
  
  getByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  
  getByPLU: (plu: string) => api.get(`/products/plu/${plu}`),
  
  getByCategory: (category: string) => api.get(`/products/category/${category}`),
  
  getLowStock: () => api.get('/products/low-stock'),
  
  getAll: (params: any) => api.get('/products', { params }),
  
  create: (product: Partial<Product>) => api.post('/products', product),
  
  update: (id: string, product: Partial<Product>) => 
    api.put(`/products/${id}`, product),
  
  updateStock: (id: string, quantity: number, operation: 'add' | 'subtract' | 'set') =>
    api.put(`/products/${id}/stock`, { quantity, operation }),
  
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Transaction APIs
export const transactionAPI = {
  create: (transactionData: any) => api.post('/transactions', transactionData),
  
  getAll: (params: any) => api.get('/transactions', { params }),
  
  getById: (id: string) => api.get(`/transactions/${id}`),
  
  void: (id: string, reason: string) => 
    api.put(`/transactions/${id}/void`, { reason }),
  
  refund: (id: string, items: any[], reason: string, refundMethod?: string) =>
    api.post(`/transactions/${id}/refund`, { items, reason, refundMethod }),
};

// Customer APIs
export const customerAPI = {
  search: (params: any) => api.get('/customers/search', { params }),
  
  getById: (id: string) => api.get(`/customers/${id}`),
  
  getAll: (params: any) => api.get('/customers', { params }),
  
  create: (customer: Partial<Customer>) => api.post('/customers', customer),
  
  update: (id: string, customer: Partial<Customer>) =>
    api.put(`/customers/${id}`, customer),
  
  delete: (id: string) => api.delete(`/customers/${id}`),
  
  enrollLoyalty: (id: string) => api.post(`/customers/${id}/enroll-loyalty`),
  
  redeemPoints: (id: string, points: number) =>
    api.post(`/customers/${id}/loyalty/redeem`, { points }),
  
  getHistory: (id: string, params: any) =>
    api.get(`/customers/${id}/history`, { params }),
};

// Inventory APIs
export const inventoryAPI = {
  getDashboard: () => api.get('/inventory/dashboard'),
  
  bulkUpdate: (updates: any[]) => api.post('/inventory/bulk-update', { updates }),
  
  reorder: (id: string, quantity: number, expectedDelivery?: string) =>
    api.post(`/inventory/reorder/${id}`, { quantity, expectedDelivery }),
  
  getExpiring: (days?: number) => api.get('/inventory/expiring', { params: { days } }),
  
  stocktake: (items: any[]) => api.post('/inventory/stocktake', { items }),
};

// Coupon APIs
export const couponAPI = {
  getAll: (params: any) => api.get('/coupons', { params }),
  
  validate: (code: string, customerId?: string) =>
    api.get(`/coupons/validate/${code}`, { params: { customerId } }),
  
  create: (coupon: Partial<Coupon>) => api.post('/coupons', coupon),
  
  update: (id: string, coupon: Partial<Coupon>) =>
    api.put(`/coupons/${id}`, coupon),
  
  delete: (id: string) => api.delete(`/coupons/${id}`),
};

// Scale APIs
export const scaleAPI = {
  getWeight: () => api.get('/scales/weight'),
  
  tare: () => api.post('/scales/tare'),
  
  setTestWeight: (weight: number) => api.post('/scales/test-weight', { weight }),
  
  getStatus: () => api.get('/scales/status'),
};

// Reports APIs
export const reportsAPI = {
  getDailySales: (date?: string) => 
    api.get('/reports/daily-sales', { params: { date } }),
  
  getProductPerformance: (params: any) =>
    api.get('/reports/product-performance', { params }),
  
  getInventoryValuation: () => api.get('/reports/inventory-valuation'),
  
  getSalesTrends: (params: any) => api.get('/reports/sales-trends', { params }),
  
  getEmployeePerformance: (params: any) =>
    api.get('/reports/employee-performance', { params }),
};

// Loyalty Program APIs
export const loyaltyAPI = {
  getCustomerLoyalty: (customerId: string) =>
    api.get(`/loyalty/customer/${customerId}`),
  
  adjustPoints: (data: {
    customerId: string;
    pointsAdjustment: number;
    reason: string;
    type: 'add' | 'subtract' | 'set';
  }) => api.post('/loyalty/adjust-points', data),
  
  getStats: () => api.get('/loyalty/stats'),
  
  redeemPoints: (data: { customerId: string; pointsToRedeem: number }) =>
    api.post('/loyalty/redeem', data),
  
  getTiers: () => api.get('/loyalty/tiers'),
};

export default api;
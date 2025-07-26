import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Delete,
  Edit,
  Person,
  Scale,
  LocalOffer,
  Payment,
} from '@mui/icons-material';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import BarcodeScanner from '../components/BarcodeScanner';
import PLULookup from '../components/PLULookup';
import CustomerSelector from '../components/CustomerSelector';
import PaymentDialog from '../components/PaymentDialog';
import { Product, CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const POS: React.FC = () => {
  const { user } = useAuthStore();
  const {
    items,
    customer,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    setCustomer,
  } = useCartStore();

  const [showPLU, setShowPLU] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  const handleProductFound = (product: Product) => {
    try {
      if (product.priceType === 'weight') {
        // For weight-based items, default to 1 lb/kg
        addItem(product, 1, 1);
        toast.success(`Added ${product.name} - Please weigh the item`);
      } else {
        addItem(product, 1);
        toast.success(`Added ${product.name} to cart`);
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    toast.success('Item removed from cart');
  };

  const handleEditQuantity = (item: CartItem) => {
    setEditingItem(item);
    setEditQuantity(item.cartQuantity.toString());
  };

  const handleSaveQuantity = () => {
    if (editingItem && editQuantity) {
      const quantity = parseFloat(editQuantity);
      if (quantity > 0) {
        updateItemQuantity(editingItem._id, quantity);
        toast.success('Quantity updated');
      }
    }
    setEditingItem(null);
    setEditQuantity('');
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPayment(true);
  };

  const calculateItemTotal = (item: CartItem) => {
    if (item.priceType === 'weight' && item.cartWeight) {
      return item.cartWeight * item.price - (item.cartDiscount || 0);
    }
    return item.cartQuantity * item.price - (item.cartDiscount || 0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        POS Terminal
      </Typography>

      <Grid container spacing={3}>
        {/* Left Side - Scanner and Cart */}
        <Grid item xs={12} md={8}>
          {/* Barcode Scanner */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Scanner
              </Typography>
              <BarcodeScanner onProductFound={handleProductFound} />
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<LocalOffer />}
                  onClick={() => setShowPLU(true)}
                >
                  PLU Lookup
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Person />}
                  onClick={() => setShowCustomer(true)}
                >
                  {customer ? `${customer.firstName} ${customer.lastName}` : 'Add Customer'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Shopping Cart ({items.length} items)
                </Typography>
                <Button
                  color="error"
                  onClick={handleClearCart}
                  disabled={items.length === 0}
                >
                  Clear Cart
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Qty/Weight</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">
                            Cart is empty. Scan or search for products to add.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {item.name}
                              </Typography>
                              {item.barcode && (
                                <Typography variant="caption" color="textSecondary">
                                  {item.barcode}
                                </Typography>
                              )}
                              {item.plu && (
                                <Typography variant="caption" color="textSecondary">
                                  PLU: {item.plu}
                                </Typography>
                              )}
                              <Box sx={{ mt: 0.5 }}>
                                <Chip
                                  label={item.category}
                                  size="small"
                                  variant="outlined"
                                />
                                {item.priceType === 'weight' && (
                                  <Chip
                                    label="Weighed"
                                    size="small"
                                    color="primary"
                                    sx={{ ml: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(item.price)}/{item.unit}
                          </TableCell>
                          <TableCell>
                            {item.priceType === 'weight' 
                              ? `${item.cartWeight || 0} ${item.unit}`
                              : item.cartQuantity
                            }
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight="medium">
                              {formatCurrency(calculateItemTotal(item))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEditQuantity(item)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(item._id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Totals and Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction Summary
              </Typography>

              {customer && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary">
                    Customer: {customer.firstName} {customer.lastName}
                  </Typography>
                  {customer.loyaltyProgram.membershipNumber && (
                    <Typography variant="caption" color="textSecondary">
                      Loyalty: {customer.loyaltyProgram.membershipNumber}
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{formatCurrency(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tax:</Typography>
                  <Typography>{formatCurrency(taxAmount)}</Typography>
                </Box>
                {discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="success.main">Discount:</Typography>
                    <Typography color="success.main">
                      -{formatCurrency(discountAmount)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<Payment />}
                onClick={handleCheckout}
                disabled={items.length === 0}
                sx={{ mb: 2 }}
              >
                Checkout
              </Button>

              <Box sx={{ display: 'grid', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Scale />}
                  disabled={!items.some(item => item.priceType === 'weight')}
                  size="small"
                >
                  Scale
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocalOffer />}
                  size="small"
                >
                  Coupons
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Button size="small" disabled={!user?.permissions.canVoidTransactions}>
                  Void Transaction
                </Button>
                <Button size="small" disabled={!user?.permissions.canProcessRefunds}>
                  Process Refund
                </Button>
                <Button size="small" disabled={!user?.permissions.canOverridePrices}>
                  Price Override
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <PLULookup
        open={showPLU}
        onClose={() => setShowPLU(false)}
        onProductFound={handleProductFound}
      />

      <CustomerSelector
        open={showCustomer}
        onClose={() => setShowCustomer(false)}
        onCustomerSelected={setCustomer}
        currentCustomer={customer}
      />

      <PaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={totalAmount}
        items={items}
        customer={customer}
      />

      {/* Edit Quantity Dialog */}
      <Dialog open={!!editingItem} onClose={() => setEditingItem(null)}>
        <DialogTitle>Edit Quantity</DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box>
              <Typography variant="body2" gutterBottom>
                {editingItem.name}
              </Typography>
              <TextField
                autoFocus
                fullWidth
                label={editingItem.priceType === 'weight' ? 'Weight' : 'Quantity'}
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                inputProps={{ min: 0.01, step: editingItem.priceType === 'weight' ? 0.01 : 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingItem(null)}>Cancel</Button>
          <Button onClick={handleSaveQuantity} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POS;
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
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Delete,
  Edit,
  Person,
  Scale,
  LocalOffer,
  Payment,
  Search,
} from '@mui/icons-material';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import BarcodeScanner from '../components/BarcodeScanner';
import PLULookup from '../components/PLULookup';
import CustomerSelector from '../components/CustomerSelector';
import PaymentDialog from '../components/PaymentDialog';
import LoyaltyCard from '../components/LoyaltyCard';
import { Product, CartItem } from '../types';
import { productAPI } from '../services/api';
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
    loyaltyPointsToUse,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemWeight,
    clearCart,
    setCustomer,
    setLoyaltyPointsToUse,
  } = useCartStore();

  const [showPLU, setShowPLU] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

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
      setShowSearchResults(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding product to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  const handleProductSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      const response = await productAPI.search({ query });
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Failed to search products');
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleProductSearch(searchQuery);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    toast.success('Item removed from cart');
  };

  const handleEditQuantity = (item: CartItem) => {
    setEditingItem(item);
    if (item.priceType === 'weight') {
      setEditQuantity((item.cartWeight || 0).toString());
    } else {
      setEditQuantity(item.cartQuantity.toString());
    }
  };

  const handleSaveQuantity = () => {
    if (editingItem && editQuantity) {
      const quantity = parseFloat(editQuantity);
      if (quantity > 0) {
        if (editingItem.priceType === 'weight') {
          updateItemWeight(editingItem._id, quantity);
          toast.success('Weight updated');
        } else {
          updateItemQuantity(editingItem._id, quantity);
          toast.success('Quantity updated');
        }
      }
    }
    setEditingItem(null);
    setEditQuantity('');
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  const handleLoyaltyPointsRedeemed = (pointsUsed: number, discountValue: number) => {
    setLoyaltyPointsToUse(pointsUsed);
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
              
              {/* Product Search */}
              <Box sx={{ mt: 2, position: 'relative' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search products by name, barcode, or PLU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 2) {
                      handleProductSearch(e.target.value);
                    } else {
                      setShowSearchResults(false);
                    }
                  }}
                  onKeyPress={handleSearchKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                
                {showSearchResults && searchResults.length > 0 && (
                  <Paper
                    elevation={3}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      maxHeight: 300,
                      overflow: 'auto',
                      mt: 1,
                    }}
                  >
                    <List dense>
                      {searchResults.map((product) => (
                        <ListItem
                          key={product._id}
                          button
                          onClick={() => handleProductFound(product)}
                        >
                          <ListItemText
                            primary={product.name}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {product.category} • {formatCurrency(product.price)}/{product.unit}
                                </Typography>
                                {product.barcode && (
                                  <Typography variant="caption" color="textSecondary">
                                    Barcode: {product.barcode}
                                  </Typography>
                                )}
                                {product.plu && (
                                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                    PLU: {product.plu}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Chip 
                              label={product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                              color={product.stockQuantity > 0 ? 'success' : 'error'}
                              size="small"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
              
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
                <Box sx={{ mb: 2 }}>
                  <LoyaltyCard 
                    customer={customer} 
                    onPointsRedeemed={handleLoyaltyPointsRedeemed}
                  />
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
                {loyaltyPointsToUse > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="success.main">Loyalty Discount ({loyaltyPointsToUse} points):</Typography>
                    <Typography color="success.main">
                      -{formatCurrency(loyaltyPointsToUse * 0.01)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(totalAmount - (loyaltyPointsToUse * 0.01))}
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
        total={totalAmount - (loyaltyPointsToUse * 0.01)}
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
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Add,
  Edit,
  Delete,
  Warning,
  Refresh,
} from '@mui/icons-material';
import { inventoryAPI, productAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const Inventory: React.FC = () => {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [stockOperation, setStockOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    barcode: '',
    plu: '',
    category: 'pantry',
    price: 0,
    priceType: 'fixed',
    unit: 'piece',
    stockQuantity: 0,
    stockCapacity: 1000,
    lowStockThreshold: 10,
    reorderPoint: 5,
    taxable: true,
    taxRate: 0.0875,
    ageRestricted: false,
    minimumAge: 18,
    isActive: true,
  });

  const categories = [
    'produce', 'dairy', 'meat', 'bakery', 'frozen', 'pantry', 
    'beverages', 'household', 'pharmacy', 'alcohol', 'tobacco'
  ];

  const fetchDashboard = async () => {
    try {
      const response = await inventoryAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load inventory dashboard');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ limit: 100 });
      setProducts(response.data.products);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDashboard(), fetchProducts()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.permissions.canManageInventory) {
      loadData();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddProduct = async () => {
    try {
      await productAPI.create(newProduct);
      toast.success('Product added successfully');
      setShowAddProduct(false);
      setNewProduct({
        name: '',
        barcode: '',
        plu: '',
        category: 'pantry',
        price: 0,
        priceType: 'fixed',
        unit: 'piece',
        stockQuantity: 0,
        stockCapacity: 1000,
        lowStockThreshold: 10,
        reorderPoint: 5,
        taxable: true,
        taxRate: 0.0875,
        ageRestricted: false,
        minimumAge: 18,
        isActive: true,
      });
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add product';
      toast.error(message);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({
      _id: product._id,
      name: product.name,
      barcode: product.barcode || '',
      plu: product.plu || '',
      category: product.category,
      price: product.price,
      priceType: product.priceType,
      unit: product.unit,
      stockCapacity: product.stockCapacity || 1000,
      lowStockThreshold: product.lowStockThreshold,
      reorderPoint: product.reorderPoint,
      taxable: product.taxable,
      taxRate: product.taxRate,
      ageRestricted: product.ageRestricted,
      minimumAge: product.minimumAge,
      isActive: product.isActive,
    });
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async () => {
    try {
      await productAPI.update(editingProduct._id!, editingProduct);
      toast.success('Product updated successfully');
      setShowEditProduct(false);
      setEditingProduct({});
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(productId);
        toast.success('Product deleted successfully');
        await loadData();
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to delete product';
        toast.error(message);
      }
    }
  };

  const handleStockOperation = (product: Product, operation: 'add' | 'subtract' | 'set') => {
    setSelectedProduct(product);
    setStockOperation(operation);
    setStockQuantity('');
    setStockReason('');
    setShowStockDialog(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct || !stockQuantity) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await productAPI.updateStock(
        selectedProduct._id,
        parseInt(stockQuantity),
        stockOperation
      );
      toast.success(`Stock ${stockOperation === 'add' ? 'added' : stockOperation === 'subtract' ? 'removed' : 'updated'} successfully`);
      setShowStockDialog(false);
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update stock';
      toast.error(message);
    }
  };

  const getStockPercentage = (product: Product) => {
    return Math.round((product.stockQuantity / product.stockCapacity) * 100);
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) return { label: 'Out of Stock', color: 'error' };
    if (product.stockQuantity <= product.lowStockThreshold) return { label: 'Low Stock', color: 'warning' };
    const percentage = getStockPercentage(product);
    if (percentage >= 90) return { label: 'Near Capacity', color: 'info' };
    return { label: 'In Stock', color: 'success' };
  };

  if (!user?.permissions.canManageInventory) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Inventory Management
        </Typography>
        <Alert severity="warning">
          You don't have permission to access inventory management features.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Inventory Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddProduct(true)}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h4" color="primary">
                {dashboardData?.summary?.totalProducts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h4" color="warning.main">
                {dashboardData?.summary?.lowStockCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Out of Stock
              </Typography>
              <Typography variant="h4" color="error.main">
                {dashboardData?.summary?.outOfStockCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(dashboardData?.summary?.totalValue || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Inventory
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Capacity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {product.name}
                            </Typography>
                            {product.barcode && (
                              <Typography variant="caption" color="textSecondary">
                                Barcode: {product.barcode}
                              </Typography>
                            )}
                            {product.plu && (
                              <Typography variant="caption" color="textSecondary" display="block">
                                PLU: {product.plu}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={product.category} size="small" />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(product.price)}/{product.unit}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              color={
                                product.stockQuantity === 0
                                  ? 'error'
                                  : product.stockQuantity <= product.lowStockThreshold
                                  ? 'warning.main'
                                  : 'text.primary'
                              }
                              fontWeight="medium"
                            >
                              {product.stockQuantity}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {getStockPercentage(product)}% of capacity
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {product.stockCapacity || 1000}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Available: {(product.stockCapacity || 1000) - product.stockQuantity}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStockStatus(product).label}
                            color={getStockStatus(product).color as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleStockOperation(product, 'add')}
                              sx={{ mr: 1, mb: 1 }}
                            >
                              Add Stock
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleStockOperation(product, 'subtract')}
                              sx={{ mr: 1, mb: 1 }}
                            >
                              Remove
                            </Button>
                            <IconButton 
                              size="small"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onClose={() => setShowAddProduct(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barcode"
                value={newProduct.barcode}
                onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PLU Code"
                value={newProduct.plu}
                onChange={(e) => setNewProduct({ ...newProduct, plu: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Price Type</InputLabel>
                <Select
                  value={newProduct.priceType}
                  onChange={(e) => setNewProduct({ ...newProduct, priceType: e.target.value as 'fixed' | 'weight' })}
                  label="Price Type"
                >
                  <MenuItem value="fixed">Fixed Price</MenuItem>
                  <MenuItem value="weight">Price by Weight</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value as any })}
                  label="Unit"
                >
                  <MenuItem value="piece">Piece</MenuItem>
                  <MenuItem value="lb">Pound</MenuItem>
                  <MenuItem value="kg">Kilogram</MenuItem>
                  <MenuItem value="oz">Ounce</MenuItem>
                  <MenuItem value="gram">Gram</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Stock Quantity"
                type="number"
                value={newProduct.stockQuantity}
                onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Stock Capacity"
                type="number"
                value={newProduct.stockCapacity}
                onChange={(e) => setNewProduct({ ...newProduct, stockCapacity: parseInt(e.target.value) || 1000 })}
                inputProps={{ min: 1 }}
                helperText="Maximum storage capacity"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Low Stock Threshold"
                type="number"
                value={newProduct.lowStockThreshold}
                onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: parseInt(e.target.value) || 10 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Reorder Point"
                type="number"
                value={newProduct.reorderPoint}
                onChange={(e) => setNewProduct({ ...newProduct, reorderPoint: parseInt(e.target.value) || 5 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddProduct(false)}>Cancel</Button>
          <Button
            onClick={handleAddProduct}
            variant="contained"
            disabled={!newProduct.name || !newProduct.price}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProduct} onClose={() => setShowEditProduct(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingProduct.category || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barcode"
                value={editingProduct.barcode || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PLU Code"
                value={editingProduct.plu || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, plu: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={editingProduct.price || 0}
                onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Price Type</InputLabel>
                <Select
                  value={editingProduct.priceType || 'fixed'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, priceType: e.target.value as 'fixed' | 'weight' })}
                  label="Price Type"
                >
                  <MenuItem value="fixed">Fixed Price</MenuItem>
                  <MenuItem value="weight">Price by Weight</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={editingProduct.unit || 'piece'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value as any })}
                  label="Unit"
                >
                  <MenuItem value="piece">Piece</MenuItem>
                  <MenuItem value="lb">Pound</MenuItem>
                  <MenuItem value="kg">Kilogram</MenuItem>
                  <MenuItem value="oz">Ounce</MenuItem>
                  <MenuItem value="gram">Gram</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Stock Capacity"
                type="number"
                value={editingProduct.stockCapacity || 1000}
                onChange={(e) => setEditingProduct({ ...editingProduct, stockCapacity: parseInt(e.target.value) || 1000 })}
                inputProps={{ min: 1 }}
                helperText="Maximum storage capacity"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Low Stock Threshold"
                type="number"
                value={editingProduct.lowStockThreshold || 10}
                onChange={(e) => setEditingProduct({ ...editingProduct, lowStockThreshold: parseInt(e.target.value) || 10 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Reorder Point"
                type="number"
                value={editingProduct.reorderPoint || 5}
                onChange={(e) => setEditingProduct({ ...editingProduct, reorderPoint: parseInt(e.target.value) || 5 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditProduct(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateProduct}
            variant="contained"
            disabled={!editingProduct.name || !editingProduct.price}
          >
            Update Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Management Dialog */}
      <Dialog open={showStockDialog} onClose={() => setShowStockDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {stockOperation === 'add' ? 'Add Stock' : stockOperation === 'subtract' ? 'Remove Stock' : 'Set Stock'}
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedProduct.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current Stock: {selectedProduct.stockQuantity} / {selectedProduct.stockCapacity || 1000}
                ({getStockPercentage(selectedProduct)}% capacity)
              </Typography>
              
              <TextField
                fullWidth
                label={`Quantity to ${stockOperation === 'add' ? 'Add' : stockOperation === 'subtract' ? 'Remove' : 'Set'}`}
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                inputProps={{ 
                  min: 1,
                  max: stockOperation === 'add' 
                    ? (selectedProduct.stockCapacity || 1000) - selectedProduct.stockQuantity
                    : stockOperation === 'subtract'
                    ? selectedProduct.stockQuantity
                    : selectedProduct.stockCapacity || 1000
                }}
                sx={{ mt: 2 }}
                helperText={
                  stockOperation === 'add'
                    ? `Available capacity: ${(selectedProduct.stockCapacity || 1000) - selectedProduct.stockQuantity}`
                    : stockOperation === 'subtract'
                    ? `Current stock: ${selectedProduct.stockQuantity}`
                    : `Maximum capacity: ${selectedProduct.stockCapacity || 1000}`
                }
              />
              
              <TextField
                fullWidth
                label="Reason (Optional)"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                multiline
                rows={2}
                sx={{ mt: 2 }}
                placeholder="e.g., New delivery, Damaged goods, Inventory correction"
              />

              {stockOperation === 'add' && stockQuantity && parseInt(stockQuantity) > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  After adding {stockQuantity} units, stock will be: {selectedProduct.stockQuantity + parseInt(stockQuantity)} / {selectedProduct.stockCapacity || 1000}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStockDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateStock}
            variant="contained"
            disabled={!stockQuantity || parseInt(stockQuantity) <= 0}
            color={stockOperation === 'subtract' ? 'warning' : 'primary'}
          >
            {stockOperation === 'add' ? 'Add Stock' : stockOperation === 'subtract' ? 'Remove Stock' : 'Set Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
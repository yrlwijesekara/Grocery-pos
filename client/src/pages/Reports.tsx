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
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  ShoppingCart,
  Inventory,
  Refresh,
  Star,
  EmojiEvents,
  Whatshot,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { reportsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState<any>(null);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<any>(null);
  const [employeePerformance, setEmployeePerformance] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [productSortBy, setProductSortBy] = useState('totalRevenue');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchDailySales = async (date: string) => {
    try {
      const response = await reportsAPI.getDailySales(date);
      setDailySales(response.data);
    } catch (error: any) {
      console.error('Error fetching daily sales:', error);
      toast.error('Failed to load daily sales report');
    }
  };

  const fetchProductPerformance = async () => {
    try {
      const response = await reportsAPI.getProductPerformance({ limit: 10 });
      setProductPerformance(response.data);
    } catch (error: any) {
      console.error('Error fetching product performance:', error);
      toast.error('Failed to load product performance report');
    }
  };

  const fetchInventoryValuation = async () => {
    try {
      const response = await reportsAPI.getInventoryValuation();
      setInventoryValuation(response.data);
    } catch (error: any) {
      console.error('Error fetching inventory valuation:', error);
      toast.error('Failed to load inventory valuation report');
    }
  };

  const fetchEmployeePerformance = async () => {
    try {
      const response = await reportsAPI.getEmployeePerformance({});
      setEmployeePerformance(response.data);
    } catch (error: any) {
      console.error('Error fetching employee performance:', error);
      toast.error('Failed to load employee performance report');
    }
  };

  const loadAllReports = async () => {
    setLoading(true);
    await Promise.all([
      fetchDailySales(selectedDate),
      fetchProductPerformance(),
      fetchInventoryValuation(),
      fetchEmployeePerformance(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.permissions.canViewReports) {
      loadAllReports();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const sortedProductPerformance = [...productPerformance].sort((a, b) => {
    const aValue = a[productSortBy];
    const bValue = b[productSortBy];
    
    if (productSortOrder === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });

  const handleProductSort = (field: string) => {
    if (productSortBy === field) {
      setProductSortOrder(productSortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setProductSortBy(field);
      setProductSortOrder('desc');
    }
  };

  const getPerformanceRank = (index: number, total: number) => {
    if (index === 0) return { label: '#1 Best Seller', color: 'primary', icon: <EmojiEvents /> };
    if (index === 1) return { label: '#2 Top Performer', color: 'secondary', icon: <Star /> };
    if (index === 2) return { label: '#3 High Seller', color: 'warning', icon: <Whatshot /> };
    if (index < total * 0.2) return { label: 'Top 20%', color: 'success', icon: null };
    return null;
  };

  if (!user?.permissions.canViewReports) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>
        <Alert severity="warning">
          You don't have permission to view reports.
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
          Reports & Analytics
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small">
            <InputLabel>Date</InputLabel>
            <Select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              label="Date"
            >
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                const displayDate = date.toLocaleDateString();
                return (
                  <MenuItem key={dateString} value={dateString}>
                    {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : displayDate}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadAllReports}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Daily Sales Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Today's Sales
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(dailySales?.summary?.totalSales || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingCart sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Transactions
              </Typography>
              <Typography variant="h4" color="success.main">
                {dailySales?.summary?.totalTransactions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Avg Transaction
              </Typography>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(dailySales?.summary?.averageTransaction || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Inventory sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Items Sold
              </Typography>
              <Typography variant="h4" color="info.main">
                {dailySales?.summary?.totalItems || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Reports Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="Product Performance" />
            <Tab label="Employee Performance" />
            <Tab label="Inventory Valuation" />
            <Tab label="Payment Methods" />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Product Performance - Highest Sold Products
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={productSortBy}
                  onChange={(e) => setProductSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="totalRevenue">Revenue</MenuItem>
                  <MenuItem value="totalQuantity">Quantity Sold</MenuItem>
                  <MenuItem value="totalTransactions">Transactions</MenuItem>
                  <MenuItem value="averagePrice">Avg Price</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={`Sort ${productSortOrder === 'desc' ? 'Ascending' : 'Descending'}`}>
                <IconButton onClick={() => setProductSortOrder(productSortOrder === 'desc' ? 'asc' : 'desc')}>
                  {productSortOrder === 'desc' ? <ArrowDownward /> : <ArrowUpward />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => handleProductSort('totalQuantity')}
                      endIcon={productSortBy === 'totalQuantity' ? (productSortOrder === 'desc' ? <ArrowDownward /> : <ArrowUpward />) : null}
                    >
                      Quantity Sold
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => handleProductSort('totalRevenue')}
                      endIcon={productSortBy === 'totalRevenue' ? (productSortOrder === 'desc' ? <ArrowDownward /> : <ArrowUpward />) : null}
                    >
                      Revenue
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => handleProductSort('totalTransactions')}
                      endIcon={productSortBy === 'totalTransactions' ? (productSortOrder === 'desc' ? <ArrowDownward /> : <ArrowUpward />) : null}
                    >
                      Transactions
                    </Button>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedProductPerformance.map((product, index) => {
                  const rank = getPerformanceRank(index, sortedProductPerformance.length);
                  return (
                    <TableRow 
                      key={product._id}
                      sx={{ 
                        backgroundColor: index < 3 ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">
                            #{index + 1}
                          </Typography>
                          {rank && (
                            <Tooltip title={rank.label}>
                              <Chip
                                icon={rank.icon || undefined}
                                label={rank.label}
                                color={rank.color as any}
                                size="small"
                                variant={index < 3 ? 'filled' : 'outlined'}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={index < 3 ? 'bold' : 'normal'}>
                            {product.name}
                          </Typography>
                          {index < 3 && (
                            <Typography variant="caption" color="primary">
                              Top {index + 1} Seller
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.category} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={productSortBy === 'totalQuantity' ? 'bold' : 'normal'}
                          color={index < 3 && productSortBy === 'totalQuantity' ? 'primary' : 'inherit'}
                        >
                          {product.totalQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={productSortBy === 'totalRevenue' ? 'bold' : 'normal'}
                          color={index < 3 && productSortBy === 'totalRevenue' ? 'primary' : 'inherit'}
                        >
                          {formatCurrency(product.totalRevenue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={productSortBy === 'totalTransactions' ? 'bold' : 'normal'}
                          color={index < 3 && productSortBy === 'totalTransactions' ? 'primary' : 'inherit'}
                        >
                          {product.totalTransactions}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {sortedProductPerformance.length > 0 && (
            <Box mt={2} p={2} bgcolor="rgba(25, 118, 210, 0.04)" borderRadius={1}>
              <Typography variant="body2" color="textSecondary">
                <strong>Performance Summary:</strong> Showing {sortedProductPerformance.length} products sorted by {productSortBy.replace(/([A-Z])/g, ' $1').toLowerCase()}.
                Top 3 products are highlighted with performance badges.
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Employee Performance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                  <TableCell align="right">Total Sales</TableCell>
                  <TableCell align="right">Avg Transaction</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeePerformance.map((employee, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {employee.cashier.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {employee.cashier.employeeId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{employee.cashier.role}</TableCell>
                    <TableCell align="right">{employee.totalTransactions}</TableCell>
                    <TableCell align="right">{formatCurrency(employee.totalSales)}</TableCell>
                    <TableCell align="right">{formatCurrency(employee.averageTransaction)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Inventory Valuation
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Total Inventory Value
                  </Typography>
                  <Typography variant="h3">
                    {formatCurrency(inventoryValuation?.totalInventoryValue || 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Across {inventoryValuation?.totalProducts || 0} products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Low Stock Value
                  </Typography>
                  <Typography variant="h3">
                    {formatCurrency(inventoryValuation?.lowStockSummary?.totalValue || 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {inventoryValuation?.lowStockSummary?.count || 0} items below threshold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Payment Methods ({selectedDate})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment Method</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(dailySales?.paymentMethods || {}).map(([method, amount]: [string, any]) => (
                  <TableRow key={method}>
                    <TableCell style={{ textTransform: 'capitalize' }}>
                      {method.replace('_', ' ')}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(amount)}</TableCell>
                    <TableCell align="right">
                      {dailySales?.summary?.totalSales 
                        ? ((amount / dailySales.summary.totalSales) * 100).toFixed(1)
                        : '0'}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Reports;
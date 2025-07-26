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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  People,
  Add,
  Edit,
  Delete,
  Star,
  Refresh,
  Search,
} from '@mui/icons-material';
import { customerAPI } from '../services/api';
import { Customer } from '../types';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>({});
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    preferences: {
      emailReceipts: true,
      smsNotifications: false,
      marketingEmails: false,
    },
    taxExempt: false,
    isActive: true,
  });
  const [joinLoyalty, setJoinLoyalty] = useState(false);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll({ limit: 100 });
      setCustomers(response.data.customers);
      
      // Calculate stats
      const totalCustomers = response.data.customers.length;
      const loyaltyMembers = response.data.customers.filter((c: Customer) => c.loyaltyProgram.membershipNumber).length;
      const goldMembers = response.data.customers.filter((c: Customer) => c.loyaltyProgram.tier === 'gold').length;
      const platinumMembers = response.data.customers.filter((c: Customer) => c.loyaltyProgram.tier === 'platinum').length;
      
      setStats({
        totalCustomers,
        loyaltyMembers,
        goldMembers,
        platinumMembers,
      });
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const searchCustomers = async () => {
    if (!searchQuery.trim()) {
      fetchCustomers();
      return;
    }
    
    try {
      const response = await customerAPI.search({ query: searchQuery });
      setCustomers(response.data);
    } catch (error: any) {
      console.error('Error searching customers:', error);
      toast.error('Failed to search customers');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchCustomers();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCustomer = async () => {
    try {
      const customerData = {
        ...newCustomer,
        joinLoyaltyProgram: joinLoyalty,
      };
      
      await customerAPI.create(customerData);
      toast.success('Customer added successfully');
      setShowAddCustomer(false);
      setNewCustomer({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
        },
        preferences: {
          emailReceipts: true,
          smsNotifications: false,
          marketingEmails: false,
        },
        taxExempt: false,
        isActive: true,
      });
      setJoinLoyalty(false);
      await loadData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add customer';
      toast.error(message);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(customerId);
        toast.success('Customer deleted successfully');
        await loadData();
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to delete customer';
        toast.error(message);
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'default';
      case 'silver': return 'info';
      case 'gold': return 'warning';
      case 'platinum': return 'secondary';
      default: return 'default';
    }
  };

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
          Customer Management
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
            onClick={() => setShowAddCustomer(true)}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Total Customers
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.totalCustomers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Loyalty Members
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.loyaltyMembers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Gold Members
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.goldMembers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Platinum Members
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {stats.platinumMembers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Customer Directory
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={searchCustomers}
                  >
                    Search
                  </Button>
                </Box>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Loyalty</TableCell>
                      <TableCell>Tier</TableCell>
                      <TableCell>Total Spent</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {customer.firstName} {customer.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {customer.customerId}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {customer.email && (
                              <Typography variant="caption" display="block">
                                {customer.email}
                              </Typography>
                            )}
                            {customer.phone && (
                              <Typography variant="caption" display="block">
                                {customer.phone}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {customer.loyaltyProgram.membershipNumber ? (
                            <Box>
                              <Typography variant="caption" display="block">
                                {customer.loyaltyProgram.membershipNumber}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {customer.loyaltyProgram.points} points
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Not enrolled
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.loyaltyProgram.membershipNumber && (
                            <Chip
                              label={customer.loyaltyProgram.tier.toUpperCase()}
                              color={getTierColor(customer.loyaltyProgram.tier) as any}
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(customer.purchaseHistory.totalSpent)}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteCustomer(customer._id)}
                          >
                            <Delete />
                          </IconButton>
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

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onClose={() => setShowAddCustomer(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={newCustomer.address?.street}
                onChange={(e) => setNewCustomer({ 
                  ...newCustomer, 
                  address: { ...newCustomer.address, street: e.target.value } as any
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={newCustomer.address?.city}
                onChange={(e) => setNewCustomer({ 
                  ...newCustomer, 
                  address: { ...newCustomer.address, city: e.target.value } as any
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={newCustomer.address?.state}
                onChange={(e) => setNewCustomer({ 
                  ...newCustomer, 
                  address: { ...newCustomer.address, state: e.target.value } as any
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={newCustomer.address?.zipCode}
                onChange={(e) => setNewCustomer({ 
                  ...newCustomer, 
                  address: { ...newCustomer.address, zipCode: e.target.value } as any
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={joinLoyalty}
                    onChange={(e) => setJoinLoyalty(e.target.checked)}
                  />
                }
                label="Enroll in Loyalty Program"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newCustomer.taxExempt}
                    onChange={(e) => setNewCustomer({ ...newCustomer, taxExempt: e.target.checked })}
                  />
                }
                label="Tax Exempt"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCustomer(false)}>Cancel</Button>
          <Button
            onClick={handleAddCustomer}
            variant="contained"
            disabled={!newCustomer.firstName || !newCustomer.lastName}
          >
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
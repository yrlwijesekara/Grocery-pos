import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
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
  IconButton,
  Chip,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People,
  Add,
  Edit,
  Delete,
  Star,
  Refresh,
  Search,
  Stars,
  Redeem,
  PersonAdd,
} from '@mui/icons-material';
import { customerAPI, loyaltyAPI } from '../services/api';
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showLoyaltyDialog, setShowLoyaltyDialog] = useState(false);
  const [loyaltyAction, setLoyaltyAction] = useState<'enroll' | 'adjust'>('enroll');
  const [pointsAdjustment, setPointsAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');

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
      
      // Update stats for search results
      const totalCustomers = response.data.length;
      const loyaltyMembers = response.data.filter((c: Customer) => c.loyaltyProgram.membershipNumber).length;
      const goldMembers = response.data.filter((c: Customer) => c.loyaltyProgram.tier === 'gold').length;
      const platinumMembers = response.data.filter((c: Customer) => c.loyaltyProgram.tier === 'platinum').length;
      
      setStats({
        totalCustomers,
        loyaltyMembers,
        goldMembers,
        platinumMembers,
      });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleLoyaltyAction = (customer: Customer, action: 'enroll' | 'adjust') => {
    setSelectedCustomer(customer);
    setLoyaltyAction(action);
    setShowLoyaltyDialog(true);
    setPointsAdjustment('');
    setAdjustmentReason('');
    setAdjustmentType('add');
  };

  const handleLoyaltySubmit = async () => {
    if (!selectedCustomer) return;

    try {
      if (loyaltyAction === 'enroll') {
        // Enroll customer in loyalty program
        await customerAPI.enrollLoyalty(selectedCustomer._id);
        toast.success('Customer enrolled in loyalty program successfully');
      } else {
        // Adjust points
        if (!pointsAdjustment || !adjustmentReason.trim()) {
          toast.error('Please fill in all required fields');
          return;
        }
        
        await loyaltyAPI.adjustPoints({
          customerId: selectedCustomer.customerId,
          pointsAdjustment: parseInt(pointsAdjustment),
          reason: adjustmentReason,
          type: adjustmentType,
        });
        toast.success('Points adjusted successfully');
      }
      
      setShowLoyaltyDialog(false);
      await loadData(); // Refresh customer data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
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
                    placeholder="Search by name, phone, email, or membership..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
                    sx={{ minWidth: 300 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={searchCustomers}
                    disabled={!searchQuery.trim()}
                  >
                    Search
                  </Button>
                  {searchQuery && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSearchQuery('');
                        fetchCustomers();
                      }}
                    >
                      Clear
                    </Button>
                  )}
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
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Typography variant="caption" color="textSecondary">
                                  {customer.loyaltyProgram.points.toLocaleString()} points
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleLoyaltyAction(customer, 'adjust')}
                                  sx={{ p: 0.25 }}
                                >
                                  <Redeem fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          ) : (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Typography variant="caption" color="textSecondary">
                                Not enrolled
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => handleLoyaltyAction(customer, 'enroll')}
                                sx={{ p: 0.25 }}
                              >
                                <PersonAdd fontSize="small" />
                              </IconButton>
                            </Box>
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

      {/* Loyalty Management Dialog */}
      <Dialog open={showLoyaltyDialog} onClose={() => setShowLoyaltyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {loyaltyAction === 'enroll' ? 'Enroll in Loyalty Program' : 'Adjust Loyalty Points'}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Customer: {selectedCustomer.firstName} {selectedCustomer.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Customer ID: {selectedCustomer.customerId}
              </Typography>

              {loyaltyAction === 'enroll' ? (
                <Box>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    This customer will be enrolled in the loyalty program and receive a membership number.
                    They will start earning points on future purchases.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Current Points: {selectedCustomer.loyaltyProgram?.points?.toLocaleString() || 0}
                  </Typography>

                  <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                    <InputLabel>Adjustment Type</InputLabel>
                    <Select
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value as any)}
                      label="Adjustment Type"
                    >
                      <MenuItem value="add">Add Points</MenuItem>
                      <MenuItem value="subtract">Subtract Points</MenuItem>
                      <MenuItem value="set">Set Points To</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Points Amount"
                    type="number"
                    value={pointsAdjustment}
                    onChange={(e) => setPointsAdjustment(e.target.value)}
                    inputProps={{ min: 0 }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Reason for Adjustment"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="e.g., Customer service adjustment, Promotional bonus, System correction"
                    required
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoyaltyDialog(false)}>Cancel</Button>
          <Button
            onClick={handleLoyaltySubmit}
            variant="contained"
            disabled={
              loyaltyAction === 'adjust' && (!pointsAdjustment || !adjustmentReason.trim())
            }
          >
            {loyaltyAction === 'enroll' ? 'Enroll Customer' : 'Apply Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Chip,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import { Search, Add, Phone } from '@mui/icons-material';
import { customerAPI } from '../services/api';
import { Customer } from '../types';
import { formatCurrency, formatPhoneNumber } from '../utils/formatters';
import toast from 'react-hot-toast';

interface CustomerSelectorProps {
  open: boolean;
  onClose: () => void;
  onCustomerSelected: (customer: Customer | null) => void;
  currentCustomer: Customer | null;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  open,
  onClose,
  onCustomerSelected,
  currentCustomer,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    joinLoyaltyProgram: false,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await customerAPI.search({ query: searchQuery });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Customer search error:', error);
      toast.error('Error searching customers');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchByPhone = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await customerAPI.search({ phone: searchQuery });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Phone search error:', error);
      toast.error('Error searching by phone');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchByMembership = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await customerAPI.search({ membership: searchQuery });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Membership search error:', error);
      toast.error('Error searching by membership');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelected(customer);
    toast.success(`Selected customer: ${customer.firstName} ${customer.lastName}`);
    onClose();
  };

  const handleRemoveCustomer = () => {
    onCustomerSelected(null);
    toast.success('Customer removed from transaction');
    onClose();
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.firstName || !newCustomer.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    try {
      const response = await customerAPI.create(newCustomer);
      const customer = response.data.customer;
      onCustomerSelected(customer);
      toast.success(`Customer created: ${customer.firstName} ${customer.lastName}`);
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error creating customer';
      toast.error(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Customer Selection
        {currentCustomer && (
          <Typography variant="body2" color="textSecondary">
            Current: {currentCustomer.firstName} {currentCustomer.lastName}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="Search Customers" />
          <Tab label="New Customer" />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            {/* Search Input */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Search customers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Name, phone, email, or membership number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Search Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                size="small"
              >
                Search All
              </Button>
              <Button
                variant="outlined"
                onClick={handleSearchByPhone}
                disabled={isSearching || !searchQuery.trim()}
                size="small"
                startIcon={<Phone />}
              >
                By Phone
              </Button>
              <Button
                variant="outlined"
                onClick={handleSearchByMembership}
                disabled={isSearching || !searchQuery.trim()}
                size="small"
              >
                By Membership
              </Button>
            </Box>

            {/* Search Results */}
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {searchResults.length > 0 ? (
                <List>
                  {searchResults.map((customer) => (
                    <ListItem key={customer._id} disablePadding>
                      <ListItemButton onClick={() => handleCustomerSelect(customer)}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {customer.firstName} {customer.lastName}
                              </Typography>
                              {customer.loyaltyProgram.membershipNumber && (
                                <Chip
                                  label={customer.loyaltyProgram.tier}
                                  size="small"
                                  color="primary"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              {customer.phone && (
                                <Typography variant="body2" component="div">
                                  📞 {formatPhoneNumber(customer.phone)}
                                </Typography>
                              )}
                              {customer.email && (
                                <Typography variant="body2" component="div">
                                  ✉️ {customer.email}
                                </Typography>
                              )}
                              {customer.loyaltyProgram.membershipNumber && (
                                <Typography variant="body2" component="div">
                                  💳 {customer.loyaltyProgram.membershipNumber} - {customer.loyaltyProgram.points} points
                                </Typography>
                              )}
                              <Typography variant="caption" color="textSecondary">
                                Total Spent: {formatCurrency(customer.purchaseHistory.totalSpent)} | 
                                Transactions: {customer.purchaseHistory.totalTransactions}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : searchQuery && !isSearching ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">
                    No customers found matching "{searchQuery}"
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">
                    Enter search terms to find customers
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="First Name"
              value={newCustomer.firstName}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
            <TextField
              label="Last Name"
              value={newCustomer.lastName}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              label="Phone Number"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
            />
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setNewCustomer(prev => ({ ...prev, joinLoyaltyProgram: !prev.joinLoyaltyProgram }))}
              color={newCustomer.joinLoyaltyProgram ? 'primary' : 'inherit'}
            >
              {newCustomer.joinLoyaltyProgram ? 'Enrolled in Loyalty Program' : 'Join Loyalty Program'}
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {currentCustomer && (
          <Button onClick={handleRemoveCustomer} color="error">
            Remove Customer
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        {tabValue === 1 && (
          <Button
            onClick={handleCreateCustomer}
            variant="contained"
            disabled={!newCustomer.firstName || !newCustomer.lastName}
          >
            Create Customer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomerSelector;
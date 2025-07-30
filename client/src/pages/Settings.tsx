import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import { 
  Settings as SettingsIcon, 
  Notifications, 
  Security, 
  Print,
  ExpandMore,
  Visibility,
  Store,
  Payment,
  Receipt as ReceiptMUIIcon,
  Backup,
  Update,
  AdminPanelSettings,
  Assessment,
  ColorLens,
  Language,
  Schedule,
  LocalShipping,
  Loyalty,
  History,
  ShoppingCart,
  Refresh,
  FilterList,
  Today,
  DateRange
} from '@mui/icons-material';
import ReceiptComponent from '../components/Receipt';
import { formatCurrency } from '../utils/formatters';

interface Transaction {
  _id: string;
  transactionId: string;
  customer?: {
    firstName: string;
    lastName: string;
  };
  cashier: {
    firstName: string;
    lastName: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    weight?: number;
    totalPrice?: number;
  }>;
  totalAmount: number;
  createdAt: string;
}

const Settings: React.FC = () => {
  const [showFullSettings, setShowFullSettings] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Fetch recent transactions when full settings dialog opens
  useEffect(() => {
    if (showFullSettings) {
      fetchRecentTransactions();
    }
  }, [showFullSettings]);

  // Fetch transactions when date changes
  useEffect(() => {
    if (showFullSettings && selectedDate) {
      fetchRecentTransactions(selectedDate);
    }
  }, [selectedDate, showFullSettings]);

  const fetchRecentTransactions = async (date?: string) => {
    setLoadingTransactions(true);
    setTransactionError(null);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        limit: '50',
        page: '1'
      });
      
      if (date) {
        queryParams.append('date', date);
      }
      
      const response = await fetch(`/api/transactions?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactionError('Failed to load transaction history');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleDateFilter = (date: string) => {
    setSelectedDate(date);
    fetchRecentTransactions(date);
  };

  const handleViewReceipt = (transaction: Transaction) => {
    // Convert transaction to receipt format
    const receiptData = {
      receiptNumber: transaction.transactionId,
      timestamp: transaction.createdAt,
      items: transaction.items.map(item => ({
        ...item,
        _id: `item-${Math.random()}`,
        category: 'General',
        price: item.totalPrice ? item.totalPrice / item.quantity : 10, // Default price if not available
        priceType: item.weight ? 'weight' : 'fixed',
        unit: item.weight ? 'lb' : 'piece',
        cartQuantity: item.quantity,
        cartWeight: item.weight,
        cartDiscount: 0,
        barcode: '',
        plu: ''
      })),
      customer: transaction.customer ? {
        ...transaction.customer,
        _id: 'customer-id',
        customerId: 'CUST001',
        email: '',
        loyaltyProgram: {
          membershipNumber: 'LP001',
          points: 0,
          tier: 'bronze' as const,
          joinDate: new Date().toISOString()
        },
        preferences: {
          emailReceipts: false,
          smsNotifications: false,
          marketingEmails: false
        },
        purchaseHistory: {
          totalSpent: 0,
          totalTransactions: 0,
          averageTransactionAmount: 0
        },
        taxExempt: false,
        isActive: true
      } : null,
      payments: [{ method: 'cash' as const, amount: transaction.totalAmount }],
      subtotal: transaction.totalAmount * 0.9, // Estimate
      taxAmount: transaction.totalAmount * 0.1, // Estimate
      discountAmount: 0,
      totalAmount: transaction.totalAmount,
      loyaltyPointsUsed: 0,
      cashier: {
        name: `${transaction.cashier.firstName} ${transaction.cashier.lastName}`,
        employeeId: 'EMP001'
      }
    };
    
    setSelectedTransaction(receiptData as any);
    setShowReceipt(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatItems = (items: Transaction['items']) => {
    return items.map(item => {
      const quantity = item.weight ? `${item.weight}lb` : `${item.quantity}`;
      return `${item.name} (${quantity})`;
    }).join(', ');
  };

  const getCustomerName = (customer?: Transaction['customer']) => {
    if (!customer) return 'Guest Customer';
    return `${customer.firstName} ${customer.lastName}`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          System Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={() => setShowFullSettings(true)}
          size="large"
        >
          View All Settings
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Settings are configured by system administrators and managers.
          </Alert>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                POS Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Auto-print receipts"
                    secondary="Automatically print receipts after each transaction"
                  />
                  <Switch defaultChecked />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="Low stock alerts"
                    secondary="Show notifications when items are low in stock"
                  />
                  <Switch defaultChecked />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Age verification prompts"
                    secondary="Prompt for ID verification on restricted items"
                  />
                  <Switch defaultChecked />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hardware Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Print />
                  </ListItemIcon>
                  <ListItemText
                    primary="Receipt printer"
                    secondary="Status: Connected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Scale integration"
                    secondary="Status: Connected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Barcode scanner"
                    secondary="Status: Active"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Full Settings Dialog */}
      <Dialog 
        open={showFullSettings} 
        onClose={() => setShowFullSettings(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon />
            Complete System Settings
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            
            {/* Store Information */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Store />
                  <Typography variant="h6">Store Information</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Store Name" defaultValue="Grocery Store POS" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Store ID" defaultValue="STORE001" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone Number" defaultValue="(555) 123-4567" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" defaultValue="store@grocery.com" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address" defaultValue="123 Main Street, City, State 12345" multiline rows={2} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* POS Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SettingsIcon />
                  <Typography variant="h6">POS Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemIcon><Print /></ListItemIcon>
                    <ListItemText primary="Auto-print receipts" secondary="Automatically print receipts after each transaction" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Notifications /></ListItemIcon>
                    <ListItemText primary="Low stock alerts" secondary="Show notifications when items are low in stock" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Security /></ListItemIcon>
                    <ListItemText primary="Age verification prompts" secondary="Prompt for ID verification on restricted items" />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Schedule /></ListItemIcon>
                    <ListItemText primary="Auto-logout timer" secondary="Automatically log out inactive users" />
                    <Switch />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Payment Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Payment />
                  <Typography variant="h6">Payment Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Default Payment Method</InputLabel>
                      <Select defaultValue="cash" label="Default Payment Method">
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="card">Credit/Debit Card</MenuItem>
                        <MenuItem value="mobile">Mobile Payment</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Cash Drawer Alert Amount" defaultValue="500.00" type="number" />
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      <ListItem>
                        <ListItemText primary="Accept Cash Payments" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Accept Credit Cards" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Accept EBT/SNAP" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Accept Mobile Payments" />
                        <Switch />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>


            {/* Loyalty Program */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Loyalty />
                  <Typography variant="h6">Loyalty Program</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Points per Rs 1 spent" defaultValue="1" type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="Point redemption value (Rs)" 
                      defaultValue="0.01" 
                      type="number" 
                      inputProps={{ step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Tier Requirements (Total Spending)</Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={3}>
                        <TextField fullWidth label="Bronze" defaultValue="0" type="number" size="small" />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField fullWidth label="Silver" defaultValue="1000" type="number" size="small" />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField fullWidth label="Gold" defaultValue="2500" type="number" size="small" />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField fullWidth label="Platinum" defaultValue="5000" type="number" size="small" />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Receipt Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ReceiptMUIIcon />
                  <Typography variant="h6">Receipt Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Store Information on Receipt
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Store Name" defaultValue="Grocery Store" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Store Phone" defaultValue="(555) 123-4567" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Store Address" 
                      defaultValue="123 Main Street, City, State 12345" 
                      multiline 
                      rows={2} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Receipt Footer Message" 
                      defaultValue="Thank you for shopping with us!&#10;Have a great day!" 
                      multiline 
                      rows={3}
                      helperText="Use &#10; for line breaks"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Receipt Size</InputLabel>
                      <Select defaultValue="80mm" label="Receipt Size">
                        <MenuItem value="58mm">58mm</MenuItem>
                        <MenuItem value="80mm">80mm</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Copies to Print" defaultValue="1" type="number" />
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      <ListItem>
                        <ListItemText primary="Print store logo" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Print barcode on receipt" />
                        <Switch />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Show loyalty information on receipt" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Auto-print receipt after transaction" />
                        <Switch />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Customer Checkout History */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <History />
                  <Typography variant="h6">Transaction History & Receipts</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  {/* Date Filter and Controls */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle2">
                        Transaction History
                      </Typography>
                      <Chip 
                        icon={<FilterList />} 
                        label={`${transactions.length} transactions`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <TextField
                        size="small"
                        type="date"
                        label="Filter by Date"
                        value={selectedDate}
                        onChange={(e) => handleDateFilter(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 150 }}
                      />
                      <Button 
                        size="small" 
                        startIcon={<Today />}
                        onClick={() => handleDateFilter(new Date().toISOString().split('T')[0])}
                        variant="outlined"
                      >
                        Today
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<Refresh />}
                        onClick={() => fetchRecentTransactions(selectedDate)}
                        disabled={loadingTransactions}
                        variant="outlined"
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Box>
                  
                  {transactionError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {transactionError}
                    </Alert>
                  )}
                  
                  <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Receipt #</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Items</TableCell>
                          <TableCell>Cashier</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loadingTransactions ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Box display="flex" justifyContent="center" alignItems="center" py={3}>
                                <CircularProgress size={24} sx={{ mr: 2 }} />
                                <Typography>Loading transactions...</Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography color="text.secondary" py={3}>
                                {selectedDate === new Date().toISOString().split('T')[0] 
                                  ? 'No transactions found for today' 
                                  : `No transactions found for ${new Date(selectedDate).toLocaleDateString()}`}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((transaction) => (
                            <TableRow key={transaction._id} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(transaction.createdAt).toLocaleTimeString()}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2">
                                    {getCustomerName(transaction.customer)}
                                  </Typography>
                                  {transaction.customer && (
                                    <Chip label="Loyalty Member" size="small" color="primary" variant="outlined" />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontFamily="monospace">
                                  {transaction.transactionId}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="medium">
                                  {formatCurrency(transaction.totalAmount)}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 250 }}>
                                <Typography variant="body2" sx={{ 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {formatItems(transaction.items)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.items.length} item{transaction.items.length !== 1 ? 's' : ''}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {transaction.cashier.firstName} {transaction.cashier.lastName}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  startIcon={<ReceiptMUIIcon />}
                                  onClick={() => handleViewReceipt(transaction)}
                                  variant="outlined"
                                  sx={{ minWidth: 100 }}
                                >
                                  View Receipt
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {transactions.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Summary for {new Date(selectedDate).toLocaleDateString()}:</strong> {' '}
                        {transactions.length} transactions • {' '}
                        Total: {formatCurrency(transactions.reduce((sum, t) => sum + t.totalAmount, 0))} • {' '}
                        Average: {formatCurrency(transactions.reduce((sum, t) => sum + t.totalAmount, 0) / transactions.length)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* System Settings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AdminPanelSettings />
                  <Typography variant="h6">System Configuration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select defaultValue="en" label="Language">
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select defaultValue="light" label="Theme">
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      <ListItem>
                        <ListItemIcon><Backup /></ListItemIcon>
                        <ListItemText primary="Auto-backup enabled" secondary="Backup system data daily at 2 AM" />
                        <Switch defaultChecked />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Update /></ListItemIcon>
                        <ListItemText primary="Automatic updates" secondary="Install security updates automatically" />
                        <Switch />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Hardware Status */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Assessment />
                  <Typography variant="h6">Hardware Status</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemIcon><Print /></ListItemIcon>
                    <ListItemText primary="Receipt Printer" secondary="Model: Epson TM-T88VI" />
                    <Chip label="Connected" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Scale Integration" secondary="Model: Toledo Scale" />
                    <Chip label="Connected" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Barcode Scanner" secondary="Model: Honeywell Voyager" />
                    <Chip label="Active" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Payment /></ListItemIcon>
                    <ListItemText primary="Card Reader" secondary="Model: Ingenico iCT250" />
                    <Chip label="Ready" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Cash Drawer" secondary="Model: APG Series 4000" />
                    <Chip label="Closed" color="default" size="small" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFullSettings(false)}>Close</Button>
          <Button variant="contained" onClick={() => setShowFullSettings(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      {showReceipt && selectedTransaction && (
        <ReceiptComponent
          open={showReceipt}
          onClose={() => setShowReceipt(false)}
          transactionData={selectedTransaction}
        />
      )}
    </Box>
  );
};

export default Settings;
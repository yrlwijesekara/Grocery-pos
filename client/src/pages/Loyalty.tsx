import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Stars,
  TrendingUp,
  People,
  Redeem,
  Add,
  Remove,
  Settings,
  Search,
  EmojiEvents,
} from '@mui/icons-material';
import { loyaltyAPI, customerAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';
import LoyaltyCard from '../components/LoyaltyCard';
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
      id={`loyalty-tabpanel-${index}`}
      aria-labelledby={`loyalty-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const Loyalty: React.FC = () => {
  const { user } = useAuthStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [pointsAdjustment, setPointsAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');

  useEffect(() => {
    if (user?.permissions.canManageUsers) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResponse, tiersResponse] = await Promise.all([
        loyaltyAPI.getStats(),
        loyaltyAPI.getTiers(),
      ]);
      setStats(statsResponse.data);
      setTiers(tiersResponse.data.tiers);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
      toast.error('Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSearch = async () => {
    if (!customerSearch.trim()) {
      toast.error('Please enter a customer ID or phone number');
      return;
    }

    try {
      const response = await customerAPI.search({ query: customerSearch.trim() });
      const customers = response.data.customers;
      
      if (customers.length === 0) {
        toast.error('Customer not found');
        return;
      }
      
      if (customers.length === 1) {
        setSelectedCustomer(customers[0]);
      } else {
        // If multiple customers found, show the first one or implement selection dialog
        setSelectedCustomer(customers[0]);
        toast(`Found ${customers.length} customers, showing first match`);
      }
    } catch (error: any) {
      console.error('Error searching customer:', error);
      toast.error('Failed to search customer');
    }
  };

  const handlePointsAdjustment = async () => {
    if (!selectedCustomer || !pointsAdjustment || !adjustmentReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await loyaltyAPI.adjustPoints({
        customerId: selectedCustomer.customerId,
        pointsAdjustment: parseInt(pointsAdjustment),
        reason: adjustmentReason,
        type: adjustmentType,
      });

      toast.success('Points adjusted successfully');
      setShowAdjustDialog(false);
      setPointsAdjustment('');
      setAdjustmentReason('');
      
      // Refresh customer data
      if (selectedCustomer) {
        const response = await customerAPI.search({ query: selectedCustomer.customerId });
        if (response.data.customers.length > 0) {
          setSelectedCustomer(response.data.customers[0]);
        }
      }
      
      loadData(); // Refresh stats
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to adjust points';
      toast.error(message);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return '#CD7F32';
    }
  };

  if (!user?.permissions.canManageUsers) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Loyalty Program Management
        </Typography>
        <Alert severity="warning">
          You don't have permission to access loyalty program management features.
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
      <Typography variant="h4" gutterBottom>
        Loyalty Program Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Customer Lookup" />
          <Tab label="Program Tiers" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Total Members
                </Typography>
                <Typography variant="h4" color="primary">
                  {stats?.totalMembers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Points Earned (30d)
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats?.last30Days?.pointsEarned?.totalPointsEarned?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Redeem sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Points Redeemed (30d)
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats?.last30Days?.pointsRedeemed?.totalPointsUsed?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Stars sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Redemption Value (30d)
                </Typography>
                <Typography variant="h4" color="info.main">
                  {formatCurrency(stats?.last30Days?.pointsRedeemed?.totalValueRedeemed || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tier Distribution
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tier</TableCell>
                        <TableCell align="right">Members</TableCell>
                        <TableCell align="right">Total Points</TableCell>
                        <TableCell align="right">Average Points</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats?.tierDistribution?.map((tier: any) => (
                        <TableRow key={tier._id}>
                          <TableCell>
                            <Chip
                              label={tier._id.toUpperCase()}
                              sx={{
                                backgroundColor: getTierColor(tier._id),
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">{tier.count}</TableCell>
                          <TableCell align="right">{tier.totalPoints.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {Math.round(tier.totalPoints / tier.count).toLocaleString()}
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
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Lookup
                </Typography>
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Customer ID or Phone"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                    placeholder="Enter customer ID or phone number"
                  />
                  <Button
                    variant="contained"
                    onClick={handleCustomerSearch}
                    startIcon={<Search />}
                  >
                    Search
                  </Button>
                </Box>

                {selectedCustomer && (
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Selected Customer
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Settings />}
                        onClick={() => setShowAdjustDialog(true)}
                      >
                        Adjust Points
                      </Button>
                    </Box>
                    <LoyaltyCard customer={selectedCustomer} readOnly />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          {tiers.map((tier) => (
            <Grid item xs={12} sm={6} md={3} key={tier.name}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {tier.name === 'platinum' ? (
                      <EmojiEvents sx={{ color: getTierColor(tier.name) }} />
                    ) : (
                      <Stars sx={{ color: getTierColor(tier.name) }} />
                    )}
                    <Typography variant="h6">{tier.displayName}</Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Spend {formatCurrency(tier.spendingRequirement)}+ to qualify
                  </Typography>
                  
                  <Typography variant="h6" color="primary" gutterBottom>
                    {tier.pointsMultiplier}x Points
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Benefits:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                    {tier.benefits.map((benefit: string, index: number) => (
                      <Typography component="li" variant="caption" key={index}>
                        {benefit}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Points Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onClose={() => setShowAdjustDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Loyalty Points</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Customer: {selectedCustomer.firstName} {selectedCustomer.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current Points: {selectedCustomer.loyaltyProgram?.points || 0}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdjustDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePointsAdjustment}
            variant="contained"
            disabled={!pointsAdjustment || !adjustmentReason.trim()}
          >
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loyalty;
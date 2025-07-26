import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Stars,
  Redeem,
  Info,
  TrendingUp,
  EmojiEvents,
} from '@mui/icons-material';
import { loyaltyAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

interface LoyaltyCardProps {
  customer: any;
  onPointsRedeemed?: (pointsUsed: number, discountValue: number) => void;
  readOnly?: boolean;
}

const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ 
  customer, 
  onPointsRedeemed, 
  readOnly = false 
}) => {
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    if (customer?.customerId) {
      fetchLoyaltyData();
    }
    fetchTiers();
  }, [customer]);

  const fetchLoyaltyData = async () => {
    if (!customer?.customerId) return;
    
    setLoading(true);
    try {
      const response = await loyaltyAPI.getCustomerLoyalty(customer.customerId);
      setLoyaltyData(response.data);
    } catch (error: any) {
      console.error('Error fetching loyalty data:', error);
      toast.error('Failed to load loyalty information');
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const response = await loyaltyAPI.getTiers();
      setTiers(response.data.tiers);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const handleRedeemPoints = async () => {
    const points = parseInt(pointsToRedeem);
    if (!points || points <= 0) {
      toast.error('Please enter a valid number of points');
      return;
    }

    try {
      const response = await loyaltyAPI.redeemPoints({
        customerId: customer.customerId,
        pointsToRedeem: points,
      });

      const discountValue = response.data.discountValue;
      
      if (onPointsRedeemed) {
        onPointsRedeemed(points, discountValue);
      }

      toast.success(`Redeemed ${points} points for ${formatCurrency(discountValue)} discount`);
      setShowRedeemDialog(false);
      setPointsToRedeem('');
      fetchLoyaltyData(); // Refresh data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to redeem points';
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

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <EmojiEvents sx={{ color: getTierColor(tier) }} />;
      default: return <Stars sx={{ color: getTierColor(tier) }} />;
    }
  };

  const getProgressToNextTier = () => {
    if (!loyaltyData || !tiers.length) return { progress: 0, nextTier: null, needed: 0 };

    const currentTier = tiers.find(t => t.name === loyaltyData.customer.loyaltyProgram.tier);
    const currentTierIndex = tiers.findIndex(t => t.name === loyaltyData.customer.loyaltyProgram.tier);
    const nextTier = tiers[currentTierIndex + 1];

    if (!nextTier) return { progress: 100, nextTier: null, needed: 0 };

    const currentSpending = loyaltyData.customer.purchaseHistory.totalSpent;
    const progress = Math.min(100, (currentSpending / nextTier.spendingRequirement) * 100);
    const needed = Math.max(0, nextTier.spendingRequirement - currentSpending);

    return { progress, nextTier, needed };
  };

  if (!customer?.customerId) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="textSecondary" textAlign="center">
            No customer selected
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <Stars />
            <Typography variant="h6">Loading loyalty information...</Typography>
          </Box>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyData?.customer.loyaltyProgram.membershipNumber) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            {loyaltyData?.customer.name} is not enrolled in the loyalty program.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { progress, nextTier, needed } = getProgressToNextTier();

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {getTierIcon(loyaltyData.customer.loyaltyProgram.tier)}
              <Typography variant="h6">
                Loyalty Member
              </Typography>
            </Box>
            <Chip
              label={loyaltyData.customer.loyaltyProgram.tier.toUpperCase()}
              sx={{ 
                backgroundColor: getTierColor(loyaltyData.customer.loyaltyProgram.tier),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          <Typography variant="body2" color="textSecondary" gutterBottom>
            {loyaltyData.customer.name}
          </Typography>
          <Typography variant="caption" color="textSecondary" gutterBottom display="block">
            Member #: {loyaltyData.customer.loyaltyProgram.membershipNumber}
          </Typography>

          <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary" fontWeight="bold">
                {loyaltyData.customer.loyaltyProgram.points.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Available Points
              </Typography>
            </Box>
            
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">
                {formatCurrency(loyaltyData.customer.loyaltyProgram.points * 0.01)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Redemption Value
              </Typography>
            </Box>
          </Box>

          {!readOnly && loyaltyData.customer.loyaltyProgram.points > 0 && (
            <Button
              variant="contained"
              startIcon={<Redeem />}
              onClick={() => setShowRedeemDialog(true)}
              fullWidth
              sx={{ mb: 2 }}
            >
              Redeem Points
            </Button>
          )}

          {nextTier && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight="medium">
                    Progress to {nextTier.displayName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {Math.round(progress)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Typography variant="caption" color="textSecondary">
                  Spend {formatCurrency(needed)} more to reach {nextTier.displayName} tier
                </Typography>
              </Box>
            </>
          )}

          <Box display="flex" justifyContent="space-between" mt={2}>
            <Typography variant="caption" color="textSecondary">
              Total Spent: {formatCurrency(loyaltyData.customer.purchaseHistory.totalSpent)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Visits: {loyaltyData.customer.purchaseHistory.totalTransactions}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Redeem Points Dialog */}
      <Dialog open={showRedeemDialog} onClose={() => setShowRedeemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Redeem />
            Redeem Loyalty Points
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Each point is worth $0.01. You have {loyaltyData?.customer.loyaltyProgram.points} points available.
          </Alert>
          
          <TextField
            fullWidth
            label="Points to Redeem"
            type="number"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(e.target.value)}
            inputProps={{ 
              min: 1, 
              max: loyaltyData?.customer.loyaltyProgram.points || 0 
            }}
            helperText={
              pointsToRedeem ? 
                `Discount Value: ${formatCurrency(parseInt(pointsToRedeem || '0') * 0.01)}` :
                'Enter the number of points to redeem'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRedeemDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRedeemPoints}
            variant="contained"
            disabled={!pointsToRedeem || parseInt(pointsToRedeem) <= 0}
          >
            Redeem {pointsToRedeem || 0} Points
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LoyaltyCard;
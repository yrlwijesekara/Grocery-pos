import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  LocalAtm,
  PhoneAndroid,
  CardGiftcard,
  Star,
} from '@mui/icons-material';
import { CartItem, Customer, Payment } from '../types';
import { transactionAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  items: CartItem[];
  customer: Customer | null;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  total,
  items,
  customer,
}) => {
  useAuthStore();
  const { clearCart, loyaltyPointsToUse, couponsApplied } = useCartStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Partial<Payment>>({
    method: 'cash',
    amount: total,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <LocalAtm />, requiresAuth: false },
    { value: 'credit', label: 'Credit Card', icon: <CreditCard />, requiresAuth: true },
    { value: 'debit', label: 'Debit Card', icon: <CreditCard />, requiresAuth: true },
    { value: 'ebt', label: 'EBT/SNAP', icon: <AccountBalance />, requiresAuth: false },
    { value: 'gift_card', label: 'Gift Card', icon: <CardGiftcard />, requiresAuth: true },
    { value: 'store_credit', label: 'Store Credit', icon: <Star />, requiresAuth: false },
    { value: 'mobile_payment', label: 'Mobile Payment', icon: <PhoneAndroid />, requiresAuth: true },
  ];

  const hasAgeRestrictedItems = items.some(item => item.ageRestricted);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = total - totalPaid;
  const changeAmount = Math.max(0, totalPaid - total);

  const handleAddPayment = () => {
    if (currentPayment.method && currentPayment.amount && currentPayment.amount > 0) {
      const payment: Payment = {
        method: currentPayment.method as Payment['method'],
        amount: currentPayment.amount,
        cardLast4: currentPayment.cardLast4,
        authCode: currentPayment.authCode,
        referenceNumber: currentPayment.referenceNumber,
      };

      setPayments([...payments, payment]);
      const newRemainingBalance = remainingBalance - currentPayment.amount;
      setCurrentPayment({
        method: 'cash',
        amount: Math.max(0, newRemainingBalance),
      });
    }
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
    
    const newTotal = newPayments.reduce((sum, p) => sum + p.amount, 0);
    setCurrentPayment(prev => ({
      ...prev,
      amount: Math.max(0, total - newTotal),
    }));
  };

  const handleCompleteTransaction = async () => {
    if (remainingBalance > 0.01) {
      toast.error('Payment amount is insufficient');
      return;
    }

    if (hasAgeRestrictedItems && !ageVerified) {
      toast.error('Age verification required for restricted items');
      return;
    }

    setIsProcessing(true);
    try {
      const transactionData = {
        items: items.map(item => ({
          product: item._id,
          quantity: item.cartQuantity,
          unitPrice: item.price,
          weight: item.cartWeight,
          discountAmount: item.cartDiscount || 0,
        })),
        customer: customer?._id,
        payments: payments,
        couponsUsed: couponsApplied,
        loyaltyPointsUsed: loyaltyPointsToUse,
        notes: '',
      };

      const response = await transactionAPI.create(transactionData);
      
      toast.success(
        `Transaction completed! Receipt: ${response.data.transaction.receiptNumber}`
      );
      
      clearCart();
      onClose();
    } catch (error: any) {
      console.error('Transaction error:', error);
      const message = error.response?.data?.message || 'Transaction failed';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodInfo = (method: string) => {
    return paymentMethods.find(pm => pm.value === method);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Process Payment</DialogTitle>
      <DialogContent>
        {hasAgeRestrictedItems && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button
                size="small"
                onClick={() => setAgeVerified(!ageVerified)}
                color={ageVerified ? 'success' : 'warning'}
              >
                {ageVerified ? 'Verified' : 'Verify Age'}
              </Button>
            }
          >
            Age-restricted items in cart. Customer ID verification required.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Payment Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Transaction Summary
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Total Amount:</Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(total)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Amount Paid:</Typography>
                    <Typography color={totalPaid >= total ? 'success.main' : 'text.primary'}>
                      {formatCurrency(totalPaid)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Remaining Balance:</Typography>
                    <Typography color={remainingBalance > 0 ? 'error.main' : 'success.main'}>
                      {formatCurrency(remainingBalance)}
                    </Typography>
                  </Box>
                  {changeAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Change Due:</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(changeAmount)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Applied Payments */}
                {payments.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Applied Payments:
                    </Typography>
                    {payments.map((payment, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                          p: 1,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getPaymentMethodInfo(payment.method)?.icon}
                          <Typography variant="body2">
                            {getPaymentMethodInfo(payment.method)?.label}
                          </Typography>
                          {payment.cardLast4 && (
                            <Typography variant="caption" color="textSecondary">
                              ****{payment.cardLast4}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {formatCurrency(payment.amount)}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemovePayment(index)}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Input */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add Payment
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={currentPayment.method}
                    onChange={(e) => setCurrentPayment(prev => ({ ...prev, method: e.target.value as Payment['method'] }))}
                    label="Payment Method"
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {method.icon}
                          {method.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={currentPayment.amount || ''}
                  onChange={(e) => setCurrentPayment(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ mb: 2 }}
                />

                {currentPayment.method && ['credit', 'debit', 'gift_card'].includes(currentPayment.method) && (
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Last 4 digits"
                      value={currentPayment.cardLast4 || ''}
                      onChange={(e) => setCurrentPayment(prev => ({ 
                        ...prev, 
                        cardLast4: e.target.value.slice(-4) 
                      }))}
                      inputProps={{ maxLength: 4 }}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Authorization Code"
                      value={currentPayment.authCode || ''}
                      onChange={(e) => setCurrentPayment(prev => ({ 
                        ...prev, 
                        authCode: e.target.value 
                      }))}
                    />
                  </Box>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAddPayment}
                  disabled={!currentPayment.method || !currentPayment.amount || currentPayment.amount <= 0 || remainingBalance <= 0}
                >
                  Add Payment
                </Button>

                {/* Quick Amount Buttons for Cash */}
                {currentPayment.method === 'cash' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      Quick amounts:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {[5, 10, 20, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          size="small"
                          variant="outlined"
                          onClick={() => setCurrentPayment(prev => ({ 
                            ...prev, 
                            amount: remainingBalance + amount 
                          }))}
                        >
                          ${amount}
                        </Button>
                      ))}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setCurrentPayment(prev => ({ 
                          ...prev, 
                          amount: remainingBalance 
                        }))}
                      >
                        Exact
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCompleteTransaction}
          disabled={
            remainingBalance > 0.01 || 
            isProcessing || 
            (hasAgeRestrictedItems && !ageVerified) ||
            payments.length === 0
          }
        >
          {isProcessing ? 'Processing...' : 'Complete Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
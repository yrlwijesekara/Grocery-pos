import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
} from '@mui/material';
import { Print, Close } from '@mui/icons-material';
import { CartItem, Customer, Payment } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ReceiptProps {
  open: boolean;
  onClose: () => void;
  transactionData: {
    receiptNumber: string;
    timestamp: string;
    items: CartItem[];
    customer: Customer | null;
    payments: Payment[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    loyaltyPointsUsed: number;
    cashier: {
      name: string;
      employeeId: string;
    };
  };
  receiptConfig?: {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    footerMessage: string;
    showLoyaltyInfo: boolean;
  };
}

const Receipt: React.FC<ReceiptProps> = ({
  open,
  onClose,
  transactionData,
  receiptConfig = {
    storeName: 'Grocery Store',
    storeAddress: '123 Main Street, City, State 12345',
    storePhone: '(555) 123-4567',
    footerMessage: 'Thank you for shopping with us!\nHave a great day!',
    showLoyaltyInfo: true,
  },
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${transactionData.receiptNumber}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  margin: 0; 
                  padding: 20px;
                  max-width: 300px;
                }
                .receipt-container { 
                  width: 100%; 
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { 
                  border-top: 1px dashed #000; 
                  margin: 10px 0; 
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                }
                td { 
                  padding: 2px 0; 
                  vertical-align: top;
                }
                .item-name { 
                  width: 60%; 
                }
                .item-price { 
                  width: 40%; 
                  text-align: right; 
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const customerName = transactionData.customer 
    ? `${transactionData.customer.firstName} ${transactionData.customer.lastName}`
    : 'Guest';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        Transaction Complete!
      </DialogTitle>
      <DialogContent>
        <Paper 
          ref={receiptRef}
          sx={{ 
            p: 2, 
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1.2,
            maxWidth: '400px',
            margin: '0 auto'
          }}
        >
          {/* Store Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
              {receiptConfig.storeName.toUpperCase()}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {receiptConfig.storeAddress}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {receiptConfig.storePhone}
            </Typography>
          </Box>

          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

          {/* Transaction Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Receipt: {transactionData.receiptNumber}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Date: {new Date(transactionData.timestamp).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Cashier: {transactionData.cashier.name} ({transactionData.cashier.employeeId})
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Customer: {customerName}
            </Typography>
            {transactionData.customer?.loyaltyProgram && receiptConfig.showLoyaltyInfo && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                Loyalty ID: {transactionData.customer.loyaltyProgram.membershipNumber}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

          {/* Items */}
          <Box sx={{ mb: 2 }}>
            <Table size="small" sx={{ '& td': { border: 'none', p: 0.25, fontFamily: 'monospace' } }}>
              <TableBody>
                {transactionData.items.map((item, index) => (
                  <React.Fragment key={index}>
                    <TableRow>
                      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                        {item.name}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        {item.priceType === 'weight' ? (
                          `${item.cartWeight || 0} ${item.unit} @ ${formatCurrency(item.price)}/${item.unit}`
                        ) : (
                          `${item.cartQuantity} @ ${formatCurrency(item.price)}`
                        )}
                        {item.cartDiscount && item.cartDiscount > 0 && (
                          <span> - {formatCurrency(item.cartDiscount)} discount</span>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        {formatCurrency(
                          item.priceType === 'weight' && item.cartWeight
                            ? item.cartWeight * item.price - (item.cartDiscount || 0)
                            : item.cartQuantity * item.price - (item.cartDiscount || 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

          {/* Totals */}
          <Box sx={{ mb: 2 }}>
            <Table size="small" sx={{ '& td': { border: 'none', p: 0.25, fontFamily: 'monospace' } }}>
              <TableBody>
                <TableRow>
                  <TableCell>Subtotal:</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatCurrency(transactionData.subtotal)}
                  </TableCell>
                </TableRow>
                {transactionData.discountAmount > 0 && (
                  <TableRow>
                    <TableCell>Discount:</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      -{formatCurrency(transactionData.discountAmount)}
                    </TableCell>
                  </TableRow>
                )}
                {transactionData.loyaltyPointsUsed > 0 && (
                  <TableRow>
                    <TableCell>Loyalty Discount ({transactionData.loyaltyPointsUsed} pts):</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      -{formatCurrency(transactionData.loyaltyPointsUsed * 0.01)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell>Tax:</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {formatCurrency(transactionData.taxAmount)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '16px' }}>TOTAL:</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                    {formatCurrency(transactionData.totalAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

          {/* Payment Methods */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace', mb: 1 }}>
              PAYMENT:
            </Typography>
            <Table size="small" sx={{ '& td': { border: 'none', p: 0.25, fontFamily: 'monospace' } }}>
              <TableBody>
                {transactionData.payments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {payment.method.replace('_', ' ')}
                      {payment.cardLast4 && ` ****${payment.cardLast4}`}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {(() => {
                  const totalPaid = transactionData.payments.reduce((sum, p) => sum + p.amount, 0);
                  const change = totalPaid - transactionData.totalAmount;
                  return change > 0 ? (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>CHANGE:</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(change)}
                      </TableCell>
                    </TableRow>
                  ) : null;
                })()}
              </TableBody>
            </Table>
          </Box>

          {/* Loyalty Info */}
          {transactionData.customer?.loyaltyProgram && receiptConfig.showLoyaltyInfo && (
            <>
              <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  LOYALTY REWARDS
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Points Earned: {Math.floor(transactionData.totalAmount)}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Total Points: {transactionData.customer.loyaltyProgram.points + Math.floor(transactionData.totalAmount) - transactionData.loyaltyPointsUsed}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Tier: {transactionData.customer.loyaltyProgram.tier.toUpperCase()}
                </Typography>
              </Box>
            </>
          )}

          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

          {/* Footer Message */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            {receiptConfig.footerMessage.split('\n').map((line, index) => (
              <Typography 
                key={index} 
                variant="body2" 
                sx={{ fontFamily: 'monospace', mb: 0.5 }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePrint} startIcon={<Print />} variant="outlined">
          Print Receipt
        </Button>
        <Button onClick={onClose} startIcon={<Close />} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Receipt;
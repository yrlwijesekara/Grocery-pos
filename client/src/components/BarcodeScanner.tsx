import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { QrCodeScanner, Search } from '@mui/icons-material';
import { productAPI } from '../services/api';
import { Product } from '../types';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  onProductFound: (product: Product) => void;
  onError?: (error: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onProductFound,
  onError,
}) => {
  const [barcode, setBarcode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBarcodeSearch = useCallback(async (code: string) => {
    if (!code.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await productAPI.getByBarcode(code);
      onProductFound(response.data);
      setBarcode('');
      toast.success(`Found: ${response.data.name}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Product not found';
      toast.error(message);
      if (onError) {
        onError(message);
      }
    } finally {
      setIsSearching(false);
    }
  }, [onProductFound, onError]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeSearch(barcode);
    }
  };

  const handleManualSearch = () => {
    handleBarcodeSearch(barcode);
  };

  // Simulate barcode scanner input detection
  React.useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // If more than 100ms between keystrokes, start new barcode
      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = '';
      }
      
      lastKeyTime = currentTime;
      
      // Build barcode buffer
      if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
      
      // If Enter key and buffer looks like barcode (8+ digits)
      if (e.key === 'Enter' && barcodeBuffer.length >= 8 && /^\d+$/.test(barcodeBuffer)) {
        e.preventDefault();
        setBarcode(barcodeBuffer);
        handleBarcodeSearch(barcodeBuffer);
        barcodeBuffer = '';
      }
    };
    
    // Only listen when not focused on input fields
    const shouldListen = () => {
      const activeElement = document.activeElement;
      return !(activeElement instanceof HTMLInputElement || 
               activeElement instanceof HTMLTextAreaElement);
    };
    
    const keyDownHandler = (e: KeyboardEvent) => {
      if (shouldListen()) {
        handleKeyDown(e);
      }
    };
    
    window.addEventListener('keydown', keyDownHandler);
    
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
    };
  }, [handleBarcodeSearch]);

  const openCameraScanner = () => {
    setShowCamera(true);
  };

  const closeCameraScanner = () => {
    setShowCamera(false);
  };

  return (
    <Box>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          ref={inputRef}
          fullWidth
          size="small"
          label="Scan or Enter Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSearching}
          InputProps={{
            endAdornment: (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={handleManualSearch}
                  disabled={isSearching || !barcode.trim()}
                >
                  <Search />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={openCameraScanner}
                  disabled={isSearching}
                >
                  <QrCodeScanner />
                </IconButton>
              </Box>
            ),
          }}
        />
      </Paper>

      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Scan with barcode scanner or camera, or enter manually
        </Typography>
      </Box>

      {/* Camera Scanner Dialog */}
      <Dialog
        open={showCamera}
        onClose={closeCameraScanner}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Camera Barcode Scanner</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              height: 300,
              bgcolor: 'grey.100',
              border: '2px dashed',
              borderColor: 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <QrCodeScanner sx={{ fontSize: 48, color: 'grey.500' }} />
            <Typography color="textSecondary">
              Camera scanning not implemented in demo
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Use the text input or physical barcode scanner instead
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCameraScanner}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BarcodeScanner;
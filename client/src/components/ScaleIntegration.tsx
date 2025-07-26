import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import { Scale, CheckCircle, Error } from '@mui/icons-material';
import { scaleAPI } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { ScaleReading } from '../types';
import { formatWeight } from '../utils/formatters';
import toast from 'react-hot-toast';

interface ScaleIntegrationProps {
  productId?: string;
  onWeightUpdate?: (weight: number) => void;
}

const ScaleIntegration: React.FC<ScaleIntegrationProps> = ({
  productId,
  onWeightUpdate,
}) => {
  const {
    currentScaleReading,
    isWeighingItem,
    weighingProductId,
    startWeighing,
    stopWeighing,
    updateScaleReading,
  } = useCartStore();

  const [isConnected, setIsConnected] = useState(false);
  const [manualWeight, setManualWeight] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkScaleStatus();
    
    // Start polling for weight readings when weighing
    let intervalId: NodeJS.Timeout;
    
    if (isWeighingItem && weighingProductId) {
      intervalId = setInterval(async () => {
        try {
          const response = await scaleAPI.getWeight();
          updateScaleReading(response.data);
        } catch (error) {
          console.error('Error reading scale:', error);
        }
      }, 1000); // Poll every second
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isWeighingItem, weighingProductId, updateScaleReading]);

  const checkScaleStatus = async () => {
    setIsChecking(true);
    try {
      const response = await scaleAPI.getStatus();
      setIsConnected(response.data.connected);
    } catch (error) {
      setIsConnected(false);
      console.error('Scale status check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleTareScale = async () => {
    try {
      await scaleAPI.tare();
      toast.success('Scale tared successfully');
    } catch (error) {
      toast.error('Failed to tare scale');
    }
  };

  const handleStartWeighing = () => {
    if (productId) {
      startWeighing(productId);
      toast('Place item on scale...', { icon: 'ℹ️' });
    }
  };

  const handleStopWeighing = () => {
    stopWeighing();
    if (currentScaleReading && onWeightUpdate) {
      onWeightUpdate(currentScaleReading.weight);
    }
    toast.success('Weight reading completed');
  };

  const handleManualWeight = () => {
    const weight = parseFloat(manualWeight);
    if (weight > 0) {
      if (onWeightUpdate) {
        onWeightUpdate(weight);
      }
      setManualWeight('');
      toast.success(`Manual weight set: ${formatWeight(weight, 'lb')}`);
    }
  };

  const handleTestWeight = async (testWeight: number) => {
    try {
      await scaleAPI.setTestWeight(testWeight);
      toast.success(`Test weight set to ${formatWeight(testWeight, 'lb')}`);
    } catch (error) {
      toast.error('Failed to set test weight');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Scale color={isConnected ? 'primary' : 'disabled'} />
          <Typography variant="h6">
            Scale Integration
          </Typography>
          <Chip
            icon={isConnected ? <CheckCircle /> : <Error />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
        </Box>

        {isChecking && <LinearProgress sx={{ mb: 2 }} />}

        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Scale is not connected. You can still enter weights manually.
          </Alert>
        )}

        {/* Current Reading */}
        {isWeighingItem && currentScaleReading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" color="primary" textAlign="center">
              {formatWeight(currentScaleReading.weight, currentScaleReading.unit)}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
              <Chip
                label={currentScaleReading.stable ? 'Stable' : 'Unstable'}
                color={currentScaleReading.stable ? 'success' : 'warning'}
                size="small"
              />
              <Chip
                label={new Date(currentScaleReading.timestamp).toLocaleTimeString()}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        )}

        {/* Scale Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {!isWeighingItem ? (
            <Button
              variant="contained"
              onClick={handleStartWeighing}
              disabled={!productId || !isConnected}
              startIcon={<Scale />}
            >
              Start Weighing
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleStopWeighing}
              disabled={!currentScaleReading?.stable}
            >
              Accept Weight
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={handleTareScale}
            disabled={!isConnected}
            size="small"
          >
            Tare Scale
          </Button>

          <Button
            variant="outlined"
            onClick={checkScaleStatus}
            disabled={isChecking}
            size="small"
          >
            Check Status
          </Button>
        </Box>

        {/* Manual Weight Entry */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Manual Weight Entry
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              label="Weight (lbs)"
              type="number"
              value={manualWeight}
              onChange={(e) => setManualWeight(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              onClick={handleManualWeight}
              disabled={!manualWeight || parseFloat(manualWeight) <= 0}
            >
              Set
            </Button>
          </Box>
        </Box>

        {/* Test Weights (for demo) */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Test Weights (Demo)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[0.5, 1.0, 1.5, 2.0, 2.5].map((weight) => (
                <Button
                  key={weight}
                  size="small"
                  variant="outlined"
                  onClick={() => handleTestWeight(weight)}
                >
                  {weight} lb
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ScaleIntegration;
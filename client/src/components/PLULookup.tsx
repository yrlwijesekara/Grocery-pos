import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { productAPI } from '../services/api';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

interface PLULookupProps {
  open: boolean;
  onClose: () => void;
  onProductFound: (product: Product) => void;
}

const PLULookup: React.FC<PLULookupProps> = ({
  open,
  onClose,
  onProductFound,
}) => {
  const [pluCode, setPluCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [produceItems, setProduceItems] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Common PLU codes for quick access (matching seed data)
  const commonPLUs = [
    { plu: '4011', name: 'Bananas', price: 0.68 },
    { plu: '4017', name: 'Granny Smith Apples', price: 1.49 },
    { plu: '4087', name: 'Roma Tomatoes', price: 1.29 },
    { plu: '4065', name: 'Green Bell Peppers', price: 1.99 },
    { plu: '4082', name: 'Red Onions', price: 0.99 },
    { plu: '4225', name: 'Broccoli Crowns', price: 2.49 },
  ];

  useEffect(() => {
    if (open) {
      loadProduceItems();
    }
  }, [open]);

  const loadProduceItems = async () => {
    try {
      const response = await productAPI.getByCategory('produce');
      setProduceItems(response.data);
    } catch (error) {
      console.error('Error loading produce items:', error);
    }
  };

  const handleProductSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await productAPI.search({ query });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePLUSearch = async (plu: string) => {
    if (!plu.trim()) return;
    
    setIsLoading(true);
    try {
      console.log('Searching for PLU:', plu);
      const response = await productAPI.getByPLU(plu);
      console.log('PLU search response:', response.data);
      onProductFound(response.data);
      toast.success(`Found: ${response.data.name}`);
      onClose();
      setPluCode(''); // Clear the input after successful search
    } catch (error: any) {
      console.error('PLU search error:', error);
      const message = error.response?.data?.message || `PLU ${plu} not found`;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePLUSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePLUSearch(pluCode);
  };

  const handleQuickPLU = (plu: string) => {
    setPluCode(plu);
    handlePLUSearch(plu);
  };

  const handleProductSelect = (product: Product) => {
    onProductFound(product);
    toast.success(`Added: ${product.name}`);
    onClose();
  };

  const displayItems = searchQuery.trim() ? searchResults : produceItems;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>PLU Lookup - All Products</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <form onSubmit={handlePLUSubmit}>
            <TextField
              fullWidth
              label="Enter PLU Code"
              value={pluCode}
              onChange={(e) => setPluCode(e.target.value)}
              placeholder="e.g., 4011 for Bananas"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={isLoading || !pluCode.trim()}
                    >
                      <Search />
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </form>
        </Box>

        {/* Common PLUs */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Common PLU Codes
          </Typography>
          <Grid container spacing={1}>
            {commonPLUs.map((item) => (
              <Grid item xs={6} sm={4} md={3} key={item.plu}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => handleQuickPLU(item.plu)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h6" color="primary">
                      {item.plu}
                    </Typography>
                    <Typography variant="body2" noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatCurrency(item.price)}/lb
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Search Produce */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Search All Products"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length >= 2) {
                handleProductSearch(e.target.value);
              } else {
                setSearchResults([]);
                setIsSearching(false);
              }
            }}
            placeholder="Search by name, PLU, or barcode"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Product Items List */}
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {isSearching && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="textSecondary">Searching...</Typography>
            </Box>
          )}
          <Grid container spacing={1}>
            {displayItems.map((item) => (
              <Grid item xs={12} sm={6} key={item._id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.01)',
                      boxShadow: 1,
                    },
                  }}
                  onClick={() => handleProductSelect(item)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, mr: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {item.name}
                        </Typography>
                        {item.plu && (
                          <Chip
                            label={`PLU: ${item.plu}`}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.price)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          per {item.unit}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {displayItems.length === 0 && searchQuery && !isSearching && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                No products found matching "{searchQuery}"
              </Typography>
            </Box>
          )}
          {displayItems.length === 0 && !searchQuery && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                No produce items available
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PLULookup;
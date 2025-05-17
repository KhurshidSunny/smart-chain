import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  TextField,
  IconButton,
  TableContainer,
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import StatusIndicator from '../../../components/common/StatusIndicator/StatusIndicator';
import { getInventoryItems } from '../../../services/inventoryService';
import useProductMutations from '../hooks/useProductMutations';

function LowStockAlerts() {
  const navigate = useNavigate();
  const isManager = true; // Replace with auth context
  const [adjustStock, setAdjustStock] = useState({});
  const { reserveMutation, releaseMutation, adjustStockMutation } = useProductMutations();

  

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getInventoryItems,
    onError: (error) => {
      console.error('useQuery error:', error);
      toast.error(error.message || 'Failed to fetch products', { toastId: 'fetch-products-error' });
    },
  });

  const products = data?.inventory || [];

  console.log('products:', products);

  // Filter low stock products
  const lowStock = products.filter((product) => {
    const stock = Number(product.stockLevel) || 0;
    const reorder = Number(product.reorderPoint) || 20;
    console.log(`Product: ${product.name}, stock: ${stock}, reorder: ${reorder}, low: ${stock <= reorder}`);

    // will change later on 
    // return stock <= reorder;
    return stock >= reorder;
  });


  // Handle stock adjustment
  const handleAdjustStock = (productId, action) => {
    const quantity = parseInt(adjustStock[productId] || 0);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity', { toastId: `stock-adjust-error-${productId}` });
      return;
    }
    adjustStockMutation.mutate(
      { id: productId, quantity, action },
      {
        onSuccess: () => {
          setAdjustStock((prev) => ({ ...prev, [productId]: 0 }));
        },
      }
    );
  };

  // Handle reserve/release
  const handleReserve = (productId, stockLevel) => {
    const quantity = Math.min(stockLevel || 0, 10);
    if (quantity <= 0) {
      toast.error('No stock available to reserve', { toastId: `reserve-error-${productId}` });
      return;
    }
    reserveMutation.mutate({ id: productId, quantity });
  };

  const handleRelease = (productId, reserved) => {
    if (!reserved || reserved <= 0) {
      toast.error('No reserved stock to release', { toastId: `release-error-${productId}` });
      return;
    }
    releaseMutation.mutate({ id: productId, quantity: reserved });
  };

  // Map stock to StatusIndicator status and label
  const getStockStatus = (stockLevel, reorderPoint) => {
    const threshold = Number(reorderPoint) || 20;
    const stock = Number(stockLevel) || 0;
    if (stock <= threshold * 0.25) {
      return { status: 'error', label: 'Critical' };
    }
    if (stock <= threshold) {
      return { status: 'inProgress', label: 'Warning' };
    }
    return { status: 'completed', label: 'Healthy' };
  };

  return (
    <Card
      sx={{
        bgcolor: '#e3f2fd',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        borderRadius: 2,
        '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.1)' },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 'medium',
            color: '#1976d2',
            mb: 2,
          }}
        >
          Low Stock Alerts
        </Typography>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#1976d2' }} />
          </Box>
        ) : lowStock.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                color: '#757575',
              }}
            >
              No low stock products found
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 'auto', sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Stock</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Criticality</TableCell>
                  {isManager && (
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStock.map((product) => {
                  const { status, label } = getStockStatus(product.stockLevel, product.reorderPoint);
                  return (
                    <TableRow
                      key={product._id}
                      sx={{
                        '&:hover': { bgcolor: '#e0f7fa', cursor: 'pointer' },
                      }}
                      onClick={() => navigate(`/products/${product.productId}`)}
                      role="button"
                      aria-label={`View details for ${product.name}`}
                    >
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {product.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {product.category}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {product.stockLevel}
                      </TableCell>
                      <TableCell>
                        <StatusIndicator status={status} label={label} />
                      </TableCell>
                      {isManager && (
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 1,
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              flexWrap: 'wrap',
                            }}
                          >
                            <Tooltip title="Reserve Stock">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReserve(product._id, product.stockLevel);
                                }}
                                sx={{
                                  color: '#388e3c',
                                  borderColor: '#388e3c',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  minWidth: { xs: '100px', sm: '80px' },
                                }}
                                aria-label={`Reserve stock for ${product.name}`}
                              >
                                Reserve
                              </Button>
                            </Tooltip>
                            <Tooltip title="Release Reserved Stock">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRelease(product._id, product.reserved || 0);
                                }}
                                sx={{
                                  color: '#1976d2',
                                  borderColor: '#1976d2',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  minWidth: { xs: '100px', sm: '80px' },
                                }}
                                disabled={!product.reserved || product.reserved <= 0}
                                aria-label={`Release stock for ${product.name}`}
                              >
                                Release
                              </Button>
                            </Tooltip>
                            <TextField
                              type="number"
                              size="small"
                              value={adjustStock[product._id] || 0}
                              onChange={(e) =>
                                setAdjustStock((prev) => ({
                                  ...prev,
                                  [product._id]: e.target.value,
                                }))
                              }
                              onClick={(e) => e.stopPropagation()}
                              sx={{ width: { xs: '100px', sm: '80px' } }}
                              inputProps={{ min: 0 }}
                              aria-label={`Stock adjustment quantity for ${product.name}`}
                            />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Increase Stock">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdjustStock(product._id, 'increase');
                                  }}
                                  sx={{ color: '#1976d2', p: { xs: 0.5, sm: 1 } }}
                                  aria-label={`Increase stock for ${product.name}`}
                                >
                                  <Add fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Decrease Stock">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdjustStock(product._id, 'decrease');
                                  }}
                                  sx={{ color: '#1976d2', p: { xs: 0.5, sm: 1 } }}
                                  aria-label={`Decrease stock for ${product.name}`}
                                >
                                  <Remove fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default LowStockAlerts;
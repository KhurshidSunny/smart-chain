import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Edit, Place, Remove, Adjust } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventoryItem, adjustInventory } from '../../services/inventoryService';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx';
import useProductMutations from './hooks/useProductMutations.js';
import EditProductDialog from './components/EditProductDialog.jsx';
import TransactionsTable from './components/TransactionsTable.jsx';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isManager = true; // Replace with auth context
  const [editProduct, setEditProduct] = useState(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [newLocationStock, setNewLocationStock] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { editMutation } = useProductMutations();

  // Mutation for updating locations (mock, replace with actual API)
  const updateLocationsMutation = useMutation({
    mutationFn: async ({ id, locations }) => {
      console.log('Updating locations for product', id, locations);
      return { _id: id, locations };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product', id]);
      toast.success('Locations updated successfully', { toastId: 'update-locations-success' });
      setLocationDialogOpen(false);
      setNewLocation('');
      setNewLocationStock('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update locations', { toastId: 'update-locations-error' });
    },
  });

  // Mutation for adjusting inventory
  const adjustInventoryMutation = useMutation({
    mutationFn: ({ productId, quantity, reason }) => adjustInventory({ productId, quantity, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['product', id]);
      toast.success('Stock adjusted successfully', { toastId: 'adjust-inventory-success' });
      setAdjustDialogOpen(false);
      setAdjustQuantity('');
      setAdjustReason('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to adjust inventory', { toastId: 'adjust-inventory-error' });
    },
  });

  // Fetch product by ID
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getInventoryItem(id),
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch product', { toastId: 'fetch-product-error' });
    },
  });

  // Colors for pie chart
  const COLORS = ['#0288d1', '#d81b60', '#388e3c', '#f57c00', '#7b1fa2'];

  // Process recentActivity to create stock history
  const stockHistory = useMemo(() => {
    if (!product?.recentActivity) return [];
    
    let currentStock = 0;
    const history = product.recentActivity
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((activity, index) => {
        if (activity.type === 'received' || activity.type === 'Adjusted' && activity.quantity > 0) {
          currentStock += activity.quantity;
        } else {
          currentStock -= Math.abs(activity.quantity);
        }
        currentStock = Math.max(0, currentStock);
        
        return {
          name: new Date(activity.date).toLocaleDateString(),
          stock: currentStock,
          color: COLORS[index % COLORS.length],
        };
      });

    if (history.length === 0 && product?.stockLevel) {
      return [
        {
          name: new Date().toLocaleDateString(),
          stock: product.stockLevel,
          color: COLORS[0],
        },
      ];
    }

    return history;
  }, [product]);

  // Handlers
  const handleEditOpen = () => {
    setEditProduct(product);
  };

  const handleEditClose = () => {
    setEditProduct(null);
  };

  const handleEditSubmit = (data) => {
    editMutation.mutate({ id, ...data });
    setEditProduct(null);
  };

  const handleLocationDialogOpen = () => {
    setLocationDialogOpen(true);
  };

  const handleLocationDialogClose = () => {
    setLocationDialogOpen(false);
    setNewLocation('');
    setNewLocationStock('');
  };

  const handleAdjustDialogOpen = () => {
    setAdjustDialogOpen(true);
  };

  const handleAdjustDialogClose = () => {
    setAdjustDialogOpen(false);
    setAdjustQuantity('');
    setAdjustReason('');
  };

  const handleAddLocation = () => {
    if (!newLocation || !newLocationStock || isNaN(newLocationStock) || newLocationStock <= 0) {
      toast.error('Please enter a valid location and stock quantity', { toastId: 'add-location-error' });
      return;
    }
    const updatedLocations = [
      ...(product.locations || []),
      { location: newLocation, stock: parseInt(newLocationStock) },
    ];
    updateLocationsMutation.mutate({ id, locations: updatedLocations });
  };

  const handleRemoveLocation = (indexToRemove) => {
    const updatedLocations = (product.locations || []).filter((_, index) => index !== indexToRemove);
    updateLocationsMutation.mutate({ id, locations: updatedLocations });
  };

  const handleAdjustInventory = () => {
    if (!adjustQuantity || isNaN(adjustQuantity) || adjustQuantity === '0' || !adjustReason.trim()) {
      toast.error('Please enter a valid non-zero quantity and reason', { toastId: 'adjust-error' });
      return;
    }
    adjustInventoryMutation.mutate({
      productId: id,
      quantity: parseInt(adjustQuantity),
      reason: adjustReason,
    });
  };

  // Map stock to StatusIndicator status and label
  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'error', label: 'Out of Stock' };
    if (stock <= (product?.reorderPoint || 20)) return { status: 'inProgress', label: 'Low Stock' };
    return { status: 'completed', label: 'In Stock' };
  };

  if (isProductLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#1565c0' }} />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#546e7a' }}>
          Product not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        bgcolor: '#f9fafb',
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
      }}
      role="region"
      aria-label={`Product detail page for ${product.name}`}
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: { xs: '0.875rem', sm: '1rem' },
          maxWidth: { xs: '90vw', sm: '400px' },
        }}
      />
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: '#1565c0',
            }}
          >
            {product.name}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: '#546e7a',
              mt: 0.5,
            }}
          >
            Manage product details and stock
          </Typography>
        </Box>
        {isManager && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Tooltip title="Edit Product Information">
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEditOpen}
                sx={{
                  bgcolor: '#1565c0',
                  '&:hover': { bgcolor: '#104d93' },
                  borderRadius: '8px',
                  px: 2.5,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
                aria-label="Edit product information"
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip title="Manage Locations">
              <Button
                variant="contained"
                startIcon={<Place />}
                onClick={handleLocationDialogOpen}
                sx={{
                  bgcolor: '#1565c0',
                  '&:hover': { bgcolor: '#104d93' },
                  borderRadius: '8px',
                  px: 2.5,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
                aria-label="Manage product locations"
              >
                Locations
              </Button>
            </Tooltip>
            <Tooltip title="Adjust Stock">
              <Button
                variant="contained"
                startIcon={<Adjust />}
                onClick={handleAdjustDialogOpen}
                sx={{
                  bgcolor: '#1565c0',
                  '&:hover': { bgcolor: '#104d93' },
                  borderRadius: '8px',
                  px: 2.5,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
                aria-label="Adjust stock"
              >
                Adjust
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Product Information */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              borderRadius: 3,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#1565c0', mb: 2.5 }}
              >
                Product Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#546e7a', fontWeight: 500 }}>
                    SKU
                  </Typography>
                  <Typography sx={{ color: '#263238', fontSize: '1rem' }}>
                    {product.sku}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#546e7a', fontWeight: 500 }}>
                    Category
                  </Typography>
                  <Typography sx={{ color: '#263238', fontSize: '1rem' }}>
                    {product.category || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#546e7a', fontWeight: 500 }}>
                    Price
                  </Typography>
                  <Typography sx={{ color: '#263238', fontSize: '1rem' }}>
                    {product.unitCost ? `$${product.unitCost.toFixed(2)}` : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#546e7a', fontWeight: 500 }}>
                    Description
                  </Typography>
                  <Typography sx={{ color: '#263238', fontSize: '1rem' }}>
                    {product.description || 'No description available'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock and Locations */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              borderRadius: 3,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#1565c0', mb: 2.5 }}
              >
                Stock and Locations
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                <StatusIndicator {...getStockStatus(product.stockLevel)} />
                <Typography sx={{ ml: 1.5, color: '#263238', fontSize: '1rem' }}>
                  Total Stock: {product.stockLevel}
                </Typography>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#1565c0' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1565c0' }}>Stock</TableCell>
                    {isManager && (
                      <TableCell sx={{ fontWeight: 600, color: '#1565c0' }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(product.locations || []).map((loc, index) => (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: '#e3f2fd' } }}>
                      <TableCell>{loc.location}</TableCell>
                      <TableCell>{loc.stock}</TableCell>
                      {isManager && (
                        <TableCell>
                          <Tooltip title="Remove Location">
                            <IconButton
                              onClick={() => handleRemoveLocation(index)}
                              sx={{ color: '#d32f2f' }}
                              aria-label={`Remove ${loc.location}`}
                            >
                              <Remove />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock History Pie Chart */}
        <Grid item xs={12}>
          <Card
            sx={{
              bgcolor: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              borderRadius: 3,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#1565c0', mb: 2.5 }}
              >
                Stock History
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#546e7a', mb: 3 }}
              >
                Stock levels over time by date
              </Typography>
              {stockHistory.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
                  <Typography
                    variant="body1"
                    sx={{ color: '#546e7a', fontSize: { xs: '1rem', sm: '1.125rem' } }}
                  >
                    No stock history available
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockHistory}
                        dataKey="stock"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ stock }) => stock}
                      >
                        {stockHistory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value, name) => [value, `Stock on ${name}`]} />
                      <Legend formatter={(value) => `Date: ${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction Log */}
        <Grid item xs={12}>
          <TransactionsTable productId={id} />
        </Grid>
      </Grid>

      {/* Edit Product Dialog */}
      <EditProductDialog
        open={!!editProduct}
        product={editProduct}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
      />

      {/* Location Management Dialog */}
      <Dialog
        open={locationDialogOpen}
        onClose={handleLocationDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1565c0', color: '#fff', fontWeight: 600 }}>
          Manage Locations
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Location Name"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              aria-label="New location name"
            />
            <TextField
              label="Stock Quantity"
              type="number"
              value={newLocationStock}
              onChange={(e) => setNewLocationStock(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              inputProps={{ min: 0 }}
              aria-label="New location stock quantity"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleLocationDialogClose}
            sx={{ color: '#546e7a' }}
            aria-label="Cancel location management"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddLocation}
            variant="contained"
            sx={{ bgcolor: '#1565c0', '&:hover': { bgcolor: '#104d93' } }}
            aria-label="Add new location"
          >
            Add Location
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Inventory Dialog */}
      <Dialog
        open={adjustDialogOpen}
        onClose={handleAdjustDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1565c0', color: '#fff', fontWeight: 600 }}>
          Adjust Inventory
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Quantity (positive to add, negative to remove)"
              type="number"
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              aria-label="Adjustment quantity"
            />
            <TextField
              label="Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              aria-label="Adjustment reason"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleAdjustDialogClose}
            sx={{ color: '#546e7a' }}
            aria-label="Cancel adjustment"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdjustInventory}
            variant="contained"
            sx={{ bgcolor: '#1565c0', '&:hover': { bgcolor: '#104d93' } }}
            aria-label="Confirm adjustment"
          >
            Adjust
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProductDetail;






































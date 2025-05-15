import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Edit, Add, Remove, Image, Place } from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getInventoryItem, getInventoryTransactions } from '../../services/inventoryService';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx';
import useProductMutations from './hooks/useProductMutations.js';
import EditProductDialog from './components/EditProductDialog.jsx';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isManager = true; // Replace with auth context
  const [adjustStock, setAdjustStock] = useState(0);
  const [editProduct, setEditProduct] = useState(null);

  const { editMutation, adjustStockMutation } = useProductMutations();

  // Fetch product by ID
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => {
      return getInventoryItem(id)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch product', { toastId: 'fetch-product-error' });
    },
  });

  console.log(product)

  

  // Fetch transaction log
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', id],
    queryFn: getInventoryTransactions,
    select: (data) => data.filter((t) => t.productId === id),
  });

  // Mock stock history (replace with API if available)
  const mockStockHistory = [
    { date: '2025-04-07', stock: 60 },
    { date: '2025-04-14', stock: 55 },
    { date: '2025-04-21', stock: 52 },
    { date: '2025-04-28', stock: 50 },
    { date: '2025-05-05', stock: 50 },
  ];

  // Handlers
  const handleAdjustStock = (action) => {
    const quantity = parseInt(adjustStock);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity', { toastId: 'stock-adjust-error' });
      return;
    }
    adjustStockMutation.mutate({ id, quantity, action });
  };

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

  // Map stock to StatusIndicator status and label
  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { status: 'error', label: 'Out of Stock' };
    }
    if (stock <= 20) {
      return { status: 'inProgress', label: 'Low Stock' };
    }
    return { status: 'completed', label: 'In Stock' };
  };

  if (isProductLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#1976d2' }} />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
        <Typography
          variant="h6"
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#757575' }}
        >
          Product not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)', width: '100%' }}
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
      {/* Page Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, fontWeight: 'bold', color: '#1976d2' }}
          >
            Product Detail
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#757575' }}
          >
            View and manage product information
          </Typography>
        </Box>
        {isManager && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit Product Information">
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEditOpen}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Edit product information"
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip title="Manage Images">
              <Button
                variant="contained"
                startIcon={<Image />}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Manage product images"
              >
                Images
              </Button>
            </Tooltip>
            <Tooltip title="Assign Locations">
              <Button
                variant="contained"
                startIcon={<Place />}
                sx={{ bgcolor: '1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Assign product locations"
              >
                Locations
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Product Data */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}
              >
                Product Information
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CardMedia
                  component="img"
                  sx={{ width: 120, height: 120, objectFit: 'contain', bgcolor: '#fff', borderRadius: 1 }}
                  image={product.image || 'placeholder.png'}
                  alt={product.name}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {product.name}
                  </Typography>
                  <Typography sx={{ color: '#757575' }}>SKU: {product.sku}</Typography>
                  <Typography sx={{ color: '#757575' }}>
                    Category: {product.category}
                  </Typography>
                  <Typography sx={{ color: '#757575' }}>
                    Price: ${product.price.toFixed(2)}
                  </Typography>
                  <Typography sx={{ color: '#757575', mt: 1 }}>
                    {product.description || 'No description available'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Stock Level and Locations */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}
              >
                Stock and Locations
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StatusIndicator {...getStockStatus(product.stock)} />
                <Typography sx={{ ml: 1, color: '#757575' }}>
                  Total Stock: {product.stock}
                </Typography>
              </Box>
              {isManager && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TextField
                    type="number"
                    label="Adjust Stock"
                    size="small"
                    value={adjustStock}
                    onChange={(e) => setAdjustStock(e.target.value)}
                    sx={{ width: 120 }}
                    inputProps={{ min: 0 }}
                    aria-label="Stock adjustment quantity"
                  />
                  <Tooltip title="Increase Stock">
                    <IconButton
                      onClick={() => handleAdjustStock('increase')}
                      sx={{ color: '#1976d2' }}
                      aria-label="Increase stock"
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Decrease Stock">
                    <IconButton
                      onClick={() => handleAdjustStock('decrease')}
                      sx={{ color: '#1976d2' }}
                      aria-label="Decrease stock"
                    >
                      <Remove />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(product.locations || []).map((loc, index) => (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                      <TableCell>{loc.location}</TableCell>
                      <TableCell>{loc.stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock History Graph */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}
              >
                Stock History
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockStockHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#757575" />
                    <YAxis stroke="#757575" />
                    <RechartsTooltip />
                    <Line
                      type="monotone"
                      dataKey="stock"
                      stroke="#1976d2"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction Log */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'medium', color: '#1976d2' }}
                >
                  Transaction Log
                </Typography>
              </Box>
              {isTransactionsLoading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#1976d2' }} />
                </Box>
              ) : transactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#757575' }}
                  >
                    No transactions found
                  </Typography>
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>{transaction.location || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Product Dialog */}
      <EditProductDialog
        open={!!editProduct}
        product={editProduct}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
      />
    </Box>
  );
}

export default ProductDetail;
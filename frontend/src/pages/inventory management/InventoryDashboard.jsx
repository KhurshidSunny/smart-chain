import React, { useState } from 'react';
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  CircularProgress,
  TextField,
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx';
import {
  getStockSummary,
  getLowStockProducts,
  getInventoryTransactions,
  setLowStockThresholds,
} from '../../services/inventoryService.js';

// Color palette for bar chart
const barColors = ['#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2'];

function InventoryDashboard() {
  const queryClient = useQueryClient();
  const isManager = true; // Replace with auth context
  const [openThresholdDialog, setOpenThresholdDialog] = useState(false);

  // React Hook Form for threshold settings
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      critical: 5,
      warning: 20,
    },
  });

  // Fetch stock summary
  const { data: stockSummary = [], isLoading: isSummaryLoading } = useQuery({
    queryKey: ['stockSummary'],
    queryFn: getStockSummary,
  });

  // Fetch low stock products
  const { data: lowStock = [], isLoading: isLowStockLoading } = useQuery({
    queryKey: ['lowStock'],
    queryFn: getLowStockProducts,
  });

  // Fetch recent transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: getInventoryTransactions,
  });

  // Mutation for setting thresholds
  const thresholdMutation = useMutation({
    mutationFn: setLowStockThresholds,
    onSuccess: () => {
      queryClient.invalidateQueries(['lowStock']);
      toast.success('Thresholds updated successfully');
      setOpenThresholdDialog(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update thresholds');
    },
  });

  // Handle threshold form submission
  const handleSetThresholds = (data) => {
    thresholdMutation.mutate({
      critical: parseInt(data.critical),
      warning: parseInt(data.warning),
    });
  };

  // Map stock to StatusIndicator status and label
  const getStockStatus = (stock) => {
    if (stock <= 5) {
      return { status: 'error', label: 'Critical' };
    }
    if (stock <= 20) {
      return { status: 'inProgress', label: 'Warning' };
    }
    return { status: 'completed', label: 'Healthy' };
  };

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          bgcolor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
          width: '100%',
        }}
        role="region"
        aria-label="Inventory dashboard page"
      >
        {/* Page Title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                fontWeight: 'bold',
                color: '#1976d2',
              }}
            >
              Inventory Dashboard
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                color: '#757575',
              }}
            >
              Monitor and manage inventory health
            </Typography>
          </Box>
          {isManager && (
            <Tooltip title="Manage Low Stock Thresholds">
              <Button
                variant="contained"
                startIcon={<Settings />}
                onClick={() => setOpenThresholdDialog(true)}
                sx={{
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#115293' },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
                aria-label="Set low stock thresholds"
              >
                Set Thresholds
              </Button>
            </Tooltip>
          )}
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Stock Level Summary by Category */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={800}>
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
                    Stock Level by Category
                  </Typography>
                  {isSummaryLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress sx={{ color: '#1976d2' }} />
                    </Box>
                  ) : stockSummary.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                          color: '#757575',
                        }}
                      >
                        No stock summary data available
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stockSummary}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="category" stroke="#757575" />
                          <YAxis stroke="#757575" />
                          <RechartsTooltip />
                          <Legend />
                          {stockSummary.map((entry, index) => (
                            <Bar
                              key={entry.category}
                              dataKey="stock"
                              name={entry.category}
                              fill={barColors[index % barColors.length]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Low Stock Alerts */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={800}>
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
                  {isLowStockLoading ? (
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
                    <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Stock</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Criticality</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStock.map((product) => {
                          const { status, label } = getStockStatus(product.stock);
                          return (
                            <TableRow key={product.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {product.name}
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {product.category}
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {product.stock}
                              </TableCell>
                              <TableCell>
                                <StatusIndicator status={status} label={label} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Recent Inventory Transactions */}
          <Grid item xs={12}>
            <Fade in timeout={800}>
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
                    Recent Inventory Transactions
                  </Typography>
                  {isTransactionsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress sx={{ color: '#1976d2' }} />
                    </Box>
                  ) : transactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                          color: '#757575',
                        }}
                      >
                        No recent transactions found
                      </Typography>
                    </Box>
                  ) : (
                    <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {transaction.date}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {transaction.product}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {transaction.type}
                            </TableCell>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {transaction.quantity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>

        {/* Threshold Settings Dialog */}
        {isManager && (
          <Dialog open={openThresholdDialog} onClose={() => setOpenThresholdDialog(false)}>
            <DialogTitle>Set Low Stock Thresholds</DialogTitle>
            <DialogContent>
              <form onSubmit={handleSubmit(handleSetThresholds)}>
                <Controller
                  name="critical"
                  control={control}
                  rules={{
                    required: 'Critical threshold is required',
                    min: { value: 0, message: 'Threshold must be non-negative' },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Critical Threshold (≤ Stock)"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      aria-label="Critical stock threshold"
                    />
                  )}
                />
                <Controller
                  name="warning"
                  control={control}
                  rules={{
                    required: 'Warning threshold is required',
                    min: { value: 0, message: 'Threshold must be non-negative' },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Warning Threshold (≤ Stock)"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      aria-label="Warning stock threshold"
                    />
                  )}
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenThresholdDialog(false)} aria-label="Cancel threshold settings">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit(handleSetThresholds)}
                disabled={thresholdMutation.isLoading}
                startIcon={thresholdMutation.isLoading ? <CircularProgress size={20} /> : null}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Save threshold settings"
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Fade>
  );
}

export default InventoryDashboard;
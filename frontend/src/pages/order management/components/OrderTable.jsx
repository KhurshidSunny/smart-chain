import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  TablePagination,
  TableSortLabel,
  IconButton,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { Visibility, Edit, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrderStatus, deleteOrder, updateOrder, releaseInventory } from '../../../services/orderService';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';

function OrderTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [batchAction, setBatchAction] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const isStaff = true; // Replace with auth context

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', { page, rowsPerPage, sortBy, sortOrder }],
    queryFn: () =>
      getOrders({
        page: page + 1, // Backend expects 1-based indexing
        limit: rowsPerPage,
        sortBy,
        sortOrder,
      }),
    // keepPreviousData: true,
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch orders');
    },
  });

  console.log(orders)

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id) => deleteOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries(['orders']);
      releaseInventory(id).catch((err) => toast.error(err.message)); // Release inventory
      toast.success('Order cancelled');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['order', editOrder?.id]);
      toast.success('Order updated');
      setEditDialogOpen(false);
      setEditOrder(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update order');
    },
  });

  // Handlers
  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortBy(column);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedOrders(orders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((orderId) => orderId !== id) : [...prev, id]
    );
  };

  const handleBatchAction = () => {
    if (batchAction === 'updateStatus') {
      // Open dialog or prompt for status (simplified here)
      const newStatus = prompt('Enter new status (completed, inProgress, pending, cancelled):');
      if (newStatus) {
        selectedOrders.forEach((id) => {
          updateStatusMutation.mutate({ id, status: newStatus });
          if (newStatus === 'cancelled') {
            releaseInventory(id).catch((err) => toast.error(err.message));
          }
        });
        setSelectedOrders([]);
      }
    } else if (batchAction === 'export') {
      const csv = [
        'Order Number,Customer,Date,Total,Status',
        ...selectedOrders.map((id) => {
          const order = orders.find((o) => o.id === id);
          return `${order.orderNumber},${order.customer.name},${order.date},${order.total},${order.status}`;
        }),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, 'orders.csv');
      setSelectedOrders([]);
    } else if (batchAction === 'cancel') {
      selectedOrders.forEach((id) => {
        deleteOrderMutation.mutate(id);
      });
      setSelectedOrders([]);
    }
    setBatchAction('');
  };

  const handleEditOpen = (order) => {
    setEditOrder(order);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editOrder.customer.name || !editOrder.items.length) {
      toast.error('Customer name and items are required');
      return;
    }
    updateOrderMutation.mutate({
      id: editOrder.id,
      data: {
        customer: editOrder.customer,
        items: editOrder.items,
        shippingAddress: editOrder.shippingAddress,
      },
    });
  };

  if (isLoading) {
    return <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Select
          disabled={selectedOrders.length === 0}
          value={batchAction}
          onChange={(e) => setBatchAction(e.target.value)}
          displayEmpty
          sx={{ mr: 2, width: 200 }}
          renderValue={(selected) => (selected ? selected : 'Batch Actions')}
        >
          <MenuItem value="" disabled>
            Batch Actions
          </MenuItem>
          <MenuItem value="updateStatus">Update Status</MenuItem>
          <MenuItem value="export">Export Selected</MenuItem>
          <MenuItem value="cancel">Cancel Orders</MenuItem>
        </Select>
        <Button
          variant="contained"
          disabled={selectedOrders.length === 0 || !batchAction}
          onClick={handleBatchAction}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
        >
          Apply
        </Button>
      </Box>
      <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}>
            Orders
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'orderNumber'}
                    direction={sortBy === 'orderNumber' ? sortOrder : 'asc'}
                    onClick={() => handleSort('orderNumber')}
                  >
                    Order Number
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'customer'}
                    direction={sortBy === 'customer' ? sortOrder : 'asc'}
                    onClick={() => handleSort('customer')}
                  >
                    Customer
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'date'}
                    direction={sortBy === 'date' ? sortOrder : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'total'}
                    direction={sortBy === 'total' ? sortOrder : 'asc'}
                    onClick={() => handleSort('total')}
                  >
                    Total
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                    />
                  </TableCell>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <StatusIndicator status={order.status} />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => navigate(`/orders/${order.id}`)} title="View">
                      <Visibility />
                    </IconButton>
                    {isStaff && (
                      <>
                        <IconButton onClick={() => handleEditOpen(order)} title="Edit">
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => deleteOrderMutation.mutate(order.id)}
                          title="Cancel"
                          sx={{ color: '#d32f2f' }}
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      {editDialogOpen && editOrder && (
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Order {editOrder.orderNumber}</DialogTitle>
          <DialogContent>
            <TextField
              label="Customer Name"
              value={editOrder.customer.name}
              onChange={(e) =>
                setEditOrder({ ...editOrder, customer: { ...editOrder.customer, name: e.target.value } })
              }
              fullWidth
              sx={{ mt: 2 }}
            />
            {/* Simplified: Add fields for items, address as needed */}
            <Typography sx={{ mt: 2 }}>Items and address editing not fully implemented.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleEditSubmit}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default OrderTable;
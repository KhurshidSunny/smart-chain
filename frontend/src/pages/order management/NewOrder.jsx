import React, { useState } from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomerSelection from './components/CustomerSelection';
import ProductSearch from './components/ProductSearch';
import OrderSummary from './components/OrderSummary';
import ShippingAddress from './components/ShippingAddress';
import { createOrder, reserveInventory } from '../../services/orderService';

function NewOrder() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData) => createOrder(orderData),
    onSuccess: (order) => {
      // Reserve inventory
      reserveInventory(order.id, order.items).then(() => {
        queryClient.invalidateQueries(['orders']);
        toast.success('Order created successfully');
        setSelectedCustomer(null);
        setSelectedProducts([]);
        setSelectedAddress(null);
      }).catch((err) => {
        toast.error('Order created but failed to reserve inventory: ' + err.message);
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create order');
    },
  });

  const handleSubmit = () => {
    if (!selectedCustomer || !selectedProducts.length || !selectedAddress) {
      toast.error('Please select a customer, products, and address');
      return;
    }

    const orderData = {
      customer: selectedCustomer,
      items: selectedProducts,
      shippingAddress: selectedAddress,
      total: selectedProducts.reduce((sum, item) => sum + item.quantity * item.price, 0),
      status: 'pending',
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)', width: '100%' }}>
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
      />
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
        Create New Order
      </Typography>
      <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
        Fill in the details to create a new order
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CustomerSelection
            selectedCustomer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ProductSearch
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <OrderSummary
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ShippingAddress
            selectedCustomer={selectedCustomer}
            selectedAddress={selectedAddress}
            onAddressChange={setSelectedAddress}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' }, px: 4, py: 1 }}
            >
              Submit Order
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default NewOrder;

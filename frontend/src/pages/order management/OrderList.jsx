import React, { useState } from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OrderFilters from './components/OrderFileters'
import OrderTable from './components/OrderTable';

function OrderList() {
  const navigate = useNavigate();
  const isStaff = true; // Replace with auth context

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
      {/* Page Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
            Order List
          </Typography>
          <Typography variant="h6" color="textSecondary" sx={{ mt: 0.5 }}>
            Manage and monitor all orders
          </Typography>
        </Box>
        {isStaff && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/new-order')}
            sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
          >
            Create New Order
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12}>
          <OrderFilters />
        </Grid>
        {/* Table */}
        <Grid item xs={12}>
          <OrderTable />
        </Grid>
      </Grid>
    </Box>
  );
}

export default OrderList;
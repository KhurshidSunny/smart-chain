import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Tooltip, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StockLevelChart from './components/StockLevelChart';
import LowStockAlerts from './components/LowStockAlerts';
import TransactionsTable from './components/TransactionsTable';
import AddProductDialog from './components/AddProductDialog';
import useProductMutations from './hooks/useProductMutations';

function InventoryDashboard() {
  const navigate = useNavigate();
  const { addMutation } = useProductMutations(); // Changed to addMutation for adding products
  const isManager = true; // Replace with auth context
  const [addProductOpen, setAddProductOpen] = useState(false);

  // Handle add product
  const handleAddProduct = () => {
    setAddProductOpen(true);
  };

  const handleAddProductSubmit = (data) => {
    addMutation.mutate(data);
    setAddProductOpen(false);
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
        {/* Page Title and Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
          }}
        >
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
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' },
            }}
          >
            <Tooltip title="View Product Catalog">
              <Button
                variant="contained"
                onClick={() => navigate('/product-catalog')}
                sx={{
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#115293' },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                }}
                aria-label="View product catalog"
              >
                Product Catalog
              </Button>
            </Tooltip>
            {isManager && (
              <Tooltip title="Add New Product">
                <Button
                  variant="contained"
                  onClick={handleAddProduct}
                  sx={{
                    bgcolor: '#388e3c',
                    '&:hover': { bgcolor: '#2e7d32' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1, sm: 2 },
                  }}
                  aria-label="Add new product"
                >
                  Add Product
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={6}>
            <StockLevelChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <LowStockAlerts />
          </Grid>
          <Grid item xs={12}>
            <TransactionsTable />
          </Grid>
        </Grid>

        {isManager && (
          <AddProductDialog
            open={addProductOpen}
            onClose={() => setAddProductOpen(false)}
            onSubmit={handleAddProductSubmit}
          />
        )}
      </Box>
    </Fade>
  );
}

export default InventoryDashboard;
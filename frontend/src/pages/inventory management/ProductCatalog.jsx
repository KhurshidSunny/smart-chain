import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Fade, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Add } from '@mui/icons-material';
import FilterControls from './components/FilterControls';
import ProductCard from './components/ProductCard';
import EditProductDialog from './components/EditProductDialog';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import AddProductDialog from './components/AddProductDialog';
import useProductCatalog from './hooks/useProductCatalog';
import useProductMutations from './hooks/useProductMutations';

function ProductCatalog() {
  const {
    products,
    isLoading,
    filters,
    sort,
    showFilters,
    editProduct,
    deleteProductId,
    isManager,
    handleFilterChange,
    handleSortChange,
    toggleFilters,
    handleEditOpen,
    handleEditClose,
    handleEditSubmit,
    handleDeleteOpen,
    handleDeleteClose,
    handleDeleteConfirm,
    handleReleaseProduct,
    handleAdjustStock,
  } = useProductCatalog();
  const {createMutation} = useProductMutations();
  const [addProductOpen, setAddProductOpen] = useState(false);

  const handleAddProduct = () => {
    setAddProductOpen(true);
  };

  const handleAddProductSubmit = (data) => {
    createMutation.mutate(data);
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
        aria-label="Product catalog page"
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                fontWeight: 'bold',
                color: '#1976d2',
              }}
            >
              Product Catalog
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                color: '#757575',
              }}
            >
              Browse and manage products
            </Typography>
          </Box>
          {isManager && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddProduct}
              sx={{
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#115293' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
              }}
              aria-label="Add new product"
            >
              Add Product
            </Button>
          )}
        </Box>

        {/* Filter Controls */}
        <FilterControls
          filters={filters}
          sort={sort}
          showFilters={showFilters}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onToggleFilters={toggleFilters}
        />

        {/* Product Grid */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
              <CircularProgress sx={{ color: '#1976d2' }} />
            </Box>
          ) : products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, width: '100%' }} aria-live="polite">
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  color: '#757575',
                }}
              >
                No products found
              </Typography>
            </Box>
          ) : (
            products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <ProductCard
                  product={product}
                  isManager={isManager}
                  onEdit={handleEditOpen}
                  onDelete={handleDeleteOpen}
                  onRelease={handleReleaseProduct}
                  onAdjustStock={handleAdjustStock}
                />
              </Grid>
            ))
          )}
        </Grid>

        {/* Dialogs */}
        <EditProductDialog
          open={!!editProduct}
          product={editProduct}
          onClose={handleEditClose}
          onSubmit={handleEditSubmit}
        />
        <DeleteConfirmDialog
          open={!!deleteProductId}
          productId={deleteProductId}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
        />
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

export default ProductCatalog;
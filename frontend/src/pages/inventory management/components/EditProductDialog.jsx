import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

function EditProductDialog({ open, product, onClose, onSubmit }) {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      category: product?.category || '',
      price: product?.price || '',
      stock: product?.stock || '',
    },
  });

  const handleFormSubmit = (data) => {
    onSubmit({ ...data, id: product?.id });
    reset();
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="edit-product-dialog-title">
      <DialogTitle id="edit-product-dialog-title">
        {product ? 'Edit Product' : 'Add Product'}
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Product name is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Product Name"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                aria-label="Product name"
              />
            )}
          />
          <Controller
            name="sku"
            control={control}
            rules={{ required: 'SKU is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="SKU"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                aria-label="Product SKU"
              />
            )}
          />
          <Controller
            name="category"
            control={control}
            rules={{ required: 'Category is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Category"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                aria-label="Product category"
              />
            )}
          />
          <Controller
            name="price"
            control={control}
            rules={{
              required: 'Price is required',
              min: { value: 0, message: 'Price must be non-negative' },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Price"
                type="number"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                aria-label="Product price"
              />
            )}
          />
          <Controller
            name="stock"
            control={control}
            rules={{
              required: 'Stock is required',
              min: { value: 0, message: 'Stock must be non-negative' },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Stock"
                type="number"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                aria-label="Product stock"
              />
            )}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label="Cancel product edit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' }, color: '#fff' }}
          aria-label="Save product"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditProductDialog;
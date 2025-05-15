import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

// Common categories for supply chain management
const categories = [
  'Electronics',
  'Clothing',
  'Automotive',
  'Food & Beverage',
  'Industrial',
  'Healthcare',
  'Consumer Goods',
];

function EditProductDialog({ open, product, onClose, onSubmit }) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      unitCost: '',
      stockLevel: '',
    },
  });

  // Reset form with product values when dialog opens or product changes
  useEffect(() => {
    if (open && product) {
      reset({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        unitCost: product.unitCost ? product.unitCost.toString() : '',
        stockLevel: product.stockLevel ? product.stockLevel.toString() : '',
      });
    } else if (open) {
      reset({
        name: '',
        sku: '',
        category: '',
        unitCost: '',
        stockLevel: '',
      });
    }
  }, [open, product, reset]);

  const handleFormSubmit = (data) => {
    const submissionData = {
      ...data,
      id: product?._id,
      unitCost: parseFloat(data.unitCost) || 0,
      stockLevel: parseInt(data.stockLevel) || 0,
    };
    onSubmit(submissionData);
    onClose();
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
            render={({ field }) => (
              <TextField
                {...field}
                label="Product Name"
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
                aria-label="Product name"
              />
            )}
          />
          <Controller
            name="sku"
            control={control}
            rules={{ required: 'SKU is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="SKU"
                fullWidth
                margin="normal"
                error={!!errors.sku}
                helperText={errors.sku?.message}
                aria-label="Product SKU"
              />
            )}
          />
          <Controller
            name="category"
            control={control}
            rules={{
              required: 'Category is required',
              validate: (value) => value !== '' || 'Please select a category',
            }}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.category}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  {...field}
                  labelId="category-label"
                  label="Category"
                  value={field.value}
                  onChange={field.onChange}
                  aria-label="Product category"
                >
                  <MenuItem value="" disabled>
                    Select Category
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category.toLowerCase()}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error">
                    {errors.category.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="unitCost"
            control={control}
            rules={{
              required: 'Unit cost is required',
              min: { value: 0, message: 'Unit cost must be non-negative' },
              validate: (value) => !isNaN(parseFloat(value)) || 'Unit cost must be a valid number',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Unit Cost"
                type="number"
                fullWidth
                margin="normal"
                error={!!errors.unitCost}
                helperText={errors.unitCost?.message}
                inputProps={{ step: '0.01' }}
                aria-label="Unit cost"
              />
            )}
          />
          <Controller
            name="stockLevel"
            control={control}
            rules={{
              required: 'Stock level is required',
              min: { value: 0, message: 'Stock level must be non-negative' },
              validate: (value) => Number.isInteger(parseFloat(value)) || 'Stock level must be an integer',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Stock Level"
                type="number"
                fullWidth
                margin="normal"
                error={!!errors.stockLevel}
                helperText={errors.stockLevel?.message}
                inputProps={{ step: '1' }}
                aria-label="Stock level"
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
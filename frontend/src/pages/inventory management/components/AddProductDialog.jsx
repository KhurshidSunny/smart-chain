import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
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

function AddProductDialog({ open, onClose, onSubmit }) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      category: '',
      stockLevel: 0,
      sku: '',
      description: '',
      unitCost: 0,
      reorderPoint: 20,
      dimensions: { width: 0, height: 0, depth: 0, weight: 0 },
      active: true,
    },
  });

  const handleFormSubmit = (data) => {
    // Convert numeric fields to numbers
    const submissionData = {
      ...data,
      stockLevel: parseInt(data.stockLevel),
      unitCost: parseFloat(data.unitCost),
      reorderPoint: parseInt(data.reorderPoint),
      dimensions: {
        width: parseFloat(data.dimensions.width) || 0,
        height: parseFloat(data.dimensions.height) || 0,
        depth: parseFloat(data.dimensions.depth) || 0,
        weight: parseFloat(data.dimensions.weight) || 0,
      },
    };
    onSubmit(submissionData);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Product</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Product name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Product Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    aria-label="Product name"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="category"
                control={control}
                rules={{
                  required: 'Category is required',
                  validate: (value) => value !== '' || 'Please select a category',
                }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.category}>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      {...field}
                      labelId="category-label"
                      label="Category"
                      value={field.value}
                      onChange={field.onChange}
                      aria-label="Category"
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
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="stockLevel"
                control={control}
                rules={{
                  required: 'Stock level is required',
                  min: { value: 0, message: 'Stock level must be non-negative' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Stock Level"
                    type="number"
                    fullWidth
                    error={!!errors.stockLevel}
                    helperText={errors.stockLevel?.message}
                    aria-label="Stock level"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="sku"
                control={control}
                rules={{ required: 'SKU is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SKU"
                    fullWidth
                    error={!!errors.sku}
                    helperText={errors.sku?.message}
                    aria-label="SKU"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    aria-label="Description"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="unitCost"
                control={control}
                rules={{
                  required: 'Unit cost is required',
                  min: { value: 0, message: 'Unit cost must be non-negative' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unit Cost"
                    type="number"
                    fullWidth
                    error={!!errors.unitCost}
                    helperText={errors.unitCost?.message}
                    inputProps={{ step: '0.01' }}
                    aria-label="Unit cost"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="reorderPoint"
                control={control}
                rules={{
                  required: 'Reorder point is required',
                  min: { value: 0, message: 'Reorder point must be non-negative' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Reorder Point"
                    type="number"
                    fullWidth
                    error={!!errors.reorderPoint}
                    helperText={errors.reorderPoint?.message}
                    aria-label="Reorder point"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="dimensions.width"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Width (cm)"
                    type="number"
                    fullWidth
                    inputProps={{ step: '0.1' }}
                    aria-label="Width"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="dimensions.height"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Height (cm)"
                    type="number"
                    fullWidth
                    inputProps={{ step: '0.1' }}
                    aria-label="Height"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="dimensions.depth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Depth (cm)"
                    type="number"
                    fullWidth
                    inputProps={{ step: '0.1' }}
                    aria-label="Depth"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="dimensions.weight"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Weight (kg)"
                    type="number"
                    fullWidth
                    inputProps={{ step: '0.1' }}
                    aria-label="Weight"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Active"
                    aria-label="Active status"
                  />
                )}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { reset(); onClose(); }} aria-label="Cancel">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
          aria-label="Save product"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddProductDialog;
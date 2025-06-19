import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, TextField, Select, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, IconButton } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getInventoryItems } from '../../../services/inventoryService';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

function ProductSearch({ selectedProducts, onProductsChange }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  const debouncedSetSearch = debounce((value) => {
    setDebouncedSearch(value);
  }, 500);

  useEffect(() => {
    debouncedSetSearch(search);
    return () => debouncedSetSearch.cancel();
  }, [search]);

  // Fetch products
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventoryItems', { search: debouncedSearch, category }],
    queryFn: async () => {
      const params = { search: debouncedSearch || undefined, category: category || undefined };
      const response = await getInventoryItems(params);
      return response.inventory || [];
    },
    onError: (error) => {
      console.error('getInventoryItems error:', error);
      toast.error(error.message || 'Failed to fetch products');
    },
  });

  // Filter products client-side if search is active
  const filteredProducts = (Array.isArray(data) ? data : []).filter((product) =>
    debouncedSearch
      ? product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true
  );

  // Limit to first 5 products
  const products = filteredProducts.slice(0, 5);
  console.log(products)

  const handleAddProduct = (product) => {
    const existing = selectedProducts.find((p) => p.productId === product.productId);
    if (existing) {
      if (existing.quantity >= product.stockLevel) {
        toast.error(`Cannot add more ${product.name}; stock limit reached`);
        return;
      }
      onProductsChange(
        selectedProducts.map((p) =>
          p.productId === product.productId ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      onProductsChange([
        ...selectedProducts,
        { productId: product.productId, name: product.name, quantity: 1, unitCost: product.unitCost },
      ]);
    }
  };

  console.log(selectedProducts, 'in product search')

  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 1 }}>
        Product Search
      </Typography>
      <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <TextField
                label="Search Products"
                variant="outlined"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <Select
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                displayEmpty
                renderValue={(selected) => (selected ? selected : 'All Categories')}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Accessories">Accessories</MenuItem>
              </Select>
            </Grid>
          </Grid>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center' }}>
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', color: '#d32f2f' }}>
                    Failed to load products: {error.message}
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center' }}>
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product.productId}
                    onClick={() => product.stockLevel > 0 && handleAddProduct(product)}
                    sx={{
                      '&:hover': { bgcolor: '#e0f7fa' },
                      cursor: product.stockLevel > 0 ? 'pointer' : 'default',
                      bgcolor: product.stockLevel === 0 ? '#f5f5f5' : 'inherit',
                    }}
                  >
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.unitCost}</TableCell>
                    <TableCell>{product.stockLevel}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleAddProduct(product);
                        }}
                        disabled={product.stockLevel === 0}
                      >
                        <Add />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default ProductSearch;
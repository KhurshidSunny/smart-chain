import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';

function FilterControls({
  filters,
  sort,
  showFilters,
  onFilterChange,
  onSortChange,
  onToggleFilters,
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Button
        variant="outlined"
        startIcon={<FilterList />}
        onClick={onToggleFilters}
        sx={{
          mb: showFilters ? 2 : 0,
          bgcolor: showFilters ? '#e3f2fd' : 'inherit',
          borderColor: '#1976d2',
          color: '#1976d2',
          '&:hover': { bgcolor: '#e0f7fa', borderColor: '#115293' },
        }}
        aria-label={showFilters ? 'Hide filters' : 'Show filters'}
      >
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>
      {showFilters && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              name="category"
              value={filters.category}
              onChange={onFilterChange}
              label="Category"
              aria-label="Filter by category"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Clothing">Clothing</MenuItem>
              <MenuItem value="Books">Books</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="stock-filter-label">Stock Status</InputLabel>
            <Select
              labelId="stock-filter-label"
              name="stockStatus"
              value={filters.stockStatus}
              onChange={onFilterChange}
              label="Stock Status"
              aria-label="Filter by stock status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="inStock">In Stock</MenuItem>
              <MenuItem value="lowStock">Low Stock</MenuItem>
              <MenuItem value="outOfStock">Out of Stock</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="sort-label">Sort By</InputLabel>
            <Select
              labelId="sort-label"
              value={sort}
              onChange={onSortChange}
              label="Sort By"
              aria-label="Sort products"
            >
              <MenuItem value="name-asc">Name (A-Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z-A)</MenuItem>
              <MenuItem value="price-asc">Price (Low to High)</MenuItem>
              <MenuItem value="price-desc">Price (High to Low)</MenuItem>
              <MenuItem value="stock-asc">Stock (Low to High)</MenuItem>
              <MenuItem value="stock-desc">Stock (High to Low)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            name="search"
            label="Search Products"
            value={filters.search}
            onChange={onFilterChange}
            sx={{ minWidth: 120 }}
            aria-label="Search products"
          />
        </Box>
      )}
    </Box>
  );
}

export default FilterControls;
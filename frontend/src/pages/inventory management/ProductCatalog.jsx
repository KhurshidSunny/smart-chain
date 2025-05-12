
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Slider,
  Checkbox,
  Collapse,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search,
  ViewModule,
  ViewList,
  Add,
  Remove,
  Edit,
  Delete,
  Inventory,
  History,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx';
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  reserveInventory,
  releaseInventory,
  adjustInventory,
  getInventoryTransactions,
} from '../../services/inventoryService.js';

// Categories for filtering
const categories = ['All', 'Electronics', 'Accessories', 'Clothing', 'Books'];

function ProductCatalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('grid');
  const [filterOpen, setFilterOpen] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openReserveDialog, setOpenReserveDialog] = useState(false);
  const [openReleaseDialog, setOpenReleaseDialog] = useState(false);
  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [openTransactionsDialog, setOpenTransactionsDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const isManager = true; // Replace with auth context

  // React Hook Form for create/edit product
  const createForm = useForm({
    defaultValues: {
      name: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      image: '',
    },
  });
  const editForm = useForm({
    defaultValues: {
      name: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      image: '',
    },
  });
  const reserveForm = useForm({
    defaultValues: { quantity: '' },
  });
  const releaseForm = useForm({
    defaultValues: { quantity: '' },
  });
  const adjustForm = useForm({
    defaultValues: { quantity: '', reason: '' },
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search, categoryFilter, stockFilter, priceRange],
    queryFn: () =>
      getInventoryItems({
        name: search || undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        stock: stockFilter !== 'All' ? stockFilter : undefined,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
      }),
  });

  console.log(products);

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getInventoryTransactions(),
    enabled: openTransactionsDialog,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product created successfully');
      setOpenCreateDialog(false);
      createForm.reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product updated successfully');
      setOpenEditDialog(false);
      setSelectedProduct(null);
      editForm.reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product deleted successfully');
      setSelectedProducts((prev) => prev.filter((id) => !selectedProducts.includes(id)));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const reserveMutation = useMutation({
    mutationFn: reserveInventory,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Inventory reserved successfully');
      setOpenReserveDialog(false);
      reserveForm.reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reserve inventory');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: releaseInventory,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Inventory released successfully');
      setOpenReleaseDialog(false);
      releaseForm.reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to release inventory');
    },
  });

  const adjustMutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Inventory adjusted successfully');
      setOpenAdjustDialog(false);
      adjustForm.reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to adjust inventory');
    },
  });

  // Handlers
  const handleViewToggle = (mode) => {
    setViewMode(mode);
  };

  const handleFilterToggle = () => {
    setFilterOpen((prev) => !prev);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedProducts(products.map((product) => product.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((productId) => productId !== id) : [...prev, id]
    );
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleCreateProduct = (data) => {
    createMutation.mutate(data);
  };

  const handleEditProduct = (data) => {
    updateMutation.mutate({ id: selectedProduct.id, data });
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleReserveInventory = (data) => {
    reserveMutation.mutate({ productId: selectedProduct.id, quantity: parseInt(data.quantity) });
  };

  const handleReleaseInventory = (data) => {
    releaseMutation.mutate({ productId: selectedProduct.id, quantity: parseInt(data.quantity) });
  };

  const handleAdjustInventory = (data) => {
    adjustMutation.mutate({
      productId: selectedProduct.id,
      quantity: parseInt(data.quantity),
      reason: data.reason,
    });
  };

  const handleBatchAction = (action) => {
    if (action === 'updateStock' && selectedProducts.length > 0) {
      setOpenAdjustDialog(true);
      setSelectedProduct(null); // Batch action, no single product
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Stock status for StatusIndicator
  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { status: 'error', label: 'Out of Stock' };
    }
    if (stock <= 20) {
      return { status: 'inProgress', label: 'Low Stock' };
    }
    return { status: 'completed', label: 'In Stock' };
  };

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          bgcolor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
          width: '100%',
          overflowX: 'hidden',
        }}
        role="region"
        aria-label="Product catalog page"
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Tooltip title="Back to Home">
            <Button
              variant="text"
              onClick={handleBack}
              sx={{ color: '#1976d2', mr: 2 }}
              aria-label="Back to home"
            >
              <ArrowBack sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Button>
          </Tooltip>
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
              Browse and manage product inventory
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Search and View Toggle */}
          <Grid item xs={12}>
            <Fade in timeout={800}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search products..."
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: '#757575', mr: 1, fontSize: { xs: 20, sm: 24 } }} />,
                  }}
                  sx={{
                    flexGrow: 1,
                    bgcolor: '#fff',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' },
                  }}
                  aria-label="Search products"
                />
                <Tooltip title="Grid View">
                  <IconButton
                    onClick={() => handleViewToggle('grid')}
                    sx={{
                      color: viewMode === 'grid' ? '#1976d2' : '#757575',
                      bgcolor: viewMode === 'grid' ? '#e3f2fd' : 'transparent',
                    }}
                    aria-label="Switch to grid view"
                  >
                    <ViewModule sx={{ fontSize: { xs: 24, sm: 28 } }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton
                    onClick={() => handleViewToggle('list')}
                    sx={{
                      color: viewMode === 'list' ? '#1976d2' : '#757575',
                      bgcolor: viewMode === 'list' ? '#e3f2fd' : 'transparent',
                    }}
                    aria-label="Switch to list view"
                  >
                    <ViewList sx={{ fontSize: { xs: 24, sm: 28 } }} />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  onClick={handleFilterToggle}
                  sx={{
                    color: '#757575',
                    borderColor: '#757575',
                    '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                  aria-label={filterOpen ? 'Hide filters' : 'Show filters'}
                >
                  {filterOpen ? 'Hide Filters' : 'Show Filters'}
                </Button>
                {isManager && (
                  <Button
                    variant="contained"
                    onClick={() => setOpenCreateDialog(true)}
                    startIcon={<Add />}
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                    aria-label="Create new product"
                  >
                    Add Product
                  </Button>
                )}
              </Box>
            </Fade>
          </Grid>

          {/* Filter Panel */}
          <Grid item xs={12}>
            <Collapse in={filterOpen}>
              <Fade in={filterOpen} timeout={1000}>
                <Card
                  sx={{
                    bgcolor: '#e3f2fd',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        fontWeight: 'medium',
                        color: '#1976d2',
                        mb: 2,
                      }}
                    >
                      Filters
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 1 }}>
                          <InputLabel id="category-filter-label">Category</InputLabel>
                          <Select
                            labelId="category-filter-label"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            label="Category"
                            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                            aria-label="Filter by category"
                          >
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 1 }}>
                          <InputLabel id="stock-filter-label">Stock Status</InputLabel>
                          <Select
                            labelId="stock-filter-label"
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            label="Stock Status"
                            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                            aria-label="Filter by stock status"
                          >
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="inStock">In Stock</MenuItem>
                            <MenuItem value="lowStock">Low Stock</MenuItem>
                            <MenuItem value="outOfStock">Out of Stock</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          gutterBottom
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                        >
                          Price Range: ${priceRange[0]} - ${priceRange[1]}
                        </Typography>
                        <Slider
                          value={priceRange}
                          onChange={handlePriceRangeChange}
                          min={0}
                          max={1000}
                          valueLabelDisplay="auto"
                          sx={{ color: '#1976d2' }}
                          aria-label="Filter by price range"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            </Collapse>
          </Grid>

          {/* Batch Actions */}
          {isManager && (
            <Grid item xs={12}>
              <Fade in timeout={800}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                  <Select
                    disabled={selectedProducts.length === 0}
                    displayEmpty
                    onChange={(e) => handleBatchAction(e.target.value)}
                    sx={{
                      width: 200,
                      bgcolor: '#fff',
                      borderRadius: 1,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' },
                    }}
                    renderValue={(value) => (value ? 'Batch Actions' : 'Batch Actions')}
                    aria-label="Batch actions"
                  >
                    <MenuItem value="" disabled>
                      Batch Actions
                    </MenuItem>
                    <MenuItem value="updateStock">Update Stock</MenuItem>
                  </Select>
                  <Button
                    variant="contained"
                    disabled={selectedProducts.length === 0}
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                    aria-label="Apply batch action"
                  >
                    Apply
                  </Button>
                </Box>
              </Fade>
            </Grid>
          )}

          {/* Product Display */}
          <Grid item xs={12}>
            {viewMode === 'grid' ? (
              <Fade in={viewMode === 'grid'} timeout={800}>
                <Box>
                  {isLoading ? (
                    <Grid item xs={12} sx={{ textAlign: 'center' }}>
                      <CircularProgress sx={{ color: '#1976d2' }} />
                    </Grid>
                  ) : products.length === 0 ? (
                    <Card
                      sx={{
                        bgcolor: '#e3f2fd',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        borderRadius: 2,
                        p: { xs: 2, sm: 3 },
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                          color: '#757575',
                        }}
                        aria-live="polite"
                      >
                        No products found
                      </Typography>
                    </Card>
                  ) : (
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                      {products.map((product) => {
                        const { status, label } = getStockStatus(product.stock);
                        return (
                          <Grid item xs={12} sm={6} md={3} key={product.id}>
                            <Card
                              sx={{
                                bgcolor: '#e3f2fd',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                borderRadius: 2,
                                '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.1)' },
                              }}
                            >
                              <CardMedia
                                component="img"
                                height="140"
                                image={product.image || 'https://via.placeholder.com/140'}
                                alt={product.name}
                                sx={{ objectFit: 'contain', bgcolor: '#fff' }}
                              />
                              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  {isManager && (
                                    <Checkbox
                                      checked={selectedProducts.includes(product.id)}
                                      onChange={() => handleSelectProduct(product.id)}
                                      sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                                      aria-label={`Select ${product.name}`}
                                    />
                                  )}
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      flexGrow: 1,
                                      fontSize: { xs: '1rem', sm: '1.25rem' },
                                      color: '#1976d2',
                                    }}
                                  >
                                    {product.name}
                                  </Typography>
                                </Box>
                                <Typography
                                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                                >
                                  Category: {product.category}
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontSize: { xs: '1rem', sm: '1.25rem' },
                                    fontWeight: 'bold',
                                    color: '#1976d2',
                                  }}
                                >
                                  ${parseFloat(product.price).toFixed(2)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <StatusIndicator status={status} label={label} />
                                  <Typography
                                    sx={{
                                      ml: 1,
                                      fontSize: { xs: '0.875rem', sm: '1rem' },
                                      color: '#757575',
                                    }}
                                  >
                                    Stock: {product.stock}
                                  </Typography>
                                </Box>
                                {isManager && (
                                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                    <Tooltip title="Increase Stock">
                                      <IconButton
                                        onClick={() => {
                                          setSelectedProduct(product);
                                          adjustForm.setValue('quantity', '1');
                                          setOpenAdjustDialog(true);
                                        }}
                                        sx={{ color: '#1976d2' }}
                                        aria-label={`Increase stock for ${product.name}`}
                                      >
                                        <Add sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Decrease Stock">
                                      <IconButton
                                        onClick={() => {
                                          setSelectedProduct(product);
                                          adjustForm.setValue('quantity', '-1');
                                          setOpenAdjustDialog(true);
                                        }}
                                        sx={{ color: '#1976d2' }}
                                        aria-label={`Decrease stock for ${product.name}`}
                                      >
                                        <Remove sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit Product">
                                      <IconButton
                                        onClick={() => {
                                          setSelectedProduct(product);
                                          editForm.reset({
                                            name: product.name,
                                            category: product.category,
                                            price: product.price,
                                            stock: product.stock,
                                            description: product.description || '',
                                            image: product.image || '',
                                          });
                                          setOpenEditDialog(true);
                                        }}
                                        sx={{ color: '#1976d2' }}
                                        aria-label={`Edit ${product.name}`}
                                      >
                                        <Edit sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Product">
                                      <IconButton
                                        onClick={() => handleDeleteProduct(product.id)}
                                        sx={{ color: '#1976d2' }}
                                        aria-label={`Delete ${product.name}`}
                                      >
                                        <Delete sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reserve Inventory">
                                      <IconButton
                                        onClick={() => {
                                          setSelectedProduct(product);
                                          setOpenReserveDialog(true);
                                        }}
                                        sx={{ color: '#1976d2' }}
                                        aria-label={`Reserve inventory for ${product.name}`}
                                      >
                                        <Inventory sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Release Inventory">
                                      <IconButton
                                        onClick={() => {
                                          setSelectedProduct(product);
                                          setOpenReleaseDialog(true);
                                        }}
                                        sx={{ color: '#1976d2' }}
                                        aria-label={`Release inventory for ${product.name}`}
                                      >
                                        <Inventory sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              </Fade>
            ) : (
              <Fade in={viewMode === 'list'} timeout={800}>
                <Card
                  sx={{
                    bgcolor: '#e3f2fd',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {isLoading ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#1976d2' }} />
                      </Box>
                    ) : products.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
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
                      <>
                        <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                          <TableHead>
                            <TableRow>
                              {isManager && (
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={selectedProducts.length === products.length && products.length > 0}
                                    onChange={handleSelectAll}
                                    sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                                    aria-label="Select all products"
                                  />
                                </TableCell>
                              )}
                              <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Category</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Price</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Stock</TableCell>
                              {isManager && (
                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Actions</TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {products.map((product) => {
                              const { status, label } = getStockStatus(product.stock);
                              return (
                                <TableRow key={product.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                  {isManager && (
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => handleSelectProduct(product.id)}
                                        sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                                        aria-label={`Select ${product.name}`}
                                      />
                                    </TableCell>
                                  )}
                                  <TableCell
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                  >
                                    {product.name}
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                  >
                                    {product.category}
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                  >
                                    ${parseFloat(product.price).toFixed(2)}
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                  >
                                    <StatusIndicator status={status} label={label} />
                                    <Typography
                                      component="span"
                                      sx={{ ml: 1, color: '#757575' }}
                                    >
                                      {product.stock}
                                    </Typography>
                                  </TableCell>
                                  {isManager && (
                                    <TableCell>
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Tooltip title="Increase Stock">
                                          <IconButton
                                            onClick={() => {
                                              setSelectedProduct(product);
                                              adjustForm.setValue('quantity', '1');
                                              setOpenAdjustDialog(true);
                                            }}
                                            sx={{ color: '#1976d2' }}
                                            aria-label={`Increase stock for ${product.name}`}
                                          >
                                            <Add sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Decrease Stock">
                                          <IconButton
                                            onClick={() => {
                                              setSelectedProduct(product);
                                              adjustForm.setValue('quantity', '-1');
                                              setOpenAdjustDialog(true);
                                            }}
                                            sx={{ color: '#1976d2' }}
                                            aria-label={`Decrease stock for ${product.name}`}
                                          >
                                            <Remove sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit Product">
                                          <IconButton
                                            onClick={() => {
                                              setSelectedProduct(product);
                                              editForm.reset({
                                                name: product.name,
                                                category: product.category,
                                                price: product.price,
                                                stock: product.stock,
                                                description: product.description || '',
                                                image: product.image || '',
                                              });
                                              setOpenEditDialog(true);
                                            }}
                                            sx={{ color: '#1976d2' }}
                                            aria-label={`Edit ${product.name}`}
                                          >
                                            <Edit sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Product">
                                          <IconButton
                                            onClick={() => handleDeleteProduct(product.id)}
                                            sx={{ color: '#1976d2' }}
                                            aria-label={`Delete ${product.name}`}
                                          >
                                            <Delete sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Reserve Inventory">
                                          <IconButton
                                            onClick={() => {
                                              setSelectedProduct(product);
                                              setOpenReserveDialog(true);
                                            }}
                                            sx={{ color: '#1976d2' }}
                                            aria-label={`Reserve inventory for ${product.name}`}
                                          >
                                            <Inventory sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Release Inventory">
                                          <IconButton
                                            onClick={() => {
                                              setSelectedProduct(product);
                                              setOpenReleaseDialog(true);
                                            }}
                                            sx={{ color: '#1976d2' }}
                                            aria-label={`Release inventory for ${product.name}`}
                                          >
                                            <Inventory sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {isManager && (
                          <Button
                            variant="contained"
                            onClick={() => setOpenTransactionsDialog(true)}
                            startIcon={<History />}
                            sx={{
                              mt: 2,
                              bgcolor: '#1976d2',
                              '&:hover': { bgcolor: '#115293' },
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                            }}
                            aria-label="View transaction history"
                          >
                            View Transactions
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            )}
          </Grid>
        </Grid>

        {/* Create Product Dialog */}
        {isManager && (
          <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogContent>
              <form onSubmit={createForm.handleSubmit(handleCreateProduct)}>
                <Controller
                  name="name"
                  control={createForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Name"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      aria-label="Product name"
                    />
                  )}
                />
                <Controller
                  name="category"
                  control={createForm.control}
                  rules={{ required: 'Category is required' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth margin="normal" error={!!fieldState.error}>
                      <InputLabel id="create-category-label">Category</InputLabel>
                      <Select
                        {...field}
                        labelId="create-category-label"
                        label="Category"
                        aria-label="Product category"
                      >
                        {categories.slice(1).map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <Typography color="error" variant="caption">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
                <Controller
                  name="price"
                  control={createForm.control}
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
                  control={createForm.control}
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
                <Controller
                  name="description"
                  control={createForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      margin="normal"
                      multiline
                      rows={4}
                      aria-label="Product description"
                    />
                  )}
                />
                <Controller
                  name="image"
                  control={createForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Image URL"
                      fullWidth
                      margin="normal"
                      aria-label="Product image URL"
                    />
                  )}
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenCreateDialog(false)} aria-label="Cancel create product">
                Cancel
              </Button>
              <Button
                onClick={createForm.handleSubmit(handleCreateProduct)}
                disabled={createMutation.isLoading}
                startIcon={createMutation.isLoading ? <CircularProgress size={20} /> : null}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Save new product"
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Edit Product Dialog */}
        {isManager && (
          <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogContent>
              <form onSubmit={editForm.handleSubmit(handleEditProduct)}>
                <Controller
                  name="name"
                  control={editForm.control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Name"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      aria-label="Edit product name"
                    />
                  )}
                />
                <Controller
                  name="category"
                  control={editForm.control}
                  rules={{ required: 'Category is required' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth margin="normal" error={!!fieldState.error}>
                      <InputLabel id="edit-category-label">Category</InputLabel>
                      <Select
                        {...field}
                        labelId="edit-category-label"
                        label="Category"
                        aria-label="Edit product category"
                      >
                        {categories.slice(1).map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                      {fieldState.error && (
                        <Typography color="error" variant="caption">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
                <Controller
                  name="price"
                  control={editForm.control}
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
                      aria-label="Edit product price"
                    />
                  )}
                />
                <Controller
                  name="stock"
                  control={editForm.control}
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
                      aria-label="Edit product stock"
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      margin="normal"
                      multiline
                      rows={4}
                      aria-label="Edit product description"
                    />
                  )}
                />
                <Controller
                  name="image"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Image URL"
                      fullWidth
                      margin="normal"
                      aria-label="Edit product image URL"
                    />
                  )}
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEditDialog(false)} aria-label="Cancel edit product">
                Cancel
              </Button>
              <Button
                onClick={editForm.handleSubmit(handleEditProduct)}
                disabled={updateMutation.isLoading}
                startIcon={updateMutation.isLoading ? <CircularProgress size={20} /> : null}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Save product changes"
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Reserve Inventory Dialog */}
        {isManager && (
          <Dialog open={openReserveDialog} onClose={() => setOpenReserveDialog(false)}>
            <DialogTitle>Reserve Inventory</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Product: {selectedProduct?.name}
              </Typography>
              <form onSubmit={reserveForm.handleSubmit(handleReserveInventory)}>
                <Controller
                  name="quantity"
                  control={reserveForm.control}
                  rules={{
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be positive' },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Quantity"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      aria-label="Reserve quantity"
                    />
                  )}
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenReserveDialog(false)} aria-label="Cancel reserve inventory">
                Cancel
              </Button>
              <Button
                onClick={reserveForm.handleSubmit(handleReserveInventory)}
                disabled={reserveMutation.isLoading}
                startIcon={reserveMutation.isLoading ? <CircularProgress size={20} /> : null}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Reserve inventory"
              >
                Reserve
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Release Inventory Dialog */}
        {isManager && (
          <Dialog open={openReleaseDialog} onClose={() => setOpenReleaseDialog(false)}>
            <DialogTitle>Release Inventory</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Product: {selectedProduct?.name}
              </Typography>
              <form onSubmit={releaseForm.handleSubmit(handleReleaseInventory)}>
                <Controller
                  name="quantity"
                  control={releaseForm.control}
                  rules={{
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be positive' },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Quantity"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      aria-label="Release quantity"
                    />
                  )}
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenReleaseDialog(false)} aria-label="Cancel release inventory">
                Cancel
              </Button>
              <Button
                onClick={releaseForm.handleSubmit(handleReleaseInventory)}
                disabled={releaseMutation.isLoading}
                startIcon={releaseMutation.isLoading ? <CircularProgress size={20} /> : null}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Release inventory"
              >
                Release
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Adjust Inventory Dialog */}
        {isManager && (
          <Dialog open={openAdjustDialog} onClose={() => setOpenAdjustDialog(false)}>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Product: {selectedProduct ? selectedProduct.name : 'Multiple Products'}
              </Typography>
              <form onSubmit={adjustForm.handleSubmit(handleAdjustInventory)}>
                <Controller
                  name="quantity"
                  control={adjustForm.control}
                  rules={{ required: 'Quantity is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Quantity (use negative to decrease)"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      aria-label="Adjust quantity"
                    />
                  )}
                />
                <Controller
                  name="reason"
                  control={adjustForm.control}
                  rules={{ required: 'Reason is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Reason"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      aria-label="Adjustment reason"
                    />
                  )}
                />
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAdjustDialog(false)} aria-label="Cancel adjust inventory">
                Cancel
              </Button>
              <Button
                onClick={adjustForm.handleSubmit(handleAdjustInventory)}
                disabled={adjustMutation.isLoading}
                startIcon={adjustMutation.isLoading ? <CircularProgress size={20} /> : null}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                aria-label="Adjust inventory"
              >
                Adjust
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Transactions Dialog */}
        {isManager && (
          <Dialog open={openTransactionsDialog} onClose={() => setOpenTransactionsDialog(false)}>
            <DialogTitle>Inventory Transactions</DialogTitle>
            <DialogContent>
              <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {transactions.map((transaction) => (
                  <ListItem key={transaction.id}>
                    <ListItemText
                      primary={`Type: ${transaction.type}, Quantity: ${transaction.quantity}`}
                      secondary={`Product ID: ${transaction.productId}, Time: ${transaction.timestamp}${transaction.reason ? `, Reason: ${transaction.reason}` : ''}`}
                      primaryTypographyProps={{
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        color: '#1976d2',
                      }}
                      secondaryTypographyProps={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        color: '#757575',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenTransactionsDialog(false)} aria-label="Close transactions">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Fade>
  );
}

export default ProductCatalog;

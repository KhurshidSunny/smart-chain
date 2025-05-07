
import React from 'react';
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
} from '@mui/material';
import { Search, ViewModule, ViewList, Add, Remove, Edit } from '@mui/icons-material';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from OrderList/OrderDetail

// Mock product data
const mockProducts = [
    {
        id: '1',
        name: 'Laptop Pro',
        category: 'Electronics',
        price: 999.99,
        stock: 50,
        image: 'placeholder-laptop.png',
    },
    {
        id: '2',
        name: 'Wireless Mouse',
        category: 'Accessories',
        price: 19.99,
        stock: 10,
        image: 'placeholder-mouse.png',
    },
    {
        id: '3',
        name: 'Smartphone',
        category: 'Electronics',
        price: 699.99,
        stock: 0,
        image: 'placeholder-phone.png',
    },
    {
        id: '4',
        name: 'Headphones',
        category: 'Accessories',
        price: 49.99,
        stock: 100,
        image: 'placeholder-headphones.png',
    },
];

// Mock categories for filter
const mockCategories = ['All', 'Electronics', 'Accessories'];

function ProductCatalog() {
    // Temporary state for UI (you'll replace with real state)
    const [viewMode, setViewMode] = React.useState('grid'); // grid or list
    const [filterOpen, setFilterOpen] = React.useState(true);
    const [selectedProducts, setSelectedProducts] = React.useState([]);
    const isManager = true; // Temporary flag, replace with real role check

    // Handle view toggle
    const handleViewToggle = (mode) => {
        setViewMode(mode);
    };

    // Handle filter panel toggle
    const handleFilterToggle = () => {
        setFilterOpen((prev) => !prev);
    };

    // Handle batch selection
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedProducts(mockProducts.map((product) => product.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id) => {
        setSelectedProducts((prev) =>
            prev.includes(id) ? prev.filter((productId) => productId !== id) : [...prev, id]
        );
    };

    // Map stock to StatusIndicator status and label
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
        <Box sx={{ p: 4, bgcolor: 'background-light', minHeight: 'calc(100vh - 64px)', width: '100%' }}>
            {/* Page Title */}
            <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                Product Catalog
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
                Browse and manage product inventory
            </Typography>

            <Grid container spacing={3}>
                {/* Search and View Toggle */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <TextField
                            placeholder="Search products..."
                            variant="outlined"
                            InputProps={{
                                startAdornment: <Search sx={{ color: '#757575', mr: 1 }} />,
                            }}
                            sx={{
                                flexGrow: 1,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' },
                            }}
                        />
                        <Tooltip title="Grid View">
                            <IconButton
                                onClick={() => handleViewToggle('grid')}
                                sx={{
                                    color: viewMode === 'grid' ? '#1976d2' : '#757575',
                                }}
                            >
                                <ViewModule />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="List View">
                            <IconButton
                                onClick={() => handleViewToggle('list')}
                                sx={{
                                    color: viewMode === 'list' ? '#1976d2' : '#757575',
                                }}
                            >
                                <ViewList />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="outlined"
                            onClick={handleFilterToggle}
                            sx={{
                                color: '#757575',
                                borderColor: '#757575',
                                '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' },
                            }}
                        >
                            {filterOpen ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                    </Box>
                </Grid>

                {/* Filter Panel */}
                <Grid item xs={12}>
                    <Collapse in={filterOpen}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                                    Filters
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Category Filter */}
                                    <Grid item xs={12} sm={4}>
                                        <Select
                                            fullWidth
                                            displayEmpty
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                        >
                                            <MenuItem value="">All Categories</MenuItem>
                                            {mockCategories.map((category) => (
                                                <MenuItem key={category} value={category}>
                                                    {category}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    {/* Stock Level Filter */}
                                    <Grid item xs={12} sm={4}>
                                        <Select
                                            fullWidth
                                            displayEmpty
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                        >
                                            <MenuItem value="">All Stock Levels</MenuItem>
                                            <MenuItem value="inStock">In Stock</MenuItem>
                                            <MenuItem value="lowStock">Low Stock</MenuItem>
                                            <MenuItem value="outOfStock">Out of Stock</MenuItem>
                                        </Select>
                                    </Grid>
                                    {/* Price Range Filter */}
                                    <Grid item xs={12} sm={4}>
                                        <Typography gutterBottom>Price Range</Typography>
                                        <Slider
                                            value={[0, 1000]}
                                            min={0}
                                            max={1000}
                                            valueLabelDisplay="auto"
                                            sx={{ color: '#1976d2' }}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Collapse>
                </Grid>

                {/* Batch Actions (Managers Only) */}
                {isManager && (
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Select
                                disabled={selectedProducts.length === 0}
                                displayEmpty
                                sx={{ mr: 2, width: 200, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
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
                                    color: 'white',
                                    '&:hover': { bgcolor: '#115293' },
                                }}
                            >
                                Apply
                            </Button>
                        </Box>
                    </Grid>
                )}

                {/* Product Display */}
                <Grid item xs={12}>
                    {viewMode === 'grid' ? (
                        <Grid container spacing={3}>
                            {mockProducts.map((product) => {
                                const { status, label } = getStockStatus(product.stock);
                                return (
                                    <Grid item xs={12} sm={6} md={3} key={product.id}>
                                        <Card
                                            sx={{
                                                backgroundColor: '#e3f2fd',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                borderRadius: 2,
                                                '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.1)' },
                                            }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={product.image}
                                                alt={product.name}
                                                sx={{ objectFit: 'contain', bgcolor: '#fff' }}
                                            />
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    {isManager && (
                                                        <Checkbox
                                                            checked={selectedProducts.includes(product.id)}
                                                            onChange={() => handleSelectProduct(product.id)}
                                                            sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                                                        />
                                                    )}
                                                    <Typography variant="h6" sx={{ flexGrow: 1, color: '#1976d2' }}>
                                                        {product.name}
                                                    </Typography>
                                                </Box>
                                                <Typography color="textSecondary">Category: {product.category}</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                    ${product.price.toFixed(2)}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                    <StatusIndicator status={status} label={label} />
                                                    <Typography sx={{ ml: 1, color: '#757575' }}>
                                                        Stock: {product.stock}
                                                    </Typography>
                                                </Box>
                                                {isManager && (
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                                        <Tooltip title="Increase Stock">
                                                            <IconButton sx={{ color: '#1976d2' }}>
                                                                <Add />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Decrease Stock">
                                                            <IconButton sx={{ color: '#1976d2' }}>
                                                                <Remove />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit Product">
                                                            <IconButton sx={{ color: '#1976d2' }}>
                                                                <Edit />
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
                    ) : (
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            {isManager && (
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedProducts.length === mockProducts.length}
                                                        onChange={handleSelectAll}
                                                        sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
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
                                        {mockProducts.map((product) => {
                                            const { status, label } = getStockStatus(product.stock);
                                            return (
                                                <TableRow key={product.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                    {isManager && (
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                checked={selectedProducts.includes(product.id)}
                                                                onChange={() => handleSelectProduct(product.id)}
                                                                sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                                                            />
                                                        </TableCell>
                                                    )}
                                                    <TableCell>{product.name}</TableCell>
                                                    <TableCell>{product.category}</TableCell>
                                                    <TableCell>${product.price.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <StatusIndicator status={status} label={label} />
                                                        <Typography component="span" sx={{ ml: 1, color: '#757575' }}>
                                                            {product.stock}
                                                        </Typography>
                                                    </TableCell>
                                                    {isManager && (
                                                        <TableCell>
                                                            <Tooltip title="Increase Stock">
                                                                <IconButton sx={{ color: '#1976d2' }}>
                                                                    <Add />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Decrease Stock">
                                                                <IconButton sx={{ color: '#1976d2' }}>
                                                                    <Remove />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Edit Product">
                                                                <IconButton sx={{ color: '#1976d2' }}>
                                                                    <Edit />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}

export default ProductCatalog;

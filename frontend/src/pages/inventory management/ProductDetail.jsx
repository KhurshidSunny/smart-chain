
import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Select,
    MenuItem,
    Tooltip,
} from '@mui/material';
import { Edit, Add, Remove, Image, Place } from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from other pages

// Mock product data
const mockProduct = {
    id: '1',
    sku: 'LAP-PRO-001',
    name: 'Laptop Pro',
    description: 'High-performance laptop with 16GB RAM and 512GB SSD.',
    category: 'Electronics',
    price: 999.99,
    stock: 50,
    locations: [
        { location: 'Warehouse A', stock: 30 },
        { location: 'Store B', stock: 20 },
    ],
    image: 'placeholder-laptop.png',
};

// Mock stock history (last 30 days)
const mockStockHistory = [
    { date: '2025-04-07', stock: 60 },
    { date: '2025-04-14', stock: 55 },
    { date: '2025-04-21', stock: 52 },
    { date: '2025-04-28', stock: 50 },
    { date: '2025-05-05', stock: 50 },
];

// Mock transaction log
const mockTransactions = [
    {
        id: '1',
        date: '2025-05-06 14:30',
        type: 'Stock Added',
        quantity: 10,
        location: 'Warehouse A',
    },
    {
        id: '2',
        date: '2025-05-05 09:15',
        type: 'Stock Removed',
        quantity: 5,
        location: 'Store B',
    },
    {
        id: '3',
        date: '2025-05-04 16:00',
        type: 'Stock Added',
        quantity: 15,
        location: 'Warehouse A',
    },
];

function ProductDetail() {
    const isManager = true; // Temporary flag, replace with real role check

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                        Product Detail
                    </Typography>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        View and manage product information
                    </Typography>
                </Box>
                {isManager && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit Product Information">
                            <Button
                                variant="contained"
                                startIcon={<Edit />}
                                sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' } }}
                            >
                                Edit
                            </Button>
                        </Tooltip>
                        <Tooltip title="Manage Images">
                            <Button
                                variant="contained"
                                startIcon={<Image />}
                                sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' } }}
                            >
                                Images
                            </Button>
                        </Tooltip>
                        <Tooltip title="Assign Locations">
                            <Button
                                variant="contained"
                                startIcon={<Place />}
                                sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' } }}
                            >
                                Locations
                            </Button>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Product Data */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Product Information
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <CardMedia
                                    component="img"
                                    sx={{ width: 120, height: 120, objectFit: 'contain', bgcolor: '#fff', borderRadius: 1 }}
                                    image={mockProduct.image}
                                    alt={mockProduct.name}
                                />
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                        {mockProduct.name}
                                    </Typography>
                                    <Typography color="textSecondary">SKU: {mockProduct.sku}</Typography>
                                    <Typography color="textSecondary">Category: {mockProduct.category}</Typography>
                                    <Typography color="textSecondary">Price: ${mockProduct.price.toFixed(2)}</Typography>
                                    <Typography color="textSecondary" sx={{ mt: 1 }}>
                                        {mockProduct.description}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Current Stock Level and Locations */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Stock and Locations
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <StatusIndicator {...getStockStatus(mockProduct.stock)} />
                                <Typography sx={{ ml: 1, color: '#757575' }}>
                                    Total Stock: {mockProduct.stock}
                                </Typography>
                            </Box>
                            {isManager && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <TextField
                                        type="number"
                                        label="Adjust Stock"
                                        size="small"
                                        defaultValue={0}
                                        sx={{ width: 120 }}
                                    />
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
                                </Box>
                            )}
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Location</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Stock</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockProduct.locations.map((loc, index) => (
                                        <TableRow key={index} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                            <TableCell>{loc.location}</TableCell>
                                            <TableCell>{loc.stock}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Stock History Graph */}
                <Grid item xs={12}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Stock History
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={mockStockHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="date" stroke="#757575" />
                                        <YAxis stroke="#757575" />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="stock" stroke="#1976d2" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Transaction Log */}
                <Grid item xs={12}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" className="text-text-hover" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                    Transaction Log
                                </Typography>
                                <Select
                                    displayEmpty
                                    defaultValue=""
                                    sx={{ width: 200, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                >
                                    <MenuItem value="">All Transactions</MenuItem>
                                    <MenuItem value="Stock Added">Stock Added</MenuItem>
                                    <MenuItem value="Stock Removed">Stock Removed</MenuItem>
                                </Select>
                            </Box>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Location</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockTransactions.map((transaction) => (
                                        <TableRow key={transaction.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                            <TableCell>{transaction.date}</TableCell>
                                            <TableCell>{transaction.type}</TableCell>
                                            <TableCell>{transaction.quantity}</TableCell>
                                            <TableCell>{transaction.location}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default ProductDetail;
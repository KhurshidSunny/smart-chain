
import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from ProductCatalog

// Mock stock summary by category
const mockStockSummary = [
    { category: 'Electronics', stock: 150 },
    { category: 'Accessories', stock: 220 },
];

// Mock low stock products
const mockLowStock = [
    {
        id: '2',
        name: 'Wireless Mouse',
        stock: 10,
        category: 'Accessories',
    },
    {
        id: '3',
        name: 'Smartphone',
        stock: 0,
        category: 'Electronics',
    },
];

// Mock recent transactions
const mockTransactions = [
    {
        id: '1',
        date: '2025-05-06 14:30',
        product: 'Laptop Pro',
        type: 'Stock Added',
        quantity: 10,
    },
    {
        id: '2',
        date: '2025-05-06 12:00',
        product: 'Wireless Mouse',
        type: 'Stock Removed',
        quantity: 5,
    },
    {
        id: '3',
        date: '2025-05-05 09:15',
        product: 'Headphones',
        type: 'Stock Added',
        quantity: 20,
    },
];

function InventoryDashboard() {
    const isManager = true; // Temporary flag, replace with real role check

    // Map stock to StatusIndicator status and label
    const getStockStatus = (stock) => {
        if (stock <= 5) {
            return { status: 'error', label: 'Critical' };
        }
        if (stock <= 20) {
            return { status: 'inProgress', label: 'Warning' };
        }
        return { status: 'completed', label: 'Healthy' };
    };

    return (
        <Box sx={{ p: 4, bgcolor: 'background-light', minHeight: 'calc(100vh - 64px)', width: '100%' }}>
            {/* Page Title */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                        Inventory Dashboard
                    </Typography>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Monitor and manage inventory health
                    </Typography>
                </Box>
                {isManager && (
                    <Tooltip title="Manage Low Stock Thresholds">
                        <Button
                            variant="contained"
                            startIcon={<Settings />}
                            sx={{
                                bgcolor: '#1976d2',
                                color: 'white',
                                '&:hover': { bgcolor: '#115293' },
                            }}
                        >
                            Set Thresholds
                        </Button>
                    </Tooltip>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Stock Level Summary by Category */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Stock Level by Category
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mockStockSummary}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="category" stroke="#757575" />
                                        <YAxis stroke="#757575" />
                                        <RechartsTooltip />
                                        <Bar dataKey="stock" fill="#1976d2" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Low Stock Alerts */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Low Stock Alerts
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Stock</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Criticality</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockLowStock.map((product) => {
                                        const { status, label } = getStockStatus(product.stock);
                                        return (
                                            <TableRow key={product.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                <TableCell>{product.name}</TableCell>
                                                <TableCell>{product.category}</TableCell>
                                                <TableCell>{product.stock}</TableCell>
                                                <TableCell>
                                                    <StatusIndicator status={status} label={label} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Inventory Transactions */}
                <Grid item xs={12}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Recent Inventory Transactions
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockTransactions.map((transaction) => (
                                        <TableRow key={transaction.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                            <TableCell>{transaction.date}</TableCell>
                                            <TableCell>{transaction.product}</TableCell>
                                            <TableCell>{transaction.type}</TableCell>
                                            <TableCell>{transaction.quantity}</TableCell>
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

export default InventoryDashboard;

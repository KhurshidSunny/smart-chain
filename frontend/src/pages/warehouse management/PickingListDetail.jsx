
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
    TextField,
    Tooltip,
} from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from other pages

// Mock order data
const mockOrder = {
    orderId: 'ORD001',
    status: 'inProgress',
    assignedStaff: 'John Doe',
    totalItems: 5,
};

// Mock item checklist
const mockItems = [
    {
        id: '1',
        productName: 'Laptop Pro',
        sku: 'LAP-PRO-001',
        location: 'Warehouse A - Aisle 3',
        quantity: 2,
        verified: true,
    },
    {
        id: '2',
        productName: 'Wireless Mouse',
        sku: 'MOUSE-WL-001',
        location: 'Warehouse A - Aisle 5',
        quantity: 3,
        verified: false,
    },
    {
        id: '3',
        productName: 'Headphones',
        sku: 'HEAD-001',
        location: 'Store B - Shelf 2',
        quantity: 1,
        verified: false,
    },
];

function PickingListDetail() {
    const isStaff = true; // Temporary flag, replace with real role check

    return (
        <Box
            sx={{
                width: '100vw', // Full viewport width
                maxWidth: '100%', // Prevent overflow
                minHeight: 'calc(100vh - 64px)', // Adjust for header
                bgcolor: 'background-light', // Match other pages (assumed #f5f5f5)
                m: 0, // Remove margins
                p: 0, // Remove outer padding
                boxSizing: 'border-box', // Ensure padding is included in width
            }}
        >
            {/* Inner content with consistent padding */}
            <Box sx={{ p: 4 }}>
                {/* Order Information Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                        Picking List Detail
                    </Typography>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Execute and track the picking process for Order {mockOrder.orderId}
                    </Typography>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2, mt: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Order Information
                            </Typography>
                            <Typography color="textSecondary">Order ID: {mockOrder.orderId}</Typography>
                            <Typography color="textSecondary">
                                Status: <StatusIndicator status={mockOrder.status} label={mockOrder.status} />
                            </Typography>
                            <Typography color="textSecondary">Assigned Staff: {mockOrder.assignedStaff}</Typography>
                            <Typography color="textSecondary">Total Items: {mockOrder.totalItems}</Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Grid container spacing={3}>
                    {/* Item Checklist */}
                    <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                    Item Checklist
                                </Typography>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>SKU</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Location</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Verified</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockItems.map((item) => (
                                            <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                <TableCell>{item.productName}</TableCell>
                                                <TableCell>{item.sku}</TableCell>
                                                <TableCell>{item.location}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>
                                                    <StatusIndicator
                                                        status={item.verified ? 'completed' : 'pending'}
                                                        label={item.verified ? 'Verified' : 'Unverified'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* QR Scanning Interface */}
                    <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                    QR/Barcode Scanner
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Tooltip title="Scan QR or Barcode">
                                        <Button
                                            variant="contained"
                                            startIcon={<QrCodeScanner />}
                                            sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' } }}
                                        >
                                            Scan Item
                                        </Button>
                                    </Tooltip>
                                    <TextField
                                        label="Enter Barcode Manually"
                                        variant="outlined"
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                        {isStaff && (
                            <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2, mt: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                        Complete Picking
                                    </Typography>
                                    <Tooltip title="Confirm all items are picked">
                                        <Button
                                            variant="contained"
                                            sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' } }}
                                            disabled={mockItems.some((item) => !item.verified)}
                                        >
                                            Confirm Completion
                                        </Button>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

export default PickingListDetail;

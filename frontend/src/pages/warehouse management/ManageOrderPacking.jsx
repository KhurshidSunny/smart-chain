
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
    Select,
    MenuItem,
    TextField,
    Tooltip,
} from '@mui/material';
import { QrCode, Print } from '@mui/icons-material';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from other pages

// Mock ready-to-pack orders
const mockReadyOrders = [
    { orderId: 'ORD001', status: 'picked', totalItems: 5 },
    { orderId: 'ORD002', status: 'picked', totalItems: 3 },
];

// Mock selected order's items
const mockOrderItems = [
    {
        id: '1',
        productName: 'Laptop Pro',
        sku: 'LAP-PRO-001',
        quantity: 2,
        verified: true,
    },
    {
        id: '2',
        productName: 'Wireless Mouse',
        sku: 'MOUSE-WL-001',
        quantity: 3,
        verified: false,
    },
    {
        id: '3',
        productName: 'Headphones',
        sku: 'HEAD-001',
        quantity: 1,
        verified: false,
    },
];

// Mock packing materials
const mockPackingMaterials = [
    { id: '1', name: 'Small Box', quantity: 50 },
    { id: '2', name: 'Tape Roll', quantity: 20 },
];

function ManageOrderPacking() {
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
                {/* Page Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                        Manage Order Packing
                    </Typography>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Pack and verify picked orders for shipping
                    </Typography>
                </Box>

                {/* Order Selection */}
                <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2, mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                            Select Order to Pack
                        </Typography>
                        <Select
                            displayEmpty
                            defaultValue=""
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                        >
                            <MenuItem value="" disabled>
                                Select an order
                            </MenuItem>
                            {mockReadyOrders.map((order) => (
                                <MenuItem key={order.orderId} value={order.orderId}>
                                    {order.orderId} ({order.totalItems} items)
                                </MenuItem>
                            ))}
                        </Select>
                    </CardContent>
                </Card>

                <Grid container spacing={3}>
                    {/* Item Verification Checklist */}
                    <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                    Item Verification Checklist
                                </Typography>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>SKU</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Verified</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockOrderItems.map((item) => (
                                            <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                <TableCell>{item.productName}</TableCell>
                                                <TableCell>{item.sku}</TableCell>
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

                    {/* QR Code Generation and Printing */}
                    <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                    QR/Barcode Scanner
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                                    <Tooltip title="Scan QR or Barcode">
                                        <Button
                                            variant="contained"
                                            startIcon={<QrCode />}
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
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                    QR Code and Printing
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Tooltip title="Generate QR code for package">
                                        <Button
                                            variant="contained"
                                            startIcon={<QrCode />}
                                            sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' } }}
                                        >
                                            Generate QR Code
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Print shipping label with QR code">
                                        <Button
                                            variant="outlined"
                                            startIcon={<Print />}
                                            sx={{
                                                color: '#1976d2',
                                                borderColor: '#1976d2',
                                                '&:hover': { borderColor: '#115293', bgcolor: '#e0f7fa' },
                                            }}
                                        >
                                            Print Label
                                        </Button>
                                    </Tooltip>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Packing Materials and Completion */}
                    {isStaff && (
                        <Grid item xs={12}>
                            <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                        Packing Materials Used
                                    </Typography>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Material</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity Available</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {mockPackingMaterials.map((material) => (
                                                <TableRow key={material.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                    <TableCell>{material.name}</TableCell>
                                                    <TableCell>{material.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Tooltip title="Confirm packing is complete">
                                            <Button
                                                variant="contained"
                                                sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' } }}
                                                disabled={mockOrderItems.some((item) => !item.verified)}
                                            >
                                                Confirm Packing Completion
                                            </Button>
                                        </Tooltip>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Box>
    );
}

export default ManageOrderPacking;
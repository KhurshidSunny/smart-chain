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
    Fade,
    Slide,
    Tooltip,
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from '@mui/lab';
import { LocalShipping, CheckCircle, Feedback } from '@mui/icons-material';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from other pages

// Mock order data
const mockOrder = {
    trackingNumber: 'TRK123',
    orderId: 'ORD001',
    items: [
        { productName: 'Laptop Pro', sku: 'LAP-PRO-001', quantity: 2 },
        { productName: 'Wireless Mouse', sku: 'MOUSE-WL-001', quantity: 1 },
    ],
    carrier: 'FedEx',
    service: 'Express',
    carrierContact: '1-800-463-3339',
    estimatedDelivery: '2025-05-10 14:00:00',
    status: 'inTransit',
    trackingEvents: [
        { status: 'packed', timestamp: '2025-05-07 09:00:00', location: 'Warehouse, NY' },
        { status: 'pending', timestamp: '2025-05-07 12:00:00', location: 'Warehouse, NY' },
        { status: 'inTransit', timestamp: '2025-05-08 14:30:00', location: 'FedEx Facility, Memphis, TN' },
    ],
};

function CustomerTracking() {
    return (
        <Box
            sx={{
                width: '100vw',
                maxWidth: '100%',
                minHeight: 'calc(100vh - 64px)',
                bgcolor: 'background-light',
                m: 0,
                p: 0,
                boxSizing: 'border-box',
            }}
        >
            {/* Inner content with consistent padding */}
            <Box sx={{ p: 4 }}>
                {/* Page Header */}
                <Fade in timeout={600}>
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography
                            variant="h4"
                            className="text-text-primary font-semibold"
                            gutterBottom
                            sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, color: '#1976d2' }}
                        >
                            Track Your Order
                        </Typography>
                        <Typography
                            variant="h6"
                            color="textSecondary"
                            gutterBottom
                            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#757575' }}
                        >
                            View your order status and tracking details
                        </Typography>
                    </Box>
                </Fade>

                <Grid container spacing={3}>
                    {/* Order Summary */}
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                        <Slide in direction="right" timeout={600}>
                            <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        className="text-text-hover"
                                        gutterBottom
                                        sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                    >
                                        Order Summary
                                    </Typography>
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                        Product
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                        SKU
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                        Quantity
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {mockOrder.items.map((item, index) => (
                                                    <TableRow key={index} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                        <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{item.productName}</TableCell>
                                                        <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{item.sku}</TableCell>
                                                        <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{item.quantity}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Slide>
                    </Grid>

                    {/* Shipping Information */}
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                        <Slide in direction="left" timeout={600}>
                            <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        className="text-text-hover"
                                        gutterBottom
                                        sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                    >
                                        Shipping Information
                                    </Typography>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Carrier
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockOrder.carrier}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Service
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockOrder.service}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Tracking Number
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockOrder.trackingNumber}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Estimated Delivery
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockOrder.estimatedDelivery}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </Slide>
                    </Grid>

                    {/* Tracking Timeline */}
                    <Grid item xs={12} sx={{ minWidth: 0 }}>
                        <Slide in direction="up" timeout={600}>
                            <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        className="text-text-hover"
                                        gutterBottom
                                        sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                    >
                                        Tracking Timeline
                                    </Typography>
                                    <Timeline>
                                        {mockOrder.trackingEvents.map((event, index) => (
                                            <TimelineItem key={index}>
                                                <TimelineSeparator>
                                                    <TimelineDot sx={{ bgcolor: '#1976d2' }} />
                                                    {index < mockOrder.trackingEvents.length - 1 && <TimelineConnector />}
                                                </TimelineSeparator>
                                                <TimelineContent>
                                                    <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'medium' }}>
                                                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {event.timestamp}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {event.location}
                                                    </Typography>
                                                </TimelineContent>
                                            </TimelineItem>
                                        ))}
                                    </Timeline>
                                </CardContent>
                            </Card>
                        </Slide>
                    </Grid>

                    {/* Delivery Confirmation and Feedback */}
                    <Grid item xs={12} sx={{ minWidth: 0 }}>
                        <Slide in direction="up" timeout={800}>
                            <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        className="text-text-hover"
                                        gutterBottom
                                        sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                    >
                                        Delivery Status
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="body1" sx={{ mr: 2, color: '#757575' }}>
                                            Current Status:
                                        </Typography>
                                        <StatusIndicator status={mockOrder.status} label={mockOrder.status} />
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                            Confirm Delivery with QR Code
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                            Scan the QR code on your package to confirm delivery.
                                        </Typography>
                                        {/* Placeholder for QR code */}
                                        <Button
                                            variant="outlined"
                                            sx={{
                                                borderColor: '#1976d2',
                                                color: '#1976d2',
                                                '&:hover': { borderColor: '#115293', color: '#115293' },
                                                transition: 'all 0.3s ease',
                                            }}
                                            aria-label="Scan QR code for delivery confirmation"
                                        >
                                            Scan QR Code
                                        </Button>
                                    </Box>
                                    {mockOrder.status === 'delivered' && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Tooltip title="Provide feedback on your delivery experience">
                                                <Button
                                                    variant="contained"
                                                    startIcon={<Feedback />}
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        '&:hover': { bgcolor: '#115293' },
                                                        px: { xs: 1, sm: 2 },
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                        transition: 'all 0.3s ease',
                                                    }}
                                                    aria-label="Submit feedback"
                                                >
                                                    Submit Feedback
                                                </Button>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Slide>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

export default CustomerTracking;
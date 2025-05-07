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
    TableRow,
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
import { LocalShipping, CheckCircle } from '@mui/icons-material';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from other pages

// Mock shipment details
const mockShipment = {
    shipmentId: 'SHP001',
    orderId: 'ORD001',
    items: [
        { productName: 'Laptop Pro', sku: 'LAP-PRO-001', quantity: 2 },
        { productName: 'Wireless Mouse', sku: 'MOUSE-WL-001', quantity: 1 },
    ],
    destination: '123 Main St, New York, NY 10001',
    carrier: 'FedEx',
    service: 'Express',
    carrierContact: '1-800-463-3339',
    trackingNumber: 'TRK123',
    lastLocation: {
        location: 'FedEx Facility, Memphis, TN',
        timestamp: '2025-05-08 14:30:00',
    },
    status: 'inTransit',
    trackingEvents: [
        { status: 'packed', timestamp: '2025-05-07 09:00:00', location: 'Warehouse, NY' },
        { status: 'pending', timestamp: '2025-05-07 12:00:00', location: 'Warehouse, NY' },
        { status: 'inTransit', timestamp: '2025-05-08 14:30:00', location: 'FedEx Facility, Memphis, TN' },
    ],
};

function ShipmentDetail() {
    const isStaff = true; // Temporary flag, replace with real role check

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
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h4"
                        className="text-text-primary font-semibold"
                        gutterBottom
                        sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}
                    >
                        Shipment Detail - {mockShipment.shipmentId}
                    </Typography>
                    <Typography
                        variant="h6"
                        color="textSecondary"
                        gutterBottom
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                        Track and manage shipment details
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Package and Order Information */}
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    className="text-text-hover"
                                    gutterBottom
                                    sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    Package and Order Information
                                </Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Shipment ID
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockShipment.shipmentId}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Order ID
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockShipment.orderId}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Destination
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockShipment.destination}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Items
                                                </TableCell>
                                                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                    {mockShipment.items.map((item, index) => (
                                                        <Typography key={index} variant="body2">
                                                            {item.productName} (SKU: {item.sku}, Qty: {item.quantity})
                                                        </Typography>
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Carrier Details */}
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    className="text-text-hover"
                                    gutterBottom
                                    sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    Carrier Details
                                </Typography>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                Carrier
                                            </TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockShipment.carrier}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                Service
                                            </TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockShipment.service}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                Tracking Number
                                            </TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockShipment.trackingNumber}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                Contact
                                            </TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{mockShipment.carrierContact}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Tracking Timeline */}
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
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
                                    {mockShipment.trackingEvents.map((event, index) => (
                                        <TimelineItem key={index}>
                                            <TimelineSeparator>
                                                <TimelineDot sx={{ bgcolor: '#1976d2' }} />
                                                {index < mockShipment.trackingEvents.length - 1 && <TimelineConnector />}
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
                    </Grid>

                    {/* Last Known Location */}
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    className="text-text-hover"
                                    gutterBottom
                                    sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    Last Known Location
                                </Typography>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                Location
                                            </TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                {mockShipment.lastLocation.location}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                Timestamp
                                            </TableCell>
                                            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                {mockShipment.lastLocation.timestamp}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Delivery Status and Confirmation */}
                    <Grid item xs={12} sx={{ minWidth: 0 }}>
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
                                    <StatusIndicator status={mockShipment.status} label={mockShipment.status} />
                                </Box>
                                {isStaff && mockShipment.status !== 'delivered' && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Tooltip title="Confirm delivery">
                                            <Button
                                                variant="contained"
                                                startIcon={<CheckCircle />}
                                                sx={{
                                                    bgcolor: '#1976d2',
                                                    '&:hover': { bgcolor: '#115293' },
                                                    px: { xs: 1, sm: 2 },
                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                }}
                                            >
                                                Confirm Delivery
                                            </Button>
                                        </Tooltip>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

export default ShipmentDetail;
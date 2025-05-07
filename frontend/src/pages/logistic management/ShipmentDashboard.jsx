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
    Tooltip,
} from '@mui/material';
import { LocalShipping, Warning, BarChart } from '@mui/icons-material';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from other pages

// Mock pending shipments
const mockPendingShipments = [
    {
        shipmentId: 'SHP001',
        orderId: 'ORD001',
        carrier: 'FedEx',
        service: 'Express',
        status: 'pending',
        destination: '123 Main St, NY',
    },
    {
        shipmentId: 'SHP002',
        orderId: 'ORD002',
        carrier: 'UPS',
        service: 'Ground',
        status: 'pending',
        destination: '456 Oak Ave, CA',
    },
];

// Mock in-transit shipments
const mockInTransitShipments = [
    {
        shipmentId: 'SHP003',
        orderId: 'ORD003',
        trackingNumber: 'TRK123',
        carrier: 'FedEx',
        estimatedDelivery: '2025-05-10',
        status: 'inTransit',
    },
    {
        shipmentId: 'SHP004',
        orderId: 'ORD004',
        trackingNumber: 'TRK456',
        carrier: 'USPS',
        estimatedDelivery: '2025-05-12',
        status: 'inTransit',
    },
];

// Mock delivery exceptions
const mockExceptions = [
    {
        shipmentId: 'SHP005',
        orderId: 'ORD005',
        carrier: 'UPS',
        issue: 'Failed delivery attempt',
        status: 'exception',
    },
    {
        shipmentId: 'SHP006',
        orderId: 'ORD006',
        carrier: 'DHL',
        issue: 'Address incorrect',
        status: 'exception',
    },
];

// Mock carrier performance metrics
const mockCarrierMetrics = [
    { carrier: 'FedEx', onTimeRate: 95, totalShipments: 100 },
    { carrier: 'UPS', onTimeRate: 90, totalShipments: 80 },
    { carrier: 'USPS', onTimeRate: 85, totalShipments: 60 },
    { carrier: 'DHL', onTimeRate: 88, totalShipments: 50 },
];

// Function to determine card color based on onTimeRate
const getMetricCardColor = (onTimeRate) => {
    if (onTimeRate >= 90) return { bgcolor: '#388e3c', color: '#fff' }; // Darker green for high performance
    if (onTimeRate >= 80) return { bgcolor: '#ffb300', color: '#424242' }; // Darker yellow (amber) for medium performance
    return { bgcolor: '#d32f2f', color: '#fff' }; // Darker red for low performance
};

function ShipmentDashboard() {
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
                        Shipment Dashboard
                    </Typography>
                    <Typography
                        variant="h6"
                        color="textSecondary"
                        gutterBottom
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                        Manage and monitor all outgoing shipments
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Pending Shipments Awaiting Dispatch */}
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    className="text-text-hover"
                                    gutterBottom
                                    sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    Pending Shipments
                                </Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Shipment ID
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Order ID
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Carrier
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#1976d2',
                                                        px: { xs: 1, sm: 2 },
                                                        display: { xs: 'none', sm: 'table-cell' },
                                                    }}
                                                >
                                                    Service
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#1976d2',
                                                        px: { xs: 1, sm: 2 },
                                                        display: { xs: 'none', sm: 'table-cell' },
                                                    }}
                                                >
                                                    Status
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#1976d2',
                                                        px: { xs: 1, sm: 2 },
                                                        position: 'sticky',
                                                        right: 0,
                                                        bgcolor: '#e3f2fd',
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {mockPendingShipments.map((shipment) => (
                                                <TableRow key={shipment.shipmentId} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{shipment.shipmentId}</TableCell>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{shipment.orderId}</TableCell>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                        <Select
                                                            value={shipment.carrier}
                                                            size="small"
                                                            sx={{ minWidth: { xs: 80, sm: 100 } }}
                                                            aria-label="Select carrier"
                                                        >
                                                            <MenuItem value="FedEx">FedEx</MenuItem>
                                                            <MenuItem value="UPS">UPS</MenuItem>
                                                            <MenuItem value="USPS">USPS</MenuItem>
                                                            <MenuItem value="DHL">DHL</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ px: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}
                                                    >
                                                        <Select
                                                            value={shipment.service}
                                                            size="small"
                                                            sx={{ minWidth: { xs: 80, sm: 100 } }}
                                                            aria-label="Select service"
                                                        >
                                                            <MenuItem value="Express">Express</MenuItem>
                                                            <MenuItem value="Ground">Ground</MenuItem>
                                                            <MenuItem value="Priority">Priority</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ px: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}
                                                    >
                                                        <StatusIndicator status={shipment.status} label={shipment.status} />
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            px: { xs: 1, sm: 2 },
                                                            position: 'sticky',
                                                            right: 0,
                                                            bgcolor: '#e3f2fd',
                                                            zIndex: 1,
                                                        }}
                                                    >
                                                        <Tooltip title="Dispatch shipment">
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: '#1976d2',
                                                                    '&:hover': { bgcolor: '#115293' },
                                                                    px: { xs: 1, sm: 2 },
                                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                }}
                                                            >
                                                                Dispatch
                                                            </Button>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* In-Transit Shipment Tracking */}
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    className="text-text-hover"
                                    gutterBottom
                                    sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    In-Transit Shipments
                                </Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Shipment ID
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Order ID
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Tracking #
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#1976d2',
                                                        px: { xs: 1, sm: 2 },
                                                        display: { xs: 'none', sm: 'table-cell' },
                                                    }}
                                                >
                                                    Carrier
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#1976d2',
                                                        px: { xs: 1, sm: 2 },
                                                        display: { xs: 'none', sm: 'table-cell' },
                                                    }}
                                                >
                                                    Est. Delivery
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Status
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {mockInTransitShipments.map((shipment) => (
                                                <TableRow key={shipment.shipmentId} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{shipment.shipmentId}</TableCell>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{shipment.orderId}</TableCell>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{shipment.trackingNumber}</TableCell>
                                                    <TableCell
                                                        sx={{ px: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}
                                                    >
                                                        {shipment.carrier}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ px: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}
                                                    >
                                                        {shipment.estimatedDelivery}
                                                    </TableCell>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                        <StatusIndicator status={shipment.status} label={shipment.status} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Delivery Exception Management */}
                    <Grid item xs={12} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    className="text-text-hover"
                                    gutterBottom
                                    sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    Delivery Exceptions
                                </Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Shipment ID
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Order ID
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#1976d2',
                                                        px: { xs: 1, sm: 2 },
                                                        display: { xs: 'none', sm: 'table-cell' },
                                                    }}
                                                >
                                                    Carrier
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Issue
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', px: { xs: 1, sm: 2 } }}>
                                                    Status
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#1976d2',
                                                        px: { xs: 1, sm: 2 },
                                                        position: 'sticky',
                                                        right: 0,
                                                        bgcolor: '#e3f2fd',
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {mockExceptions.map((exception) => (
                                                <TableRow key={exception.shipmentId} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{exception.shipmentId}</TableCell>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{exception.orderId}</TableCell>
                                                    <TableCell
                                                        sx={{ px: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}
                                                    >
                                                        {exception.carrier}
                                                    </TableCell>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>{exception.issue}</TableCell>
                                                    <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                                                        <StatusIndicator status={exception.status} label={exception.status} />
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            px: { xs: 1, sm: 2 },
                                                            position: 'sticky',
                                                            right: 0,
                                                            bgcolor: '#e3f2fd',
                                                            zIndex: 1,
                                                        }}
                                                    >
                                                        <Tooltip title="Resolve exception">
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: '#1976d2',
                                                                    '&:hover': { bgcolor: '#115293' },
                                                                    px: { xs: 1, sm: 2 },
                                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                }}
                                                            >
                                                                Resolve
                                                            </Button>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Performance Metrics by Carrier Level */}
                    <Grid item xs={12} sx={{ minWidth: 0 }}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    className="text-text-hover"
                                    gutterBottom
                                    sx={{ fontWeight: 'medium', color: '#1976d2', fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    Carrier Performance Metrics
                                </Typography>
                                <Grid container spacing={2}>
                                    {mockCarrierMetrics.map((metric) => (
                                        <Grid item xs={12} sm={6} md={3} key={metric.carrier}>
                                            <Card
                                                sx={{
                                                    borderRadius: 2,
                                                    p: 2,
                                                    textAlign: 'center',
                                                    ...getMetricCardColor(metric.onTimeRate),
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: 'medium',
                                                        color: getMetricCardColor(metric.onTimeRate).color,
                                                    }}
                                                >
                                                    {metric.carrier}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: getMetricCardColor(metric.onTimeRate).color }}
                                                >
                                                    On-Time Rate: {metric.onTimeRate}%
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: getMetricCardColor(metric.onTimeRate).color }}
                                                >
                                                    Total Shipments: {metric.totalShipments}
                                                </Typography>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

export default ShipmentDashboard;
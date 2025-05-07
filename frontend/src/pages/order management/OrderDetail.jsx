
import React, { useEffect, useRef } from 'react';
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
    IconButton,
    Paper,
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from '@mui/lab';
import { Edit, Print, PictureAsPdf, LocalShipping } from '@mui/icons-material';
import QRCode from 'qrcode';

import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Assumed from your project

// Mock order data
const mockOrder = {
    id: '1',
    orderNumber: 'ORD-001',
    date: '2025-03-15',
    status: 'inProgress',
    total: 1039.97,
    customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(123) 456-7890',
    },
    items: [
        { id: '1', name: 'Laptop', quantity: 1, price: 999.99 },
        { id: '2', name: 'Mouse', quantity: 2, price: 19.99 },
    ],
    timeline: [
        { id: '1', event: 'Order Placed', date: '2025-03-15 10:00', details: 'Order received' },
        { id: '2', event: 'In Progress', date: '2025-03-15 12:00', details: 'Order being processed' },
    ],
    qrCode: 'placeholder-qr-code.png', // Placeholder for QR code
};

function OrderDetail() {
    // Temporary flag for role-based UI (replace with real role check)
    const isStaff = true;

    // const printQRCode = async () => {
    //     const canvas = document.createElement('canvas');
    //     await QRCode.toCanvas(canvas, `order:${mockOrder.id}`, { width: 150 });
    //     const imgData = canvas.toDataURL('image/png');
    //     const win = window.open('');
    //     win.document.write(`<img src="${imgData}" onload="window.print();window.close()" />`);
    // };


    const qrRef = useRef();
useEffect(() => {
    QRCode.toCanvas(qrRef.current, `order:${mockOrder.id}`, { width: 150 });
}, []);

    return (
        <Box sx={{ p: 4, bgcolor: 'background-light', minHeight: 'calc(100vh - 64px)', width: '100%' }}>
            {/* Page Title */}
            <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                Order Details
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
                View and manage order {mockOrder.orderNumber}
            </Typography>

            <Grid container spacing={3}>
                {/* Order Header */}
                <Grid item xs={12}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                        Order #{mockOrder.orderNumber}
                                    </Typography>
                                    <Typography color="textSecondary">
                                        Date: {mockOrder.date}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                    <StatusIndicator status={mockOrder.status} />
                                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold', color: '#1976d2' }}>
                                        Total: ${mockOrder.total.toFixed(2)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Item List */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                                Items
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Price</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockOrder.items.map((item) => (
                                        <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>${item.price.toFixed(2)}</TableCell>
                                            <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Customer Information */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                                Customer Information
                            </Typography>
                            <Typography>Name: {mockOrder.customer.name}</Typography>
                            <Typography>Email: {mockOrder.customer.email}</Typography>
                            <Typography>Phone: {mockOrder.customer.phone}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Timeline */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                                Status Timeline
                            </Typography>
                            <Timeline position="alternate">
                                {mockOrder.timeline.map((event) => (
                                    <TimelineItem key={event.id}>
                                        <TimelineSeparator>
                                            <TimelineDot sx={{ bgcolor: '#1976d2' }} />
                                            <TimelineConnector sx={{ bgcolor: '#1976d2' }} />
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Typography variant="h6" sx={{ color: '#1976d2' }}>
                                                {event.event}
                                            </Typography>
                                            <Typography color="textSecondary">{event.date}</Typography>
                                            <Typography>{event.details}</Typography>
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        </CardContent>
                    </Card>
                </Grid>

                {/* QR Code */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                                QR Code
                            </Typography>
                            {/* QR code */}
                            <canvas ref={qrRef} style={{ width: 150, height: 150, marginBottom: 16 }} />

                            <Button
                                variant="outlined"
                                startIcon={<Print />}
                                sx={{
                                    color: '#757575',
                                    borderColor: '#757575',
                                    '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' },
                                }}
                            >
                                Print QR Code
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        {isStaff && (
                            <>
                                <Button
                                    variant="contained"
                                    startIcon={<Edit />}
                                    sx={{
                                        bgcolor: '#1976d2',
                                        color: 'white',
                                        '&:hover': { bgcolor: '#115293' },
                                    }}
                                >
                                    Edit Order
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<LocalShipping />}
                                    sx={{
                                        bgcolor: '#1976d2',
                                        color: 'white',
                                        '&:hover': { bgcolor: '#115293' },
                                    }}
                                >
                                    Update Status
                                </Button>
                            </>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<PictureAsPdf />}
                            sx={{
                                bgcolor: '#1976d2',
                                color: 'white',
                                '&:hover': { bgcolor: '#115293' },
                            }}
                        >
                            Generate Invoice
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

export default OrderDetail;
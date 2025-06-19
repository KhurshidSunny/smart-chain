import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Divider } from '@mui/material';

function OrderDetail() {
  const { id } = useParams();

  // Mock order data (in practice, fetch via useQuery with id)
  const order = {
    _id: '68209d293649a8a112102098',
    orderNumber: 'ORD-1746967849772-317',
    customer: { name: 'John Doe' }, // Mocked
    createdAt: '2025-05-11T12:50:50.850Z',
    updatedAt: '2025-05-11T12:50:54.575Z',
    items: [
      {
        productId: '68209cedf134db929495a56a',
        name: 'Sample Widget',
        quantity: 10,
        unitPrice: 15.99,
      },
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'Sample City',
      state: 'CA',
      country: 'USA',
      zipCode: '90210',
    },
    status: 'confirmed',
    totalAmount: 159.9,
    notes: 'Please deliver before noon.',
    qrCode: '...' // Truncated for display
  };

  if (!order || order._id !== id) {
    return <Box sx={{ p: 4 }}><Typography variant="h4">Order not found</Typography></Box>;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#1976d2' }}>
        Order Details: {order.orderNumber}
      </Typography>
      <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                General Information
              </Typography>
              <Typography><strong>Order Number:</strong> {order.orderNumber}</Typography>
              <Typography><strong>Customer:</strong> {order.customer.name}</Typography>
              <Typography><strong>Status:</strong> {order.status}</Typography>
              <Typography><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</Typography>
              <Typography><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</Typography>
              <Typography><strong>Updated At:</strong> {new Date(order.updatedAt).toLocaleString()}</Typography>
              <Typography><strong>Notes:</strong> {order.notes || 'None'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                Shipping Address
              </Typography>
              <Typography>{order.shippingAddress.street}</Typography>
              <Typography>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</Typography>
              <Typography>{order.shippingAddress.country}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                Items
              </Typography>
              {order.items.map((item, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography><strong>{item.name}</strong></Typography>
                  <Typography>Quantity: {item.quantity}</Typography>
                  <Typography>Unit Price: ${item.unitPrice.toFixed(2)}</Typography>
                  <Typography>Total: ${(item.quantity * item.unitPrice).toFixed(2)}</Typography>
                </Box>
              ))}
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                QR Code
              </Typography>
              <Typography sx={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
                {order.qrCode}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default OrderDetail;
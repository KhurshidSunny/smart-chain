import React from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

function OrderItemsTable({ items }) {
  return (
    <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}>
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
            {items.map((item) => (
              <TableRow key={item.productId} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
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
  );
}

export default OrderItemsTable;
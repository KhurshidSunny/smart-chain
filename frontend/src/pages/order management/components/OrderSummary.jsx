import React from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TextField } from '@mui/material';
import { Delete } from '@mui/icons-material';

function OrderSummary({ selectedProducts, onProductsChange }) {
  const totalAmount = selectedProducts.reduce(
    (sum, product) => sum + product.quantity * product.unitCost,
    0
  );
  console.log(selectedProducts, 'order summary')

  const handleRemoveProduct = (productId) => {
    onProductsChange(selectedProducts.filter((p) => p.productId !== productId));
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    onProductsChange(
      selectedProducts.map((p) =>
        p.productId === productId ? { ...p, quantity: parseInt(quantity) } : p
      )
    );
  };

  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 1 }}>
        Order Summary
      </Typography>
      <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedProducts.map((product) => (
                <TableRow key={product.productId} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                      size="small"
                      inputProps={{ min: 1 }}
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell>${product.unitCost}</TableCell>
                  <TableCell>${(product.quantity * product.unitCost)}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleRemoveProduct(product.productId)}
                      sx={{ color: '#d32f2f' }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'right', fontWeight: 'bold', color: '#1976d2' }}>
            Total: ${totalAmount.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}

export default OrderSummary;
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

function CustomerInfo({ customer }) {
  return (
    <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}>
          Customer Information
        </Typography>
        <Typography>Name: {customer.name}</Typography>
        <Typography>Email: {customer.email}</Typography>
        <Typography>Phone: {customer.phone}</Typography>
      </CardContent>
    </Card>
  );
}

export default CustomerInfo;
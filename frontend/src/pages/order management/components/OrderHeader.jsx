import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import StatusIndicator from '../../../components/common/StatusIndicator/StatusIndicator';

function OrderHeader({ order }) {
  return (
    <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2' }}>
              Order #{order.orderNumber}
            </Typography>
            <Typography color="textSecondary">Date: {order.date}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <StatusIndicator status={order.status} />
            <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold', color: '#1976d2' }}>
              Total: ${order.total.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default OrderHeader;
import React from 'react';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getInventoryItems } from '../../../services/inventoryService';

// Vibrant color palette
const barColors = ['#0288d1', '#d81b60', '#388e3c', '#f57c00', '#7b1fa2'];

function StockLevelChart() {
  // Mock data for testing
  const mockData = [
    {
      _id: '68209c01f134db929495a545',
      name: 'Sample Widget',
      category: 'Electronics',
      stockLevel: 107,
      sku: 'PROD-0011',
      description: 'A high-quality widget for testing',
      unitCost: 15.99,
      reorderPoint: 20,
      dimensions: { width: 10, height: 5, depth: 3, weight: 0.5 },
      createdAt: '2025-05-11T12:45:53.528Z',
      updatedAt: '2025-05-11T12:45:53.528Z',
      active: true,
      __v: 0,
    },
  ];

  const { data: products = mockData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getInventoryItems,
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch products', { toastId: 'fetch-products-error' });
    },
  });

  // Aggregate stock by category
  const stockSummary = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    const stockLevel = Number(product.stockLevel) || 0;
    const existing = acc.find((item) => item.category === category);
    if (existing) {
      existing.stock = (existing.stock || 0) + stockLevel;
    } else {
      acc.push({ category, stock: stockLevel });
    }
    return acc;
  }, []);

  return (
    <Card
      sx={{
        bgcolor: '#e3f2fd',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        borderRadius: 2,
        '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.1)' },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 'medium',
            color: '#1976d2',
            mb: 2,
          }}
        >
          Stock Level by Category
        </Typography>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#1976d2' }} />
          </Box>
        ) : stockSummary.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                color: '#757575',
              }}
            >
              No stock summary data available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: { xs: 250, sm: 300 } }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="category" stroke="#757575" fontSize={{ xs: 12, sm: 14 }} />
                <YAxis stroke="#757575" fontSize={{ xs: 12, sm: 14 }} />
                <RechartsTooltip />
                <Legend />
                {stockSummary.map((entry, index) => (
                  <Bar
                    key={entry.category}
                    dataKey="stock"
                    name={entry.category}
                    fill={barColors[index % barColors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default StockLevelChart;
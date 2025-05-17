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
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getInventoryItems,
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch products', { toastId: 'fetch-products-error' });
    },
  });

  // Extract inventory array, default to empty array if undefined
  const products = data?.inventory || [];

  // Aggregate stock by category
  const stockSummary = products.reduce((acc, product) => {
    const category = (product.category || 'Uncategorized').toLowerCase();
    const stockLevel = Number(product.stockLevel) || 0;
    const existing = acc.find((item) => item.category === category);
    if (existing) {
      existing.stock = (existing.stock || 0) + stockLevel;
    } else {
      acc.push({ category, stock: stockLevel });
    }
    return acc;
  }, []);

  console.log(stockSummary)
  // Pivot data for bar chart
  const chartData = [{ name: 'Stock' }];
  stockSummary.forEach((entry) => {
    chartData[0][entry.category] = entry.stock;
  });

  console.log('StockSummary:', stockSummary);
  console.log('ChartData:', chartData);

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
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#757575" fontSize={{ xs: 12, sm: 14 }} tick={false} />
                <YAxis stroke="#757575" fontSize={{ xs: 12, sm: 14 }} />
                <RechartsTooltip formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]} />
                <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
                {stockSummary.map((entry, index) => (
                  <Bar
                    key={entry.category}
                    dataKey={entry.category}
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
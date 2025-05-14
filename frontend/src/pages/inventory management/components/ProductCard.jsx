import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StatusIndicator from '../../../components/common/StatusIndicator/StatusIndicator';

function ProductCard({ product, isManager, onEdit, onDelete }) {
  const navigate = useNavigate();

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'error', label: 'Out of Stock' };
    if (stock <= 20) return { status: 'inProgress', label: 'Low Stock' };
    return { status: 'completed', label: 'In Stock' };
  };

  return (
    <Card
      sx={{
        bgcolor: '#e3f2fd',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        borderRadius: 2,
        '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.1)', cursor: 'pointer' },
      }}
      onClick={() => navigate(`/products/${product._id}`)}
      role="button"
      aria-label={`View details for ${product.name}`}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2' }}
        >
          {product.name}
        </Typography>
        <Typography sx={{ color: '#757575', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          SKU: {product.sku}
        </Typography>
        <Typography sx={{ color: '#757575', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Category: {product.category}
        </Typography>
        <Typography sx={{ color: '#757575', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Price: ${product.unitCost.toFixed(2)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <StatusIndicator {...getStockStatus(product.stockLevel)} />
          <Typography sx={{ ml: 1, color: '#757575', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Stock: {product.stockLevel}
          </Typography>
        </Box>
        {isManager && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Tooltip title="Edit Product">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                sx={{ color: '#1976d2' }}
                aria-label={`Edit ${product.name}`}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Product">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
                sx={{ color: '#d32f2f' }}
                aria-label={`Delete ${product.name}`}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductCard;
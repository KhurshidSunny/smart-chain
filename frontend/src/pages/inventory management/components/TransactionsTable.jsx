import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getInventoryTransactions } from '../../../services/inventoryService'

function TransactionsTable() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: getInventoryTransactions,
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch transactions', { toastId: 'fetch-transactions-error' });
    },
  });

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
          Recent Inventory Transactions
        </Typography>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#1976d2' }} />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                color: '#757575',
              }}
            >
              No recent transactions found
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 'auto', sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Product
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Quantity
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    sx={{
                      '&:hover': { bgcolor: '#e0f7fa' },
                    }}
                  >
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {transaction.product || 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {transaction.type || 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {transaction.quantity || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default TransactionsTable;
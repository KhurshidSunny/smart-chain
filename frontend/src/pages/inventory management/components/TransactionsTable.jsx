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
import { getInventoryTransactions } from '../../../services/inventoryService';

function TransactionsTable({ productId = null }) {
  // Fetch transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', productId],
    queryFn: () => getInventoryTransactions(productId),
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch transactions', {
        toastId: 'fetch-transactions-error',
      });
    },
  });

  console.log(transactions)
 

  return (
    <Card
      sx={{
        bgcolor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderRadius: 3,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: 600,
            color: '#1565c0',
            mb: 2.5,
          }}
        >
          {productId ? 'Product Transaction Log' : 'Recent Inventory Transactions'}
        </Typography>
        {isTransactionsLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#1565c0' }} />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }} aria-live="polite">
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem' },
                color: '#546e7a',
              }}
            >
              No transactions found
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 'auto', sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#1565c0',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#1565c0',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    Product
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#1565c0',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#1565c0',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    Quantity
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#1565c0',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    Location
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction._id}
                    sx={{
                      '&:hover': { bgcolor: '#e3f2fd' },
                    }}
                  >
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {transaction?.productId?.name || 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {transaction.type || 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {transaction.quantity || 0}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {transaction.location || 'N/A'}
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
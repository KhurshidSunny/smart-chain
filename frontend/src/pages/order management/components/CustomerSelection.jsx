import React, { useState } from 'react';
import { Card, CardContent, Typography, Autocomplete, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer } from '../../../services/orderService'
import { toast } from 'react-toastify';

function CustomerSelection({ selectedCustomer, onCustomerChange }) {
  const queryClient = useQueryClient();
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch customers');
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: (customerData) => createCustomer(customerData),
    onSuccess: (customer) => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer created');
      setOpenCustomerDialog(false);
      setNewCustomer({ name: '', email: '', phone: '' });
      onCustomerChange(customer);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast.error('Name and email are required');
      return;
    }
    createCustomerMutation.mutate(newCustomer);
  };

  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 1 }}>
        Customer Selection
      </Typography>
      <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent>
          <Autocomplete
            options={customers}
            getOptionLabel={(option) => option.name}
            value={selectedCustomer}
            onChange={(e, value) => onCustomerChange(value)}
            loading={isLoading}
            renderInput={(params) => (
              <TextField {...params} label="Select Customer" variant="outlined" fullWidth />
            )}
            sx={{ mb: 2 }}
          />
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={() => setOpenCustomerDialog(true)}
            sx={{ color: '#757575', borderColor: '#757575', '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' } }}
          >
            Add New Customer
          </Button>
        </CardContent>
      </Card>

      <Dialog open={openCustomerDialog} onClose={() => setOpenCustomerDialog(false)}>
        <DialogTitle sx={{ color: '#1976d2' }}>Add New Customer</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Email"
            fullWidth
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Phone"
            fullWidth
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomerDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCustomer}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CustomerSelection;
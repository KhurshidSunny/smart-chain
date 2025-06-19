import React, { useState } from 'react';
import { Card, CardContent, Typography, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomerAddresses, createAddress } from '../../../services/orderService'
import { toast } from 'react-toastify';

function ShippingAddress({ selectedCustomer, selectedAddress, onAddressChange }) {
  const queryClient = useQueryClient();
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  // Fetch addresses
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', selectedCustomer?.id],
    queryFn: () => getCustomerAddresses(selectedCustomer.id),
    enabled: !!selectedCustomer,
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch addresses');
    },
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: (addressData) => createAddress(selectedCustomer.id, addressData),
    onSuccess: (address) => {
      queryClient.invalidateQueries(['addresses', selectedCustomer.id]);
      toast.success('Address created');
      setOpenAddressDialog(false);
      setNewAddress({ street: '', city: '', state: '', zipCode: '', country: '' });
      onAddressChange(address);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create address');
    },
  });

  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state) {
      toast.error('Street, city, and state are required');
      return;
    }
    createAddressMutation.mutate(newAddress);
  };

  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 1 }}>
        Shipping Address
      </Typography>
      <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent>
          <Select
            fullWidth
            displayEmpty
            value={selectedAddress?.id || ''}
            onChange={(e) => {
              const address = addresses.find((a) => a.id === e.target.value);
              onAddressChange(address || null);
            }}
            disabled={!selectedCustomer}
            renderValue={(selected) => {
              if (!selected) return <em>Select Address</em>;
              const address = addresses.find((addr) => addr.id === selected);
              return `${address.street}, ${address.city}, ${address.state}`;
            }}
            sx={{ mb: 2 }}
          >
            <MenuItem disabled value="">
              <em>Select Address</em>
            </MenuItem>
            {addresses.map((address) => (
              <MenuItem key={address.id} value={address.id}>
                {`${address.street}, ${address.city}, ${address.state} ${address.zipCode}`}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="outlined"
            startIcon={<LocationOn />}
            onClick={() => setOpenAddressDialog(true)}
            disabled={!selectedCustomer}
            sx={{ color: '#757575', borderColor: '#757575', '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' } }}
          >
            Add New Address
          </Button>
        </CardContent>
      </Card>

      <Dialog open={openAddressDialog} onClose={() => setOpenAddressDialog(false)}>
        <DialogTitle sx={{ color: '#1976d2' }}>Add New Address</DialogTitle>
        <DialogContent>
          <TextField
            label="Street"
            fullWidth
            value={newAddress.street}
            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="City"
            fullWidth
            value={newAddress.city}
            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="State"
            fullWidth
            value={newAddress.state}
            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Zip Code"
            fullWidth
            value={newAddress.zipCode}
            onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Country"
            fullWidth
            value={newAddress.country}
            onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddressDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAddress}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ShippingAddress;
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  Typography,
  Autocomplete,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../../../services/orderService';
import { toast } from 'react-toastify';

function OrderFilters({ onFilterChange }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customer, setCustomer] = useState(null);
  const isStaff = true; // Replace with auth context

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch customers');
    },
  });

  // Update filters when inputs change
  useEffect(() => {
    const filters = {
      search: search || undefined,
      status: status || undefined,
      startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : undefined,
      endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : undefined,
      customerId: customer?.id || undefined,
    };
    onFilterChange?.(filters);
  }, [search, status, startDate, endDate, customer, onFilterChange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Search Orders"
                variant="outlined"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Select
                fullWidth
                displayEmpty
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                renderValue={(selected) => (selected ? selected : 'All Statuses')}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="inProgress">In Progress</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            {isStaff && (
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.name}
                  value={customer}
                  onChange={(e, value) => setCustomer(value)}
                  loading={customersLoading}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Customer" variant="outlined" fullWidth />
                  )}
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
}

export default OrderFilters;
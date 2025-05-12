import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Chip,
  Fade,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Search,
  Lock,
  Shield,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Users() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'Active',
      permissions: ['view', 'edit', 'delete'],
      locked: false,
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'User',
      status: 'Inactive',
      permissions: ['view'],
      locked: false,
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'Manager',
      status: 'Active',
      permissions: ['view', 'edit'],
      locked: true,
    },
    {
      id: 4,
      name: 'Sarah Lee',
      email: 'sarah.lee@example.com',
      role: 'User',
      status: 'Active',
      permissions: ['view'],
      locked: false,
    },
  ]);

  // Ensure component is mounted
  useEffect(() => {
    // TODO: Replace with apiClient GET /users
    return () => {};
  }, []);

  // Debounced search
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.role.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleToggleStatus = (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === 'Active' ? 'Inactive' : 'Active',
            }
          : user
      )
    );
    toast.success(`User ${users.find((u) => u.id === userId).name} status toggled`);
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    toast.success(`User ${users.find((u) => u.id === userId).name} role updated to ${newRole}`);
  };

  const handlePermissionsEdit = (userId) => {
    // Mock permission edit (replace with dialog in future)
    toast.success(`Editing permissions for user ${users.find((u) => u.id === userId).name}`);
  };

  const handleUnlock = (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, locked: false } : user
      )
    );
    toast.success(`User ${users.find((u) => u.id === userId).name} account unlocked`);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          minHeight: '100vh',
          height: '100%',
          width: '100vw',
          maxWidth: '100%',
          overflow: 'hidden',
          bgcolor: '#f5f5f5',
          p: { xs: 2, sm: 3, md: 4 },
          boxSizing: 'border-box',
        }}
        role="region"
        aria-label="Users management page"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Tooltip title="Back to Home">
            <Button
              variant="text"
              onClick={handleBack}
              sx={{ color: '#1976d2', mr: 2 }}
              aria-label="Back to home"
            >
              <ArrowBack sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Button>
          </Tooltip>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 'bold',
              color: '#1976d2',
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Users Management
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 3 }}>
          {/* Search */}
          <Grid item xs={12} sm={6}>
            <Fade in timeout={800}>
              <TextField
                label="Search by Name, Email, or Role"
                variant="outlined"
                value={search}
                onChange={handleSearchChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Search sx={{ color: '#757575', mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                  ),
                }}
                sx={{ bgcolor: '#fff', borderRadius: 1 }}
                aria-label="Search users"
              />
            </Fade>
          </Grid>

          {/* Filters */}
          <Grid item xs={12} sm={3}>
            <Fade in timeout={1000}>
              <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 1 }}>
                <InputLabel id="role-filter-label">Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  onChange={handleRoleFilterChange}
                  label="Role"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  aria-label="Filter by role"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Fade>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Fade in timeout={1000}>
              <FormControl fullWidth sx={{ bgcolor: '#fff', borderRadius: 1 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  label="Status"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  aria-label="Filter by status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Locked">Locked</MenuItem>
                </Select>
              </FormControl>
            </Fade>
          </Grid>
        </Grid>

        {/* User Directory */}
        <Fade in timeout={800}>
          <Card
            sx={{
              bgcolor: '#e3f2fd',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2', mb: 2 }}
              >
                User Directory
              </Typography>
              <TableContainer sx={{ maxHeight: '60vh', overflowX: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                        Name
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                        Email
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                        Role
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                        Permissions
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(25,118,210,0.1)' },
                        }}
                      >
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ fontSize: { xs: 20, sm: 24 }, color: '#1976d2' }} />
                            {user.name}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {user.email}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <FormControl size="small">
                            <Select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              aria-label={`Change role for ${user.name}`}
                            >
                              <MenuItem value="Admin">Admin</MenuItem>
                              <MenuItem value="User">User</MenuItem>
                              <MenuItem value="Manager">Manager</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <Chip
                            label={user.status}
                            color={
                              user.status === 'Active'
                                ? 'success'
                                : user.status === 'Inactive'
                                ? 'default'
                                : 'error'
                            }
                            size="small"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {user.permissions.join(', ')}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Tooltip title={user.status === 'Active' ? 'Deactivate' : 'Activate'}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleToggleStatus(user.id)}
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  borderColor: '#1976d2',
                                  color: '#1976d2',
                                  '&:hover': { bgcolor: '#e3f2fd', borderColor: '#115293' },
                                }}
                                aria-label={`${user.status === 'Active' ? 'Deactivate' : 'Activate'} user ${user.name}`}
                              >
                                {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </Button>
                            </Tooltip>
                            <Tooltip title="Edit Permissions">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handlePermissionsEdit(user.id)}
                                startIcon={<Shield sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  borderColor: '#1976d2',
                                  color: '#1976d2',
                                  '&:hover': { bgcolor: '#e3f2fd', borderColor: '#115293' },
                                }}
                                aria-label={`Edit permissions for ${user.name}`}
                              >
                                Permissions
                              </Button>
                            </Tooltip>
                            {user.locked && (
                              <Tooltip title="Unlock Account">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleUnlock(user.id)}
                                  startIcon={<Lock sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                                  sx={{
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    borderColor: '#1976d2',
                                    color: '#1976d2',
                                    '&:hover': { bgcolor: '#e3f2fd', borderColor: '#115293' },
                                  }}
                                  aria-label={`Unlock account for ${user.name}`}
                                >
                                  Unlock
                                </Button>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    </Fade>
  );
}

export default Users;
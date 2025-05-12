import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Checkbox,
  FormControlLabel,
  Fade,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Person,
  AdminPanelSettings,
  Lock,
  Shield,
  History,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    role: 'Admin',
    status: 'Active',
    locked: false,
    permissions: ['view', 'edit', 'delete'],
  });
  const [activityLog] = useState([
    { id: 1, action: 'Logged in', timestamp: '2025-05-10 10:00:00' },
    { id: 2, action: 'Updated profile', timestamp: '2025-05-09 15:30:00' },
    { id: 3, action: 'Role changed to Admin', timestamp: '2025-05-08 09:00:00' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted and validate userId
  useEffect(() => {
    setIsMounted(true);
    if (!userId || isNaN(userId)) {
      toast.error('Invalid user ID');
      navigate('/users');
    }
    // TODO: Replace with apiClient GET /users/:userId
    return () => setIsMounted(false);
  }, [userId, navigate]);

  const handleProfileChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const validateProfile = () => {
    if (!user.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      toast.error('Invalid email format');
      return false;
    }
    return true;
  };

  const handleProfileSave = () => {
    if (!validateProfile()) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Profile updated successfully');
      setIsSubmitting(false);
      activityLog.unshift({
        id: activityLog.length + 1,
        action: 'Updated profile',
        timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      });
    }, 1000);
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setUser((prev) => ({ ...prev, role: newRole }));
    toast.success(`Role updated to ${newRole}`);
    activityLog.unshift({
      id: activityLog.length + 1,
      action: `Role changed to ${newRole}`,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
    });
  };

  const handleStatusToggle = () => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setUser((prev) => ({ ...prev, status: newStatus }));
    toast.success(`Status updated to ${newStatus}`);
    activityLog.unshift({
      id: activityLog.length + 1,
      action: `Status changed to ${newStatus}`,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
    });
  };

  const handleLockToggle = () => {
    const newLocked = !user.locked;
    setUser((prev) => ({ ...prev, locked: newLocked }));
    toast.success(`Account ${newLocked ? 'locked' : 'unlocked'}`);
    activityLog.unshift({
      id: activityLog.length + 1,
      action: `Account ${newLocked ? 'locked' : 'unlocked'}`,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
    });
  };

  const handlePermissionToggle = (permission) => {
    setUser((prev) => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
    toast.success(`Permission ${permission} ${user.permissions.includes(permission) ? 'removed' : 'added'}`);
    activityLog.unshift({
      id: activityLog.length + 1,
      action: `Permission ${permission} ${user.permissions.includes(permission) ? 'removed' : 'added'}`,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
    });
  };

  const handlePasswordReset = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Password reset initiated');
      setIsSubmitting(false);
      activityLog.unshift({
        id: activityLog.length + 1,
        action: 'Password reset initiated',
        timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      });
    }, 1000);
  };

  const handleBack = () => {
    navigate('/users');
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
        aria-label="User detail page"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Tooltip title="Back to Users">
            <Button
              variant="text"
              onClick={handleBack}
              sx={{ color: '#1976d2', mr: 2 }}
              aria-label="Back to users"
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
            User Details (ID: {userId})
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Profile Information */}
          <Grid item xs={12} sm={6}>
            <Fade in timeout={800}>
              <Card
                sx={{
                  bgcolor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2', mb: 2 }}
                  >
                    Profile Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Person sx={{ fontSize: { xs: 24, sm: 28 }, color: '#1976d2' }} />
                    <Typography
                      variant="body1"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                    >
                      User ID: {user.id}
                    </Typography>
                  </Box>
                  <TextField
                    label="Name"
                    value={user.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    aria-label="Edit user name"
                  />
                  <TextField
                    label="Email"
                    value={user.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    aria-label="Edit user email"
                  />
                  <TextField
                    label="Phone"
                    value={user.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    aria-label="Edit user phone"
                  />
                  <Button
                    variant="contained"
                    onClick={handleProfileSave}
                    disabled={isSubmitting}
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    aria-label="Save profile changes"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Role & Status */}
          <Grid item xs={12} sm={6}>
            <Fade in timeout={1000}>
              <Card
                sx={{
                  bgcolor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2', mb: 2 }}
                  >
                    Role & Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <AdminPanelSettings sx={{ fontSize: { xs: 24, sm: 28 }, color: '#1976d2' }} />
                    <FormControl fullWidth>
                      <InputLabel id="role-label">Role</InputLabel>
                      <Select
                        labelId="role-label"
                        value={user.role}
                        onChange={handleRoleChange}
                        label="Role"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        aria-label="Change user role"
                      >
                        <MenuItem value="Admin">Admin</MenuItem>
                        <MenuItem value="User">User</MenuItem>
                        <MenuItem value="Manager">Manager</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Tooltip title={user.status === 'Active' ? 'Deactivate' : 'Activate'}>
                      <Button
                        variant="outlined"
                        onClick={handleStatusToggle}
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          borderColor: '#1976d2',
                          color: '#1976d2',
                          '&:hover': { bgcolor: '#e3f2fd', borderColor: '#115293' },
                        }}
                        startIcon={<Lock sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                        aria-label={`${user.status === 'Active' ? 'Deactivate' : 'Activate'} user`}
                      >
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Tooltip>
                    <Tooltip title={user.locked ? 'Unlock' : 'Lock'}>
                      <Button
                        variant="outlined"
                        onClick={handleLockToggle}
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          borderColor: '#1976d2',
                          color: '#1976d2',
                          '&:hover': { bgcolor: '#e3f2fd', borderColor: '#115293' },
                        }}
                        startIcon={<Lock sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                        aria-label={`${user.locked ? 'Unlock' : 'Lock'} user account`}
                      >
                        {user.locked ? 'Unlock' : 'Lock'}
                      </Button>
                    </Tooltip>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handlePasswordReset}
                    disabled={isSubmitting}
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    aria-label="Initiate password reset"
                  >
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Permissions */}
          <Grid item xs={12} sm={6}>
            <Fade in timeout={1200}>
              <Card
                sx={{
                  bgcolor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2', mb: 2 }}
                  >
                    Permissions
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Shield sx={{ fontSize: { xs: 24, sm: 28 }, color: '#1976d2' }} />
                    <Typography
                      variant="body1"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                    >
                      Specific Permission Overrides
                    </Typography>
                  </Box>
                  {['view', 'edit', 'delete'].map((permission) => (
                    <FormControlLabel
                      key={permission}
                      control={
                        <Checkbox
                          checked={user.permissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                          sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                          aria-label={`Toggle ${permission} permission`}
                        />
                      }
                      label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                    />
                  ))}
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Activity History Log */}
          <Grid item xs={12} sm={6}>
            <Fade in timeout={1400}>
              <Card
                sx={{
                  bgcolor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2', mb: 2 }}
                  >
                    Activity History Log
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <History sx={{ fontSize: { xs: 24, sm: 28 }, color: '#1976d2' }} />
                    <Typography
                      variant="body1"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                    >
                      Recent Activities
                    </Typography>
                  </Box>
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <List>
                      {activityLog.map((entry) => (
                        <ListItem key={entry.id} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={entry.action}
                            secondary={entry.timestamp}
                            primaryTypographyProps={{
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              color: '#1976d2',
                            }}
                            secondaryTypographyProps={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              color: '#757575',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}

export default UserDetail;
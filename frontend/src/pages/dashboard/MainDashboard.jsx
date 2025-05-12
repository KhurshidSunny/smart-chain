import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Badge,
  Chip,
  Fade,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, LocalShipping, Feedback } from '@mui/icons-material';
import toast from 'react-hot-toast';
import ActionButton from '../../components/common/ActionButton/ActionButton.jsx';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx';
import SearchBar from '../../components/common/SearchBar/SearchBar.jsx';
import LoadingIndicator from '../../components/common/LoadingIndicator/LoadingIndicator.jsx';
import { getCurrentUser } from './../../services/authService.js';

const MainDashboard = () => {
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: getCurrentUser,
  });

  const { data: dashboardData, isLoading: dataLoading } = useQuery({
    queryKey: ['customerDashboard'],
    // queryFn: getCustomerDashboardData,
    enabled: !!user,
    onError: () => toast.error('Failed to load dashboard data'),
  });

  const sampleData = {
    stats: [
      { title: 'Your Orders', value: '5', status: 'completed', icon: <ShoppingCart />, bgColor: '#e3f2fd' },
      { title: 'Pending Deliveries', value: '2', status: 'inProgress', icon: <LocalShipping />, bgColor: '#e3f2fd' },
      { title: 'Feedback Submitted', value: '3', status: 'completed', icon: <Feedback />, bgColor: '#e3f2fd' },
    ],
    timeline: [
      { event: 'Order #1234 placed', date: '2025-03-17', status: 'completed' },
      { event: 'Order #1235 shipped', date: '2025-03-18', status: 'inProgress' },
      { event: 'Order #1233 delivered', date: '2025-03-16', status: 'completed' },
    ],
    notifications: [
      { message: 'Order #1235 out for delivery', unread: true },
      { message: 'Rate your recent delivery', unread: true },
      { message: 'Order #1233 delivered', unread: false },
    ],
    chartData: [
      { name: 'Mon', orders: 1 },
      { name: 'Tue', orders: 3 },
      { name: 'Wed', orders: 2 },
      { name: 'Thu', orders: 4 },
      { name: 'Fri', orders: 1 },
    ],
  };

  const { stats, timeline, notifications, chartData } = dashboardData || sampleData;
  const role = user?.role || 'customer';

  const handleSearch = (query) => {
    toast(`Searching for: ${query}`);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleAction = (path) => {
    navigate(path);
    toast.success(`Navigating to ${path}`);
  };

  const handleNotificationClick = (message, unread) => {
    toast(message, { duration: unread ? 6000 : 4000 });
  };

  if (userLoading || dataLoading) {
    return (
      <LoadingIndicator
        fullScreen
        message="Loading your dashboard..."
        size={60}
        color="primary"
        overlayOpacity={0.6}
        overlayColor="rgba(0, 0, 0, 0.6)"
        variant="pulse"
        animationDuration={1.2}
      />
    );
  }

  return (
    <Box
      sx={{
        width: '100vw',
        maxWidth: '100%',
        minHeight: '100vh',
        height: '100%',
        bgcolor: '#f5f5f5',
        m: 0,
        p: { xs: 2, sm: 3, md: 4 },
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <Fade in timeout={600}>
        <Box sx={{ mb: 3, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            variant="h4"
            className="text-text-primary font-semibold"
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, color: '#1976d2' }}
          >
            Welcome, {user?.firstName || 'Customer'}!
          </Typography>
          <Typography
            variant="h6"
            color="textSecondary"
            gutterBottom
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#757575' }}
          >
            Your Smart-Chain Dashboard
          </Typography>
        </Box>
      </Fade>

      <Fade in timeout={800}>
        <Box sx={{ maxWidth: { xs: 300, sm: 400 }, mb: { xs: 3, sm: 4 }, mx: { xs: 'auto', sm: 0 } }}>
          <SearchBar onSearch={handleSearch} placeholder="Search your orders..." />
        </Box>
      </Fade>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* Quick Stats */}
        <Grid item xs={12} sm={6} lg={4}>
          <Fade in timeout={1000}>
            <Box>
              <Typography
                variant="h6"
                className="text-text-hover"
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2' }}
              >
                Quick Stats
              </Typography>
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                {stats.map((stat, index) => (
                  <Grid item xs={12} key={index}>
                    <Card
                      sx={{
                        backgroundColor: '#e3f2fd',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        borderRadius: 2,
                      }}
                    >
                      <CardContent
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 1, sm: 2 },
                          p: { xs: 1.5, sm: 2 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {React.cloneElement(stat.icon, {
                            sx: { fontSize: { xs: 24, sm: 30 }, color: '#1976d2' },
                          })}
                        </Box>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            className="text-text-secondary"
                            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                          >
                            {stat.title}
                          </Typography>
                          <Typography
                            variant="h5"
                            className="text-text-primary"
                            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                          >
                            {stat.value}
                          </Typography>
                          <StatusIndicator status={stat.status} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} sm={6} lg={4}>
          <Fade in timeout={1200}>
            <Box>
              <Typography
                variant="h6"
                className="text-text-hover"
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2' }}
              >
                Quick Actions
              </Typography>
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12}>
                  <ActionButton
                    label="Track Order"
                    onClick={() => handleAction('/tracking')}
                    fullWidth
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ActionButton
                    label="Submit Feedback"
                    onClick={() => handleAction('/feedback')}
                    fullWidth
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ActionButton
                    label="View Orders"
                    onClick={() => handleAction('/orders')}
                    fullWidth
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </Grid>

        {/* Activity Timeline */}
        <Grid item xs={12} lg={4}>
          <Fade in timeout={1400}>
            <Box>
              <Typography
                variant="h6"
                className="text-text-hover"
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2' }}
              >
                Recent Activity
              </Typography>
              <Card
                sx={{
                  backgroundColor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Timeline sx={{ p: 0 }}>
                    {timeline.map((item, index) => (
                      <TimelineItem key={index}>
                        <TimelineSeparator>
                          <TimelineDot color={item.status === 'completed' ? 'success' : 'warning'} />
                          {index < timeline.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography
                            variant="body1"
                            className="text-text-primary"
                            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                          >
                            {item.event}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {item.date}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </CardContent>
              </Card>
            </Box>
          </Fade>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} lg={6}>
          <Fade in timeout={1600}>
            <Box>
              <Typography
                variant="h6"
                className="text-text-hover"
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2' }}
              >
                Notifications
                <Chip
                  label={notifications.filter((n) => n.unread).length}
                  color="primary"
                  size="small"
                  sx={{ ml: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                />
              </Typography>
              <Card
                sx={{
                  backgroundColor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <List dense>
                    {notifications.map((notif, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          button
                          onClick={() => handleNotificationClick(notif.message, notif.unread)}
                          sx={{ py: { xs: 0.5, sm: 1 } }}
                        >
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                className={notif.unread ? 'text-text-primary font-bold' : 'text-text-secondary'}
                                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                              >
                                {notif.message}
                              </Typography>
                            }
                          />
                          {notif.unread && <Badge color="primary" variant="dot" />}
                        </ListItem>
                        {index < notifications.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Fade>
        </Grid>

        {/* Order Trends Graph */}
        <Grid item xs={12}>
          <Fade in timeout={1800}>
            <Box>
              <Typography
                variant="h6"
                className="text-text-hover"
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2' }}
              >
                Order Trends (This Week)
              </Typography>
              <Card
                sx={{
                  backgroundColor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <ResponsiveContainer width="100%" height={{ xs: 150, sm: 200, md: 250 }}>
                    <BarChart data={chartData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: { xs: 10, sm: 12, md: 14 } }}
                      />
                      <YAxis tick={{ fontSize: { xs: 10, sm: 12, md: 14 } }} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainDashboard;
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
            { title: 'Pending Deliveries', value: '2', status: 'inProgress', icon: <LocalShipping />, bgColor: '#fff3e0' },
            { title: 'Feedback Submitted', value: '3', status: 'completed', icon: <Feedback />, bgColor: '#e8f5e9' },
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
        return <LoadingIndicator fullScreen message="Loading your dashboard..." />;
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background-light', minHeight: 'calc(100vh - 64px)', width: '100%' }}>
            <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                Welcome, {user?.firstName || 'Customer'}!
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
                Your Smart-Chain Dashboard
            </Typography>
            <Box sx={{ maxWidth: 400, mb: 4 }}>
                <SearchBar onSearch={handleSearch} placeholder="Search your orders..." />
            </Box>

            <Grid container spacing={3}>
                {/* Quick Stats */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom>
                        Quick Stats
                    </Typography>
                    <Grid container spacing={2}>
                        {stats.map((stat, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                                <Card sx={{ border: '1px solid', borderColor: 'neutral-light', backgroundColor: stat.bgColor }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {React.cloneElement(stat.icon, { sx: { fontSize: 30, color: 'text-primary' } })}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" className="text-text-secondary">
                                                {stat.title}
                                            </Typography>
                                            <Typography variant="h5" className="text-text-primary">
                                                {stat.value}
                                            </Typography>
                                            <StatusIndicator status={stat.status} /> {/* Removed backgroundColor="black" */}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom>
                        Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <ActionButton label="Track Order" onClick={() => handleAction('/tracking')} fullWidth sx={{ bgcolor: 'primary', '&:hover': { bgcolor: 'primary-dark' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <ActionButton label="Submit Feedback" onClick={() => handleAction('/feedback')} fullWidth sx={{ bgcolor: 'primary', '&:hover': { bgcolor: 'primary-dark' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <ActionButton label="View Orders" onClick={() => handleAction('/orders')} fullWidth sx={{ bgcolor: 'primary', '&:hover': { bgcolor: 'primary-dark' } }} />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Activity Timeline */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom>
                        Recent Activity
                    </Typography>
                    <Card sx={{ border: '1px solid', borderColor: 'neutral-light' }}>
                        <CardContent>
                            <Timeline>
                                {timeline.map((item, index) => (
                                    <TimelineItem key={index}>
                                        <TimelineSeparator>
                                            <TimelineDot color={item.status === 'completed' ? 'success' : 'warning'} />
                                            {index < timeline.length - 1 && <TimelineConnector />}
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Typography variant="body1" className="text-text-primary">
                                                {item.event}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {item.date}
                                            </Typography>
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Notifications */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom>
                        Notifications
                        <Chip label={notifications.filter((n) => n.unread).length} color="primary" size="small" sx={{ ml: 1 }} />
                    </Typography>
                    <Card sx={{ border: '1px solid', borderColor: 'neutral-light' }}>
                        <CardContent>
                            <List dense>
                                {notifications.map((notif, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem button onClick={() => handleNotificationClick(notif.message, notif.unread)}>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1" className={notif.unread ? 'text-text-primary font-bold' : 'text-text-secondary'}>
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
                </Grid>

                {/* Order Trends Graph */}
                <Grid item xs={12}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom>
                        Order Trends (This Week)
                    </Typography>
                    <Card sx={{ border: '1px solid', borderColor: 'neutral-light' }}>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="orders" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MainDashboard;
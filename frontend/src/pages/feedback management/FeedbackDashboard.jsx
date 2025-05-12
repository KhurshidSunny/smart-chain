import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Fade,
  Tooltip,
} from '@mui/material';
import { Star, Warning, TrendingUp, DeliveryDining, Verified } from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function FeedbackDashboard() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  // Ensure charts render after mount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Memoized mock data
  const feedbackSummary = useMemo(
    () => ({
      averageScore: 4.2,
      totalFeedback: 150,
      sentiment: { positive: 100, neutral: 30, negative: 20 },
    }),
    []
  );

  const unresolvedIssues = useMemo(
    () => [
      { id: 1, description: 'Delayed delivery complaint', priority: 'high', date: '2025-05-08' },
      { id: 2, description: 'Product quality issue', priority: 'medium', date: '2025-05-07' },
      { id: 3, description: 'Incorrect order', priority: 'low', date: '2025-05-06' },
    ],
    []
  );

  const trendData = useMemo(
    () => [
      { week: 'Week 1', score: 4.0 },
      { week: 'Week 2', score: 4.1 },
      { week: 'Week 3', score: 4.2 },
      { week: 'Week 4', score: 4.3 },
      { week: 'Week 5', score: 4.2 },
    ],
    []
  );

  const categoryData = useMemo(
    () => [
      { category: 'Delivery', score: 4.0 },
      { category: 'Product Quality', score: 4.5 },
    ],
    []
  );

  const handleIssueClick = (issue) => {
    toast.success(`Opening issue #${issue.id}: ${issue.description}`);
    navigate(`/feedback/issue/${issue.id}`);
  };

  const handleResolveIssue = (issue) => {
    toast.success(`Resolving issue #${issue.id}`);
  };

  const handleExportData = (type) => {
    toast.success(`Exporting ${type} data as CSV`);
    // Placeholder for CSV export logic
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
        aria-label="Feedback dashboard"
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            fontWeight: 'bold',
            color: '#1976d2',
            mb: 2,
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          Feedback Dashboard
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
            color: '#757575',
            mb: 4,
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          Analyze customer feedback and manage unresolved issues
        </Typography>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Feedback Summary */}
          <Grid item xs={12} sm={6} md={4}>
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
                    Feedback Summary
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Star sx={{ fontSize: { xs: 24, sm: 30 }, color: '#1976d2' }} />
                    <Typography
                      variant="h5"
                      sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, color: '#1976d2' }}
                    >
                      {feedbackSummary.averageScore}/5
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                  >
                    Total Feedback: {feedbackSummary.totalFeedback}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={`Positive: ${feedbackSummary.sentiment.positive}`}
                      color="success"
                      size="small"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                    <Chip
                      label={`Neutral: ${feedbackSummary.sentiment.neutral}`}
                      color="default"
                      size="small"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                    <Chip
                      label={`Negative: ${feedbackSummary.sentiment.negative}`}
                      color="error"
                      size="small"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Unresolved Issues */}
          <Grid item xs={12} sm={6} md={4}>
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
                    Unresolved Issues
                    <Chip
                      label={unresolvedIssues.length}
                      color="error"
                      size="small"
                      sx={{ ml: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    />
                  </Typography>
                  <List dense>
                    {unresolvedIssues.map((issue) => (
                      <ListItem
                        key={issue.id}
                        button
                        onClick={() => handleIssueClick(issue)}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: issue.priority === 'high' ? 'rgba(239,83,80,0.1)' : 'transparent',
                          '&:hover': { bgcolor: 'rgba(25,118,210,0.1)' },
                        }}
                      >
                        <ListItemIcon>
                          <Warning
                            sx={{
                              fontSize: { xs: 20, sm: 24 },
                              color:
                                issue.priority === 'high'
                                  ? '#ef5350'
                                  : issue.priority === 'medium'
                                  ? '#ff9800'
                                  : '#4caf50',
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                fontWeight: issue.priority === 'high' ? 'bold' : 'normal',
                                color: '#1976d2',
                              }}
                            >
                              {issue.description}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: '#757575' }}
                            >
                              {issue.date} • {issue.priority.toUpperCase()}
                            </Typography>
                          }
                        />
                        <Tooltip title="Resolve Issue">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveIssue(issue);
                            }}
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              '&:hover': { bgcolor: '#e3f2fd', borderColor: '#115293' },
                            }}
                            aria-label={`Resolve issue ${issue.description}`}
                          >
                            Resolve
                          </Button>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Satisfaction Trend */}
          <Grid item xs={12} md={4}>
            <Fade in timeout={1200}>
              <Card
                sx={{
                  bgcolor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  minHeight: { xs: 260, sm: 300, md: 340 },
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2' }}
                    >
                      Satisfaction Trend
                    </Typography>
                    <Tooltip title="Export trend data">
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleExportData('trend')}
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: '#1976d2' }}
                        aria-label="Export satisfaction trend data"
                      >
                        Export
                      </Button>
                    </Tooltip>
                  </Box>
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={250} key="trend-chart">
                      <LineChart
                        data={trendData}
                        margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                        aria-label="Satisfaction trend over weeks"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: { xs: 10, sm: 12 }, fill: '#757575' }}
                        />
                        <YAxis
                          domain={[0, 5]}
                          tick={{ fontSize: { xs: 10, sm: 12 }, fill: '#757575' }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0',
                            color: '#1976d2',
                          }}
                        />
                        <Legend verticalAlign="bottom" />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#1976d2"
                          strokeWidth={4}
                          dot={{ r: 6, fill: '#1976d2' }}
                          name="Satisfaction Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Performance by Category */}
          <Grid item xs={12}>
            <Fade in timeout={1400}>
              <Card
                sx={{
                  bgcolor: '#e3f2fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  minHeight: { xs: 260, sm: 300, md: 340 },
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1976d2' }}
                    >
                      Performance by Category
                    </Typography>
                    <Tooltip title="Export category data">
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleExportData('category')}
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: '#1976d2' }}
                        aria-label="Export performance by category data"
                      >
                        Export
                      </Button>
                    </Tooltip>
                  </Box>
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={250} key="category-chart">
                      <BarChart
                        data={categoryData}
                        margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                        aria-label="Performance by category"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: { xs: 10, sm: 12 }, fill: '#757575' }}
                        />
                        <YAxis
                          domain={[0, 5]}
                          tick={{ fontSize: { xs: 10, sm: 12 }, fill: '#757575' }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0',
                            color: '#1976d2',
                          }}
                        />
                        <Legend verticalAlign="bottom" />
                        <Bar
                          dataKey="score"
                          fill="#1976d2"
                          barSize={60}
                          name="Category Score"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}

export default FeedbackDashboard;
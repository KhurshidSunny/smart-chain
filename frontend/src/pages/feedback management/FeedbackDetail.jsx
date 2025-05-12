import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Fade,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Rating,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart,
  Comment,
  Send,
  TrackChanges,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function FeedbackDetail() {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Mock data
  const feedbackData = {
    order: {
      id: 'ORD12345',
      date: '2025-05-08',
      product: 'Wireless Headphones',
      price: 99.99,
    },
    feedback: {
      rating: 3,
      comment: 'The headphones work well, but delivery was delayed by two days.',
      date: '2025-05-09',
    },
    resolutionHistory: [
      { status: 'Open', date: '2025-05-09', note: 'Feedback received' },
      { status: 'In Progress', date: '2025-05-10', note: 'Investigating delivery issue' },
    ],
  };

  // Ensure component is mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleResponseSubmit = () => {
    if (response.length < 10) {
      toast.error('Response must be at least 10 characters long');
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Response submitted successfully');
      setResponse('');
      feedbackData.resolutionHistory.push({
        status,
        date: new Date().toISOString().split('T')[0],
        note: `Response sent: ${response}`,
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    setStatus(newStatus);
    toast.success(`Status updated to ${newStatus}`);
    feedbackData.resolutionHistory.push({
      status: newStatus,
      date: new Date().toISOString().split('T')[0],
      note: `Status changed to ${newStatus}`,
    });
  };

  const handleBack = () => {
    navigate('/feedback');
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
        aria-label="Feedback detail page"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Tooltip title="Back to Feedback Dashboard">
            <Button
              variant="text"
              onClick={handleBack}
              sx={{ color: '#1976d2', mr: 2 }}
              aria-label="Back to feedback dashboard"
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
            Feedback Details (Feedback #{feedbackId})
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Order Context */}
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
                    Order Context
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ShoppingCart sx={{ fontSize: { xs: 24, sm: 28 }, color: '#1976d2' }} />
                    <Typography
                      variant="body1"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                    >
                      Order ID: {feedbackData.order.id}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575', mb: 1 }}
                  >
                    Date: {feedbackData.order.date}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575', mb: 1 }}
                  >
                    Product: {feedbackData.order.product}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                  >
                    Price: ${feedbackData.order.price.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Customer Feedback */}
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
                    Customer Feedback
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Comment sx={{ fontSize: { xs: 24, sm: 28 }, color: '#1976d2' }} />
                    <Rating
                      value={feedbackData.feedback.rating}
                      readOnly
                      precision={0.5}
                      sx={{ color: '#1976d2' }}
                      aria-label={`Rating ${feedbackData.feedback.rating} out of 5`}
                    />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575', mb: 1 }}
                  >
                    Comment: {feedbackData.feedback.comment}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575' }}
                  >
                    Submitted: {feedbackData.feedback.date}
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Response Composition */}
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
                    Compose Response
                  </Typography>
                  <TextField
                    label="Your Response"
                    multiline
                    rows={4}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    inputProps={{ minLength: 10 }}
                    aria-label="Compose response to customer feedback"
                  />
                  <Button
                    variant="contained"
                    onClick={handleResponseSubmit}
                    disabled={isSubmitting}
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    aria-label="Submit response"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Response'}
                  </Button>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Resolution Tracking */}
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
                    Resolution Tracking
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <TrackChanges sx={{ fontSize: { xs: 24, sm: 28 }, color: '#1976d2' }} />
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select
                        labelId="status-label"
                        value={status}
                        onChange={handleStatusChange}
                        label="Status"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        aria-label="Update resolution status"
                      >
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: '#757575', mb: 1 }}
                  >
                    Resolution History:
                  </Typography>
                  {feedbackData.resolutionHistory.map((entry, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: '#1976d2' }}
                      >
                        {entry.date}: {entry.status}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: '#757575' }}
                      >
                        {entry.note}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}

export default FeedbackDetail;
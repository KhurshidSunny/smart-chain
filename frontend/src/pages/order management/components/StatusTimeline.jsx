import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineDot, TimelineContent } from '@mui/lab';
import { useQuery } from '@tanstack/react-query';
import { getOrderHistory } from '../../../services/orderService';
import { toast } from 'react-toastify';
function StatusTimeline({ orderId }) {
  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ['orderHistory', orderId],
    queryFn: () => getOrderHistory(orderId),
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch order history');
    },
  });

  if (isLoading) {
    return <Typography>Loading timeline...</Typography>;
  }

  return (
    <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}>
          Status Timeline
        </Typography>
        <Timeline position="alternate">
          {timeline.map((event) => (
            <TimelineItem key={event.id}>
              <TimelineSeparator>
                <TimelineDot sx={{ bgcolor: '#1976d2' }} />
                <TimelineConnector sx={{ bgcolor: '#1976d2' }} />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" sx={{ color: '#1976d2' }}>
                  {event.event}
                </Typography>
                <Typography color="textSecondary">{event.date}</Typography>
                <Typography>{event.details}</Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}

export default StatusTimeline;
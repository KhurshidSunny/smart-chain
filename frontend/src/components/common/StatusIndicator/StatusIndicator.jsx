import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

const statusStyles = {
    completed: { backgroundColor: '#4caf50', color: '#ffffff' }, // Green
    inProgress: { backgroundColor: '#ffca28', color: '#000000' }, // Yellow
    pending: { backgroundColor: '#42a5f5', color: '#ffffff' }, // Blue
    error: { backgroundColor: '#f44336', color: '#ffffff' }, // Red
    cancelled: { backgroundColor: '#757575', color: '#ffffff' }, // Gray
    default: { backgroundColor: '#e0e0e0', color: '#000000' }, // Light gray
};

const StyledChip = styled(Chip)(({ status, backgroundColor }) => {
    const baseStyle = statusStyles[status] || statusStyles.default;
    return {
        fontWeight: 'bold',
        textTransform: 'capitalize',
        backgroundColor: backgroundColor || baseStyle.backgroundColor, // Use custom bg if provided, else status bg
        color: backgroundColor ? '#ffffff' : baseStyle.color, // White text with custom bg, else status color
        padding: '2px 5px', // Consistent padding
    };
});

const StatusIndicator = ({ status, label, tooltip, backgroundColor }) => {
    const normalizedStatus = status?.toLowerCase().replace(/\s/g, '') || 'default';
    const displayLabel = label || status || 'Unknown';

    return (
        <Tooltip title={tooltip || displayLabel}>
            <StyledChip
                label={displayLabel}
                status={normalizedStatus}
                backgroundColor={backgroundColor} // Pass prop to StyledChip
                size="small"
                aria-label={`Status: ${displayLabel}`}
            />
        </Tooltip>
    );
};

export default StatusIndicator;
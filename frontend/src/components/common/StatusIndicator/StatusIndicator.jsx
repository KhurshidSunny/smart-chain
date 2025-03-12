import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

// Define status styles
const statusStyles = {
    completed: { backgroundColor: 'success.main', color: 'white' },
    inProgress: { backgroundColor: 'warning.main', color: 'black' },
    pending: { backgroundColor: 'info.main', color: 'white' },
    error: { backgroundColor: 'error.main', color: 'white' },
    cancelled: { backgroundColor: 'grey.500', color: 'white' },
    default: { backgroundColor: 'grey.300', color: 'black' },
};

// Styled Chip component for consistent look
const StyledChip = styled(Chip)(({ status }) => ({
    ...statusStyles[status] || statusStyles.default,
    fontWeight: 'bold',
    textTransform: 'capitalize',
}));

const StatusIndicator = ({ status, label, tooltip }) => {
    // Normalize status to lowercase and remove spaces for consistency
    const normalizedStatus = status?.toLowerCase().replace(/\s/g, '') || 'default';
    const displayLabel = label || status || 'Unknown';

    return (
        <Tooltip title={tooltip || displayLabel}>
            <StyledChip
                label={displayLabel}
                status={normalizedStatus}
                size="small"
                aria-label={`Status: ${displayLabel}`}
            />
        </Tooltip>
    );
};

export default StatusIndicator;
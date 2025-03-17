import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

const statusStyles = {
    completed: { backgroundColor: 'success', color: 'white' },
    inProgress: { backgroundColor: 'warning', color: 'black' },
    pending: { backgroundColor: 'info', color: 'white' },
    error: { backgroundColor: 'error', color: 'white' },
    cancelled: { backgroundColor: 'neutral', color: 'white' },
    default: { backgroundColor: 'neutral-light', color: 'black' },
};

const StyledChip = styled(Chip)(({ status }) => ({
    ...statusStyles[status] || statusStyles.default,
    fontWeight: 'bold',
    textTransform: 'capitalize',
}));

const StatusIndicator = ({ status, label, tooltip }) => {
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
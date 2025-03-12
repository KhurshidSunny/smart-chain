import React from 'react';
import {
    Alert,
    AlertTitle,
    Button,
    Box,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

const ErrorMessage = ({
    severity = 'error',
    title = 'An Error Occurred',
    message,
    errorCode,
    onRetry,
    retryText = 'Retry',
    actionText,
    onAction,
}) => {
    return (
        <Alert
            severity={severity}
            sx={{ mb: 2 }}
            action={
                onRetry || onAction ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {onRetry && (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={onRetry}
                                aria-label="retry action"
                            >
                                {retryText}
                            </Button>
                        )}
                        {onAction && (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={onAction}
                                aria-label="custom action"
                            >
                                {actionText}
                            </Button>
                        )}
                    </Box>
                ) : null
            }
        >
            <AlertTitle>{title}</AlertTitle>
            {message}
            {errorCode && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Error Code: {errorCode}
                </Typography>
            )}
        </Alert>
    );
};

ErrorMessage.propTypes = {
    severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
    title: PropTypes.string,
    message: PropTypes.string.isRequired,
    errorCode: PropTypes.string,
    onRetry: PropTypes.func,
    retryText: PropTypes.string,
    actionText: PropTypes.string,
    onAction: PropTypes.func,
};

export default ErrorMessage;
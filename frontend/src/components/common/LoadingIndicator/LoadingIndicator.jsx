import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const LoadingIndicator = ({
    size = 40,
    message = 'Loading...',
    fullScreen = false,
    color = 'primary',
    thickness = 4,
}) => {
    const content = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
            }}
        >
            <CircularProgress
                size={size}
                color={color}
                thickness={thickness}
                aria-label="loading indicator"
            />
            {message && (
                <Typography variant="body1" color="textSecondary">
                    {message}
                </Typography>
            )}
        </Box>
    );

    if (fullScreen) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Slight overlay
                    zIndex: 1300, // Above most content
                }}
            >
                {content}
            </Box>
        );
    }

    return content;
};

LoadingIndicator.propTypes = {
    size: PropTypes.number,
    message: PropTypes.string,
    fullScreen: PropTypes.bool,
    color: PropTypes.oneOf(['primary', 'secondary', 'inherit']),
    thickness: PropTypes.number,
};

export default LoadingIndicator;
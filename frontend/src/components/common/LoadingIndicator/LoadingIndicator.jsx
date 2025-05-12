import React, { useEffect } from 'react';
import { CircularProgress, Box, Typography, Fade } from '@mui/material';
import PropTypes from 'prop-types';
import { keyframes } from '@emotion/react';

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const LoadingIndicator = ({
  size = 50,
  message = 'Loading...',
  fullScreen = false,
  color = 'primary',
  thickness = 4,
  overlayOpacity = 0.5,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  animationDuration = 1.5,
  variant = 'pulse',
  sx = {},
}) => {
  useEffect(() => {
    if (fullScreen) {
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [fullScreen]);

  const spinnerSize = {
    xs: size * 0.8, // Smaller on mobile
    sm: size,
    md: size * 1.2, // Larger on desktop
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 1, sm: 2 },
        width: '100%',
        ...sx,
      }}
      role="status"
      aria-live="polite"
    >
      <CircularProgress
        size={spinnerSize}
        color={color}
        thickness={thickness}
        sx={{
          animation: variant === 'pulse' ? `${pulseAnimation} ${animationDuration}s ease-in-out infinite` : undefined,
          '@media (max-width: 600px)': { size: spinnerSize.xs },
          '@media (min-width: 960px)': { size: spinnerSize.md },
        }}
        aria-label="loading indicator"
      />
      {message && (
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
            color: fullScreen ? '#fff' : 'textSecondary', // White text on overlay for contrast
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Fade in timeout={300}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: overlayColor || `rgba(0, 0, 0, ${overlayOpacity})`,
            backdropFilter: 'blur(5px)', // Frosted glass effect
            WebkitBackdropFilter: 'blur(5px)', // Safari support
            zIndex: 1300,
          }}
          role="dialog"
          aria-label="Full-screen loading indicator"
        >
          {content}
        </Box>
      </Fade>
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
  overlayOpacity: PropTypes.number,
  overlayColor: PropTypes.string,
  animationDuration: PropTypes.number,
  variant: PropTypes.oneOf(['pulse', 'spin']),
  sx: PropTypes.object,
};

export default LoadingIndicator;
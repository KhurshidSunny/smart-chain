import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';

const ActionButton = ({
    label,
    onClick,
    icon,
    variant = 'contained',
    color = 'primary',
    disabled = false,
    loading = false,
    size = 'medium',
    fullWidth = false,
    sx = {},
}) => {
    return (
        <Button
            variant={variant}
            color={color}
            onClick={onClick}
            disabled={disabled || loading}
            startIcon={loading ? <CircularProgress size={20} /> : icon}
            size={size}
            fullWidth={fullWidth}
            sx={{
                textTransform: 'none',
                fontWeight: 'medium',
                '&:hover': {
                    opacity: 0.9,
                    boxShadow: 2,
                },
                ...sx,
            }}
        >
            {label}
        </Button>
    );
};

ActionButton.propTypes = {
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.element,
    variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
    color: PropTypes.oneOf(['primary', 'secondary', 'error', 'info', 'success', 'warning', 'inherit']),
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    fullWidth: PropTypes.bool,
    sx: PropTypes.object,
};

export default ActionButton;
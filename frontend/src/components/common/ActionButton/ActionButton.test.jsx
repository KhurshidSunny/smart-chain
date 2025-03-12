import React from 'react';
import { Button, IconButton, Tooltip, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Define variants for different action types
const variantStyles = {
    primary: {
        backgroundColor: 'primary.main',
        color: 'white',
        '&:hover': { backgroundColor: 'primary.dark' },
    },
    secondary: {
        backgroundColor: 'secondary.main',
        color: 'white',
        '&:hover': { backgroundColor: 'secondary.dark' },
    },
    cancel: {
        backgroundColor: 'grey.500',
        color: 'white',
        '&:hover': { backgroundColor: 'grey.700' },
    },
    disabled: {
        backgroundColor: 'grey.300',
        color: 'grey.700',
    },
};

// Styled button with dynamic variant
const StyledButton = styled(Button)(({ variant }) => ({
    borderRadius: 8,
    padding: '8px 16px',
    fontWeight: 'bold',
    textTransform: 'none',
    ...(variantStyles[variant] || variantStyles.primary),
}));

const StyledIconButton = styled(IconButton)(({ variant }) => ({
    ...(variantStyles[variant] || variantStyles.primary),
}));

const ActionButton = ({
    label,
    icon,
    onClick,
    variant = 'primary',
    disabled = false,
    tooltip = '',
    isIconOnly = false,
}) => {
    const buttonProps = {
        onClick: disabled ? undefined : onClick,
        disabled,
        variant: disabled ? 'disabled' : variant,
        'aria-label': label || tooltip || 'action button',
    };

    const buttonContent = (
        <>
            {icon && !isIconOnly && <Box sx={{ mr: 1 }}>{icon}</Box>}
            {(!isIconOnly || !icon) && label}
        </>
    );

    const buttonComponent = isIconOnly ? (
        <StyledIconButton {...buttonProps}>
            {icon}
        </StyledIconButton>
    ) : (
        <StyledButton {...buttonProps} startIcon={icon && !isIconOnly ? icon : null}>
            {buttonContent}
        </StyledButton>
    );

    return tooltip ? (
        <Tooltip title={tooltip}>
            <span>{buttonComponent}</span> {/* Span needed for Tooltip with disabled button */}
        </Tooltip>
    ) : (
        buttonComponent
    );
};

export default ActionButton;
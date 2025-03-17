import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, TextField, Link as MuiLink, Grid } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ActionButton from '../../../components/common/ActionButton/ActionButton';
import ErrorMessage from '../../../components/common/ErrorMessage/ErrorMessage';
import { registerUser } from '../../../services/authService';

const RegistrationPage = () => {
    const [formData, setFormData] = useState({
        firstName: 'admin',
        lastName: 'someone',
        email: 'admin@test.com',
        password: '12345678',
        confirmPassword: '12345678',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            queryClient.setQueryData(['authUser'], data.user);
            navigate('/dashboard');
        },
        onError: (error) => {
            setFormErrors({ server: error.response?.data?.message || 'Registration failed' });
            console.log('er')
        },
    });

    const validateForm = () => {
        const errors = {};
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
        if (!formData.password.trim()) errors.password = 'Password is required';
        else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        registerMutation.mutate({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
        });
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <Box
            className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background-default px-4"
            sx={{ width: '100vw', overflowX: 'hidden' }}
        >
            <Box
                className="w-full max-w-md bg-background-white p-6 rounded-lg shadow-md"
                sx={{ border: '1px solid', borderColor: 'neutral-light' }}
            >
                <Typography
                    variant="h5"
                    align="center"
                    gutterBottom
                    className="text-text-primary font-semibold"
                >
                    Register for Smart-Chain
                </Typography>

                {registerMutation.isError && (
                    <ErrorMessage
                        message={formErrors.server}
                        onRetry={handleSubmit}
                        retryText="Try Again"
                        sx={{ mb: 3 }}
                    />
                )}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="First Name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    error={!!formErrors.firstName}
                                    helperText={formErrors.firstName}
                                    disabled={registerMutation.isLoading}
                                    InputProps={{ className: 'bg-background-light' }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Last Name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    error={!!formErrors.lastName}
                                    helperText={formErrors.lastName}
                                    disabled={registerMutation.isLoading}
                                    InputProps={{ className: 'bg-background-light' }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            fullWidth
                            variant="outlined"
                            error={!!formErrors.email}
                            helperText={formErrors.email}
                            disabled={registerMutation.isLoading}
                            InputProps={{ className: 'bg-background-light' }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, mb: 2 }}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            fullWidth
                            variant="outlined"
                            error={!!formErrors.password}
                            helperText={formErrors.password}
                            disabled={registerMutation.isLoading}
                            InputProps={{
                                className: 'bg-background-light',
                                endAdornment: (
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1 text-text-muted hover:text-text-hover disabled:text-text-disabled"
                                        disabled={registerMutation.isLoading}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </button>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, mb: 2 }}
                        />

                        <TextField
                            label="Confirm Password"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            fullWidth
                            variant="outlined"
                            error={!!formErrors.confirmPassword}
                            helperText={formErrors.confirmPassword}
                            disabled={registerMutation.isLoading}
                            InputProps={{
                                className: 'bg-background-light',
                                endAdornment: (
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="p-1 text-text-muted hover:text-text-hover disabled:text-text-disabled"
                                        disabled={registerMutation.isLoading}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </button>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </Box>

                    <ActionButton
                        label="Register"
                        onClick={handleSubmit}
                        fullWidth
                        loading={registerMutation.isLoading}
                        disabled={registerMutation.isLoading}
                        sx={{
                            mt: 2,
                            py: 1.5,
                            bgcolor: 'primary',
                            '&:hover': { bgcolor: 'primary-dark' },
                        }}
                    />

                    <Typography
                        variant="body2"
                        align="center"
                        className="text-text-secondary"
                        sx={{ mt: 2 }}
                    >
                        Already have an account?{' '}
                        <MuiLink
                            component="button"
                            type="button"
                            onClick={handleLoginClick}
                            underline="hover"
                            disabled={registerMutation.isLoading}
                            className="text-primary hover:text-primary-dark font-medium"
                        >
                            Login
                        </MuiLink>
                    </Typography>
                </form>
            </Box>
        </Box>
    );
};

export default RegistrationPage;
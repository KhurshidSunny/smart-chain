import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, TextField, Link as MuiLink } from '@mui/material';
import { DoNotDisturbOnTotalSilenceTwoTone, Visibility, VisibilityOff } from '@mui/icons-material';
import ActionButton from '../../../components/common/ActionButton/ActionButton';
import ErrorMessage from '../../../components/common/ErrorMessage/ErrorMessage';
import { loginUser } from '../../../services/authService';
import LoadingIndicator from '../../../components/common/LoadingIndicator/LoadingIndicator';

const LoginPage = () => {
    const [email, setEmail] = useState('admin@test.com');
    const [password, setPassword] = useState('12345678');
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {mutate: loginMutation, isPending} = useMutation({
        mutationFn: (data) =>  loginUser(data),
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            queryClient.setQueryData(['authUser'], data.user);
            
            navigate('/dashboard');
        },
        onError: (error) => {
            setFormErrors({ server: error.response?.data?.message || 'Login failed' });
        },
    });

    const validateForm = () => {
        const errors = {};
        if (!email.trim()) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
        if (!password.trim()) errors.password = 'Password is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        loginMutation({ email, password });
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    if(isPending) return <LoadingIndicator />

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
                    Login to Smart-Chain
                </Typography>

                {loginMutation.isError && (
                    <ErrorMessage
                        message={formErrors.server}
                        onRetry={handleSubmit}
                        retryText="Try Again"
                        sx={{ mb: 3 }}
                    />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <TextField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        variant="outlined"
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        disabled={loginMutation.isLoading}
                        InputProps={{
                            className: 'bg-background-light',
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />

                    <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        variant="outlined"
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        disabled={loginMutation.isLoading}
                        InputProps={{
                            className: 'bg-background-light',
                            endAdornment: (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1 text-text-muted hover:text-text-hover disabled:text-text-disabled"
                                    disabled={loginMutation.isLoading}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </button>
                            ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />

                    <ActionButton
                        label="Login"
                        onClick={handleSubmit}
                        fullWidth
                        loading={loginMutation.isLoading}
                        disabled={loginMutation.isLoading}
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
                        Don’t have an account?{' '}
                        <MuiLink
                            component="button"
                            type="button"
                            onClick={handleRegisterClick}
                            underline="hover"
                            disabled={loginMutation.isLoading}
                            className="text-primary hover:text-primary-dark font-medium"
                        >
                            Register
                        </MuiLink>
                    </Typography>
                </form>
            </Box>
        </Box>
    );
};

export default LoginPage;
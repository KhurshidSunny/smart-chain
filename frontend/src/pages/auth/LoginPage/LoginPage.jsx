import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { Box, Typography, TextField, Link as MuiLink } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../../redux/slices/authSlice';
import ActionButton from '../../../components/common/ActionButton/ActionButton';
import ErrorMessage from '../../../components/common/ErrorMessage/ErrorMessage';
import { loginUser } from '../../../services/authService';

/**
 * LoginPage Component
 * Description: Handles user login by collecting credentials, validating them, 
 * and integrating with Redux for state management and the IAM service for authentication.
 */
const LoginPage = () => {
    const [email, setEmail] = useState('admin@test.com');
    const [password, setPassword] = useState('12345678');
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector((state) => state.auth);

    const validateForm = () => {
        const errors = {};
        if (!email.trim()) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
        if (!password.trim()) errors.password = 'Password is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        dispatch(loginStart());
        try {
            const response = await loginUser({ email, password });
            dispatch(loginSuccess({ user: response.user, token: response.token }));
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            navigate('/dashboard');
        } catch (err) {
            dispatch(loginFailure(err.response?.data?.message || 'Login failed'));
        }
    };

    const handleRegisterClick = (e) => {
        dispatch(clearError());
        navigate('/register');
    };

    return (
        <Box
            className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100 px-4"
            sx={{ width: '100vw', overflowX: 'hidden' }}
        >
            <Box
                className="w-full max-w-md bg-white p-6 rounded-lg shadow-md"
                sx={{ border: '1px solid', borderColor: 'grey.300' }}
            >
                <Typography
                    variant="h5"
                    align="center"
                    gutterBottom
                    className="text-gray-800 font-semibold"
                >
                    Login to Smart-Chain
                </Typography>

                {error && (
                    <ErrorMessage
                        message={error}
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
                        disabled={loading}
                        InputProps={{
                            className: 'bg-gray-50',
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
                        disabled={loading}
                        InputProps={{
                            className: 'bg-gray-50',
                            endAdornment: (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                                    disabled={loading}
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
                        loading={loading}
                        disabled={loading}
                        sx={{
                            mt: 2,
                            py: 1.5,
                            bgcolor: 'blue.600',
                            '&:hover': { bgcolor: 'blue.700' },
                        }}
                    />

                    <Typography
                        variant="body2"
                        align="center"
                        className="text-gray-600"
                        sx={{ mt: 2 }}
                    >
                        Don’t have an account?{' '}
                        <MuiLink
                            component="button"
                            type="button"
                            onClick={handleRegisterClick}
                            underline="hover"
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 font-medium"
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
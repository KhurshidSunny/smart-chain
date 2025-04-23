import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { Box, Typography, TextField, Link as MuiLink, Grid } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../../redux/slices/authSlice';
import ActionButton from '../../../components/common/ActionButton/ActionButton';
import ErrorMessage from '../../../components/common/ErrorMessage/ErrorMessage';
import { registerUser } from '../../../services/authService';

/**
 * RegistrationPage Component
 * Description: Handles user registration by collecting required fields per the User model,
 * validating them, and integrating with Redux and the IAM service for authentication.
 */
const RegistrationPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector((state) => state.auth);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        dispatch(loginStart());
        try {
            const response = await registerUser({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
            });
            dispatch(loginSuccess({ user: response.user, token: response.token }));
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            navigate('/dashboard');
        } catch (err) {
            console.log(err)
            dispatch(loginFailure(err.response?.data?.message || 'Registration failed'));
        }
    };

    const handleLoginClick = () => {
        dispatch(clearError())
        navigate('/login');
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
                    Register for Smart-Chain
                </Typography>

                {error && (
                    <ErrorMessage
                        message={error}
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
                                    disabled={loading}
                                    InputProps={{ className: 'bg-gray-50' }}
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
                                    disabled={loading}
                                    InputProps={{ className: 'bg-gray-50' }}
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
                            disabled={loading}
                            InputProps={{ className: 'bg-gray-50' }}
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
                            disabled={loading}
                            InputProps={{
                                className: 'bg-gray-50',
                                endAdornment: (
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                                        disabled={loading}
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
                        Already have an account?{' '}
                        <MuiLink
                            component="button"
                            type="button"
                            onClick={handleLoginClick}
                            underline="hover"
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 font-medium"
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
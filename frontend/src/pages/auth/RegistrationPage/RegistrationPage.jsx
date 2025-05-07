import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { Box, Typography, TextField, Link as MuiLink, Grid } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ActionButton from '../../../components/common/ActionButton/ActionButton';
import { registerUser } from '../../../services/authService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingIndicator from '../../../components/common/LoadingIndicator/LoadingIndicator';

const RegistrationPage = () => {
<<<<<<< HEAD
=======
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
>>>>>>> bc5b8243e6c6cfdbd6a66b21b95223435bc7bf08
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    const queryClient = useQueryClient();
    const navigate = useNavigate()

    const {mutate: registerMutation, isPending} = useMutation({
        mutationFn: (data) =>  registerUser(data),
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            queryClient.setQueryData(['authUser'], data.user);
            toast.success(`You are logged in`);
            navigate('/dashboard');
<<<<<<< HEAD
        },
        onError: (error) => {
            toast.error(`Registration failed: Please try again`)
            console.log(`Registration failed: ${error.message}`)
            
=======
        } catch (err) {
            console.log(err)
            dispatch(loginFailure(err.response?.data?.message || 'Registration failed'));
>>>>>>> bc5b8243e6c6cfdbd6a66b21b95223435bc7bf08
        }
    })
   
    console.log(isPending)

    async function onSubmit(data) {
        console.log(data)
         registerMutation(data)
    }

    if(isPending) return <LoadingIndicator />

    return (
        <Box className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background-default px-4" sx={{ width: '100vw', overflowX: 'hidden' }}>
            <Box className="w-full max-w-md bg-background-white p-6 rounded-lg shadow-md" sx={{ border: '1px solid', borderColor: 'neutral-light' }}>
                <Typography variant="h5" align="center" gutterBottom className="text-text-primary font-semibold">
                    Register for Smart-Chain
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box sx={{ mb: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="First Name"
                                    {...register('firstName', { required: 'First name is required' })}
                                    fullWidth
                                    variant="outlined"
                                    error={!!errors.firstName}
                                    helperText={errors.firstName?.message}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Last Name"
                                    {...register('lastName', { required: 'Last name is required' })}
                                    fullWidth
                                    variant="outlined"
                                    error={!!errors.lastName}
                                    helperText={errors.lastName?.message}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Email"
                            {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                            fullWidth
                            variant="outlined"
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                            fullWidth
                            variant="outlined"
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            InputProps={{
                                endAdornment: (
                                    <button className='text-primary bg-transparent hover:border-none' type="button" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </button>
                                ),
                            }}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...register('confirmPassword', 
                                { required: 'Confirm password is required',
                                    validate: (value) => value === watch('password') || 'Password do not match'
                                 })}
                            fullWidth
                            variant="outlined"
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
                            InputProps={{
                                endAdornment: (
                                    <button className='text-primary bg-transparent outline-none hover:border-none' type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </button>
                                ),
                            }}
                        />
                    </Box>

                  
                            <button className='mt-2 py-2 bg-primary hover:bg-primary-dark w-full outline-none '>register</button>

                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        Already have an account?{' '}
                        <MuiLink component="button" type="button" underline="hover" className="text-primary hover:text-primary-dark font-medium">
                            Login
                        </MuiLink>
                    </Typography>
                </form>
            </Box>
        </Box>
    );
};

export default RegistrationPage;

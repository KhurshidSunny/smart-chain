import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from "./../services/authService"
import LoadingIndicator from "./../components/common/LoadingIndicator/LoadingIndicator"

const ProtectedRoute = ({ children, requiredRole }) => {
    const { data: user, isLoading, error } = useQuery({
        queryKey: ['authUser'],
        queryFn: getCurrentUser,
        retry: false,
        onError: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        },
    });

    if (isLoading) {
        return <LoadingIndicator fullScreen message="Checking authentication..." />;
    }

    const token = localStorage.getItem('token');

    if (!token || error || !user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
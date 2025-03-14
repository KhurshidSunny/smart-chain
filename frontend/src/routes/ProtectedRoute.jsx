import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { token, user } = useAppSelector((state) => state.auth);

  if (!token) return <Navigate to="/login" replace />; // Redirect if not authenticated
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/dashboard" replace />; // Role check

  return children;
};

export default ProtectedRoute;
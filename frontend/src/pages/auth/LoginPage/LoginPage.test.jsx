/* eslint-disable no-undef */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import * as authService from '../../../services/authService';

// Extend Jest with testing-library matchers
import '@testing-library/jest-dom';

// Mock authService
jest.mock('../../../services/authService', () => ({
    loginUser: jest.fn(),
}));

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

// Create a QueryClient instance for testing
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Disable retries for faster test failures
            retry: false,
        },
    },
});

// Utility function to render the component with providers
const renderComponent = () =>
    render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        </QueryClientProvider>
    );

describe('LoginPage', () => {
    beforeEach(() => {
        // Clear mocks before each test
        jest.clearAllMocks();
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => null),
                setItem: jest.fn(),
                removeItem: jest.fn(),
            },
            writable: true,
        });
        // Mock useNavigate
        const { useNavigate } = require('react-router-dom');
        useNavigate.mockReturnValue(jest.fn());
    });

    it('renders login form with default values', () => {
        renderComponent();
        expect(screen.getByText('Login to Smart-Chain')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toHaveValue('admin@test.com');
        expect(screen.getByLabelText('Password')).toHaveValue('12345678');
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('shows validation errors on empty submit', () => {
        renderComponent();
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /login/i }));
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('shows validation error for invalid email', () => {
        renderComponent();
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
        fireEvent.click(screen.getByRole('button', { name: /login/i }));
        expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });

    it('calls loginUser on valid submit', async () => {
        authService.loginUser.mockResolvedValue({
            user: { id: '1', email: 'admin@test.com', role: 'admin' },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
        });

        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(authService.loginUser).toHaveBeenCalledWith({
                email: 'admin@test.com',
                password: '12345678',
            });
        });
    });

    it('handles successful login and navigation', async () => {
        const { useNavigate } = require('react-router-dom');
        const mockNavigate = jest.fn();
        useNavigate.mockReturnValue(mockNavigate);
        authService.loginUser.mockResolvedValue({
            user: { id: '1', email: 'admin@test.com', role: 'admin' },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
        });

        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
            expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
            expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: '1', email: 'admin@test.com', role: 'admin' }));
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('handles login failure and displays error', async () => {
        authService.loginUser.mockRejectedValue({
            response: { data: { message: 'Invalid credentials' } },
        });

        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });
});
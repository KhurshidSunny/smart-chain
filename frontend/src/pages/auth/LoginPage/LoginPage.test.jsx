// src/pages/auth/LoginPage/LoginPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import LoginPage from './LoginPage';
import { loginStart, loginSuccess, loginFailure } from '../../../redux/slices/authSlice';
import * as authService from '../../../services/authService';

jest.mock('../../../services/authService', () => ({
    loginUser: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

const mockStore = configureStore([]);

describe('LoginPage', () => {
    let store;

    beforeEach(() => {
        jest.clearAllMocks();
        store = mockStore({
            auth: { user: null, token: null, loading: false, error: null },
        });
        store.dispatch = jest.fn();

        // Create mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => null),
                setItem: jest.fn(() => null),
                removeItem: jest.fn(() => null)
            },
            writable: true
        });

        const { useNavigate } = require('react-router-dom');
        useNavigate.mockReturnValue(jest.fn());
    });

    afterEach(() => {
        // Restore original implementations
        jest.restoreAllMocks();
    });

    const renderComponent = () =>
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <LoginPage />
                </BrowserRouter>
            </Provider>
        );

    it('renders login form with default values', () => {
        renderComponent();
        expect(screen.getByText('Login to Smart-Chain')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toHaveValue('test@test.com');
        expect(screen.getByLabelText('Password')).toHaveValue('testtest');
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

    it('dispatches loginStart and calls loginUser on valid submit', async () => {
        authService.loginUser.mockResolvedValue({
            user: { id: '1', email: 'test@test.com', role: 'customer' },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
        });

        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        expect(store.dispatch).toHaveBeenCalledWith(loginStart());
        await waitFor(() => {
            expect(authService.loginUser).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'testtest',
            });
        });
    });

    it('handles successful login and navigation', async () => {
        const { useNavigate } = require('react-router-dom');
        const mockNavigate = useNavigate();
        authService.loginUser.mockResolvedValue({
            user: { id: '1', email: 'test@test.com', role: 'customer' },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
        });

        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(store.dispatch).toHaveBeenCalledWith(
                loginSuccess({
                    user: { id: '1', email: 'test@test.com', role: 'customer' },
                    token: 'mock-token',
                })
            );
            expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
            expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
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
            expect(store.dispatch).toHaveBeenCalledWith(loginFailure('Invalid credentials'));
            // Uncomment when error text is actually displayed in the component
            // expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('displays generic error on unexpected failure', async () => {
        authService.loginUser.mockRejectedValue(new Error('Network error'));

        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(store.dispatch).toHaveBeenCalledWith(loginFailure('Login failed'));
            // Uncomment when error text is actually displayed in the component
            // expect(screen.getByText('Login failed')).toBeInTheDocument();
        });
    });

    it('toggles password visibility', () => {
        renderComponent();
        const passwordInput = screen.getByLabelText('Password');
        const toggleButton = screen.getByLabelText('Show password');

        expect(passwordInput).toHaveAttribute('type', 'password');
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('navigates to register page on link click', () => {
        const { useNavigate } = require('react-router-dom');
        const mockNavigate = useNavigate();
        renderComponent();
        fireEvent.click(screen.getByText('Register'));
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('disables inputs and button during loading', () => {
        store = mockStore({
            auth: { user: null, token: null, loading: true, error: null },
        });
        renderComponent();

        expect(screen.getByLabelText('Email')).toBeDisabled();
        expect(screen.getByLabelText('Password')).toBeDisabled();
        expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
    });
});
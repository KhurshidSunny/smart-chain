// src/pages/auth/LoginPage/LoginPage.test.jsx

// Importing React and testing utilities
import React from 'react';
// RTL provides tools to render and interact with React components in tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Provider connects your React components to the Redux store
import { Provider } from 'react-redux';
// BrowserRouter provides routing context needed by components using React Router
import { BrowserRouter } from 'react-router-dom';
// redux-mock-store creates a mock Redux store for testing
import configureStore from 'redux-mock-store';
// The component we're testing
import LoginPage from './LoginPage';
// Redux actions we'll be testing for
import { loginStart, loginSuccess, loginFailure } from '../../../redux/slices/authSlice';
// The service containing API calls that our component will use
import * as authService from '../../../services/authService';

// Mock the authService module to avoid actual API calls during tests
// This replaces real API calls with Jest mock functions we can control
jest.mock('../../../services/authService', () => ({
    loginUser: jest.fn(), // This creates a function we can track and control in tests
}));

// Mock react-router-dom's useNavigate hook to test navigation
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'), // Keep all other exports from the real module
    useNavigate: jest.fn(), // But replace useNavigate with a mock function
}));

// Create a factory function that makes mock Redux stores
const mockStore = configureStore([]);

// describe blocks group related tests together
describe('LoginPage', () => {
    let store; // Will hold our mock Redux store for each test

    // beforeEach runs before each test case to set up a fresh environment
    beforeEach(() => {
        // Clear any previous mock function calls and return values
        jest.clearAllMocks();

        // Create a fresh mock Redux store with initial state similar to our real app
        store = mockStore({
            auth: { user: null, token: null, loading: false, error: null },
        });
        // Replace the store's dispatch method with a Jest mock so we can track its calls
        store.dispatch = jest.fn();

        // Mock the browser's localStorage API since our component uses it
        // This prevents tests from modifying the actual localStorage during test runs
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => null),
                setItem: jest.fn(() => null),
                removeItem: jest.fn(() => null)
            },
            writable: true
        });

        // Set up the mocked navigate function to return a Jest mock function
        const { useNavigate } = require('react-router-dom');
        useNavigate.mockReturnValue(jest.fn());
    });

    // Restore original implementations after all tests finish
    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Helper function to consistently render the component with all needed providers
    // This avoids code duplication across test cases
    const renderComponent = () =>
        render(
            <Provider store={store}> {/* Provides Redux store context */}
                <BrowserRouter> {/* Provides routing context */}
                    <LoginPage /> {/* The component we're testing */}
                </BrowserRouter>
            </Provider>
        );

    // Test case: verify that the component renders with expected default values
    it('renders login form with default values', () => {
        renderComponent();
        // Check that key elements appear on the page
        expect(screen.getByText('Login to Smart-Chain')).toBeInTheDocument();
        // Check that input fields have the expected default values
        expect(screen.getByLabelText('Email')).toHaveValue('test@test.com');
        expect(screen.getByLabelText('Password')).toHaveValue('testtest');
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    // Test case: verify that validation errors show up when trying to submit empty fields
    it('shows validation errors on empty submit', () => {
        renderComponent();
        // Change input values to empty strings
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: '' } });
        // Click the login button to trigger form submission
        fireEvent.click(screen.getByRole('button', { name: /login/i }));
        // Check that validation error messages appear
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    // Test case: verify that email validation works
    it('shows validation error for invalid email', () => {
        renderComponent();
        // Change email to an invalid format
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /login/i }));
        // Check for validation error
        expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });

    // Test case: verify the login process starts correctly with valid form data
    it('dispatches loginStart and calls loginUser on valid submit', async () => {
        // Set up our mock to return a successful response
        authService.loginUser.mockResolvedValue({
            user: { id: '1', email: 'test@test.com', role: 'customer' },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
        });

        renderComponent();
        // Submit form with default values (which are valid)
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        // Check that the loginStart action was dispatched to Redux
        expect(store.dispatch).toHaveBeenCalledWith(loginStart());

        // Using waitFor because service call is asynchronous
        await waitFor(() => {
            // Verify the service was called with expected credentials
            expect(authService.loginUser).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'testtest',
            });
        });
    });

    // Test case: verify the full successful login flow including navigation
    it('handles successful login and navigation', async () => {
        // Get access to the mocked navigate function
        const { useNavigate } = require('react-router-dom');
        const mockNavigate = useNavigate();

        // Mock a successful API response
        authService.loginUser.mockResolvedValue({
            user: { id: '1', email: 'test@test.com', role: 'customer' },
            token: 'mock-token',
            refreshToken: 'mock-refresh-token',
        });

        renderComponent();
        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        // Wait for async operations and verify all expected actions happened
        await waitFor(() => {
            // Check that loginSuccess action was dispatched with correct payload
            expect(store.dispatch).toHaveBeenCalledWith(
                loginSuccess({
                    user: { id: '1', email: 'test@test.com', role: 'customer' },
                    token: 'mock-token',
                })
            );

            // Verify tokens were saved to localStorage
            expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
            expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');

            // Verify navigation to dashboard occurred
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    // Test case: verify handling of API errors
    it('handles login failure and displays error', async () => {
        // Mock API call to reject with an error
        authService.loginUser.mockRejectedValue({
            response: { data: { message: 'Invalid credentials' } },
        });

        renderComponent();
        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        // Wait for async operations and verify error handling
        await waitFor(() => {
            // Check that loginFailure action was dispatched with correct error message
            expect(store.dispatch).toHaveBeenCalledWith(loginFailure('Invalid credentials'));
        });
    });

    // Test case: verify handling of unexpected errors
    it('displays generic error on unexpected failure', async () => {
        // Mock API call to reject with a general error (not API-specific)
        authService.loginUser.mockRejectedValue(new Error('Network error'));

        renderComponent();
        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        // Wait for async operations and verify generic error handling
        await waitFor(() => {
            // Check that loginFailure action was dispatched with generic error message
            expect(store.dispatch).toHaveBeenCalledWith(loginFailure('Login failed'));
        });
    });

    // Test case: verify password visibility toggle functionality
    it('toggles password visibility', () => {
        renderComponent();
        const passwordInput = screen.getByLabelText('Password');
        const toggleButton = screen.getByLabelText('Show password');

        // Initially password should be hidden
        expect(passwordInput).toHaveAttribute('type', 'password');
        // Click toggle button
        fireEvent.click(toggleButton);
        // Password should now be visible
        expect(passwordInput).toHaveAttribute('type', 'text');
        // Click toggle button again
        fireEvent.click(toggleButton);
        // Password should be hidden again
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    // Test case: verify navigation to register page
    it('navigates to register page on link click', () => {
        // Get access to mocked navigate function
        const { useNavigate } = require('react-router-dom');
        const mockNavigate = useNavigate();

        renderComponent();
        // Click on register link
        fireEvent.click(screen.getByText('Register'));
        // Verify navigation happened with expected path
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    // Test case: verify UI state during loading
    it('disables inputs and button during loading', () => {
        // Create store with loading:true to simulate loading state
        store = mockStore({
            auth: { user: null, token: null, loading: true, error: null },
        });
        renderComponent();

        // Verify that all interactive elements are disabled during loading
        expect(screen.getByLabelText('Email')).toBeDisabled();
        expect(screen.getByLabelText('Password')).toBeDisabled();
        expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
    });
});
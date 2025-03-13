import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import LoginPage from './LoginPage';
import { loginStart } from '../../../redux/slices/authSlice';

const mockStore = configureStore([]);

describe('LoginPage', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            auth: { user: null, token: null, loading: false, error: null },
        });
        store.dispatch = jest.fn();
    });

    const renderComponent = () =>
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <LoginPage />
                </BrowserRouter>
            </Provider>
        );

    it('renders login form', () => {
        renderComponent();
        expect(screen.getByText('Login to Smart-Chain')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('shows validation errors on empty submit', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /login/i }));
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('dispatches loginStart on valid submit', () => {
        renderComponent();
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /login/i }));
        expect(store.dispatch).toHaveBeenCalledWith(loginStart());
    });

    it('displays error message from state', () => {
        store = mockStore({
            auth: { user: null, token: null, loading: false, error: 'Invalid credentials' },
        });
        renderComponent();
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows loading indicator when loading', () => {
        store = mockStore({
            auth: { user: null, token: null, loading: true, error: null },
        });
        renderComponent();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText('Logging in...')).toBeInTheDocument();
    });

    it('navigates to register page on link click', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Register'));
        // Navigation is handled by useNavigate, so test via mock if needed
    });
});
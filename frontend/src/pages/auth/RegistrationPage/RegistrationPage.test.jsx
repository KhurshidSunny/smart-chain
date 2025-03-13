import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import RegistrationPage from './RegistrationPage';
import { loginStart } from '../../../redux/slices/authSlice';

const mockStore = configureStore([]);

describe('RegistrationPage', () => {
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
                    <RegistrationPage />
                </BrowserRouter>
            </Provider>
        );

    it('renders registration form', () => {
        renderComponent();
        expect(screen.getByText('Register for Smart-Chain')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('shows validation errors on empty submit', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /register/i }));
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('shows password mismatch error', () => {
        renderComponent();
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password456' } });
        fireEvent.click(screen.getByRole('button', { name: /register/i }));
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('dispatches loginStart on valid submit', () => {
        renderComponent();
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /register/i }));
        expect(store.dispatch).toHaveBeenCalledWith(loginStart());
    });

    it('displays error message from state', () => {
        store = mockStore({
            auth: { user: null, token: null, loading: false, error: 'Email already exists' },
        });
        renderComponent();
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows loading indicator when loading', () => {
        store = mockStore({
            auth: { user: null, token: null, loading: true, error: null },
        });
        renderComponent();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText('Registering...')).toBeInTheDocument();
    });

    it('navigates to login page on link click', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Login'));
        // Navigation is handled by useNavigate, so test via mock if needed
    });
});
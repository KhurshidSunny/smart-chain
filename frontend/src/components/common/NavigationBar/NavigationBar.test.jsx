import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter, useLocation } from 'react-router-dom';
import NavigationBar from './NavigationBar';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: jest.fn(), // Will override in tests
}));

const mockStore = configureStore([]);

describe('NavigationBar', () => {
    let store;

    beforeEach(() => {
        mockNavigate.mockClear();
        store = mockStore({
            auth: {
                user: { role: 'admin', username: 'testadmin' },
            },
        });
    });

    it('renders Smart-Chain title', () => {
        jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard' });
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );
        expect(screen.getByText('Smart-Chain')).toBeInTheDocument();
    });

    it('displays role-specific navigation items for admin', () => {
        jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard' });
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('Inventory')).toBeInTheDocument();
        expect(screen.getByText('Warehouse')).toBeInTheDocument();
        expect(screen.getByText('Logistics')).toBeInTheDocument();
        expect(screen.getByText('Feedback')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('highlights current section', () => {
        jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/orders' });
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/orders']}>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );
        const ordersButton = screen.getByText('Orders');
        expect(ordersButton).toHaveStyle('border-bottom: 2px solid white');
    });

    it('navigates to selected path on button click', () => {
        jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard' });
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );
        fireEvent.click(screen.getByText('Orders'));
        expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });

    it('opens and closes drawer on mobile', () => {
        jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard' });
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );
        const menuButton = screen.getByLabelText(/menu/i); // aria-label added implicitly by IconButton
        fireEvent.click(menuButton);
        expect(screen.getByText('Dashboard')).toBeVisible(); // In drawer
        fireEvent.click(screen.getByText('Orders')); // Closes drawer after navigation
        expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });

    it('handles logout', () => {
        jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard' });
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );
        fireEvent.click(screen.getByText('Logout'));
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        // TODO: Add test for logout action dispatch when implemented
    });

    it('displays limited items for customer role', () => {
        store = mockStore({
            auth: { user: { role: 'customer', username: 'testcustomer' } },
        });
        jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard' });
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('Tracking')).toBeInTheDocument();
        expect(screen.getByText('Feedback')).toBeInTheDocument();
        expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
    });
});
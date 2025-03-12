// src/components/common/NavigationBar/NavigationBar.test.jsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import NavigationBar from './NavigationBar';

const mockStore = configureStore([]);

describe('NavigationBar', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            auth: {
                user: { username: 'testuser', role: 'admin' },
            },
        });
    });

    test('renders NavigationBar with title and user info', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Order Tracking System')).toBeInTheDocument();
        expect(screen.getByText('testuser (admin)')).toBeInTheDocument();
    });

    test('opens drawer on menu button click', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );

        const menuButton = screen.getByLabelText('menu');
        fireEvent.click(menuButton);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument(); // Admin role should see all options
    });

    test('filters menu items based on role', () => {
        store = mockStore({
            auth: {
                user: { username: 'warehouseuser', role: 'warehouse' },
            },
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <NavigationBar />
                </MemoryRouter>
            </Provider>
        );

        fireEvent.click(screen.getByLabelText('menu'));

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Warehouse')).toBeInTheDocument();
        expect(screen.queryByText('Users')).not.toBeInTheDocument(); // Warehouse role shouldn't see Users
    });
});
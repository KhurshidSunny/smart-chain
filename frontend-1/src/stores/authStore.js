import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: !!localStorage.getItem('token'),

    setAuth: (user, token, refreshToken = null) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user, token, refreshToken, isAuthenticated: true });
    },

    logout: async () => {
        const { token, refreshToken } = get();

        // Clear local state immediately for better UX
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });

        // Try to logout on server (don't wait for it)
        try {
            if (refreshToken) {
                const { logout: logoutService } = await import('../services/authService');
                await logoutService(refreshToken);
            }
        } catch (error) {
            console.warn('Server logout failed:', error.message);
            // Don't throw error - local logout already completed
        }
    },

    // Force logout (used by interceptors)
    forceLogout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    }
}));

export default useAuthStore;
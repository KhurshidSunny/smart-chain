import { create } from 'zustand';
import { clearAccess, dropLegacyTokenStorage, readCsrfCookie, setAccess } from '../services/sessionMemory';

const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    setAuth: (user, token, csrfToken) => {
        dropLegacyTokenStorage();
        setAccess(token, csrfToken);
        set({ user, token, isAuthenticated: true });
    },

    logout: async () => {
        try {
            const { logoutSession } = await import('../services/sessionClient');
            await logoutSession();
        } catch (error) {
            console.warn('Server logout failed:', error.message);
        }
        clearAccess();
        dropLegacyTokenStorage();
        set({ user: null, token: null, isAuthenticated: false });
    },

    forceLogout: () => {
        clearAccess();
        dropLegacyTokenStorage();
        set({ user: null, token: null, isAuthenticated: false });
    },
}));

export async function restoreSession() {
    dropLegacyTokenStorage();
    if (!readCsrfCookie()) return;

    try {
        const { refreshSession } = await import('../services/sessionClient');
        const data = await refreshSession();
        useAuthStore.getState().setAuth(data.user, data.token, data.csrfToken);
    } catch {
        useAuthStore.getState().forceLogout();
    }
}

export default useAuthStore;

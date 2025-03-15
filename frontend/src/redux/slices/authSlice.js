import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null , // Will hold user data like { role: 'admin' }
        token: null,
        loading: false,
        error: null,
    },
    reducers: {
        loginStart(state) {
            state.loading = true;
            state.error = null;
        },
        loginSuccess(state, action) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.loading = false;
        },
        loginFailure(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        logout(state) {
            state.user = null;
            state.token = null;
            state.loading = false;
            state.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        },
        restoreAuth(state, action) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.loading = false;
        },
        clearError(state) {
            state.error = null;
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout, restoreAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
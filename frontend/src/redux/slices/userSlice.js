import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
    name: 'users',
    initialState: {
        users: [],
        loading: false,
        error: null,
    },
    reducers: {
        fetchUsersStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchUsersSuccess(state, action) {
            state.users = action.payload;
            state.loading = false;
        },
        fetchUsersFailure(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { fetchUsersStart, fetchUsersSuccess, fetchUsersFailure } = userSlice.actions;
export default userSlice.reducer;
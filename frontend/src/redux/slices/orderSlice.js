import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
    name: 'orders',
    initialState: {
        orders: [],
        loading: false,
        error: null,
    },
    reducers: {
        fetchOrdersStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchOrdersSuccess(state, action) {
            state.orders = action.payload;
            state.loading = false;
        },
        fetchOrdersFailure(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { fetchOrdersStart, fetchOrdersSuccess, fetchOrdersFailure } = orderSlice.actions;
export default orderSlice.reducer;
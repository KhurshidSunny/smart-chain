import { createSlice } from '@reduxjs/toolkit';

const logisticsSlice = createSlice({
    name: 'logistics',
    initialState: {
        shipments: [],
        loading: false,
        error: null,
    },
    reducers: {
        fetchShipmentsStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchShipmentsSuccess(state, action) {
            state.shipments = action.payload;
            state.loading = false;
        },
        fetchShipmentsFailure(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { fetchShipmentsStart, fetchShipmentsSuccess, fetchShipmentsFailure } = logisticsSlice.actions;
export default logisticsSlice.reducer;
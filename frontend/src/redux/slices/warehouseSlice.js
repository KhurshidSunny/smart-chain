import { createSlice } from '@reduxjs/toolkit';

const warehouseSlice = createSlice({
    name: 'warehouse',
    initialState: {
        warehouses: [],
        loading: false,
        error: null,
    },
    reducers: {
        fetchWarehousesStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchWarehousesSuccess(state, action) {
            state.warehouses = action.payload;
            state.loading = false;
        },
        fetchWarehousesFailure(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { fetchWarehousesStart, fetchWarehousesSuccess, fetchWarehousesFailure } = warehouseSlice.actions;
export default warehouseSlice.reducer;
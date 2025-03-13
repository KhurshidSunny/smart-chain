import { createSlice } from '@reduxjs/toolkit';

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchInventoryStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchInventorySuccess(state, action) {
      state.items = action.payload;
      state.loading = false;
    },
    fetchInventoryFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { fetchInventoryStart, fetchInventorySuccess, fetchInventoryFailure } = inventorySlice.actions;
export default inventorySlice.reducer;
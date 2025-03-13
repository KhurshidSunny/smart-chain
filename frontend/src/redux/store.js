import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import orderReducer from './slices/orderSlice';
import inventoryReducer from './slices/inventorySlice';
import warehouseReducer from './slices/warehouseSlice';
import logisticsReducer from './slices/logisticsSlice';
import feedbackReducer from './slices/feedbackSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: orderReducer,
    inventory: inventoryReducer,
    warehouse: warehouseReducer,
    logistics: logisticsReducer,
    feedback: feedbackReducer,
    users: userReducer,
  },
});

export default store;
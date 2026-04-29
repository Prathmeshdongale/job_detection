import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import checksReducer from './checksSlice';
import uiReducer from './uiSlice';
import userReducer from './userSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    checks: checksReducer,
    ui: uiReducer,
    user: userReducer,
  },
});

export default store;

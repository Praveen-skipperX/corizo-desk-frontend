import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import syncProgressReducer from './syncProgressSlice';
import { apiSlice } from './api/apiSlice';

const clearPrivateCache = (storeApi) => (next) => (action) => {
  const previousUser = storeApi.getState().auth.user?._id;
  const result = next(action);
  if (action.type === 'auth/logout' || (action.type === 'auth/setUser' && previousUser !== action.payload?._id)) {
    storeApi.dispatch(apiSlice.util.resetApiState());
  }
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    syncProgress: syncProgressReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(clearPrivateCache, apiSlice.middleware),
});

setupListeners(store.dispatch);

export default store;

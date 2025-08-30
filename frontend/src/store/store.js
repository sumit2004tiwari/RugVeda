import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import { authApi } from "../features/auth/api";
import { api } from "./api";
import modalSlice from '../features/modal/modalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    modal: modalSlice,
    [api.reducerPath]: api.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware, authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


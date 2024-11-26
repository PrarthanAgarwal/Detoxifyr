import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';
import preferencesReducer from './preferencesSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    preferences: preferencesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SessionSettings } from '@/types/session';

const initialState: SessionSettings = {
  keywords: [] as string[],
  playbackSpeed: 1,
  maxVideos: 5,
  maxDuration: 30,
  autoplay: false,
  notifications: true,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<SessionSettings>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { updateSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
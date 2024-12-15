import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPreferences, VideoLength } from '../types';

const initialState: UserPreferences = {
  keywords: [],
  averageVideoLength: 'medium' as VideoLength,
  numberOfVideos: 5,
  languagePreferences: ['en'],
  contentLength: {
    min: 5,
    max: 20,
  },
  viewCountThreshold: 1000,
  engagementRatioThreshold: 0.8,
  ageLimit: 365,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      return { ...state, ...action.payload };
    },
    addKeyword: (state, action: PayloadAction<string>) => {
      if (state.keywords.length < 5) {
        state.keywords.push(action.payload);
      }
    },
    removeKeyword: (state, action: PayloadAction<string>) => {
      state.keywords = state.keywords.filter(keyword => keyword !== action.payload);
    },
  },
});

export const { setPreferences, addKeyword, removeKeyword } = preferencesSlice.actions;
export default preferencesSlice.reducer;
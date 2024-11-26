import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Session, VideoProgress } from '@/types/session';

interface SessionState {
  currentSession: Session | null;
  history: Session[];
  loading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  currentSession: null,
  history: [],
  loading: false,
  error: null,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<Session>) => {
      state.currentSession = action.payload;
      state.error = null;
    },
    endSession: (state) => {
      if (state.currentSession) {
        state.currentSession.endTime = Date.now();
        state.currentSession.isActive = false;
        state.history.push(state.currentSession);
        state.currentSession = null;
      }
    },
    updateVideoProgress: (state, action: PayloadAction<VideoProgress>) => {
      if (state.currentSession) {
        const videoIndex = state.currentSession.videosWatched.findIndex(
          (v) => v.videoId === action.payload.videoId
        );
        if (videoIndex >= 0) {
          state.currentSession.videosWatched[videoIndex] = action.payload;
        } else {
          state.currentSession.videosWatched.push(action.payload);
        }
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { startSession, endSession, updateVideoProgress, setError } =
  sessionSlice.actions;

export default sessionSlice.reducer;
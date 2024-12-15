import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { VideoMetadata, SessionHistory } from '../types';
import { ChannelInfo } from '../types/youtube';
import { YouTubeService } from '../services/youtubeService';
import { FilteringEngine } from '../services/filteringEngine';
import { RootState } from './index';
import { convertToVideoMetadata } from '../utils/videoUtils';

interface SessionState {
    isActive: boolean;
    currentVideos: VideoMetadata[];
    history: SessionHistory[];
    loading: boolean;
    error: string | null;
}

const initialState: SessionState = {
    isActive: false,
    currentVideos: [],
    history: [],
    loading: false,
    error: null
};

export const startSession = createAsyncThunk<
    VideoMetadata[],
    void,
    { state: RootState; rejectValue: string }
>(
    'session/start',
    async (_, { getState, rejectWithValue }) => {
        const youtubeService = YouTubeService.getInstance();
        const filteringEngine = FilteringEngine.getInstance();
        const state = getState();
        const preferences = state.preferences;

        try {
            // Input validation
            if (!preferences?.keywords?.length) {
                return rejectWithValue('No keywords provided');
            }

            // Clean and validate keywords
            const validKeywords = preferences.keywords
                .map(keyword => keyword.trim())
                .filter(keyword => keyword.length >= 2);

            if (!validKeywords.length) {
                return rejectWithValue('No valid keywords after filtering');
            }

            // Search with combined query
            console.log('Searching with query:', validKeywords.join(' '));
            const searchResponse = await youtubeService.searchVideos({
                query: validKeywords.join(' '),
                maxResults: Math.min(50, preferences.numberOfVideos * 2),
                order: 'relevance',
                safeSearch: 'moderate'
            });

            if (!searchResponse?.items?.length) {
                return rejectWithValue(`No videos found for: ${validKeywords.join(' ')}`);
            }

            console.log(`Found ${searchResponse.items.length} initial results`);

            // Get channel IDs from search results
            const channelIds = [...new Set(searchResponse.items.map(item => item.channelId))];
            
            // Fetch channel data
            const channelData = await Promise.all(
                channelIds.map(id => youtubeService.getChannelInfo(id))
            );

            // Create channel map, filtering out null values
            const channelMap = new Map<string, ChannelInfo>(
                channelData
                    .filter((channel): channel is ChannelInfo => channel !== null)
                    .map(channel => [channel.id, channel])
            );

            if (!channelMap.size) {
                return rejectWithValue('Failed to fetch channel data');
            }

            // Apply filtering with preferences
            const filteredResults = await filteringEngine.filterAndRankContent(
                searchResponse.items,
                channelMap,
                {
                    minEngagementScore: 0.2,
                    minAuthorityScore: 0.2,
                    minQualityScore: 0.2,
                    maxContentAge: preferences.ageLimit,
                    minRelevancyScore: 0.3,
                    minViewCount: Math.max(100, preferences.viewCountThreshold),
                    minDuration: preferences.contentLength.min * 60,
                    maxDuration: preferences.contentLength.max * 60,
                    numberOfVideos: preferences.numberOfVideos,
                    weights: {
                        engagement: 0.2,
                        authority: 0.2,
                        quality: 0.2,
                        freshness: 0.2,
                        relevancy: 0.2
                    }
                },
                validKeywords.join(' ')
            );

            if (!filteredResults?.videos?.length) {
                return rejectWithValue('No videos met the quality criteria. Try adjusting your preferences or using different keywords.');
            }

            console.log(`${filteredResults.videos.length} videos passed filtering`);

            // Convert to metadata
            const results = filteredResults.videos
                .slice(0, preferences.numberOfVideos)
                .map(video => convertToVideoMetadata(video));

            if (!results.length) {
                return rejectWithValue('Failed to process video results');
            }

            return results;

        } catch (error) {
            console.error('Session start error:', error);
            return rejectWithValue(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to start session. Please try again.'
            );
        }
    }
);

export const fetchChannelDetails = createAsyncThunk(
    'session/fetchChannelDetails',
    async (channelIds: string[]) => {
        const youtubeService = YouTubeService.getInstance();
        const channelPromises = channelIds.map(id => youtubeService.getChannelInfo(id));
        const channels = await Promise.all(channelPromises);
        
        // Filter out null values and create a map
        const channelMap = new Map<string, ChannelInfo>(
            channels
                .filter((channel): channel is ChannelInfo => channel !== null)
                .map(channel => [channel.id, channel])
        );
        
        return channelMap;
    }
);

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        clearSession: (state) => {
            state.isActive = false;
            state.currentVideos = [];
            state.error = null;
        },
        setCurrentVideos: (state, action: PayloadAction<VideoMetadata[]>) => {
            state.currentVideos = action.payload;
        },
        addToHistory: (state, action: PayloadAction<SessionHistory>) => {
            state.history.push(action.payload);
        },
        clearHistory: (state) => {
            state.history = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(startSession.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(startSession.fulfilled, (state, action) => {
                state.loading = false;
                state.isActive = true;
                state.currentVideos = action.payload;
            })
            .addCase(startSession.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to start session';
            });
    }
});

export const {
    clearSession,
    setCurrentVideos,
    addToHistory,
    clearHistory
} = sessionSlice.actions;

export default sessionSlice.reducer;

// Selectors
export const selectCurrentVideos = (state: RootState) => state.session.currentVideos;
export const selectSessionHistory = (state: RootState) => state.session.history;
export const selectSessionStatus = (state: RootState) => ({
    isActive: state.session.isActive,
    loading: state.session.loading,
    error: state.session.error
});
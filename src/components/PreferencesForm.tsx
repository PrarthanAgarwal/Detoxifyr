import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RootState } from '../store';
import { setPreferences, addKeyword, removeKeyword } from '../store/preferencesSlice';
import { startSession, setCurrentVideos } from '../store/sessionSlice';
import { AppDispatch } from '../store';
import { YouTubeService } from '../services/youtubeService';
import { SimplifiedFilteringEngine } from '../services/filtering/SimplifiedFilteringEngine';
import { VideoLength, VideoMetadata } from '../types';
import { KeywordProcessor } from '../services/keyword/KeywordProcessor';

const PreferencesForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const preferences = useSelector((state: RootState) => state.preferences);
  const [newKeyword, setNewKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword && preferences.keywords.length < 5) {
      dispatch(addKeyword(newKeyword));
      setNewKeyword('');
    }
  };

  const handleStartDetox = async () => {
    try {
      dispatch(startSession());
      
      const youtubeService = YouTubeService.getInstance();
      const filteringEngine = SimplifiedFilteringEngine.getInstance();
      
      const keywordProcessor = KeywordProcessor.getInstance();
      const processedKeywords = keywordProcessor.process(preferences.keywords);
      if (processedKeywords.errors.length > 0) {
        setError(processedKeywords.errors[0]);
        return;
      }
      const optimizedKeywords = keywordProcessor.optimize(processedKeywords);
      
      // Combine keywords for a single search
      const combinedQuery = optimizedKeywords.optimizedKeywords.join(' ');
      
      try {
        const searchResponse = await youtubeService.searchVideos({
          query: combinedQuery,
          maxResults: preferences.numberOfVideos * 2,
          preferences: {
            videoLength: preferences.averageVideoLength,
            contentAge: preferences.contentAge,
            minEngagementScore: 0.5,
            minAuthorityScore: 0.5,
            minQualityScore: 0.5,
            maxContentAge: 365,
            minRelevancyScore: 0.5,
            minViewCount: 1000,
            minDuration: 60,
            maxDuration: 3600,
            numberOfVideos: preferences.numberOfVideos,
            weights: {
              engagement: 0.2,
              authority: 0.2,
              quality: 0.2,
              freshness: 0.2,
              relevancy: 0.2
            }
          }
        });

        if (!searchResponse?.items?.length) {
          throw new Error('No videos found for the given search criteria');
        }

        // Filter and rank the videos
        const filteredResults = await filteringEngine.filterAndRankContent(
          searchResponse.items,
          searchResponse.channels,
          {
            minEngagementScore: 0.5,
            minAuthorityScore: 0.5,
            minQualityScore: 0.5,
            maxContentAge: 365,
            minRelevancyScore: 0.5,
            minViewCount: 1000,
            minDuration: 60,
            maxDuration: 3600,
            numberOfVideos: preferences.numberOfVideos,
            videoLength: preferences.averageVideoLength,
            contentAge: preferences.contentAge,
            weights: {
              engagement: 0.2,
              authority: 0.2,
              quality: 0.2,
              freshness: 0.2,
              relevancy: 0.2
            }
          }
        );

        // Convert filtered videos to VideoMetadata format
        const videoMetadata: VideoMetadata[] = filteredResults.videos
          .slice(0, preferences.numberOfVideos)
          .map(video => ({
            videoId: video.id,
            title: video.title,
            thumbnailUrl: video.thumbnails.high.url,
            channelId: video.channelId,
            channelTitle: video.channelTitle,
            publishDate: video.publishedAt,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            dislikeCount: 0,
            commentCount: video.commentCount,
            duration: parseInt(video.duration.replace(/\D/g, '')),
            creatorAuthorityScore: 0,
            contentQualityScore: 0,
            engagementRatio: 0
          }));

        if (videoMetadata.length === 0) {
          throw new Error('No videos passed the quality filters. Please try different keywords.');
        }

        dispatch(setCurrentVideos(videoMetadata));
        navigate('/videos');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const videoLengthOptions: Array<{label: string; value: VideoLength}> = [
    { label: 'Short (< 4 min)', value: 'short' },
    { label: 'Medium (4-20 min)', value: 'medium' },
    { label: 'Long (> 20 min)', value: 'long' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4"
    >
      <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      <form onSubmit={handleAddKeyword} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords (Max 5)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add keyword"
            />
            <button
              type="submit"
              disabled={preferences.keywords.length >= 5}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {preferences.keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
              >
                {keyword}
                <button
                  onClick={() => dispatch(removeKeyword(keyword))}
                  className="ml-2 text-indigo-600 hover:text-indigo-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Length
          </label>
          <div className="space-y-2">
            {videoLengthOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  checked={preferences.averageVideoLength === option.value}
                  onChange={() => dispatch(setPreferences({ averageVideoLength: option.value }))}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Age
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                checked={preferences.contentAge === 'recent'}
                onChange={() => dispatch(setPreferences({ contentAge: 'recent' }))}
                className="form-radio h-4 w-4 text-indigo-600"
              />
              <span className="text-gray-700">Prioritize newer content (within last year)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                checked={preferences.contentAge === 'all'}
                onChange={() => dispatch(setPreferences({ contentAge: 'all' }))}
                className="form-radio h-4 w-4 text-indigo-600"
              />
              <span className="text-gray-700">Show all time periods</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Videos
          </label>
          <input
            type="number"
            value={preferences.numberOfVideos}
            onChange={(e) => dispatch(setPreferences({ numberOfVideos: Number(e.target.value) }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            min="1"
            max="20"
          />
        </div>

        <button
          type="button"
          onClick={handleStartDetox}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Start Detox Session
        </button>
      </form>
    </motion.div>
  );
};

export default PreferencesForm;
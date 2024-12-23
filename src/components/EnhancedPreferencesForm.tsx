import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { setPreferences, addKeyword, removeKeyword } from '../store/preferencesSlice';
import { startSession } from '../store/sessionSlice';
import { AppDispatch } from '../store';
import { VideoLength } from '../types';
import { KeywordProcessor } from '../services/keyword/KeywordProcessor';
import { FiClock, FiCalendar, FiPlay } from 'react-icons/fi';

interface VideoLengthOption {
  label: string;
  value: VideoLength;
  icon: JSX.Element;
  description: string;
}

const EnhancedPreferencesForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const preferences = useSelector((state: RootState) => state.preferences);
  const [newKeyword, setNewKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [keywordQuality, setKeywordQuality] = useState<'idle' | 'good' | 'warning'>('idle');

  const videoLengthOptions: VideoLengthOption[] = [
    {
      label: 'Quick Watch',
      value: 'short',
      icon: <FiPlay className="w-5 h-5" />,
      description: 'Perfect for quick breaks (< 5 min)'
    },
    {
      label: 'Standard',
      value: 'medium',
      icon: <FiClock className="w-5 h-5" />,
      description: 'Ideal for regular viewing (5-15 min)'
    },
    {
      label: 'Deep Dive',
      value: 'long',
      icon: <FiClock className="w-5 h-5" />,
      description: 'In-depth content (> 15 min)'
    }
  ];

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword && preferences.keywords.length < 5) {
      const keywordProcessor = KeywordProcessor.getInstance();
      const processed = await keywordProcessor.process([newKeyword]);
      
      if (processed.errors.length > 0) {
        setKeywordQuality('warning');
        return;
      }
      
      dispatch(addKeyword(newKeyword));
      setNewKeyword('');
      setKeywordQuality('good');
      
      setTimeout(() => setKeywordQuality('idle'), 2000);
    }
  };

  const handleStartDetox = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await dispatch(startSession()).unwrap();
      
      if (response && response.length > 0) {
        navigate('/videos');
      } else {
        setError('No videos found matching your criteria. Please try different keywords.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4"
    >
      <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
      
      <form onSubmit={handleAddKeyword} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords
            <span className="ml-1 text-sm text-gray-500">
              ({preferences.keywords.length}/5)
            </span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 ${
                  keywordQuality === 'good' ? 'border-green-500 ring-1 ring-green-500' :
                  keywordQuality === 'warning' ? 'border-yellow-500 ring-1 ring-yellow-500' :
                  'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="Enter a keyword"
              />
              <AnimatePresence>
                {keywordQuality !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                      keywordQuality === 'good' ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  >
                    {keywordQuality === 'good' ? '✓' : '!'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="submit"
              disabled={preferences.keywords.length >= 5 || !newKeyword.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {preferences.keywords.map((keyword) => (
              <motion.span
                key={keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
              >
                {keyword}
                <button
                  onClick={() => dispatch(removeKeyword(keyword))}
                  className="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  ×
                </button>
              </motion.span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Video Length
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {videoLengthOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => dispatch(setPreferences({ averageVideoLength: option.value }))}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors h-full ${
                  preferences.averageVideoLength === option.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex flex-col items-center flex-1 justify-center">
                  {option.icon}
                  <span className="mt-2 font-medium text-sm">{option.label}</span>
                  <span className="mt-1 text-xs text-gray-500 text-center">
                    {option.description}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Content Age
          </label>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => dispatch(setPreferences({ contentAge: 'recent' }))}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                preferences.contentAge === 'recent'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <FiCalendar className="w-5 h-5" />
              <span className="mt-2 font-medium text-sm">Latest & Greatest</span>
              <span className="mt-1 text-xs text-gray-500 text-center">
                Prioritizes recent content
              </span>
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => dispatch(setPreferences({ contentAge: 'all' }))}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                preferences.contentAge === 'all'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <FiCalendar className="w-5 h-5" />
              <span className="mt-2 font-medium text-sm">All-Time Best</span>
              <span className="mt-1 text-xs text-gray-500 text-center">
                Includes classic content
              </span>
            </motion.button>
          </div>
        </div>

        <div>
          <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            Number of Videos
            <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">
              {preferences.numberOfVideos}
            </span>
          </label>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="20"
              value={preferences.numberOfVideos}
              onChange={(e) => dispatch(setPreferences({ numberOfVideos: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(79 70 229) 0%, rgb(79 70 229) ${(preferences.numberOfVideos - 1) * 100 / 19}%, rgb(229 231 235) ${(preferences.numberOfVideos - 1) * 100 / 19}%, rgb(229 231 235) 100%)`
              }}
            />
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleStartDetox}
          disabled={preferences.keywords.length === 0 || isProcessing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors relative overflow-hidden"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            'Start Detox Session'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default EnhancedPreferencesForm; 
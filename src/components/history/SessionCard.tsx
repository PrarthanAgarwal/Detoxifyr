import React, { useState } from 'react';
import { SessionHistory } from '../../types';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionCardProps {
  session: SessionHistory;
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 cursor-pointer hover:shadow-md transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
      initial={false}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-600">
          {dayjs(session.date).format('MMM D, YYYY h:mm A')}
        </span>
        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
          {session.totalVideos} videos
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {session.keywords?.map((keyword, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
            >
              {keyword}
            </span>
          ))}
        </div>
        
        <div className="text-sm text-gray-500">
          <span className="mr-3">
            Length: {session.contentLength} min
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t"
          >
            <div className="space-y-4">
              {session.videosWatched.map((video) => (
                <div
                  key={video.videoId}
                  className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank');
                  }}
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{video.title}</h4>
                    <p className="text-sm text-gray-500 truncate">{video.channelTitle}</p>
                    <div className="text-xs text-gray-400 flex items-center space-x-2">
                      <span>{video.viewCount.toLocaleString()} views</span>
                      <span>•</span>
                      <span>Quality: {video.contentQualityScore.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SessionCard;
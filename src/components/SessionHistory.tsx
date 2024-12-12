import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

const SessionHistory: React.FC = () => {
  const history = useSelector((state: RootState) => state.session.history);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Group sessions by month and year
  const groupedSessions = history.reduce((groups, session) => {
    const date = dayjs(session.date);
    const key = date.format('MMMM YYYY');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(session);
    return groups;
  }, {} as Record<string, typeof history>);

  const handleSessionClick = (sessionId: string) => {
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold mb-6">Session History</h2>
      
      {Object.entries(groupedSessions).map(([monthYear, sessions]) => (
        <div key={monthYear} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">{monthYear}</h3>
          
          <div className="space-y-3">
            {sessions.map((session) => (
              <motion.div
                key={session.sessionId}
                className="border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSessionClick(session.sessionId)}
                initial={false}
              >
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="font-medium">
                        {dayjs(session.date).format('MMM D, YYYY')}
                      </span>
                      <div className="text-sm text-gray-500">
                        Keywords: {session.keywords.join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-600">
                        {session.totalVideos} videos
                      </span>
                      <div className="text-xs text-gray-500">
                        {dayjs(session.date).format('h:mm A')}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSessionId === session.sessionId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="space-y-3">
                          {session.videosWatched.map((video) => (
                            <div
                              key={video.videoId}
                              className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50"
                            >
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-24 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{video.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {video.channelTitle}
                                </p>
                                <div className="text-xs text-gray-400">
                                  {video.viewCount.toLocaleString()} views • 
                                  Quality Score: {video.contentQualityScore.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SessionHistory;
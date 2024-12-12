import React from 'react';
import { SessionHistory } from '../../types';
import dayjs from 'dayjs';

interface SessionCardProps {
  session: SessionHistory;
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
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
    </div>
  );
};

export default SessionCard;
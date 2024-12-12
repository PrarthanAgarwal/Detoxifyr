import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import SessionCard from './SessionCard';
import { motion } from 'framer-motion';

const SessionHistory: React.FC = () => {
  const history = useSelector((state: RootState) => state.session.history);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      <h2 className="text-xl font-semibold mb-4">Session History</h2>
      
      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No sessions yet. Start your first detox session!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => (
            <SessionCard key={session.sessionId} session={session} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SessionHistory;
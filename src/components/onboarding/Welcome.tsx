import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center"
    >
      <h1 className="text-3xl font-bold text-indigo-600 mb-4">
        Welcome to Detoxifyr
      </h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Take control of your YouTube experience with curated content that matters to you.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/new-session')}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
      >
        Get Started :)
      </motion.button>
    </motion.div>
  );
};

export default Welcome;
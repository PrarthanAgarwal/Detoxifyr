import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoadingManager } from '../../hooks/useLoadingManager';
import LoadingSpinner from './LoadingSpinner';

interface LoadingProgressProps {
    progress: number;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({ progress }) => (
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <motion.div
            className="bg-indigo-600 h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
        />
    </div>
);

const EnhancedLoadingIndicator: React.FC = () => {
    const { isLoading, currentOperation, getProgress } = useLoadingManager();

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <LoadingSpinner />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {currentOperation?.description || 'Loading...'}
                                </p>
                                {currentOperation?.estimatedDuration && (
                                    <p className="text-xs text-gray-500">
                                        Estimated time: {Math.ceil(currentOperation.estimatedDuration / 1000)}s
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    {currentOperation?.estimatedDuration && (
                        <LoadingProgress 
                            progress={getProgress(currentOperation.id)}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EnhancedLoadingIndicator; 
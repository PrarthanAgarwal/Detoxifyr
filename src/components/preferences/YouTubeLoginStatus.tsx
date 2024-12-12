import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LoginStatus } from '../../types';
import { checkYouTubeLoginStatus } from '../../services/youtubeAuth';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { REQUIRED_PERMISSIONS } from '../../services/youtubeAuth';

const YouTubeLoginStatus: React.FC = () => {
  const [status, setStatus] = useState<LoginStatus>({ isLoggedIn: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    try {
      console.log('Requesting permissions...');
      
      // Request permissions in separate calls
      const permissionResults = await Promise.all(
        (REQUIRED_PERMISSIONS.permissions ?? []).map(async (permission: string) => {
          const result = await chrome.permissions.request({
            permissions: [permission]
          });
          console.log(`Permission request for ${permission}:`, result);
          return result;
        })
      );
  
      const originResults = await Promise.all(
        (REQUIRED_PERMISSIONS.origins ?? []).map(async (origin: string) => {
          const result = await chrome.permissions.request({
            origins: [origin]
          });
          console.log(`Origin request for ${origin}:`, result);
          return result;
        })
      );
  
      const allGranted = [...permissionResults, ...originResults].every(result => result);
      console.log('All permissions granted:', allGranted);
  
      if (allGranted) {
        console.log('Rechecking status after permissions granted...');
        await checkStatus();
      } else {
        setError('Some permissions were not granted');
      }
    } catch (err: unknown) {
      console.error('Permission request failed:', err);
      setError(`Failed to request permissions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const checkStatus = async () => {
    try {
      console.log('Checking YouTube login status...');
      setIsLoading(true);
      setError(null);
      const loginStatus = await checkYouTubeLoginStatus();
      console.log('Login status result:', loginStatus);
      setStatus(loginStatus);
    } catch (err: unknown) {
      console.warn('Failed to check login status:', err);
      setError('Unable to verify YouTube connection status');
      setStatus({ isLoggedIn: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={checkStatus} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-2">
        <motion.div
          animate={{
            scale: status.isLoggedIn ? [1, 1.2, 1] : 1,
            backgroundColor: status.isLoggedIn ? '#10B981' : '#EF4444'
          }}
          className={`w-2.5 h-2.5 rounded-full`}
        />
        <span className="font-medium text-gray-900">
          YouTube Connection Status
        </span>
      </div>
      
      {status.isLoggedIn ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-gray-600"
        >
          Connected as: {status.email}
        </motion.p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2"
        >
          <p className="text-sm text-red-600">
            Not connected to YouTube
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Please log in to YouTube to get personalized recommendations
          </p>
          <button
            onClick={requestPermissions}
            className="mt-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Grant Permissions
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default YouTubeLoginStatus;
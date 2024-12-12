import React from 'react';
import { useDispatch } from 'react-redux';
import { clearHistory } from '../../store/sessionSlice';

const AboutSection: React.FC = () => {
  const dispatch = useDispatch();
  const version = '1.0.0';
  const quotaUsage = '0/10000'; // This would come from your quota tracking system

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      dispatch(clearHistory());
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">About & Links</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-500">Version:</span>
            <span className="ml-2 text-sm text-gray-900">{version}</span>
          </div>
          <div>
            <a
              href="https://github.com/PrarthanAgarwal/Detoxifyr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              GitHub Repository
            </a>
          </div>
          <div>
            <a
              href="https://detoxifyr.vercel.app/terms-privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800 block mb-2"
            >
              Privacy Policy & Terms
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Usage</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-500">Daily Quota Usage:</span>
            <span className="ml-2 text-sm text-gray-900">{quotaUsage}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-indigo-600 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
        <button
          onClick={handleClearHistory}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Clear History
        </button>
      </div>
    </div>
  );
};

export default AboutSection;
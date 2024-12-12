import React from 'react';
import YouTubeLoginStatus from './YouTubeLoginStatus';
import AboutSection from './AboutSection';

const AdvancedSettings: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      <YouTubeLoginStatus />
      <AboutSection />
    </div>
  );
};

export default AdvancedSettings;
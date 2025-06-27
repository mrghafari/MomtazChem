import React from 'react';
import MoodThemeDemo from '@/components/mood/MoodThemeDemo';

const ThemeDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <MoodThemeDemo />
      </div>
    </div>
  );
};

export default ThemeDemoPage;
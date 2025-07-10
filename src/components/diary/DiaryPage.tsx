import React from 'react';
import DiaryEditor from './DiaryEditor';
import DiaryFeed from './DiaryFeed';

const DiaryPage: React.FC = () => (
  <div className="max-w-2xl mx-auto p-4 space-y-4">
    <DiaryEditor />
    <DiaryFeed />
  </div>
);

export default DiaryPage; 
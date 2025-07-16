import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import ChallengeBoard from './ChallengeBoard';
import { useMissionStore } from '@/stores/missionStore';

const MissionPage: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#missions');
  const { fetchAll } = useMissionStore();

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#missions');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (open) void fetchAll();
  }, [open, fetchAll]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <ChallengeBoard />
      </div>
    </div>
  );
};

export default MissionPage;

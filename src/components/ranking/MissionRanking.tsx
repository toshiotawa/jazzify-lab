import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { isStandardGlobalMode } from '@/utils/planFlags';

const MissionRanking: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#mission-ranking');
  const isGlobal = isStandardGlobalMode();

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#mission-ranking');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (!open) return null;

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-10 text-center">
            <h1 className="text-2xl font-bold mb-4">ミッションランキング</h1>
            {isGlobal ? (
              <p className="text-gray-300">このプランではミッションランキングはご利用いただけません。</p>
            ) : (
              <p className="text-gray-300">このページは現在ご利用いただけません。</p>
            )}
            <div className="mt-8">
              <button className="btn btn-outline btn-primary" onClick={handleClose}>
                ダッシュボードに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionRanking;

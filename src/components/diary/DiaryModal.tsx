import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import DiaryPage from './DiaryPage';
import ChallengeBoard from '@/components/mission/ChallengeBoard';

const DiaryModal: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash === '#diary-modal');
  const [tab, setTab] = useState<'diary' | 'mission'>('diary');

  useEffect(() => {
    const handler = () => setOpen(window.location.hash === '#diary-modal');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-auto" onClick={() => { window.location.hash = ''; }}>
      <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg" onClick={e => e.stopPropagation()}>
        <div className="flex border-b border-slate-700 text-sm">
          <button className={`flex-1 p-2 ${tab === 'diary' ? 'bg-slate-800 font-bold' : ''}`} onClick={() => setTab('diary')}>日記</button>
          <button className={`flex-1 p-2 ${tab === 'mission' ? 'bg-slate-800 font-bold' : ''}`} onClick={() => setTab('mission')}>ミッション</button>
        </div>
        <div className="p-4">
          {tab === 'diary' ? <DiaryPage /> : <ChallengeBoard />}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DiaryModal; 
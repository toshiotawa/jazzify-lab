import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import SongManager from './SongManager';
import { CourseManager } from './CourseManager';
import { LessonManager } from './LessonManager';
import MissionManager from './MissionManager';
import UserManager from './UserManager';
import AnnouncementManager from './AnnouncementManager';
import FantasyBgmManager from './FantasyBgmManager';
import FantasyStageManager from './FantasyStageManager';

/**
 * 管理画面ゲート – is_admin フラグを持つユーザーのみアクセス許可
 * Hash: #admin で開く
 */
const AdminDashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const [open, setOpen] = useState(() => {
    const hash = window.location.hash;
    return hash.startsWith('#admin');
  });
  
  // profile.isAdmin を使用
  const isAdmin = !!profile?.isAdmin;

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash;
      setOpen(hash.startsWith('#admin'));
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (!open) return null;

  // 権限チェック
  if (!isAdmin) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { window.location.href = '/main#dashboard'; }}>
        <div className="bg-slate-800 rounded-lg p-8 w-full max-w-sm text-white space-y-4" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-center">管理画面</h2>
          <p className="text-center text-sm">アクセス権限がありません。</p>
          <button className="btn btn-sm btn-primary w-full" onClick={() => { window.location.href = '/main#dashboard'; }}>
            戻る
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col md:flex-row" onClick={() => {}}>
      {/* デスクトップ: サイドバー */}
      <aside className="hidden md:flex w-60 bg-slate-800 border-r border-slate-700 p-4 space-y-4 flex-col">
        <h2 className="text-lg font-bold">Admin</h2>
                 <nav className="space-y-2 flex-1">
           <SidebarLink hash="#admin-songs" label="曲管理" />
           <SidebarLink hash="#admin-fantasy-bgm" label="ファンタジーBGM" />
           <SidebarLink hash="#admin-fantasy-stages" label="ファンタジーステージ" />
           <SidebarLink hash="#admin-courses" label="コース管理" />
           <SidebarLink hash="#admin-lessons" label="レッスン管理" />
           <SidebarLink hash="#admin-challenges" label="ミッション管理" />
           <SidebarLink hash="#admin-users" label="会員管理" />
           <SidebarLink hash="#admin-announcements" label="お知らせ管理" />
         </nav>
        <button className="btn btn-sm btn-outline w-full" onClick={() => { window.location.href = '/main#dashboard'; }}>
          閉じる
        </button>
      </aside>

      {/* モバイル: トップバー */}
      <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Admin</h2>
          <button className="btn btn-sm btn-outline" onClick={() => { window.location.href = '/main#dashboard'; }}>
            閉じる
          </button>
        </div>
                 <nav className="flex space-x-2 overflow-x-auto">
           <MobileTabLink hash="#admin-songs" label="曲管理" />
           <MobileTabLink hash="#admin-fantasy-bgm" label="ファンタジーBGM" />
           <MobileTabLink hash="#admin-fantasy-stages" label="ステージ" />
           <MobileTabLink hash="#admin-courses" label="コース" />
           <MobileTabLink hash="#admin-lessons" label="レッスン" />
           <MobileTabLink hash="#admin-challenges" label="ミッション" />
           <MobileTabLink hash="#admin-users" label="会員" />
           <MobileTabLink hash="#admin-announcements" label="お知らせ" />
         </nav>
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto p-4 md:p-8 space-y-6">
        <DashboardContent />
      </main>
    </div>,
    document.body,
  );
};

export default AdminDashboard;

const SidebarLink: React.FC<{ hash: string; label: string }> = ({ hash, label }) => (
  <a
    href={hash}
    className={`block px-2 py-1 rounded hover:bg-slate-700 ${window.location.hash === hash ? 'bg-slate-700' : ''}`}
  >
    {label}
  </a>
);

const MobileTabLink: React.FC<{ hash: string; label: string }> = ({ hash, label }) => (
  <a
    href={hash}
    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
      window.location.hash === hash 
        ? 'bg-primary-600 text-white' 
        : 'bg-slate-700 text-gray-200 hover:bg-slate-600'
    }`}
  >
    {label}
  </a>
);

const DashboardContent: React.FC = () => {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

     if (currentHash.startsWith('#admin-songs')) return <SongManager />;
   if (currentHash.startsWith('#admin-fantasy-bgm')) return <FantasyBgmManager />;
   if (currentHash.startsWith('#admin-fantasy-stages')) return <FantasyStageManager />;
   if (currentHash.startsWith('#admin-courses')) return <CourseManager />;
   if (currentHash.startsWith('#admin-lessons')) return <LessonManager />;
   if (currentHash.startsWith('#admin-challenges')) return <MissionManager />;
   if (currentHash.startsWith('#admin-users')) return <UserManager />;
   if (currentHash.startsWith('#admin-announcements')) return <AnnouncementManager />;
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400 text-center px-4">
        <span className="hidden md:inline">サイドバーから管理項目を選択してください。</span>
        <span className="md:hidden">上部タブから管理項目を選択してください。</span>
      </p>
    </div>
  );
}; 
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import SongManager from './SongManager';
import LessonManager from './LessonManager';
import ChallengeManager from './ChallengeManager';
import UserManager from './UserManager';

/**
 * 管理画面ゲート – プラチナランクのみアクセス許可
 * Hash: #admin で開く
 */
const AdminDashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const [open, setOpen] = useState(window.location.hash === '#admin');

  useEffect(() => {
    const handler = () => {
      setOpen(window.location.hash === '#admin');
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (!open) return null;

  // 権限チェック
  if (!profile || !profile.isAdmin) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { window.location.hash = ''; }}>
        <div className="bg-slate-800 rounded-lg p-8 w-full max-w-sm text-white space-y-4" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-center">管理画面</h2>
          <p className="text-center text-sm">アクセス権限がありません。</p>
          <button className="btn btn-sm btn-primary w-full" onClick={() => { window.location.hash = ''; }}>
            戻る
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex" onClick={() => {}}>
      {/* サイドバー */}
      <aside className="w-60 bg-slate-800 border-r border-slate-700 p-4 space-y-4">
        <h2 className="text-lg font-bold">Admin</h2>
        <nav className="space-y-2">
          <SidebarLink hash="#admin-songs" label="曲管理" />
          <SidebarLink hash="#admin-lessons" label="レッスン管理" />
          <SidebarLink hash="#admin-challenges" label="チャレンジ管理" />
          <SidebarLink hash="#admin-users" label="会員管理" />
        </nav>
        <button className="mt-auto btn btn-sm btn-outline w-full" onClick={() => { window.location.hash = ''; }}>
          閉じる
        </button>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto p-8 space-y-6">
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

const DashboardContent: React.FC = () => {
  const hash = window.location.hash;
  if (hash === '#admin-songs') return <SongManager />;
  if (hash === '#admin-lessons') return <LessonManager />;
  if (hash === '#admin-challenges') return <ChallengeManager />;
  if (hash === '#admin-users') return <UserManager />;
  return <p className="text-gray-400">サイドバーから管理項目を選択してください。</p>;
}; 
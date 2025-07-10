import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';

/**
 * マイページモーダル
 * Hash `#mypage` で表示。
 * MVP 実装: プロフィールと累計 XP を閲覧するシンプルな UI。
 */
const MypageModal: React.FC = () => {
  const { profile } = useAuthStore();
  const toast = useToast();
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const check = () => setOpen(window.location.hash === '#mypage');
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  if (!open) return null;

  // 非ログインなら警告して閉じる
  if (!profile) {
    toast('ログインが必要です', 'warning');
    window.location.hash = '';
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={() => {
        window.location.hash = '';
      }}
    >
      <div
        className="bg-slate-800 rounded-lg p-6 w-full max-w-md text-white space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center">マイページ</h2>
        <div className="space-y-2">
          <div>
            <span className="text-gray-400 mr-2">ニックネーム:</span>
            <span>{profile.nickname}</span>
          </div>
          <div>
            <span className="text-gray-400 mr-2">ランク:</span>
            <span>{profile.rank}</span>
          </div>
          <div>
            <span className="text-gray-400 mr-2">レベル:</span>
            <span>{profile.level}</span>
          </div>
          <div>
            <span className="text-gray-400 mr-2">累計XP:</span>
            <span>{profile.xp}</span>
          </div>
        </div>
        <button
          className="btn btn-primary w-full"
          onClick={() => {
            window.location.hash = '';
          }}
        >
          閉じる
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default MypageModal; 
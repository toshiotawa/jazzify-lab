import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/ui/Header';

/**
 * マイページページ (モーダル→ページ化)
 * Hash `#mypage` で表示。
 */
const MypagePage: React.FC = () => {
  const { profile } = useAuthStore();
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
    alert('ログインが必要です');
    window.location.hash = '#login';
    return null;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      {/* Global header */}
      <Header />

      {/* Page body */}
      <div className="flex-1 w-full flex flex-col items-center overflow-auto p-6">
        <div className="w-full max-w-md space-y-4">
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
              window.location.hash = '#dashboard';
            }}
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default MypagePage; 
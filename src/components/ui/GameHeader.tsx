import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGameActions } from '@/stores/helpers';
import { FaHome, FaUserCircle } from 'react-icons/fa';

/**
 * ゲーム画面で用いるヘッダーを共通化したコンポーネント。
 * GameScreen だけでなくマイページやアカウントページでも再利用する。
 */
const GameHeader: React.FC = () => {
  const gameActions = useGameActions();

  return (
    <header className="flex-shrink-0 bg-game-surface border-b border-gray-700 px-3 py-1 z-[60]">
      <div className="flex justify-between items-center">
        {/* 左側ナビゲーション */}
        <div className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {/* トップ (ダッシュボード) */}
          <button
            className="text-white hover:text-primary-400 font-bold px-2"
            onClick={() => {
              window.location.href = '/main#dashboard';
            }}
          >
            トップ
          </button>

          {/* 曲選択タブ */}
          <HashButton
            hash="#songs"
            onClick={() => {
              gameActions.setCurrentTab?.('songs');
            }}
          >
            曲選択
          </HashButton>

          <HashButton hash="#lessons">レッスン</HashButton>
          <HashButton hash="#ranking">ランキング</HashButton>
          <HashButton hash="#mission-ranking">ミッションランキング</HashButton>
          <HashButton hash="#missions">ミッション</HashButton>
          <HashButton hash="#diary">日記</HashButton>
          <HashButton hash="#information">お知らせ</HashButton>
        </div>

        {/* 右側のコントロール */}
        <HeaderRightControls />
      </div>
    </header>
  );
};

/******************** サブコンポーネント ********************/
interface HashButtonProps {
  hash: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const HashButton: React.FC<HashButtonProps> = ({ hash, children, onClick }) => {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const active = currentHash === hash;

  return (
    <button
      onClick={() => {
        window.location.hash = hash;
        onClick?.();
      }}
      className={`tab-xs ${active ? 'tab-active' : 'tab-inactive'}`}
    >
      {children}
    </button>
  );
};

const HeaderRightControls: React.FC = () => {
  const { user, isGuest, logout } = useAuthStore();

  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      {user && !isGuest ? (
        <>
          {/* モバイル時はアイコン表示 */}
          <a 
            href="#mypage" 
            className="sm:hidden p-2 text-white hover:text-primary-400 transition-colors"
            aria-label="マイページ"
          >
            <FaHome size={20} />
          </a>
          <a 
            href="#account" 
            className="sm:hidden p-2 text-white hover:text-primary-400 transition-colors"
            aria-label="アカウント"
          >
            <FaUserCircle size={20} />
          </a>
          
          {/* デスクトップ時はテキスト表示 */}
          <a href="#mypage" className="hidden sm:inline-flex btn btn-sm btn-ghost text-white hover:text-primary-400">
            マイページ
          </a>
          <a href="#account" className="hidden sm:inline-flex btn btn-sm btn-primary">
            アカウント
          </a>
        </>
      ) : isGuest ? (
        <>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={() => {
              logout();
              window.location.hash = '#login';
            }}
          >
            会員登録
          </button>
        </>
      ) : (
        <button className="btn btn-sm btn-outline" onClick={logout}>ログアウト</button>
      )}
    </div>
  );
};

export default GameHeader; 
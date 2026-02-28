import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGameActions } from '@/stores/helpers';
import NotificationBell from '@/components/ui/NotificationBell';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { FaUserCircle } from 'react-icons/fa';

/**
 * ゲーム画面で用いるヘッダーを共通化したコンポーネント。
 * GameScreen だけでなくマイページやアカウントページでも再利用する。
 */
const GameHeader: React.FC = () => {
    const gameActions = useGameActions();
      const { isGuest, profile } = useAuthStore();
      const geoCountry = useGeoStore(state => state.country);
      const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const isStandardGlobal = profile?.rank === 'standard_global';
  const isFree = profile?.rank === 'free';

  return (
    <header className="flex-shrink-0 bg-game-surface border-b border-gray-700 px-3 py-1 z-[60]">
      <div className="flex justify-between items-center gap-2">
        {/* 左側ナビゲーション */}
        <div className="flex-1 min-w-0 flex items-center space-x-1 sm:space-x-2 overflow-x-auto whitespace-nowrap pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {/* トップ (ダッシュボード) */}
          <button
            className="text-white hover:text-primary-400 font-bold px-2"
            onClick={() => {
              window.location.href = '/main#dashboard';
            }}
          >
              {isEnglishCopy ? 'Home' : 'トップ'}
          </button>

            {!isStandardGlobal && !isFree && <HashButton hash="#lessons" disabled={isGuest}>{isEnglishCopy ? 'Lessons' : 'レッスン'}</HashButton>}
            {!isFree && <HashButton hash="#fantasy">{isEnglishCopy ? 'Fantasy' : 'ファンタジー'}</HashButton>}
            {!isFree && <HashButton hash="#survival" disabled={isGuest}>{isEnglishCopy ? 'Survival' : 'サバイバル'}</HashButton>}

          {!isFree && (
            <HashButton
              hash="#songs"
              onClick={() => {
                gameActions.setCurrentTab?.('songs');
              }}
              disabled={isGuest}
            >
                {isEnglishCopy ? 'Legend' : 'レジェンド'}
            </HashButton>
          )}

            {!isFree && <HashButton hash="#ranking" disabled={isGuest}>{isEnglishCopy ? 'Ranking' : 'ランキング'}</HashButton>}
            {!isFree && <HashButton hash="#missions" disabled={isGuest}>{isEnglishCopy ? 'Missions' : 'ミッション'}</HashButton>}
            {!isStandardGlobal && !isFree && <HashButton hash="#diary" disabled={isGuest}>{isEnglishCopy ? 'Diary' : '日記'}</HashButton>}
            {!isFree && <HashButton hash="#information" disabled={isGuest}>{isEnglishCopy ? 'Updates' : 'お知らせ'}</HashButton>}
        </div>

          {/* 右側のコントロール */}
          <HeaderRightControls isEnglishCopy={isEnglishCopy} />
      </div>
    </header>
  );
};

/******************** サブコンポーネント ********************/
interface HashButtonProps {
  hash: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const HashButton: React.FC<HashButtonProps> = ({ hash, children, onClick, disabled }) => {
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
        if (!disabled) {
          window.location.hash = hash;
          onClick?.();
        }
      }}
      className={`px-2 py-1 text-xs sm:text-sm whitespace-nowrap ${active ? 'tab-active' : 'tab-inactive'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface HeaderRightControlsProps {
  isEnglishCopy: boolean;
}

const HeaderRightControls: React.FC<HeaderRightControlsProps> = ({ isEnglishCopy }) => {
    const { user, isGuest, logout } = useAuthStore();

  return (
    <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 whitespace-nowrap">
      {user && !isGuest ? (
        <>
          {/* 通知ベル（アカウントの左） */}
          <NotificationBell />
          {/* モバイル: アイコンのみ */}
          <a 
            href="#account" 
            className="sm:hidden p-2 text-white hover:text-primary-400 transition-colors"
            aria-label={isEnglishCopy ? 'Account' : 'アカウント'}
          >
            <FaUserCircle size={24} />
          </a>
          {/* デスクトップ: テキストボタン */}
          <a href="#account" className="hidden sm:inline-flex btn btn-sm btn-primary">
            {isEnglishCopy ? 'Account' : 'アカウント'}
          </a>
        </>
      ) : isGuest ? (
        <>
          <button 
            className="btn btn-sm btn-primary text-xs px-2 py-1 sm:text-base sm:px-4 sm:py-2 whitespace-nowrap" 
            onClick={() => {
              logout();
              window.location.href = 'https://jazzify.jp/';
            }}
          >
              {isEnglishCopy ? 'Sign Up' : '会員登録'}
          </button>
        </>
      ) : (
          <button className="btn btn-sm btn-outline text-xs px-2 py-1 sm:text-base sm:px-4 sm:py-2" onClick={async ()=>{ await logout(); window.location.href = 'https://jazzify.jp/'; }}>{isEnglishCopy ? 'Log out' : 'ログアウト'}</button>
      )}
    </div>
  );
};

export default GameHeader; 
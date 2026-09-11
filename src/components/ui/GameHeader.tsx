import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { FaUserCircle } from 'react-icons/fa';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';
import PaymentIssueBanner from '@/components/ui/PaymentIssueBanner';
import { cn } from '@/utils/cn';

const GameHeader: React.FC = () => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore((state) => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });

  return (
    <>
      <header className="flex-shrink-0 bg-game-surface border-b border-gray-700 px-3 py-1 z-[60]">
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center space-x-1 sm:space-x-2 overflow-x-auto whitespace-nowrap pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            <NavPathButton path="/main/dashboard" onIos={() => sendGameCallback('gameEnd')}>
              {isEnglishCopy ? 'Home' : 'トップ'}
            </NavPathButton>
            <NavPathButton path="/main/courses">
              {isEnglishCopy ? 'Quests' : 'クエスト'}
            </NavPathButton>
            <NavPathButton path="/main/play" excludePathPrefix="/main/play/training">
              {isEnglishCopy ? 'Play' : 'プレイ'}
            </NavPathButton>
            <NavPathButton path="/main/play/training">
              {isEnglishCopy ? 'Training' : 'トレーニング'}
            </NavPathButton>
          </div>
          <HeaderRightControls isEnglishCopy={isEnglishCopy} />
        </div>
      </header>
      <PaymentIssueBanner />
    </>
  );
};

interface NavPathButtonProps {
  path: string;
  children: React.ReactNode;
  onIos?: () => void;
  /** このプレフィックス配下は別タブ扱いにして active にしない */
  excludePathPrefix?: string;
}

const NavPathButton: React.FC<NavPathButtonProps> = ({ path, children, onIos, excludePathPrefix }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const excluded = excludePathPrefix != null && location.pathname.startsWith(excludePathPrefix);
  const active = !excluded && (location.pathname === path || location.pathname.startsWith(`${path}/`));

  return (
    <button
      type="button"
      className={cn(
        'px-2 py-1 text-xs sm:text-sm whitespace-nowrap font-accent font-bold',
        active ? 'tab-active' : 'tab-inactive',
      )}
      onClick={() => {
        if (isIOSWebView() && onIos) {
          onIos();
          return;
        }
        navigate(path);
      }}
    >
      {children}
    </button>
  );
};

interface HeaderRightControlsProps {
  isEnglishCopy: boolean;
}

const HeaderRightControls: React.FC<HeaderRightControlsProps> = ({ isEnglishCopy }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 whitespace-nowrap">
      {user ? (
        <>
          <button
            type="button"
            className="sm:hidden p-2 text-white hover:text-primary-400 transition-colors"
            aria-label={isEnglishCopy ? 'Account' : 'アカウント'}
            onClick={() => navigate('/main/account')}
          >
            <FaUserCircle size={24} />
          </button>
          <button
            type="button"
            className="hidden sm:inline-flex btn btn-sm btn-primary font-accent font-bold"
            onClick={() => navigate('/main/account')}
          >
            {isEnglishCopy ? 'Account' : 'アカウント'}
          </button>
        </>
      ) : null}
    </div>
  );
};

export default GameHeader;

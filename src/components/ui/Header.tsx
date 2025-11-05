import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { FaBars, FaTimes } from 'react-icons/fa';
import NotificationBell from '@/components/ui/NotificationBell';

const Header: React.FC = () => {
  const { user, isGuest, logout, enterGuestMode, profile } = useAuthStore();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const isEnglishCopy = shouldUseEnglishCopy(profile?.rank);
  // ログイン状態に移行したらゲストIDをクリーンアップ
  if (user && !isGuest) {
    try { localStorage.removeItem('guest_id'); } catch {}
  }

  const handleLogoutToLogin = async () => {
    await logout();
    localStorage.removeItem('guest_id');
    location.href = 'https://jazzify.jp/';
    toast.info(isEnglishCopy ? 'Redirected to login page' : 'ログイン画面へ切り替えました');
    setMenuOpen(false);
  };

  const handleGuest = () => {
    enterGuestMode();
    toast.info(isEnglishCopy ? 'Started in guest mode' : 'ゲストモードで開始');
    window.location.hash = '';
    setMenuOpen(false);
  };

  return (
    <header className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/70 backdrop-blur z-40">
      {/* Left: Top page button */}
      <button 
        onClick={() => window.location.href = '/'}
        className="text-xl font-bold text-white hover:text-blue-300 transition-colors"
      >
        JazzGame
      </button>

      {/* Desktop: Right buttons */}
      <div className="hidden md:flex items-center space-x-2">
          {!user && !isGuest && (
            <>
              <button className="btn btn-sm btn-primary text-sm px-3 py-1.5" onClick={()=>{location.hash='#login';}}>
                {isEnglishCopy ? 'Sign Up' : '会員登録'}
              </button>
              <button className="btn btn-sm btn-outline text-sm px-3 py-1.5" onClick={()=>{location.hash='#login';}}>
                {isEnglishCopy ? 'Log In' : 'ログイン'}
              </button>
              <button className="btn btn-sm btn-secondary text-sm px-3 py-1.5" onClick={handleGuest}>
                {isEnglishCopy ? 'Play demo' : 'おためしプレイ'}
              </button>
            </>
          )}
          {isGuest && (
            <button className="btn btn-sm btn-secondary text-sm px-3 py-1.5" onClick={handleLogoutToLogin}>
              {isEnglishCopy ? 'Log in / Sign up' : 'ログイン / 会員登録'}
            </button>
          )}
        {user && (
          <>
              <button className="btn btn-sm btn-primary text-sm px-3 py-1.5" onClick={()=>{location.href='/main#dashboard'}}>
                {isEnglishCopy ? 'Dashboard' : 'ダッシュボード'}
            </button>
            {/* 通知ベル（アカウントの左） */}
            <NotificationBell />
            <button className="btn btn-sm text-sm px-3 py-1.5" onClick={()=>{location.hash='#account'}}>
                {isEnglishCopy ? 'Account' : 'アカウント'}
            </button>
            
            {useAuthStore.getState().profile?.rank !== 'standard_global' && (
              <button className="btn btn-sm btn-outline text-sm px-3 py-1.5" onClick={()=>{location.hash='#diary';}}>
                  {isEnglishCopy ? 'Community' : 'コミュニティ'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Mobile: Menu button */}
      <button
        className="md:hidden p-2 text-white hover:text-blue-300 transition-colors"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="メニュー"
      >
        {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur z-30 md:hidden">
          <div className="flex flex-col space-y-2 p-4">
            {!user && !isGuest && (
              <>
                  <button className="btn btn-sm btn-primary w-full text-left text-base" onClick={()=>{location.hash='#login'; setMenuOpen(false);}}>
                    {isEnglishCopy ? 'Sign Up' : '会員登録'}
                </button>
                  <button className="btn btn-sm btn-outline w-full text-left text-base" onClick={()=>{location.hash='#login'; setMenuOpen(false);}}>
                    {isEnglishCopy ? 'Log In' : 'ログイン'}
                </button>
                <button className="btn btn-sm btn-secondary w-full text-left text-base" onClick={handleGuest}>
                    {isEnglishCopy ? 'Play demo' : 'おためしプレイ'}
                </button>
              </>
            )}
            {isGuest && (
              <button className="btn btn-sm btn-secondary w-full text-left text-base" onClick={handleLogoutToLogin}>
                  {isEnglishCopy ? 'Log in / Sign up' : 'ログイン / 会員登録'}
              </button>
            )}
            {user && (
              <>
                {/* 通知ベル（アカウントの左） */}
                <div className="flex items-center">
                  <NotificationBell />
                </div>
                  <button 
                    className="btn btn-sm btn-primary w-full text-left text-base" 
                    onClick={()=>{location.href='/main#dashboard'; setMenuOpen(false);}}
                  >
                    {isEnglishCopy ? 'Dashboard' : 'ダッシュボード'}
                  </button>
                  <button 
                    className="btn btn-sm w-full text-left text-base" 
                    onClick={()=>{location.hash='#account'; setMenuOpen(false);}}
                  >
                    {isEnglishCopy ? 'Account' : 'アカウント'}
                  </button>
                  
                  {useAuthStore.getState().profile?.rank !== 'standard_global' && (
                    <button 
                      className="btn btn-sm btn-outline w-full text-left text-base" 
                      onClick={()=>{location.hash='#diary'; setMenuOpen(false);}}
                    >
                      {isEnglishCopy ? 'Community' : 'コミュニティ'}
                    </button>
                  )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 
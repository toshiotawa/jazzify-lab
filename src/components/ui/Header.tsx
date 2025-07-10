import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';

const Header: React.FC = () => {
  const { user, isGuest, logout, enterGuestMode } = useAuthStore();
  const toast = useToast();

  const handleLogoutToLogin = async () => {
    await logout();
    localStorage.removeItem('guest_id');
    location.hash = '#login';
    toast('ログイン画面へ切り替えました','info');
  };

  const handleGuest = () => {
    enterGuestMode();
    toast('ゲストモードで開始','info');
    window.location.hash = '';
  };

  return (
    <header className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/70 backdrop-blur z-40">
      {/* Left: Top page button placeholder */}
      <a href="#" className="text-xl font-bold text-white">JazzGame</a>

      {/* Right buttons */}
      <div className="space-x-2 flex items-center">
        {!user && !isGuest && (
          <>
            <button className="btn btn-sm btn-primary" onClick={()=>{location.hash='#login';}}>会員登録</button>
            <button className="btn btn-sm btn-outline" onClick={()=>{location.hash='#login';}}>ログイン</button>
            <button className="btn btn-sm btn-secondary" onClick={handleGuest}>おためしプレイ</button>
          </>
        )}
        {isGuest && (
          <button className="btn btn-sm btn-secondary" onClick={handleLogoutToLogin}>ログイン / 会員登録</button>
        )}
        {user && (
          <>
            <button className="btn btn-sm" onClick={()=>{location.hash='#account'}} >アカウント</button>
            <button className="btn btn-sm btn-outline" onClick={()=>{location.hash='#mypage'}} >マイページ</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header; 
import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { FaBars, FaTimes } from 'react-icons/fa';

const Header: React.FC = () => {
  const { user, isGuest, logout, enterGuestMode } = useAuthStore();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  // ログイン状態に移行したらゲストIDをクリーンアップ
  if (user && !isGuest) {
    try { localStorage.removeItem('guest_id'); } catch {}
  }

  const handleLogoutToLogin = async () => {
    await logout();
    localStorage.removeItem('guest_id');
    location.hash = '#login';
    toast.info('ログイン画面へ切り替えました');
    setMenuOpen(false);
  };

  const handleGuest = () => {
    enterGuestMode();
    toast.info('ゲストモードで開始');
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
            <button className="btn btn-sm btn-primary" onClick={()=>{location.hash='#login';}}>
              会員登録
            </button>
            <button className="btn btn-sm btn-outline" onClick={()=>{location.hash='#login';}}>
              ログイン
            </button>
            <button className="btn btn-sm btn-secondary" onClick={handleGuest}>
              おためしプレイ
            </button>
          </>
        )}
        {isGuest && (
          <button className="btn btn-sm btn-secondary" onClick={handleLogoutToLogin}>
            ログイン / 会員登録
          </button>
        )}
        {user && (
          <>
            <button className="btn btn-sm btn-primary" onClick={()=>{location.href='/main#dashboard'}}>
              ダッシュボード
            </button>
            <button className="btn btn-sm" onClick={()=>{location.hash='#account'}}>
              アカウント
            </button>
            
            {useAuthStore.getState().profile?.rank !== 'standard_global' && (
              <button className="btn btn-sm btn-outline" onClick={()=>{location.hash='#diary';}}>
                コミュニティ
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
                <button className="btn btn-sm btn-primary w-full text-left" onClick={()=>{location.hash='#login'; setMenuOpen(false);}}>
                  会員登録
                </button>
                <button className="btn btn-sm btn-outline w-full text-left" onClick={()=>{location.hash='#login'; setMenuOpen(false);}}>
                  ログイン
                </button>
                <button className="btn btn-sm btn-secondary w-full text-left" onClick={handleGuest}>
                  おためしプレイ
                </button>
              </>
            )}
            {isGuest && (
              <button className="btn btn-sm btn-secondary w-full text-left" onClick={handleLogoutToLogin}>
                ログイン / 会員登録
              </button>
            )}
            {user && (
              <>
                <button 
                  className="btn btn-sm btn-primary w-full text-left" 
                  onClick={()=>{location.href='/main#dashboard'; setMenuOpen(false);}}
                >
                  ダッシュボード
                </button>
                <button 
                  className="btn btn-sm w-full text-left" 
                  onClick={()=>{location.hash='#account'; setMenuOpen(false);}}
                >
                  アカウント
                </button>
                
                {useAuthStore.getState().profile?.rank !== 'standard_global' && (
                  <button 
                    className="btn btn-sm btn-outline w-full text-left" 
                    onClick={()=>{location.hash='#diary'; setMenuOpen(false);}}
                  >
                    コミュニティ
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
import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { FaBars, FaTimes } from 'react-icons/fa';

const Header: React.FC = () => {
  const { user, profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const [menuOpen, setMenuOpen] = useState(false);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });
  // ログイン状態に移行したらゲストIDをクリーンアップ
  if (user) {
    try { localStorage.removeItem('guest_id'); } catch {}
  }

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
          {!user && (
            <>
              <button className="btn btn-sm btn-primary text-sm px-3 py-1.5" onClick={()=>{location.hash='#login';}}>
                {isEnglishCopy ? 'Sign Up' : '会員登録'}
              </button>
              <button className="btn btn-sm btn-outline text-sm px-3 py-1.5" onClick={()=>{location.hash='#login';}}>
                {isEnglishCopy ? 'Log In' : 'ログイン'}
              </button>
            </>
          )}
        {user && (
          <>
              <button className="btn btn-sm btn-primary text-sm px-3 py-1.5" onClick={()=>{location.href='/main#dashboard'}}>
                {isEnglishCopy ? 'Dashboard' : 'ダッシュボード'}
            </button>
            <button className="btn btn-sm text-sm px-3 py-1.5" onClick={()=>{location.hash='#account'}}>
                {isEnglishCopy ? 'Account' : 'アカウント'}
            </button>
            
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
            {!user && (
              <>
                  <button className="btn btn-sm btn-primary w-full text-left text-base" onClick={()=>{location.hash='#login'; setMenuOpen(false);}}>
                    {isEnglishCopy ? 'Sign Up' : '会員登録'}
                </button>
                  <button className="btn btn-sm btn-outline w-full text-left text-base" onClick={()=>{location.hash='#login'; setMenuOpen(false);}}>
                    {isEnglishCopy ? 'Log In' : 'ログイン'}
                </button>
              </>
            )}
            {user && (
              <>
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
                  
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { NavLink } from '@/data/landingPageData';

interface Props {
  isEnglishLanding: boolean;
  guestCtaLabel: string;
  navLinks: NavLink[];
  onGuestClick: () => void;
  onAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

export const LPHeader: React.FC<Props> = ({
  isEnglishLanding,
  guestCtaLabel,
  navLinks,
  onGuestClick,
  onAnchorClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-slate-900/90 backdrop-blur-md z-50 border-b border-purple-500/30">
      <div className="container mx-auto px-6 py-2 md:py-3">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            <img
              src="/default_avater/default-avater.png"
              alt="Jazzify ロゴ"
              className="w-8 h-8 rounded-full"
            />
            Jazzify
          </h1>

          {/* Desktop nav links */}
          {navLinks.length > 0 && (
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="hover:text-purple-400 transition"
                  onClick={(e) => onAnchorClick(e, link.id)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onGuestClick}
              className="hidden sm:inline-flex px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 transition text-sm font-semibold"
            >
              {guestCtaLabel}
            </button>
            <Link
              to="/signup"
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition text-xs sm:text-sm font-bold whitespace-nowrap"
            >
              {isEnglishLanding ? 'Sign In / Sign Up' : 'ログイン / 無料登録'}
            </Link>

            {/* Mobile hamburger */}
            {navLinks.length > 0 && (
              <button
                className="md:hidden p-2 text-gray-300 hover:text-white"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="メニューを開く"
                aria-expanded={menuOpen}
              >
                <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-lg`} aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && navLinks.length > 0 && (
          <div className="md:hidden mt-2 pb-3 flex flex-col gap-2 text-sm text-gray-300 border-t border-slate-700 pt-3">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="py-2 px-3 rounded hover:bg-slate-800 hover:text-purple-400 transition"
                onClick={(e) => {
                  onAnchorClick(e, link.id);
                  setMenuOpen(false);
                }}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                onGuestClick();
                setMenuOpen(false);
              }}
              className="sm:hidden py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-left font-semibold transition"
            >
              {guestCtaLabel}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string): void => {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const LpHeader: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <header
      className="lp-dark fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(9, 17, 31, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="lp-container py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <img
            src="/default_avater/default-avater-64.webp"
            alt={copy.header.logoAlt}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
            decoding="async"
          />
          <span className="font-bold text-lg" style={{ color: 'var(--lp-ink)' }}>
            Jazzify
          </span>
        </div>

        <nav className="hidden lg:flex gap-6 text-sm absolute left-1/2 -translate-x-1/2">
          {copy.header.nav.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="transition-colors text-[var(--lp-ink-muted)] hover:text-[var(--lp-gold-deep)]"
              onClick={(event) => scrollToSection(event, link.id)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/login"
            className="hidden sm:inline-flex text-sm font-semibold transition-colors text-[var(--lp-ink-muted)] hover:text-[var(--lp-gold-deep)]"
          >
            {copy.header.login}
          </Link>
          <Link to="/signup" className="lp-btn-gold px-4 py-2 text-sm">
            {copy.header.signup}
          </Link>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { TypewriterText } from './TypewriterText';

interface Props {
  heroTitleText: string;
  heroSubtitleText: string;
  primaryCtaLabel: string;
  guestCtaLabel: string;
  heroCtaAria: string;
  onGuestClick: () => void;
}

export const HeroSection: React.FC<Props> = ({
  heroTitleText,
  heroSubtitleText,
  primaryCtaLabel,
  guestCtaLabel,
  heroCtaAria,
  onGuestClick,
}) => (
  <section className="hero-bg min-h-screen pt-16 sm:pt-20 flex items-center overflow-x-hidden relative">
    <div className="container mx-auto px-6">
      <div className="firstview-layout items-center">
        <div className="w-full md:w-1/2 order-2 md:order-1">
          <div className="text-center md:text-left">
            <TypewriterText
              text={heroTitleText}
              className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 section-title"
              dataAnimate="from-behind heading-underline"
              speedMsPerChar={90}
              delayMs={100}
            />
            <p
              className="text-lg sm:text-xl md:text-2xl text-purple-200 mb-8"
              data-animate="from-behind"
            >
              {heroSubtitleText}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center md:text-left md:justify-start justify-center">
            <Link
              to="/signup"
              aria-label={heroCtaAria}
              className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold shadow-lg text-base sm:text-lg transition"
            >
              {primaryCtaLabel}
            </Link>
            <button
              onClick={onGuestClick}
              className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-slate-800 hover:bg-slate-700 font-semibold text-base sm:text-lg transition"
            >
              {guestCtaLabel}
            </button>
          </div>
        </div>
        <div className="w-full md:w-1/2 order-1 md:order-2">
          <img
            src="/first-view.png"
            alt="Jazzify - ジャズの冒険イメージ"
            className="w-full h-auto rounded-2xl shadow-2xl border border-white/10"
          />
        </div>
      </div>
    </div>

    {/* Scroll-down indicator */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce text-purple-300/70">
      <span className="text-xs tracking-widest hidden sm:block">SCROLL</span>
      <i className="fas fa-chevron-down text-lg" aria-hidden="true"></i>
    </div>
  </section>
);

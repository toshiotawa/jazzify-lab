import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpFinalCta: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      className="py-24 sm:py-32"
      style={{ background: 'linear-gradient(135deg, var(--lp-blue-dark), var(--lp-blue))' }}
    >
      <div className="lp-container">
        <h2
          className="lp-display-hero text-3xl sm:text-4xl md:text-5xl text-center"
          style={{ color: '#ffffff' }}
          data-animate="from-behind"
        >
          {copy.finalCta.heading}
        </h2>

        <div
          className="max-w-2xl mx-auto text-center space-y-3 mt-8"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          {copy.finalCta.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link to="/signup" className="lp-btn-gold px-10 py-5 text-lg">
            {copy.finalCta.cta}
          </Link>
        </div>

        <p
          className="mt-4 text-xs sm:text-sm text-center"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {copy.finalCta.note}
        </p>
      </div>
    </section>
  );
};

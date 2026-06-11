import React from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy, type LandingPricingPlan } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const CheckIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className="shrink-0"
    style={{ color: 'var(--lp-blue)' }}
  >
    <path
      d="M4 10l4 4 8-8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface PricingCardProps {
  plan: LandingPricingPlan;
  emphasized: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, emphasized }) => (
  <div
    className="lp-card p-8 flex flex-col relative"
    style={emphasized ? { border: '2px solid var(--lp-gold)' } : undefined}
  >
    {plan.badge !== null && (
      <span className="lp-pill-gold lp-pill absolute -top-3 left-1/2 -translate-x-1/2">
        {plan.badge}
      </span>
    )}

    <p className="font-bold text-sm tracking-wide" style={{ color: 'var(--lp-ink-muted)' }}>
      {plan.name}
    </p>

    <div className="mt-2">
      <span className="text-4xl font-extrabold">{plan.price}</span>
      {plan.priceSuffix !== '' && (
        <span className="text-sm ml-1" style={{ color: 'var(--lp-ink-muted)' }}>
          {plan.priceSuffix}
        </span>
      )}
    </div>

    {plan.highlights.length > 0 && (
      <div className="mt-4 space-y-1">
        {plan.highlights.map((highlight) => (
          <p
            key={highlight}
            className="text-sm font-semibold"
            style={{ color: 'var(--lp-gold-deep)' }}
          >
            {highlight}
          </p>
        ))}
      </div>
    )}

    <ul className="mt-6 space-y-3 flex-1">
      {plan.features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <CheckIcon />
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>

    <Link
      to="/signup"
      className={`mt-8 w-full ${emphasized ? 'lp-btn-gold' : 'lp-btn-outline'} px-6 py-3 text-sm`}
    >
      {plan.cta}
    </Link>
  </div>
);

export const LpPricing: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());

  return (
    <section
      id="pricing"
      className="py-20 sm:py-28 scroll-mt-20"
      style={{ background: 'var(--lp-surface)' }}
    >
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.pricing.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.pricing.heading}
        </h2>

        <div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch"
          data-animate="alt-cards"
        >
          <PricingCard plan={copy.pricing.free} emphasized={false} />
          <PricingCard plan={copy.pricing.monthly} emphasized={false} />
          <PricingCard plan={copy.pricing.yearly} emphasized />
        </div>

        <div
          className="text-center text-xs sm:text-sm mt-10 space-y-1"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.pricing.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </div>
    </section>
  );
};

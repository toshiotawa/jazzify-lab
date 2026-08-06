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
    style={{ color: 'var(--lp-gold-deep)' }}
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
            key={highlight.text}
            className="text-sm font-semibold"
            style={{ color: 'var(--lp-gold-deep)' }}
          >
            {highlight.text}
          </p>
        ))}
      </div>
    )}

    <ul className="mt-6 space-y-3 flex-1">
      {plan.features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <CheckIcon />
          <span className="lp-card-body">{feature}</span>
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
  const isEnglish = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglish);

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
          className="lp-display text-3xl sm:text-4xl text-center"
          data-animate="from-behind"
        >
          {copy.pricing.heading}
        </h2>
        <p
          className="lp-section-lead text-center mb-10 max-w-2xl mx-auto mt-4"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.pricing.lead}
        </p>

        <div
          className="lp-card p-8 sm:p-10 max-w-2xl mx-auto mb-10 text-center"
          data-animate="from-behind"
        >
          <div
            className="lp-section-lead space-y-3"
            style={{ color: 'var(--lp-ink-muted)' }}
          >
            {copy.pricing.freeIntro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Link to="/signup" className="lp-btn-gold px-10 py-4 text-lg mt-6 inline-block">
            {copy.pricing.free.cta}
          </Link>
        </div>

        <div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch mb-10"
          data-animate="alt-cards"
        >
          <PricingCard plan={copy.pricing.free} emphasized={false} />
          <PricingCard plan={copy.pricing.monthly} emphasized={false} />
          <PricingCard plan={copy.pricing.yearly} emphasized />
        </div>

        <div
          className="lp-card p-8 max-w-2xl mx-auto mb-10"
          data-animate="from-behind"
        >
          <h3 className="lp-subtitle text-lg mb-4">{copy.pricing.trial.heading}</h3>
          <div className="space-y-2" style={{ color: 'var(--lp-ink-muted)' }}>
            {copy.pricing.trial.body.map((paragraph) => (
              <p key={paragraph} className="lp-card-body">{paragraph}</p>
            ))}
          </div>
        </div>

        <div
          className="lp-note text-center space-y-1"
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

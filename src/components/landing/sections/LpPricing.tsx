import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy, type LandingPricingPlan } from '@/components/landing/landingCopy';
import { useJpyUsdRate } from '@/hooks/useJpyUsdRate';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { jpyAmountToApproxUsdWhole } from '@/utils/jpyToUsdApprox';

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
  usdRate: number | null;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, emphasized, usdRate }) => (
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
      {usdRate !== null && plan.jpyAmount !== null && (
        <p className="text-xs mt-1" style={{ color: 'var(--lp-ink-muted)' }}>
          ≈ ${jpyAmountToApproxUsdWhole(plan.jpyAmount, usdRate)} USD
        </p>
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
            {usdRate !== null && highlight.jpyAmount !== null && (
              <span className="font-normal">
                {` (≈ $${jpyAmountToApproxUsdWhole(highlight.jpyAmount, usdRate)} USD)`}
              </span>
            )}
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const [fetchRate, setFetchRate] = useState(false);
  const usdRate = useJpyUsdRate(isEnglish, fetchRate);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target || !isEnglish) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setFetchRate(true);
        observer.disconnect();
      }
    }, { threshold: 0, rootMargin: '0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [isEnglish]);

  return (
    <section
      ref={sectionRef}
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
          className="lp-section-lead text-center mb-14 max-w-2xl mx-auto mt-4"
          style={{ color: 'var(--lp-ink-muted)' }}
        >
          {copy.pricing.lead}
        </p>

        <div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch"
          data-animate="alt-cards"
        >
          <PricingCard plan={copy.pricing.free} emphasized={false} usdRate={usdRate} />
          <PricingCard plan={copy.pricing.monthly} emphasized={false} usdRate={usdRate} />
          <PricingCard plan={copy.pricing.yearly} emphasized usdRate={usdRate} />
        </div>

        <div
          className="lp-note text-center mt-10 space-y-1"
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

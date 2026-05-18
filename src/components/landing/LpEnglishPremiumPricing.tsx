import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { jpyAmountToApproxUsdWhole } from '@/utils/jpyToUsdApprox';

import { CheckIcon } from './LpPricingIcons';

const JPY_PREMIUM_MONTHLY = 4980;
const FRANKFURTER_JPY_USD = 'https://api.frankfurter.dev/v1/latest?base=JPY&symbols=USD';
const FALLBACK_USD_WHOLE = 31;

const PREMIUM_FEATURES = [
  'All Main Quest chapters & Premium topic courses',
  'Unlimited lessons & practice tasks',
  'All Survival stages',
] as const;

/**
 * English LP pricing block: paywall-style Premium summary (aligned with Japanese LP),
 * with optional live USD approximation via Frankfurter (ECB-based JPY→USD).
 */
const LpEnglishPremiumPricing: React.FC = () => {
  const [usdApproxWhole, setUsdApproxWhole] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch(FRANKFURTER_JPY_USD);
        if (!res.ok || cancelled) {
          return;
        }
        const data: unknown = await res.json();
        if (
          typeof data === 'object' &&
          data !== null &&
          'rates' in data &&
          typeof (data as { rates: unknown }).rates === 'object' &&
          (data as { rates: { USD?: unknown } }).rates !== null
        ) {
          const usd = (data as { rates: { USD?: number } }).rates.USD;
          if (typeof usd === 'number' && !cancelled) {
            setUsdApproxWhole(jpyAmountToApproxUsdWhole(JPY_PREMIUM_MONTHLY, usd));
          }
        }
      } catch {
        /* network or parse failure: keep fallback copy */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const usdDisplayWhole = usdApproxWhole ?? FALLBACK_USD_WHOLE;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,19,33,0.6)', border: '1px solid rgba(200,162,77,0.15)' }} data-animate="alt-cards text-up">
      <div className="text-center px-8 pt-10 pb-6" style={{ borderBottom: '1px solid rgba(200,162,77,0.1)' }}>
        <span className="lp-btn-gold inline-block px-4 py-1 rounded-full text-xs font-medium mb-4">Premium</span>
        <div className="flex items-baseline justify-center gap-1">
          <span className="lp-display text-4xl sm:text-5xl font-bold" style={{ color: 'var(--lp-cream)' }}>¥4,980</span>
          <span className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}> / month (tax included)</span>
        </div>
        <p className="text-sm mt-3" style={{ color: 'var(--lp-gold)' }}>
          New users receive a 7-day free trial.
        </p>
        <p className="text-sm mt-3 mb-1" style={{ color: 'var(--lp-cream-muted)' }}>
          Billed monthly via Lemon Squeezy.
        </p>
        <p className="text-xs mb-1" style={{ color: 'var(--lp-cream-muted)' }}>
          Checkout is displayed in JPY and processed in USD equivalent.
        </p>
        <p className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}>
          Approx. ${usdDisplayWhole} USD / month (reference only; rate updates daily).
        </p>
      </div>

      <div className="px-8 py-8">
        <p className="text-xs font-medium mb-6 tracking-wider" style={{ color: 'var(--lp-gold-dim)' }}>
          Unlocked with Premium
        </p>
        <ul className="space-y-5">
          {PREMIUM_FEATURES.map((text) => (
            <li key={text} className="flex items-center gap-3">
              <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
                <CheckIcon />
              </span>
              <span className="text-sm sm:text-base" style={{ color: 'var(--lp-cream)' }}>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-8 pb-10 text-center">
        <Link
          to="/signup"
          className="lp-btn-gold inline-flex items-center justify-center w-full max-w-sm px-8 py-4 rounded-full text-base sm:text-lg"
        >
          Start your free trial
        </Link>
      </div>
    </div>
  );
};

export default LpEnglishPremiumPricing;

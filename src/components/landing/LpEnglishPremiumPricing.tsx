import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { jpyAmountToApproxUsdWhole } from '@/utils/jpyToUsdApprox';

import { CheckIcon } from './LpPricingIcons';

const JPY_PREMIUM_MONTHLY = 3980;
const JPY_PREMIUM_YEARLY = 34800;
const FRANKFURTER_JPY_USD = 'https://api.frankfurter.dev/v1/latest?base=JPY&symbols=USD';
const FALLBACK_USD_MONTHLY_WHOLE = 25;
const FALLBACK_USD_YEARLY_WHOLE = 220;

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
  const [usdApproxMonthly, setUsdApproxMonthly] = useState<number | null>(null);
  const [usdApproxYearly, setUsdApproxYearly] = useState<number | null>(null);

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
            setUsdApproxMonthly(jpyAmountToApproxUsdWhole(JPY_PREMIUM_MONTHLY, usd));
            setUsdApproxYearly(jpyAmountToApproxUsdWhole(JPY_PREMIUM_YEARLY, usd));
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

  const usdMonthlyDisplay = usdApproxMonthly ?? FALLBACK_USD_MONTHLY_WHOLE;
  const usdYearlyDisplay = usdApproxYearly ?? FALLBACK_USD_YEARLY_WHOLE;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,19,33,0.6)', border: '1px solid rgba(200,162,77,0.15)' }} data-animate="alt-cards text-up">
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ borderBottom: '1px solid rgba(200,162,77,0.1)' }}>
        <div className="text-center px-8 pt-10 pb-8 sm:border-r" style={{ borderColor: 'rgba(200,162,77,0.1)' }}>
          <span className="lp-btn-gold inline-block px-4 py-1 rounded-full text-xs font-medium mb-4">Premium</span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="lp-display text-4xl sm:text-5xl font-bold" style={{ color: 'var(--lp-cream)' }}>¥3,980</span>
            <span className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}> / month (tax included)</span>
          </div>
          <p className="text-sm mt-3" style={{ color: 'var(--lp-cream-muted)' }}>Cancel anytime</p>
          <p className="text-sm mt-3" style={{ color: 'var(--lp-cream-muted)' }}>
            Approx. ${usdMonthlyDisplay} USD / month (reference only; rate updates daily).
          </p>
        </div>

        <div className="text-center px-8 pt-10 pb-8">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: 'var(--lp-gold)', color: '#0d1321' }}>Best Value</span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="lp-display text-4xl sm:text-5xl font-bold" style={{ color: 'var(--lp-cream)' }}>¥34,800</span>
            <span className="text-sm" style={{ color: 'var(--lp-cream-muted)' }}> / year (tax included)</span>
          </div>
          <p className="text-sm mt-3" style={{ color: 'var(--lp-gold)' }}>¥2,900/mo equivalent</p>
          <p className="text-sm mt-1" style={{ color: 'var(--lp-gold)' }}>Save ¥12,960/year</p>
          <p className="text-sm mt-3" style={{ color: 'var(--lp-cream-muted)' }}>
            Approx. ${usdYearlyDisplay} USD / year (reference only; rate updates daily).
          </p>
        </div>
      </div>

      <div className="text-center px-8 pt-6 pb-2">
        <p className="text-sm" style={{ color: 'var(--lp-gold)' }}>
          New users receive a 7-day free trial.
        </p>
        <p className="text-sm mt-3 mb-1" style={{ color: 'var(--lp-cream-muted)' }}>
          Billed via Lemon Squeezy (monthly or annual).
        </p>
        <p className="text-xs" style={{ color: 'var(--lp-cream-muted)' }}>
          Checkout is displayed in JPY and processed in USD equivalent.
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

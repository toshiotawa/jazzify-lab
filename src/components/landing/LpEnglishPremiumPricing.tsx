import React, { useEffect, useState } from 'react';
import { jpyAmountToApproxUsdWhole } from '@/utils/jpyToUsdApprox';

import { CheckIcon } from './LpPricingIcons';

const JPY_PREMIUM_MONTHLY = 4980;
const FRANKFURTER_JPY_USD = 'https://api.frankfurter.dev/v1/latest?base=JPY&symbols=USD';
const FALLBACK_USD_WHOLE = 31;

/**
 * English LP pricing block: JPY (tax included), Lemon Squeezy notes, optional live USD approximation.
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
    <div className="max-w-md mx-auto" data-animate="alt-cards text-up">
      <div className="pricing-card premium rounded-2xl p-8 text-center">
        <div className="lp-btn-gold text-xs px-3 py-1 rounded-full inline-block mb-4">Premium</div>
        <h3 className="text-2xl font-bold mb-2 lp-display" style={{ color: 'var(--lp-gold-light)' }}>Premium Plan</h3>
        <div className="text-3xl sm:text-4xl font-bold mb-2 lp-display" style={{ color: 'var(--lp-cream)' }}>
          ¥4,980 JPY<span className="text-sm font-normal" style={{ color: 'var(--lp-cream-muted)' }}> / month (tax included)</span>
        </div>
        <p className="text-sm mb-1" style={{ color: 'var(--lp-gold)' }}>
          7-day free trial when eligible, then billed monthly.
        </p>
        <p className="text-sm mb-1" style={{ color: 'var(--lp-cream-muted)' }}>
          Billed monthly via Lemon Squeezy.
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--lp-cream-muted)' }}>
          Checkout is displayed in JPY and processed in USD equivalent.
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--lp-cream-muted)' }}>
          Approx. ${usdDisplayWhole} USD / month (reference only; rate updates daily).
        </p>
        <ul className="space-y-3 text-sm mb-6 text-left" style={{ color: 'var(--lp-cream-muted)' }}>
          <li><CheckIcon />7-day free trial (when eligible), then monthly billing</li>
          <li><CheckIcon />Fantasy Mode (unlimited)</li>
          <li><CheckIcon />MIDI keyboard support</li>
          <li><CheckIcon />Cancel before the next renewal as described in the Terms</li>
        </ul>
      </div>
    </div>
  );
};

export default LpEnglishPremiumPricing;

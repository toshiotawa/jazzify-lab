import React from 'react';
import type { PricingFeatureRow } from '@/data/landingPageData';

interface PricingPlan {
  name: string;
  price: string;
  priceSuffix: string;
  trial: boolean;
  badge: string | null;
  highlighted: boolean;
}

interface Props {
  plans: PricingPlan[];
  features: PricingFeatureRow[];
  isEnglish: boolean;
}

const EnglishPricing: React.FC = () => (
  <section id="pricing" className="py-20 story-gradient" data-animate="slide-right text-up">
    <div className="container mx-auto px-6">
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4"
        data-animate="from-behind heading-underline"
      >
        <img src="/stage_icons/10.png" alt="Pricing" className="w-16 h-16" loading="lazy" />
        Pricing
      </h2>

      <div className="max-w-md mx-auto" data-animate="alt-cards text-up">
        <div className="pricing-card premium rounded-2xl p-8 text-center">
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-black text-xs px-3 py-1 rounded-full inline-block mb-4">
            Standard
          </div>
          <h3 className="text-2xl font-bold text-purple-300 mb-4">Monthly Plan</h3>
          <div className="text-4xl font-bold text-white mb-6">
            $19<span className="text-sm text-gray-400">/month</span>
          </div>
          <ul className="space-y-3 text-sm text-gray-400 mb-6">
            <li><i className="fas fa-check text-green-400 mr-2" aria-hidden="true"></i>1 week free trial</li>
            <li><i className="fas fa-check text-green-400 mr-2" aria-hidden="true"></i>Fantasy Mode (unlimited)</li>
            <li><i className="fas fa-check text-green-400 mr-2" aria-hidden="true"></i>MIDI keyboard support</li>
            <li><i className="fas fa-check text-green-400 mr-2" aria-hidden="true"></i>Cancel anytime</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const JapanesePricing: React.FC<{ plans: PricingPlan[]; features: PricingFeatureRow[] }> = ({
  plans,
  features,
}) => (
  <section id="pricing" className="py-20 story-gradient" data-animate="slide-right text-up">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 section-title flex items-center justify-center gap-4"
        data-animate="from-behind heading-underline"
      >
        <img src="/stage_icons/10.png" alt="料金プラン" className="w-16 h-16" loading="lazy" />
        料金プラン
      </h2>
      <p className="text-center text-sm text-green-400 mb-10">
        すべての有料プランに7日間（1週間）無料トライアル
      </p>

      <div className="overflow-x-auto" data-animate="alt-cards text-up">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left bg-slate-900/80 border border-slate-700 min-w-[140px]">
                <span className="text-gray-400 text-sm">機能</span>
              </th>
              {plans.map((plan, i) => (
                <th
                  key={i}
                  className={`p-4 text-center border border-slate-700 min-w-[120px] ${
                    plan.highlighted
                      ? 'bg-slate-800/80 border-t-2 border-t-purple-500'
                      : 'bg-slate-800/80'
                  }`}
                >
                  {plan.badge && (
                    <span
                      className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium mb-2 ${
                        plan.highlighted
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black'
                          : 'bg-slate-200 text-black'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                  <div className="text-lg font-semibold text-white">{plan.name}</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {plan.price}
                    {plan.priceSuffix && (
                      <span className="text-xs text-gray-400 font-normal">{plan.priceSuffix}</span>
                    )}
                  </div>
                  {plan.trial && <div className="text-xs text-green-400 mt-1">7日間無料トライアル</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/20'}>
                <td className="p-3 border border-slate-700 text-sm text-gray-300 font-medium whitespace-pre-line">
                  {row.label}
                </td>
                {row.values.map((v, i) => (
                  <td key={i} className="p-3 border border-slate-700 text-center">
                    {v === '○' ? (
                      <span className="text-green-400 text-lg font-bold">○</span>
                    ) : v === '×' ? (
                      <span className="text-red-400 text-lg font-bold">×</span>
                    ) : (
                      <span className="text-white text-sm font-medium">{v}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export const PricingSection: React.FC<Props> = ({ plans, features, isEnglish }) => {
  if (isEnglish) return <EnglishPricing />;
  return <JapanesePricing plans={plans} features={features} />;
};

import React, { useState } from 'react';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

export const LpFaq: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number): void => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section id="faq" className="py-20 sm:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="text-center mb-4">
          <span className="lp-eyebrow" data-animate="from-behind">
            {copy.faq.eyebrow}
          </span>
        </div>
        <h2
          className="lp-display section-title text-3xl sm:text-4xl md:text-5xl text-center mb-16"
          data-animate="from-behind heading-underline"
        >
          {copy.faq.heading}
        </h2>

        <div className="max-w-3xl mx-auto space-y-3">
          {copy.faq.items.map((item, index) => (
            <div key={item.question} className="faq-item p-6">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 text-left"
                onClick={() => toggleItem(index)}
                aria-expanded={openIndex === index}
                aria-controls={`lp-faq-${index}`}
              >
                <h3 className="font-bold text-base sm:text-lg">{item.question}</h3>
                <span aria-hidden="true" className="shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className={`transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--lp-ink-muted)' }}
                  >
                    <path
                      d="M5 8l5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

              <div
                id={`lp-faq-${index}`}
                className={openIndex === index ? 'mt-4 space-y-2' : 'hidden'}
                style={{ color: 'var(--lp-ink-muted)' }}
              >
                {item.answer.map((paragraph) => (
                  <p key={paragraph} className="text-sm sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const faqLinkClass =
  'underline transition-colors hover:text-[var(--lp-gold-deep)]';

export const LpFaq: React.FC = () => {
  const copy = getLandingCopy(shouldUseEnglishCopy());
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number): void => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section id="faq" className="py-12 sm:py-20 scroll-mt-20">
      <div className="lp-container">
        <div className="lp-heading-tick lp-heading-tick--center" />
        <h2
          className="lp-section-title text-2xl sm:text-3xl text-center mb-8"
          data-animate="from-behind"
        >
          {copy.faq.heading}
        </h2>

        <div className="max-w-2xl mx-auto space-y-3">
          {copy.faq.items.map((item, index) => (
            <div key={item.question} className="faq-item p-6">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 text-left"
                onClick={() => toggleItem(index)}
                aria-expanded={openIndex === index}
                aria-controls={`lp-faq-${index}`}
              >
                <h3 className="lp-subtitle text-base sm:text-lg">{item.question}</h3>
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
                className={openIndex === index ? 'lp-faq-content mt-4 space-y-2' : 'hidden'}
                style={{ color: 'var(--lp-ink-muted)' }}
              >
                {item.answer.map((paragraph, paragraphIndex) => {
                  const isLastParagraph = paragraphIndex === item.answer.length - 1;
                  const showInlineLink = isLastParagraph && item.inlineLink;

                  return (
                    <p key={paragraph}>
                      {paragraph}
                      {showInlineLink && item.inlineLink && (
                        <>
                          <Link to={item.inlineLink.to} className={faqLinkClass}>
                            {item.inlineLink.label}
                          </Link>
                          {item.inlineLink.suffix}
                        </>
                      )}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

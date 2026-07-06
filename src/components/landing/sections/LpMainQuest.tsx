import React from 'react';
import { getLpMainQuestShot } from '@/components/landing/landingAssets';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const StepArrow: React.FC = () => (
  <svg
    className="w-4 h-4 mx-auto my-1"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style={{ color: 'var(--lp-blue)' }}
  >
    <path
      d="M8 3v8M8 11l-3.5-3.5M8 11l3.5-3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LpMainQuest: React.FC = () => {
  const isEnglish = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglish);
  const mainQuestShot = getLpMainQuestShot(isEnglish);

  return (
    <section className="py-12 sm:py-20 scroll-mt-20">
      <div className="lp-container">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          <div>
            <h2
              className="lp-section-title text-2xl sm:text-3xl"
              data-animate="from-behind"
            >
              {copy.mainQuest.heading}
            </h2>

            <div
              className="lp-section-lead mt-8 space-y-4 mb-8"
              style={{ color: 'var(--lp-ink-muted)' }}
              data-animate="text-up"
            >
              {copy.mainQuest.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="flex flex-col items-center">
              {copy.mainQuest.steps.map((step, index) => (
                <React.Fragment key={step}>
                  <div className="lp-pill w-full justify-start px-4 py-2.5">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
                      style={{ background: 'var(--lp-blue)', color: '#ffffff' }}
                    >
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                  {index < copy.mainQuest.steps.length - 1 ? <StepArrow /> : null}
                </React.Fragment>
              ))}
            </div>

            <p className="lp-pill lp-pill-gold mt-6 w-full justify-center text-center">
              {copy.mainQuest.note}
            </p>
          </div>

          <div className="lp-shot-stage" data-animate="from-behind">
            <div className="lp-shot">
              <picture>
                <source
                  srcSet={mainQuestShot.mobileSrc}
                  media="(max-width: 767px)"
                  type="image/webp"
                />
                <img
                  src={mainQuestShot.src}
                  alt={copy.mainQuest.imageAlt}
                  width={mainQuestShot.width}
                  height={mainQuestShot.height}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto block"
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

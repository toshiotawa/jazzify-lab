import React from 'react';
import { getLpMainQuestShot } from '@/components/landing/landingAssets';
import { getLandingCopy } from '@/components/landing/landingCopy';
import { isMainQuestBlockPlayable } from '@/utils/mainQuestFreeTier';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const isFreeRoadmapStep = (blockNumber: number | null): boolean => {
  if (blockNumber === null) {
    return false;
  }
  return isMainQuestBlockPlayable(blockNumber, false);
};

export const LpFirstGoal: React.FC = () => {
  const isEnglish = shouldUseEnglishCopy();
  const copy = getLandingCopy(isEnglish);
  const mainQuestShot = getLpMainQuestShot(isEnglish);

  return (
    <section id="roadmap" className="py-12 sm:py-20 scroll-mt-20" style={{ background: 'var(--lp-surface)' }}>
      <div className="lp-container">
        <div className="grid md:grid-cols-2 gap-10 items-start max-w-5xl mx-auto mb-16">
          <div>
            <p
              className="lp-eyebrow mb-4"
              style={{ color: 'var(--lp-gold-deep)' }}
              data-animate="from-behind"
            >
              {copy.roadmap.eyebrow}
            </p>
            <h2
              className="lp-section-title text-2xl sm:text-3xl"
              data-animate="from-behind"
            >
              {copy.mainQuest.heading}
            </h2>

            <div
              className="lp-section-lead mt-8 space-y-4"
              style={{ color: 'var(--lp-ink-muted)' }}
              data-animate="text-up"
            >
              {copy.mainQuest.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <p className="lp-pill lp-pill-gold w-full justify-center text-center mt-8">
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

        <div className="max-w-3xl mx-auto">
          <h3
            className="lp-subtitle text-xl sm:text-2xl text-center mb-10"
            data-animate="from-behind"
          >
            {copy.roadmap.heading}
          </h3>

          <ol className="space-y-0" data-animate="text-up">
            {copy.roadmap.steps.map((step, index) => {
              const isFree = isFreeRoadmapStep(step.blockNumber);
              const isLast = index === copy.roadmap.steps.length - 1;

              return (
                <li key={`${step.chapter}-${step.title}`} className="relative flex gap-5 pb-8">
                  {!isLast ? (
                    <span
                      className="absolute left-[19px] top-10 bottom-0 w-px"
                      style={{ background: 'var(--lp-line)' }}
                      aria-hidden="true"
                    />
                  ) : null}

                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold z-10"
                    style={{
                      background: isFree ? 'var(--lp-gold-tint)' : 'var(--lp-blue)',
                      color: isFree ? 'var(--lp-gold-deep)' : '#ffffff',
                    }}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--lp-ink-muted)' }}
                      >
                        {step.chapter}
                      </span>
                      {isFree ? (
                        <span className="lp-pill lp-pill-gold text-xs px-2 py-0.5">
                          {copy.roadmap.freeBadge}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="lp-subtitle text-lg mb-2">{step.title}</h4>
                    <p className="lp-card-body" style={{ color: 'var(--lp-ink-muted)' }}>
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};

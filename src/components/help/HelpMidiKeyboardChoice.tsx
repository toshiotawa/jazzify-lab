import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import SiteFooter from '@/components/common/SiteFooter';
import { getHelpMidiKeyboardChoiceCopy } from '@/components/help/helpContent';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const diagramBoxClass =
  'font-mono text-sm bg-slate-800/80 p-3 rounded border border-white/10 whitespace-pre-wrap my-3';

const imgSrc = (file: string): string => encodeURI(`/midi-keyboard-recomended/${file}`);

const MODEL_IMAGE_FILES = ['32 Keys.png', '61 Keys.png', '88 Keys.png'] as const;

const HelpMidiKeyboardChoice: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const copy = getHelpMidiKeyboardChoiceCopy(isEnglishCopy ? 'en' : 'ja');

  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <Helmet>
        <title>{copy.helmetTitle}</title>
      </Helmet>
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-6 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm border border-white/10"
            aria-label={copy.backButtonAria}
          >
            {copy.backButtonLabel}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-12 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">{copy.pageTitle}</h1>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section aria-labelledby="midi-buy-conclusion-heading">
              <h2 id="midi-buy-conclusion-heading" className="text-xl font-semibold text-white mb-3">
                {copy.conclusionHeading}
              </h2>
              <p className="text-white font-medium mb-4">{copy.conclusionLead}</p>
              <p>{copy.conclusionSmallKeyboard}</p>
              <p>{copy.conclusionFullSize}</p>
              <p className="text-white/90 border-l-4 border-purple-500/60 pl-4 py-1">
                <strong className="text-white">{copy.conclusionSummaryLabel}</strong>{' '}
                {copy.conclusionSummary}
              </p>
            </section>

            <section aria-labelledby="midi-buy-size-heading">
              <h2 id="midi-buy-size-heading" className="text-xl font-semibold text-white mb-3">
                {copy.sizeHeading}
              </h2>
              <pre className={diagramBoxClass}>{copy.sizeTable}</pre>
              <p className="text-sm text-gray-400">{copy.sizeNote}</p>
            </section>

            <section aria-labelledby="midi-buy-models-heading">
              <h2 id="midi-buy-models-heading" className="text-xl font-semibold text-white mb-3">
                {copy.modelsHeading}
              </h2>
              <p>{copy.modelsIntro}</p>

              {copy.models.map((model, index) => (
                <article
                  key={model.title}
                  className="rounded-lg bg-slate-800/40 border border-white/10 overflow-hidden mb-8"
                >
                  <img
                    src={imgSrc(MODEL_IMAGE_FILES[index])}
                    alt={model.imageAlt}
                    className="w-full bg-slate-900/80 object-contain max-h-64"
                    loading="lazy"
                  />
                  <div className="p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-emerald-300 font-semibold">{model.badge}</p>
                    <h3 className="text-lg font-semibold text-white">{model.title}</h3>
                    <p className="text-sm">{model.body}</p>
                  </div>
                </article>
              ))}
            </section>

            <section
              aria-labelledby="midi-buy-disclaimer-heading"
              className="rounded-lg bg-amber-950/40 border border-amber-900/60 p-4"
            >
              <h2 id="midi-buy-disclaimer-heading" className="text-lg font-semibold text-amber-200 mb-2">
                {copy.disclaimerHeading}
              </h2>
              <p className="text-sm text-gray-200">{copy.disclaimerBody}</p>
              <p className="text-sm text-gray-400 mt-3">{copy.disclaimerNote}</p>
            </section>

            <p className="text-gray-400 text-sm border-t border-white/10 pt-6">
              {copy.iosMidiCrossLinkPrefix}
              <Link to="/help/ios-midi" className="text-blue-300 underline">
                {copy.iosMidiCrossLinkLabel}
              </Link>
              {copy.iosMidiCrossLinkSuffix}
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HelpMidiKeyboardChoice;

import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import PublicPageHelmet from '@/components/seo/PublicPageHelmet';
import { getTokushohoPageCopy } from '@/components/legal/tokushohoContent';

const TokushohoIosPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const copy = getTokushohoPageCopy({
    variant: 'ios',
    locale: isEnglishCopy ? 'en' : 'ja',
  });

  const renderEntry = (entry: { label: string; value: string; href?: string }) => (
    <div key={entry.label} className="sm:grid sm:grid-cols-[200px_1fr] sm:gap-6">
      <dt className="font-semibold text-white mb-1 sm:mb-0">{entry.label}</dt>
      <dd className="text-gray-300 leading-relaxed">
        {entry.href ? (
          <div className="space-y-1">
            <p>
              <a href={entry.href} className="text-blue-300 underline" target={entry.href.startsWith('http') ? '_blank' : undefined} rel={entry.href.startsWith('http') ? 'noreferrer' : undefined}>
                {entry.href.startsWith('mailto:') ? entry.href.replace('mailto:', '') : entry.href}
              </a>
            </p>
            {entry.label === '連絡先' || entry.label === 'Contact' ? <p>{entry.value}</p> : null}
          </div>
        ) : (
          entry.value
        )}
      </dd>
    </div>
  );

  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PublicPageHelmet
        title={copy.seo.title}
        description={copy.seo.description}
        htmlLang={isEnglishCopy ? 'en' : 'ja'}
      />
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
        <div className="container mx-auto px-6 py-12 space-y-10">
          <section>
            <h1 className="text-3xl font-bold mb-2">{copy.pageTitle}</h1>
            <p className="text-sm text-gray-400 mb-6">{copy.subtitle}</p>
            <dl className="space-y-6">
              {copy.entries.map(renderEntry)}
            </dl>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TokushohoIosPage;

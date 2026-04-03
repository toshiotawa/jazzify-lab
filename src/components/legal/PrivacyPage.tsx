import React from 'react';
import { Helmet } from 'react-helmet-async';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';
import { getPrivacyPageCopy } from '@/components/legal/privacyContent';
import type { PrivacyVariant } from '@/components/legal/privacyContent';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import type { TermsLocale } from '@/components/legal/termsContent';

const renderParagraphWithEmail = (text: string, key: string): React.ReactNode => {
  const marker = 'toshiotawa@me.com';
  if (!text.includes(marker)) {
    return <p key={key} className="text-gray-300 leading-relaxed">{text}</p>;
  }
  const parts = text.split(marker);
  return (
    <p key={key} className="text-gray-300 leading-relaxed">
      {parts[0]}
      <a href={`mailto:${marker}`} className="underline text-blue-300">{marker}</a>
      {parts.slice(1).join(marker)}
    </p>
  );
};

export interface PrivacyPageProps {
  variant?: PrivacyVariant;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ variant = 'web' }) => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const locale: TermsLocale = isEnglishCopy ? 'en' : 'ja';
  const copy = getPrivacyPageCopy({ variant, locale });

  const backButtonLabel = isEnglishCopy ? '← Back' : '← 戻る';
  const backButtonAria = isEnglishCopy ? 'Go back to the previous page' : '前のページに戻る';
  const lastUpdatedLabel = isEnglishCopy ? 'Last updated:' : '最終更新日:';

  const helmetTitle =
    variant === 'ios'
      ? (isEnglishCopy ? 'Privacy Policy (iOS) — Jazzify' : 'プライバシーポリシー（iOSアプリ版）— Jazzify')
      : (isEnglishCopy ? 'Privacy Policy — Jazzify' : 'プライバシーポリシー — Jazzify');

  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <Helmet>
        <title>{helmetTitle}</title>
      </Helmet>
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-6 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm border border-white/10"
            aria-label={backButtonAria}
          >
            {backButtonLabel}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-12 space-y-10">
          <header>
            <h1 className="text-3xl font-bold mb-2">{copy.pageTitle}</h1>
            <p className="text-sm text-gray-400">
              {lastUpdatedLabel} {copy.lastUpdated}
            </p>
          </header>

          <div className="space-y-8">
            {copy.sections.map(section => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                <div className="space-y-2">
                  {section.paragraphs.map((p, i) => renderParagraphWithEmail(p, `${section.title}-p-${i}`))}
                  {section.bullets && (
                    <ul className="list-disc pl-6 space-y-1 text-gray-300">
                      {section.bullets.map((item, i) => (
                        <li key={`${section.title}-b-${i}`} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.trailingParagraphs?.map((p, i) =>
                    renderParagraphWithEmail(p, `${section.title}-t-${i}`))}
                </div>
              </section>
            ))}
          </div>

          <footer className="border-t border-white/10 pt-6 text-sm text-gray-400">
            <p>{copy.companyFooter}</p>
            <p>{copy.dataProtectionLine}</p>
          </footer>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default PrivacyPage;

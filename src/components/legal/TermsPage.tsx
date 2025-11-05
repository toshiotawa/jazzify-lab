import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';
import { getTermsContent } from '@/components/legal/termsContent';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const termsContent = getTermsContent(isEnglishCopy ? 'en' : 'ja');
  const backButtonLabel = isEnglishCopy ? '← Back' : '← 戻る';
  const backButtonAria = isEnglishCopy ? 'Go back to the previous page' : '前のページに戻る';
  const pageTitle = isEnglishCopy ? 'Terms of Service' : '利用規約';
  const lastUpdatedLabel = isEnglishCopy ? 'Last updated:' : '最終更新日:';
  const companyFooter = isEnglishCopy ? 'KindWords LLC' : '合同会社KindWords';
  const contactFooter = isEnglishCopy
    ? (
        <p>
          For questions about these Terms, email{' '}
          <a href="mailto:toshiotawa@me.com" className="underline text-blue-300">toshiotawa@me.com</a>.
        </p>
      )
    : (
        <p>
          本規約に関するお問い合わせは <a href="mailto:toshiotawa@me.com" className="underline text-blue-300">toshiotawa@me.com</a> までお願いいたします。
        </p>
      );

  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
            <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
            <p className="text-sm text-gray-400">{lastUpdatedLabel} {termsContent.lastUpdated}</p>
          </header>

          <div className="space-y-10">
            {termsContent.articles.map(article => (
              <article key={article.id} className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">{article.title}</h2>
                {article.paragraphs.map((paragraph, index) => (
                  <p key={`${article.id}-paragraph-${index}`} className="text-gray-300 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {article.points && (
                  <ul className="list-disc pl-6 space-y-1 text-gray-300">
                    {article.points.map((point, index) => (
                      <li key={`${article.id}-point-${index}`} className="leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>

          <footer className="border-t border-white/10 pt-6 text-sm text-gray-400">
            <p>{companyFooter}</p>
            {contactFooter}
          </footer>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TermsPage;
import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';
import { termsArticles, termsLastUpdated } from '@/components/legal/termsContent';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-6 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm border border-white/10"
            aria-label="前のページに戻る"
          >
            ← 戻る
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-12 space-y-10">
          <header>
            <h1 className="text-3xl font-bold mb-2">利用規約</h1>
            <p className="text-sm text-gray-400">最終更新日: {termsLastUpdated}</p>
          </header>

          <div className="space-y-10">
            {termsArticles.map(article => (
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
            <p>合同会社KindWords</p>
            <p>本規約に関するお問い合わせは <a href="mailto:toshiotawa@me.com" className="underline text-blue-300">toshiotawa@me.com</a> までお願いいたします。</p>
          </footer>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TermsPage;
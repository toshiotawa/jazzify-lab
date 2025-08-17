import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';

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
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-6">利用規約</h1>
          <div className="space-y-4 text-gray-300">
            <p>本ページはプレースホルダーです。以下の章立ての例に沿って記載してください。</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>総則</li>
              <li>定義</li>
              <li>アカウント登録</li>
              <li>利用料金・支払</li>
              <li>禁止事項</li>
              <li>サービス提供の停止・終了</li>
              <li>免責事項・責任制限</li>
              <li>知的財産権</li>
              <li>個人情報の取扱い</li>
              <li>準拠法・裁判管轄</li>
            </ol>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TermsPage;
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteFooter from '@/components/common/SiteFooter';

const HelpIosMidi: React.FC = () => {
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
          <h1 className="text-3xl font-bold mb-6">iPhone/iPad での MIDI 機器利用について</h1>
          <p className="text-gray-300 mb-6">
            このページはプレースホルダーです。iOS Safari では Web MIDI API が利用できないため、以下のアプリの利用をご検討ください。
          </p>
          <div className="mb-6 p-4 rounded-lg bg-slate-800 border border-white/10">
            <a
              href="https://apps.apple.com/us/app/web-midi-browser/id953846217?l"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 underline"
            >
              App Store: Web MIDI Browser
            </a>
          </div>
          <div className="space-y-2 text-gray-300">
            <p>・使い方（プレースホルダー）</p>
            <p>・接続手順（プレースホルダー）</p>
            <p>・トラブルシューティング（プレースホルダー）</p>
          </div>
          <div className="mt-8">
            <Link to="/contact" className="text-blue-300 underline">お問い合わせフォーム</Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HelpIosMidi;
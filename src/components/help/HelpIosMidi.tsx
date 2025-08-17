import React from 'react';
import { Link } from 'react-router-dom';

const HelpIosMidi: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
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
    </div>
  );
};

export default HelpIosMidi;
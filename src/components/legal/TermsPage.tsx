import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-game text-white">
      <div className="max-w-4xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold mb-6">利用規約</h1>
        <p className="text-gray-200 mb-4">本ページはプレースホルダーです。正式版の規約文を後日掲載します。</p>
        <div className="space-y-4 text-gray-300">
          <p>第1条（適用）・・・</p>
          <p>第2条（会員登録）・・・</p>
          <p>第3条（禁止事項）・・・</p>
        </div>
        <div className="mt-10">
          <Link to="/" className="btn btn-outline">トップに戻る</Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
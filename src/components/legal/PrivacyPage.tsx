import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-game text-white">
      <div className="max-w-4xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold mb-6">プライバシーポリシー</h1>
        <p className="text-gray-200 mb-4">本ページはプレースホルダーです。正式版のポリシー文を後日掲載します。</p>
        <div className="space-y-4 text-gray-300">
          <p>1. 取得する情報・・・</p>
          <p>2. 利用目的・・・</p>
          <p>3. 第三者提供・・・</p>
        </div>
        <div className="mt-10">
          <Link to="/" className="btn btn-outline">トップに戻る</Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
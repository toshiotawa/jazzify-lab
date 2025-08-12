import React from 'react';
import { Link } from 'react-router-dom';

const TokushohoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-game text-white">
      <div className="max-w-4xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-bold mb-6">特定商取引法に基づく表記</h1>
        <p className="text-gray-200 mb-4">本ページはプレースホルダーです。正式版の表記を後日掲載します。</p>
        <div className="space-y-3 text-gray-300">
          <p>販売事業者：〇〇〇〇</p>
          <p>運営責任者：〇〇〇〇</p>
          <p>所在地：〇〇〇〇</p>
          <p>連絡先：support@example.com</p>
          <p>販売価格：各商品ページをご参照ください</p>
          <p>お支払い方法：クレジットカード ほか</p>
          <p>返品・キャンセル：サービスの性質上承っておりません（法令に基づく場合を除く）</p>
        </div>
        <div className="mt-10">
          <Link to="/" className="btn btn-outline">トップに戻る</Link>
        </div>
      </div>
    </div>
  );
};

export default TokushohoPage;
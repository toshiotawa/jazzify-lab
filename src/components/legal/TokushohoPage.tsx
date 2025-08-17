import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';

const TokushohoPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
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
          <h1 className="text-3xl font-bold mb-6">特定商取引法に基づく表記</h1>
          <div className="space-y-4 text-gray-300">
            <p>本ページはプレースホルダーです。以下のテンプレートに沿って記載してください。</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>販売業者（屋号）: 〇〇</li>
              <li>運営統括責任者: 〇〇</li>
              <li>所在地: 〇〇</li>
              <li>連絡先: 〇〇（メールアドレス/電話番号）</li>
              <li>販売価格: 〇〇（価格表、税込/税抜の明記）</li>
              <li>商品代金以外の必要料金: 〇〇（通信費、手数料 等）</li>
              <li>支払方法: 〇〇（クレジットカード等）</li>
              <li>支払時期: 〇〇（都度/サブスクの決済タイミング）</li>
              <li>引渡し時期: 〇〇（役務提供開始のタイミング）</li>
              <li>返品・キャンセル: 〇〇（条件/不可の場合の明記）</li>
              <li>中途解約/退会について: 〇〇（サブスクの解約方法）</li>
              <li>動作環境: 〇〇（必要端末/ブラウザ 等）</li>
              <li>特別な販売条件: 〇〇（制限年齢 等 該当時）</li>
            </ul>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TokushohoPage;
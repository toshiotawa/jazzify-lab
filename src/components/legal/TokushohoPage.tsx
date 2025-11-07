import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';

interface LegalEntry {
  label: string;
  value: React.ReactNode;
}

const legalEntries: LegalEntry[] = [
  { label: '事業者', value: '永吉俊雄' },
  { label: '販売責任者', value: '永吉俊雄' },
  {
    label: '所在地',
    value: '東京都中野区沼袋2丁目15-15 Arte哲学堂107',
  },
  {
    label: '連絡先',
    value: (
      <div className="space-y-1">
        <p>080-5421-4527</p>
        <p>
          <a href="mailto:toshiotawa@me.com" className="text-blue-300 underline">
            toshiotawa@me.com
          </a>
        </p>
        <p>ご連絡はメールにて承ります。</p>
      </div>
    ),
  },
  {
    label: 'URL',
    value: (
      <a href="https://jazzify.jp/" className="text-blue-300 underline" target="_blank" rel="noreferrer">
        https://jazzify.jp/
      </a>
    ),
  },
  {
    label: '販売価格',
    value: (
      <ul className="space-y-1 list-disc pl-5">
        <li>スタンダードプラン: 2,980円（税込）</li>
        <li>プレミアムプラン: 8,980円（税込）</li>
        <li>プラチナプラン: 12,800円（税込）</li>
        <li>ゴールドプラン: 19,800円（税込）</li>
      </ul>
    ),
  },
  {
    label: '商品代金以外の必要料金',
    value: 'インターネット接続に伴う通信料、決済手数料等はお客様のご負担となります。',
  },
  {
    label: '支払方法',
    value: 'クレジットカード決済（Stripeを利用した自動継続課金）',
  },
  {
    label: '支払時期',
    value: '7日間のトライアル終了時に初回決済が行われ、その後は1か月ごとに自動で決済されます。',
  },
  {
    label: '引渡し時期',
    value: '決済完了後、即時にアカウントへサービスを提供します（トライアル期間中も同様の機能を利用可能）。',
  },
  {
    label: '返品・キャンセル',
    value: 'デジタルコンテンツの性質上、サービス提供後の返品および返金には応じられません。',
  },
  {
    label: '中途解約・退会について',
    value: 'マイページ内の解約手続きよりいつでも解約可能です。解約後も契約期間満了日まではサービスをご利用いただけます。',
  },
  {
    label: '動作環境',
    value: '最新のGoogle Chrome、Microsoft Edge、またはSafariが利用可能なPC/タブレット環境、並びに安定したインターネット接続が必要です。',
  },
  {
    label: '特別な販売条件',
    value: '未成年の方は保護者の同意を得た上でご利用ください。日本国外からのご利用に際しては現地法令を遵守してください。',
  },
];

const supplementalEntries: LegalEntry[] = [
  {
    label: 'トライアル期間',
    value: '新規登録後7日間は無料で全機能をご利用いただけます。トライアル期間中に解約された場合、料金は発生しません。',
  },
  {
    label: 'サポート体制',
    value: '原則としてメールサポートにて対応いたします。内容により回答までお時間をいただく場合があります。',
  },
];

const TokushohoPage: React.FC = () => {
  const navigate = useNavigate();
  const renderEntry = (entry: LegalEntry) => (
    <div key={entry.label} className="sm:grid sm:grid-cols-[200px_1fr] sm:gap-6">
      <dt className="font-semibold text-white mb-1 sm:mb-0">{entry.label}</dt>
      <dd className="text-gray-300 leading-relaxed">{entry.value}</dd>
    </div>
  );

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
          <section>
            <h1 className="text-3xl font-bold mb-6">特定商取引法に基づく表記</h1>
            <dl className="space-y-6">
              {legalEntries.map(renderEntry)}
            </dl>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">補足情報</h2>
            <dl className="space-y-6">
              {supplementalEntries.map(renderEntry)}
            </dl>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TokushohoPage;
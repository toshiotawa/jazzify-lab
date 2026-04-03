import React from 'react';
import SiteFooter from '@/components/common/SiteFooter';
import { useNavigate } from 'react-router-dom';

interface LegalEntry {
  label: string;
  value: React.ReactNode;
}

const legalEntries: LegalEntry[] = [
  { label: '事業者', value: '合同会社KindWords' },
  { label: '販売責任者', value: '永吉俊雄' },
  {
    label: '所在地',
    value: '〒174-0072 東京都板橋区南常盤台1-11-6 レフア南常盤台101',
  },
  {
    label: '連絡先',
    value: (
      <div className="space-y-1">
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
    label: '販売方法',
    value:
      '本アプリの有料プラン（プレミアムプラン）は、Apple Inc.が運営するApp Storeを通じたアプリ内課金（In-App Purchase）により提供されます。表示価格、請求通貨、適用税制等は、お客様が利用される国・地域のApp Storeの表示に従います（日本のApp Storeを含め、金額は利用時点の表示が優先されます）。',
  },
  {
    label: '無料トライアル',
    value:
      '当社所定の条件に該当する場合、App Storeの表示およびAppleの定める方法により、7日間の無料トライアル（又はこれに相当するお試し期間）が付与されることがあります。初回課金のタイミング、解約方法、トライアル期間中の取扱い等はApp Storeの表示及びAppleの定める条件に従います。',
  },
  {
    label: '支払方法',
    value:
      'Apple IDに登録された決済手段に基づき、Appleの定める方法により課金されます。決済条件の詳細は、Appleの利用規約およびApp Store上の表示に従います。',
  },
  {
    label: '解約・管理',
    value:
      'サブスクリプションの管理、解約、請求に関する手続は、お客様のApple AccountまたはApp Storeのサブスクリプション設定画面に従ってください。本アプリを端末から削除しただけでは、サブスクリプションは解約されません。',
  },
  {
    label: '返金',
    value:
      '返金の可否および手続は、Appleの定める条件および運用に従います。当社が独自に返金を行えない場合があります。',
  },
  {
    label: '引渡し時期',
    value: '購入が有効化された後、速やかに本アプリ上でサービスを提供します（無料トライアル期間中も同様の機能をご利用いただけます）。',
  },
  {
    label: '動作環境',
    value: 'Appleが定める対応OS・端末上で、本アプリをインストールし、安定したインターネット接続が可能な環境が必要です。',
  },
  {
    label: '特別な販売条件',
    value: '未成年の方は保護者の同意を得た上でご利用ください。日本国外からのご利用に際しては現地法令を遵守してください。',
  },
];

const TokushohoIosPage: React.FC = () => {
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
            <h1 className="text-3xl font-bold mb-2">特定商取引法に基づく表記（iOSアプリ版）</h1>
            <p className="text-sm text-gray-400 mb-6">App Store 経由のアプリ内課金によるお申込みに関する情報です。ウェブ版（Lemon Squeezy）でのお申込みは、別途「特定商取引法に基づく表記（ウェブ版）」をご確認ください。</p>
            <dl className="space-y-6">
              {legalEntries.map(renderEntry)}
            </dl>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TokushohoIosPage;

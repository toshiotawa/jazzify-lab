export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  link?: { href: string; text: string; external?: boolean };
  extraLinks?: { href: string; text: string; external?: boolean }[];
}

export interface PricingFeatureRow {
  label: string;
  values: string[];
}

export const faqDataJa: FAQItem[] = [
  {
    id: 1,
    question: '楽器未経験者でも大丈夫ですか？',
    answer:
      'はい、全く問題ありません。Jazzifyは初心者の方を想定して作られており、楽器を触ったことがない方でも楽しく学習できる仕組みになっています。ファンタジーモードでは、ゲーム感覚でコードを覚えることができます。',
  },
  {
    id: 2,
    question: 'どんな楽器に対応していますか？',
    answer:
      'ピアノ、ギター、ベース、サックス、トランペットなど、主要なジャズ楽器に対応しています。MIDIキーボードやマイク入力にも対応しているため、お持ちの楽器で学習していただけます。',
  },
  {
    id: 3,
    question: 'オフラインでも使用できますか？',
    answer:
      '一部のコンテンツはダウンロードしてオフラインでご利用いただけます。ただし、コミュニティ機能やランキング機能など、一部の機能はインターネット接続が必要です。',
  },
  {
    id: 4,
    question: 'プラン変更はいつでもできますか？',
    answer:
      'はい、プラン変更はいつでも可能です。アップグレードの場合は即座に新機能がご利用いただけ、ダウングレードの場合は次回請求日から新プランが適用されます。',
  },
  {
    id: 5,
    question: 'キャンセル・返金は可能ですか？',
    answer:
      '月額プランはいつでもキャンセル可能です。キャンセル後も現在の請求期間内はサービスをご利用いただけます。初回登録から7日以内であれば、返金対応も承っております。',
  },
  {
    id: 6,
    question: 'iPhone、iPadでMIDI機器が使用できません。',
    answer: 'iOS（Safari等）では Web MIDI API が利用できません。App Store の Web MIDI Browser のご利用をご検討ください。',
    link: {
      href: 'https://apps.apple.com/us/app/web-midi-browser/id953846217?l',
      text: 'Web MIDI Browser',
      external: true,
    },
    extraLinks: [
      { href: '/help/ios-midi', text: '詳しくはこちら' },
      { href: '/contact', text: 'お問い合わせフォーム' },
    ],
  },
];

export const faqDataEn: FAQItem[] = [
  {
    id: 1,
    question: 'What devices can I use?',
    answer: 'You can use MIDI keyboards with our application. Connect your MIDI device and start practicing!',
  },
  {
    id: 2,
    question: 'How do I use MIDI devices on iOS (iPhone/iPad)?',
    answer: 'iOS (Safari, etc.) does not support Web MIDI API. Please use Web MIDI Browser from the App Store.',
    link: {
      href: 'https://apps.apple.com/us/app/web-midi-browser/id953846217?l',
      text: 'Web MIDI Browser',
      external: true,
    },
  },
  {
    id: 3,
    question: 'Can I cancel anytime?',
    answer: '1 week free trial is included. You can cancel your subscription at any time.',
  },
];

export const pricingFeaturesJa: PricingFeatureRow[] = [
  { label: 'コミュニティ機能\n(日記・ランキング)', values: ['×', '○', '○', '○'] },
  { label: 'ミッション', values: ['×', '○', '○', '○'] },
  { label: 'ファンタジー', values: ['×', '○', '○', '○'] },
  { label: 'レジェンド', values: ['×', '5曲', '無制限', '無制限'] },
  { label: 'サバイバル', values: ['×', '1キャラ', '無制限', '無制限'] },
  { label: 'レッスン', values: ['×', '1コースのみ', '無制限', '無制限'] },
  { label: 'レッスンブロックの\n手動解放', values: ['×', '×', '無制限', '月10ブロック'] },
  { label: 'LINEでの課題添削', values: ['×', '×', '×', '○'] },
];

export const pricingPlansJa = [
  { name: 'フリー', price: '¥0', priceSuffix: '', trial: false, badge: null, highlighted: false },
  { name: 'スタンダード', price: '¥2,980', priceSuffix: '/月', trial: true, badge: null, highlighted: false },
  { name: 'プレミアム', price: '¥8,980', priceSuffix: '/月', trial: true, badge: 'おすすめ', highlighted: true },
  { name: 'プラチナ', price: '¥14,800', priceSuffix: '/月', trial: true, badge: '最上位', highlighted: false },
];

export interface NavLink {
  id: string;
  label: string;
}

export const navLinksJa: NavLink[] = [
  { id: 'modes', label: '学習モード' },
  { id: 'pricing', label: '料金プラン' },
  { id: 'faq', label: 'FAQ' },
];

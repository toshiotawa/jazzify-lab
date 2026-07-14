import type { TermsLocale } from '@/components/legal/termsContent';

export type TokushohoVariant = 'web' | 'ios';

export interface TokushohoEntry {
  label: string;
  value: string;
  href?: string;
}

export interface TokushohoPageCopy {
  pageTitle: string;
  subtitle: string;
  supplementalHeading: string;
  entries: TokushohoEntry[];
  supplementalEntries: TokushohoEntry[];
  backButtonLabel: string;
  backButtonAria: string;
  seo: {
    title: string;
    description: string;
  };
}

const WEB_TOKUSHOHO_JA: TokushohoPageCopy = {
  pageTitle: '特定商取引法に基づく表記（ウェブ版）',
  subtitle: 'Lemon Squeezy を利用したウェブサイトからのお申込みに適用されます。',
  supplementalHeading: '補足情報',
  backButtonLabel: '← 戻る',
  backButtonAria: '前のページに戻る',
  seo: {
    title: '特定商取引法に基づく表記（ウェブ版）— Jazzify',
    description:
      'Jazzify ウェブ版（Lemon Squeezy 決済）の特定商取引法に基づく表記。事業者情報、価格、支払方法、解約条件などを掲載しています。',
  },
  entries: [
    { label: '事業者', value: '合同会社KindWords' },
    { label: '販売責任者', value: '永吉俊雄' },
    { label: '所在地', value: '〒174-0072 東京都板橋区南常盤台1-11-6 レフア南常盤台101' },
    {
      label: '連絡先',
      value: 'ご連絡はメールにて承ります。',
      href: 'mailto:toshiotawa@me.com',
    },
    { label: 'URL', value: 'https://jazzify.jp/', href: 'https://jazzify.jp/' },
    {
      label: '販売価格',
      value: 'プレミアムプラン: 月額3,980円（税込） / 年額34,800円（税込）',
    },
    {
      label: '商品代金以外の必要料金',
      value: 'インターネット接続に伴う通信料、決済手数料等はお客様のご負担となります。',
    },
    {
      label: '支払方法',
      value: 'クレジットカード等による決済（Lemon Squeezyを利用した自動継続課金）',
    },
    {
      label: '支払時期',
      value:
        '当社所定の条件に該当する初回利用者には7日間の無料トライアル期間が付与される場合があります。トライアル終了日の翌日に初回料金が課金され、その後は選択したプランに応じて自動更新されます。',
    },
    {
      label: '引渡し時期',
      value: 'お申込み完了後、速やかにアカウントへサービスを提供します（トライアル期間中も同様）。',
    },
    {
      label: '返品・キャンセル',
      value:
        'デジタルコンテンツの性質上、法令上必要な場合を除き、支払済み料金の返金には応じられません。',
    },
    {
      label: '中途解約・退会について',
      value:
        '次回更新日の前までに所定の方法で解約手続を完了してください。解約後も既に支払済みの利用期間の満了まではサービスをご利用いただけます。',
    },
    {
      label: '動作環境',
      value:
        '最新のGoogle Chrome、Microsoft Edge、またはSafariが利用可能なPC/タブレット環境、並びに安定したインターネット接続が必要です。',
    },
    {
      label: '特別な販売条件',
      value: '未成年の方は保護者の同意を得た上でご利用ください。日本国外からのご利用に際しては現地法令を遵守してください。',
    },
  ],
  supplementalEntries: [
    {
      label: 'サポート体制',
      value: '原則としてメールサポートにて対応いたします。内容により回答までお時間をいただく場合があります。',
    },
  ],
};

const WEB_TOKUSHOHO_EN: TokushohoPageCopy = {
  pageTitle: 'Legal Notice (Specified Commercial Transactions Act) — Web',
  subtitle: 'Applies to subscriptions purchased through the Jazzify website via Lemon Squeezy.',
  supplementalHeading: 'Additional information',
  backButtonLabel: '← Back',
  backButtonAria: 'Go back to the previous page',
  seo: {
    title: 'Legal Notice (Web) — Jazzify',
    description:
      'Legal notice for Jazzify web subscriptions (Lemon Squeezy). Seller information, pricing in JPY, payment methods, cancellation, and delivery terms.',
  },
  entries: [
    { label: 'Seller', value: 'KindWords LLC (Godo Kaisha KindWords)' },
    { label: 'Sales manager', value: 'Toshio Tawa' },
    {
      label: 'Address',
      value: 'Reffa Minami-Tokiwadai 101, 1-11-6 Minami-Tokiwadai, Itabashi-ku, Tokyo 174-0072, Japan',
    },
    {
      label: 'Contact',
      value: 'Please contact us by email.',
      href: 'mailto:toshiotawa@me.com',
    },
    { label: 'URL', value: 'https://en.jazzify.jp/', href: 'https://en.jazzify.jp/' },
    {
      label: 'Price',
      value: 'Premium plan: ¥3,980/month (tax included) or ¥34,800/year (tax included). Billing currency is JPY.',
    },
    {
      label: 'Fees other than product price',
      value: 'Internet connection fees and payment processing fees are borne by the customer.',
    },
    {
      label: 'Payment method',
      value: 'Credit card and other methods via Lemon Squeezy recurring billing.',
    },
    {
      label: 'Payment timing',
      value:
        'Eligible first-time users may receive a 7-day free trial. If you cancel before the trial ends, no charge applies. After the trial, billing starts on the next day and renews automatically on the selected plan cycle.',
    },
    {
      label: 'Service delivery',
      value: 'Access is provided to your account promptly after signup (including during any free trial).',
    },
    {
      label: 'Returns and refunds',
      value:
        'Due to the nature of digital content, paid fees are generally non-refundable except where required by applicable law.',
    },
    {
      label: 'Cancellation',
      value:
        'Cancel before the next renewal date using the method described in your account. You may continue using the service until the end of the paid period.',
    },
    {
      label: 'System requirements',
      value:
        'A recent version of Google Chrome, Microsoft Edge, or Safari on PC/tablet, plus a stable internet connection.',
    },
    {
      label: 'Special conditions',
      value: 'Minors must use the service with a guardian’s consent. Users outside Japan must comply with local laws.',
    },
  ],
  supplementalEntries: [
    {
      label: 'Support',
      value: 'We primarily provide support by email. Response times may vary depending on the inquiry.',
    },
  ],
};

const IOS_TOKUSHOHO_JA: TokushohoPageCopy = {
  pageTitle: '特定商取引法に基づく表記（iOSアプリ版）',
  subtitle:
    'App Store 経由のアプリ内課金によるお申込みに関する情報です。ウェブ版（Lemon Squeezy）でのお申込みは、別途「特定商取引法に基づく表記（ウェブ版）」をご確認ください。',
  supplementalHeading: '補足情報',
  backButtonLabel: '← 戻る',
  backButtonAria: '前のページに戻る',
  seo: {
    title: '特定商取引法に基づく表記（iOSアプリ版）— Jazzify',
    description:
      'Jazzify iOSアプリ（App Store アプリ内課金）の特定商取引法に基づく表記。販売方法、支払、解約、返金に関する情報です。',
  },
  entries: [
    { label: '事業者', value: '合同会社KindWords' },
    { label: '販売責任者', value: '永吉俊雄' },
    { label: '所在地', value: '〒174-0072 東京都板橋区南常盤台1-11-6 レフア南常盤台101' },
    {
      label: '連絡先',
      value: 'ご連絡はメールにて承ります。',
      href: 'mailto:toshiotawa@me.com',
    },
    { label: 'URL', value: 'https://jazzify.jp/', href: 'https://jazzify.jp/' },
    {
      label: '販売方法',
      value:
        '本アプリの有料プラン（プレミアムプラン）は、Apple Inc.が運営するApp Storeを通じたアプリ内課金（In-App Purchase）により提供されます。',
    },
    {
      label: '無料トライアル',
      value:
        '当社所定の条件に該当する場合、App Storeの表示およびAppleの定める方法により、7日間の無料トライアルが付与されることがあります。',
    },
    {
      label: '支払方法',
      value: 'Apple IDに登録された決済手段に基づき、Appleの定める方法により課金されます。',
    },
    {
      label: '解約・管理',
      value:
        'サブスクリプションの管理、解約、請求に関する手続は、Apple AccountまたはApp Storeのサブスクリプション設定画面に従ってください。',
    },
    {
      label: '返金',
      value: '返金の可否および手続は、Appleの定める条件および運用に従います。',
    },
    {
      label: '引渡し時期',
      value: '購入が有効化された後、速やかに本アプリ上でサービスを提供します。',
    },
    {
      label: '動作環境',
      value: 'Appleが定める対応OS・端末上で、本アプリをインストールし、安定したインターネット接続が可能な環境が必要です。',
    },
    {
      label: '特別な販売条件',
      value: '未成年の方は保護者の同意を得た上でご利用ください。日本国外からのご利用に際しては現地法令を遵守してください。',
    },
  ],
  supplementalEntries: [],
};

const IOS_TOKUSHOHO_EN: TokushohoPageCopy = {
  pageTitle: 'Legal Notice (Specified Commercial Transactions Act) — iOS App',
  subtitle:
    'Information for subscriptions purchased through the App Store (In-App Purchase). For web subscriptions via Lemon Squeezy, see the Web Legal Notice.',
  supplementalHeading: 'Additional information',
  backButtonLabel: '← Back',
  backButtonAria: 'Go back to the previous page',
  seo: {
    title: 'Legal Notice (iOS App) — Jazzify',
    description:
      'Legal notice for Jazzify iOS app subscriptions via the App Store. Sales method, payment, cancellation, and refund information.',
  },
  entries: [
    { label: 'Seller', value: 'KindWords LLC (Godo Kaisha KindWords)' },
    { label: 'Sales manager', value: 'Toshio Tawa' },
    {
      label: 'Address',
      value: 'Reffa Minami-Tokiwadai 101, 1-11-6 Minami-Tokiwadai, Itabashi-ku, Tokyo 174-0072, Japan',
    },
    {
      label: 'Contact',
      value: 'Please contact us by email.',
      href: 'mailto:toshiotawa@me.com',
    },
    { label: 'URL', value: 'https://en.jazzify.jp/', href: 'https://en.jazzify.jp/' },
    {
      label: 'Sales method',
      value:
        'Premium plans are sold through In-App Purchase on the App Store operated by Apple Inc. Displayed prices and billing currency follow your App Store region.',
    },
    {
      label: 'Free trial',
      value:
        'Eligible users may receive a 7-day free trial (or equivalent) as shown in the App Store and per Apple’s terms.',
    },
    {
      label: 'Payment method',
      value: 'Billed through the payment method on your Apple ID, per Apple’s terms.',
    },
    {
      label: 'Cancellation and management',
      value:
        'Manage or cancel your subscription in your Apple Account or App Store subscription settings. Deleting the app does not cancel billing.',
    },
    {
      label: 'Refunds',
      value: 'Refund eligibility and procedures follow Apple’s policies. We may not be able to issue refunds directly.',
    },
    {
      label: 'Service delivery',
      value: 'Access is provided in the app promptly after purchase is activated (including during any free trial).',
    },
    {
      label: 'System requirements',
      value: 'Compatible Apple OS and device with the app installed and a stable internet connection.',
    },
    {
      label: 'Special conditions',
      value: 'Minors must use the service with a guardian’s consent. Users outside Japan must comply with local laws.',
    },
  ],
  supplementalEntries: [],
};

const TOKUSHOHO_COPY: Record<TokushohoVariant, Record<TermsLocale, TokushohoPageCopy>> = {
  web: { ja: WEB_TOKUSHOHO_JA, en: WEB_TOKUSHOHO_EN },
  ios: { ja: IOS_TOKUSHOHO_JA, en: IOS_TOKUSHOHO_EN },
};

export const getTokushohoPageCopy = ({
  variant,
  locale,
}: {
  variant: TokushohoVariant;
  locale: TermsLocale;
}): TokushohoPageCopy => TOKUSHOHO_COPY[variant][locale];

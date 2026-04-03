import type { TermsLocale } from '@/components/legal/termsContent';

export type PrivacyVariant = 'web' | 'ios';

export interface PrivacySectionData {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  /** Rendered after bullets when order matters (e.g. delegation notice). */
  trailingParagraphs?: string[];
}

export interface PrivacyPageCopy {
  pageTitle: string;
  lastUpdated: string;
  companyFooter: string;
  dataProtectionLine: string;
  sections: PrivacySectionData[];
}

const LAST_UPDATED_JA = '2026年4月3日';
const LAST_UPDATED_EN = 'April 3, 2026';

const webPrivacyJa: PrivacyPageCopy = {
  pageTitle: 'プライバシーポリシー',
  lastUpdated: LAST_UPDATED_JA,
  companyFooter: '合同会社KindWords',
  dataProtectionLine: '個人情報保護責任者: 永吉俊雄',
  sections: [
    {
      title: '1. 事業者情報',
      paragraphs: [
        '事業者名：合同会社KindWords',
        '所在地：〒174-0072 東京都板橋区南常盤台1-11-6 レフア南常盤台101',
        '代表者：永吉俊雄',
        'お問い合わせ先：toshiotawa@me.com',
      ],
    },
    {
      title: '2. 取得する情報',
      paragraphs: ['当社は、本サービスの提供にあたり、以下の情報を取得することがあります。'],
      bullets: [
        '会員登録、プロフィール設定その他の入力フォームに利用者が入力する情報（例：ニックネーム、メールアドレス、居住国その他利用者が任意に入力する情報）',
        '本サービスの利用に伴って生成または記録される情報（例：利用日時、学習進捗、演奏ログ、アクセス履歴、端末情報、IPアドレス、エラー情報）',
        'お問い合わせ、アンケート、サポート対応等を通じて利用者が任意に提供する情報',
        '決済に関連して外部決済事業者から当社に提供される情報（例：購入状況、注文情報、トークン化された決済ID、サブスクリプション状態等）',
        'なお、当社はクレジットカード番号等の決済情報そのものを取得・保有しません。',
      ],
    },
    {
      title: '3. 取得方法',
      paragraphs: ['当社は、次の方法により情報を取得します。'],
      bullets: [
        '利用者による入力',
        '本サービスの利用に伴う自動取得',
        '利用者からの問い合わせや連絡',
        '外部事業者からの連携',
      ],
    },
    {
      title: '4. 利用目的',
      paragraphs: ['当社は、取得した情報を以下の目的で利用します。'],
      bullets: [
        '本サービスの提供、維持、運営のため',
        '本人確認、アカウント管理、ログイン認証のため',
        '利用料金の決済、請求、返金対応、購入状況確認のため',
        'サポート対応、お問い合わせ対応のため',
        '不正利用の防止、利用規約違反への対応、セキュリティ確保のため',
        'サービス改善、新機能開発、品質向上のため',
        '重要なお知らせ、メンテナンス情報、規約・ポリシー変更等の通知のため',
        '個人を特定できない形式に加工した統計情報の作成および利用のため',
      ],
    },
    {
      title: '5. 外部事業者の利用',
      paragraphs: [
        '当社は、本サービスの運営にあたり、以下の外部事業者を利用することがあります。',
      ],
      bullets: [
        'Lemon Squeezy：決済、購入管理、サブスクリプション管理',
        'Supabase：データベース、認証、バックエンド機能',
        'Netlify：ホスティング、配信基盤',
      ],
      trailingParagraphs: [
        '当社は、利用目的の達成に必要な範囲で、これらの外部事業者に情報の取扱いを委託することがあります。この場合、当社は委託先に対し、適切な契約締結その他必要かつ適切な監督を行います。',
      ],
    },
    {
      title: '6. 第三者提供',
      paragraphs: [
        '当社は、法令に基づく場合を除き、利用者の個人情報を、あらかじめ本人の同意を得ることなく第三者に提供しません。',
        'ただし、利用目的の達成に必要な範囲で外部事業者に取扱いを委託する場合は、この限りではありません。',
      ],
    },
    {
      title: '7. 国外事業者の利用',
      paragraphs: [
        '当社は、クラウドサービス、決済サービスその他外部事業者の利用に伴い、利用者情報を外国に所在する事業者またはその関連事業者が取り扱う場合があります。',
        '当社は、当該取扱いに関し、適用法令に従い必要な対応を行います。',
      ],
    },
    {
      title: '8. Cookie等の利用',
      paragraphs: [
        '当社は、本サービスの提供、ログイン状態の維持、セキュリティ確保その他サービス運営に必要な範囲で、Cookieその他これに類する技術を利用することがあります。',
        '現時点では、広告配信目的または第三者提供を伴うアクセス解析目的のタグ・SDKは導入していません。',
        '今後これらを導入する場合は、本ポリシーの改定または別途の通知により公表します。',
      ],
    },
    {
      title: '9. 安全管理措置',
      paragraphs: [
        '当社は、個人情報の漏えい、滅失または毀損の防止その他個人情報の安全管理のため、必要かつ適切な措置を講じます。',
      ],
    },
    {
      title: '10. 開示、訂正、削除、利用停止等',
      paragraphs: [
        '利用者は、当社に対し、法令の定めに従い、自己の個人情報について開示、訂正、追加、削除、利用停止その他の請求を行うことができます。',
        '請求を希望する場合は、下記お問い合わせ先までご連絡ください。当社は、本人確認の上、法令に従って適切に対応します。',
      ],
    },
    {
      title: '11. 未成年者の利用',
      paragraphs: [
        '未成年者が本サービスを利用する場合は、必要に応じて保護者の同意を得た上で利用してください。',
      ],
    },
    {
      title: '12. 本ポリシーの変更',
      paragraphs: [
        '当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス上で周知その他適切な方法により通知します。',
      ],
    },
    {
      title: '13. お問い合わせ窓口',
      paragraphs: [
        '合同会社KindWords',
        'プライバシーに関するお問い合わせ先：toshiotawa@me.com',
      ],
    },
  ],
};

const webPrivacyEn: PrivacyPageCopy = {
  pageTitle: 'Privacy Policy',
  lastUpdated: LAST_UPDATED_EN,
  companyFooter: 'KindWords LLC (Godo Kaisha KindWords)',
  dataProtectionLine: 'Personal information protection manager: Toshio Nagayoshi',
  sections: [
    {
      title: '1. Business operator information',
      paragraphs: [
        'Name: KindWords LLC (Godo Kaisha KindWords)',
        'Address: 1-11-6 Minami-Tokiwadai, Itabashi-ku, Tokyo 174-0072, Japan (Lehua Minami-Tokiwadai 101)',
        'Representative: Toshio Nagayoshi',
        'Contact: toshiotawa@me.com',
      ],
    },
    {
      title: '2. Information we collect',
      paragraphs: ['We may collect the following information in providing the Service.'],
      bullets: [
        'Information entered in registration, profile settings, and other forms (e.g., nickname, email address, country of residence, and other optional information)',
        'Information generated or recorded through use of the Service (e.g., usage times, learning progress, play logs, access history, device information, IP address, error information)',
        'Information voluntarily provided through inquiries, surveys, or support',
        'Information provided to us by external payment processors in connection with payments (e.g., purchase status, order information, tokenized payment IDs, subscription status)',
        'We do not obtain or retain full payment card numbers.',
      ],
    },
    {
      title: '3. How we collect information',
      paragraphs: ['We collect information by the following means.'],
      bullets: [
        'Information you provide',
        'Automatic collection when you use the Service',
        'Inquiries and communications from you',
        'Integration from external service providers',
      ],
    },
    {
      title: '4. Purposes of use',
      paragraphs: ['We use collected information for the following purposes.'],
      bullets: [
        'To provide, maintain, and operate the Service',
        'For identity verification, account management, and login authentication',
        'For billing, invoicing, refunds, and confirming purchase status',
        'For support and responding to inquiries',
        'To prevent fraud, respond to Terms violations, and ensure security',
        'To improve the Service, develop new features, and enhance quality',
        'For important notices, maintenance information, and changes to terms and policies',
        'To create and use statistical information in a form that does not identify individuals',
      ],
    },
    {
      title: '5. External service providers',
      paragraphs: [
        'We may use the following external providers in operating the Service.',
      ],
      bullets: [
        'Lemon Squeezy: payments, purchase management, subscription management',
        'Supabase: database, authentication, backend',
        'Netlify: hosting and delivery infrastructure',
      ],
      trailingParagraphs: [
        'We may entrust handling of information to these providers to the extent necessary to achieve the purposes of use. In such cases, we enter appropriate agreements with processors and exercise necessary and appropriate supervision.',
      ],
    },
    {
      title: '6. Third-party disclosure',
      paragraphs: [
        'Except as required by law, we do not provide personal information to third parties without prior consent.',
        'However, this does not apply to entrustment to external processors to the extent necessary to achieve the purposes of use.',
      ],
    },
    {
      title: '7. Use of providers outside Japan',
      paragraphs: [
        'In connection with cloud services, payment services, and other external providers, your information may be handled by businesses or their affiliates located outside Japan.',
        'We take necessary measures in accordance with applicable laws regarding such handling.',
      ],
    },
    {
      title: '8. Cookies and similar technologies',
      paragraphs: [
        'We may use cookies and similar technologies to the extent necessary to provide the Service, maintain login sessions, ensure security, and operate the Service.',
        'We do not currently deploy tags or SDKs for advertising or third-party analytics.',
        'If we introduce such technologies in the future, we will publish notice through an update to this Policy or by other means.',
      ],
    },
    {
      title: '9. Security measures',
      paragraphs: [
        'We implement necessary and appropriate measures to prevent leakage, loss, or damage of personal information and to manage it securely.',
      ],
    },
    {
      title: '10. Disclosure, correction, deletion, and suspension of use',
      paragraphs: [
        'You may request access, correction, addition, deletion, suspension of use, or other requests regarding your personal information in accordance with law.',
        'Please contact us at the address below. We will respond appropriately after verifying your identity in accordance with law.',
      ],
    },
    {
      title: '11. Minors',
      paragraphs: [
        'If a minor uses the Service, please obtain parental consent as necessary.',
      ],
    },
    {
      title: '12. Changes to this Policy',
      paragraphs: [
        'We may change this Policy when necessary. If there are important changes, we will notify users through the Service or by other appropriate means.',
      ],
    },
    {
      title: '13. Contact',
      paragraphs: [
        'KindWords LLC (Godo Kaisha KindWords)',
        'Privacy inquiries: toshiotawa@me.com',
      ],
    },
  ],
};

const iosPrivacyJa: PrivacyPageCopy = {
  pageTitle: 'プライバシーポリシー（iOSアプリ版）',
  lastUpdated: LAST_UPDATED_JA,
  companyFooter: '合同会社KindWords',
  dataProtectionLine: '個人情報保護責任者: 永吉俊雄',
  sections: [
    {
      title: '1. 事業者情報',
      paragraphs: [
        '事業者名：合同会社KindWords',
        '所在地：〒174-0072 東京都板橋区南常盤台1-11-6 レフア南常盤台101',
        '代表者：永吉俊雄',
        'お問い合わせ先：toshiotawa@me.com',
      ],
    },
    {
      title: '2. 取得する情報',
      paragraphs: ['当社は、本アプリの提供にあたり、以下の情報を取得することがあります。'],
      bullets: [
        'アカウント登録、プロフィール設定その他の入力フォームに利用者が入力する情報（例：ニックネーム、メールアドレス、居住国その他利用者が任意に入力する情報）',
        '本アプリの利用に伴って生成または記録される情報（例：利用日時、学習進捗、演奏ログ、端末情報、IPアドレス、エラー情報）',
        'お問い合わせ等を通じて利用者が任意に提供する情報',
        'アプリ内課金に関連してAppleまたは関連サービスを通じて当社が確認する情報（例：購入状況、商品識別子、取引確認情報、サブスクリプション状態等）',
        'なお、当社はクレジットカード番号等の決済情報そのものを取得・保有しません。',
      ],
    },
    {
      title: '3. 取得方法',
      paragraphs: ['当社は、次の方法により情報を取得します。'],
      bullets: [
        '利用者による入力',
        '本アプリの利用に伴う自動取得',
        '利用者からの問い合わせや連絡',
        'Appleのアプリ内課金に関する連携',
      ],
    },
    {
      title: '4. 利用目的',
      paragraphs: ['当社は、取得した情報を以下の目的で利用します。'],
      bullets: [
        '本アプリの提供、維持、運営のため',
        '本人確認、アカウント管理、ログイン認証のため',
        'アプリ内課金の購入確認、利用権限の付与、請求・返金関連対応のため',
        'サポート対応、お問い合わせ対応のため',
        '不正利用の防止、利用規約違反への対応、セキュリティ確保のため',
        'サービス改善、新機能開発、品質向上のため',
        '重要なお知らせ、メンテナンス情報、規約・ポリシー変更等の通知のため',
        '個人を特定できない形式に加工した統計情報の作成および利用のため',
      ],
    },
    {
      title: '5. 外部事業者の利用',
      paragraphs: [
        '当社は、本アプリの運営にあたり、以下の外部事業者を利用することがあります。',
      ],
      bullets: [
        'Apple：アプリ配信、アプリ内課金',
        'Supabase：データベース、認証、バックエンド機能',
        'Netlifyその他当社が利用する配信・運用基盤：関連ウェブページ、サポートページ等の提供',
      ],
      trailingParagraphs: [
        '当社は、利用目的の達成に必要な範囲で、これらの外部事業者に情報の取扱いを委託することがあります。この場合、当社は必要かつ適切な監督を行います。',
      ],
    },
    {
      title: '6. 第三者提供',
      paragraphs: [
        '当社は、法令に基づく場合を除き、利用者の個人情報を、あらかじめ本人の同意を得ることなく第三者に提供しません。',
        'ただし、利用目的の達成に必要な範囲で外部事業者に取扱いを委託する場合は、この限りではありません。',
      ],
    },
    {
      title: '7. 国外事業者の利用',
      paragraphs: [
        '当社は、クラウドサービスその他外部事業者の利用に伴い、利用者情報を外国に所在する事業者またはその関連事業者が取り扱う場合があります。',
        '当社は、当該取扱いに関し、適用法令に従い必要な対応を行います。',
      ],
    },
    {
      title: '8. アナリティクス・広告関連',
      paragraphs: [
        '現時点で、本アプリには第三者の広告SDKまたは第三者提供を伴うアクセス解析SDKを導入していません。',
        '今後これらを導入する場合は、本ポリシーおよびApp Store Connect上の申告内容を更新します。',
      ],
    },
    {
      title: '9. 安全管理措置',
      paragraphs: [
        '当社は、個人情報の漏えい、滅失または毀損の防止その他個人情報の安全管理のため、必要かつ適切な措置を講じます。',
      ],
    },
    {
      title: '10. 開示、訂正、削除、利用停止等',
      paragraphs: [
        '利用者は、当社に対し、法令の定めに従い、自己の個人情報について開示、訂正、追加、削除、利用停止その他の請求を行うことができます。',
        '請求を希望する場合は、下記お問い合わせ先までご連絡ください。当社は、本人確認の上、法令に従って適切に対応します。',
      ],
    },
    {
      title: '11. 未成年者の利用',
      paragraphs: [
        '未成年者が本アプリを利用する場合は、必要に応じて保護者の同意を得た上で利用してください。',
      ],
    },
    {
      title: '12. 本ポリシーの変更',
      paragraphs: [
        '当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本アプリ内、当社ウェブサイトその他適切な方法により通知します。',
      ],
    },
    {
      title: '13. お問い合わせ窓口',
      paragraphs: [
        '合同会社KindWords',
        'プライバシーに関するお問い合わせ先：toshiotawa@me.com',
      ],
    },
  ],
};

const iosPrivacyEn: PrivacyPageCopy = {
  pageTitle: 'Privacy Policy (iOS App)',
  lastUpdated: LAST_UPDATED_EN,
  companyFooter: 'KindWords LLC (Godo Kaisha KindWords)',
  dataProtectionLine: 'Personal information protection manager: Toshio Nagayoshi',
  sections: [
    {
      title: '1. Business operator information',
      paragraphs: [
        'Name: KindWords LLC (Godo Kaisha KindWords)',
        'Address: 1-11-6 Minami-Tokiwadai, Itabashi-ku, Tokyo 174-0072, Japan (Lehua Minami-Tokiwadai 101)',
        'Representative: Toshio Nagayoshi',
        'Contact: toshiotawa@me.com',
      ],
    },
    {
      title: '2. Information we collect',
      paragraphs: ['We may collect the following information in providing the App.'],
      bullets: [
        'Information entered in account registration, profile settings, and other forms (e.g., nickname, email address, country of residence, and other optional information)',
        'Information generated or recorded through use of the App (e.g., usage times, learning progress, play logs, device information, IP address, error information)',
        'Information voluntarily provided through inquiries',
        'Information we confirm through Apple or related services in connection with in-app purchases (e.g., purchase status, product identifiers, transaction confirmation, subscription status)',
        'We do not obtain or retain full payment card numbers.',
      ],
    },
    {
      title: '3. How we collect information',
      paragraphs: ['We collect information by the following means.'],
      bullets: [
        'Information you provide',
        'Automatic collection when you use the App',
        'Inquiries and communications from you',
        'Integration related to Apple In-App Purchase',
      ],
    },
    {
      title: '4. Purposes of use',
      paragraphs: ['We use collected information for the following purposes.'],
      bullets: [
        'To provide, maintain, and operate the App',
        'For identity verification, account management, and login authentication',
        'To confirm in-app purchases, grant entitlements, and handle billing and refunds',
        'For support and responding to inquiries',
        'To prevent fraud, respond to Terms violations, and ensure security',
        'To improve the App, develop new features, and enhance quality',
        'For important notices, maintenance information, and changes to terms and policies',
        'To create and use statistical information in a form that does not identify individuals',
      ],
    },
    {
      title: '5. External service providers',
      paragraphs: [
        'We may use the following external providers in operating the App.',
      ],
      bullets: [
        'Apple: app distribution and in-app purchases',
        'Supabase: database, authentication, backend',
        'Netlify and other delivery/operations infrastructure we use: related web pages, support pages, etc.',
      ],
      trailingParagraphs: [
        'We may entrust handling of information to these providers to the extent necessary to achieve the purposes of use. In such cases, we exercise necessary and appropriate supervision.',
      ],
    },
    {
      title: '6. Third-party disclosure',
      paragraphs: [
        'Except as required by law, we do not provide personal information to third parties without prior consent.',
        'However, this does not apply to entrustment to external processors to the extent necessary to achieve the purposes of use.',
      ],
    },
    {
      title: '7. Use of providers outside Japan',
      paragraphs: [
        'In connection with cloud services and other external providers, your information may be handled by businesses or their affiliates located outside Japan.',
        'We take necessary measures in accordance with applicable laws regarding such handling.',
      ],
    },
    {
      title: '8. Analytics and advertising',
      paragraphs: [
        'We do not currently integrate third-party advertising SDKs or analytics SDKs that involve disclosure to third parties.',
        'If we introduce such technologies in the future, we will update this Policy and the disclosures on App Store Connect.',
      ],
    },
    {
      title: '9. Security measures',
      paragraphs: [
        'We implement necessary and appropriate measures to prevent leakage, loss, or damage of personal information and to manage it securely.',
      ],
    },
    {
      title: '10. Disclosure, correction, deletion, and suspension of use',
      paragraphs: [
        'You may request access, correction, addition, deletion, suspension of use, or other requests regarding your personal information in accordance with law.',
        'Please contact us at the address below. We will respond appropriately after verifying your identity in accordance with law.',
      ],
    },
    {
      title: '11. Minors',
      paragraphs: [
        'If a minor uses the App, please obtain parental consent as necessary.',
      ],
    },
    {
      title: '12. Changes to this Policy',
      paragraphs: [
        'We may change this Policy when necessary. If there are important changes, we will notify users within the App, on our website, or by other appropriate means.',
      ],
    },
    {
      title: '13. Contact',
      paragraphs: [
        'KindWords LLC (Godo Kaisha KindWords)',
        'Privacy inquiries: toshiotawa@me.com',
      ],
    },
  ],
};

const PRIVACY_COPY: Record<PrivacyVariant, Record<TermsLocale, PrivacyPageCopy>> = {
  web: { ja: webPrivacyJa, en: webPrivacyEn },
  ios: { ja: iosPrivacyJa, en: iosPrivacyEn },
};

export interface GetPrivacyContentOptions {
  variant: PrivacyVariant;
  locale: TermsLocale;
}

export const getPrivacyPageCopy = ({ variant, locale }: GetPrivacyContentOptions): PrivacyPageCopy =>
  PRIVACY_COPY[variant][locale];

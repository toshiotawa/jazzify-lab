export interface TermsArticle {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
}

export type TermsLocale = 'ja' | 'en';

export type TermsVariant = 'web' | 'ios';

export interface TermsCopy {
  articles: TermsArticle[];
  highlights: string[];
  lastUpdated: string;
  summaryHeading: string;
  detailLinkLabel: string;
}

const webTermsJa: TermsArticle[] = [
  {
    id: 'application',
    title: '第1条（適用）',
    paragraphs: [
      '本規約は、本サービスの利用に関する当社と利用者との間の一切の関係に適用されます。',
      '当社が本サービス上で掲載するルール、ガイドライン、注意事項等は、本規約の一部を構成するものとします。',
      '本サービスに関する個人情報の取扱いについては、別途定めるプライバシーポリシーによるものとします。',
    ],
  },
  {
    id: 'definitions',
    title: '第2条（定義）',
    paragraphs: ['本規約における用語の定義は次のとおりとします。'],
    points: [
      '「利用者」とは、本サービスを閲覧、登録又は利用するすべての者をいいます。',
      '「会員」とは、当社所定の方法で利用登録を行い、当社がこれを承認した者をいいます。',
      '「プレミアムプラン」とは、本サービスにおいて当社が有料で提供するプランをいいます。',
      '「コンテンツ」とは、本サービス上で提供されるテキスト、音声、画像、動画、譜面、データ、教材、判定結果その他一切の情報をいいます。',
    ],
  },
  {
    id: 'registration',
    title: '第3条（利用登録）',
    paragraphs: [
      '利用登録を希望する者は、当社所定の方法により登録を申請するものとします。',
      '当社は、次の各号のいずれかに該当すると判断した場合、登録を拒否し、又は承認後に登録を取り消すことがあります。',
    ],
    points: [
      '虚偽の情報を届け出た場合',
      '過去に本規約違反等により利用停止その他の措置を受けたことがある場合',
      '未成年者が法定代理人の同意を得ていない場合',
      'その他、当社が不適切と判断した場合',
    ],
  },
  {
    id: 'account',
    title: '第4条（アカウント管理）',
    paragraphs: [
      '会員は、自己の責任においてアカウント情報を管理し、第三者に利用させ、貸与し、譲渡し、又は名義変更してはなりません。',
      'アカウント情報の管理不十分、使用上の過誤又は第三者の使用により生じた損害について、当社は当社に故意又は重過失がある場合を除き責任を負いません。',
    ],
  },
  {
    id: 'service',
    title: '第5条（本サービスの内容）',
    paragraphs: [
      '当社は、ジャズ学習支援を目的として、教材、音源、演奏支援機能、判定機能、進捗管理機能その他これに関連するサービスを提供します。',
      '当社は、サービス改善、保守、法令対応その他必要がある場合、本サービスの全部又は一部を変更、追加、停止又は終了することがあります。',
    ],
  },
  {
    id: 'fees',
    title: '第6条（利用料金）',
    paragraphs: [
      '本サービスの有料プランはプレミアムプランのみとし、利用料金は月額4,980円（税込）とします。',
      '当社所定の条件に該当する初回利用者には、7日間の無料トライアル期間（以下「トライアル」といいます。）を付与することがあります。トライアルの対象外となる場合があります。',
      '利用料金は、申込画面、決済画面又は当社が別途表示する方法により明示します。',
      '当社は、必要に応じて利用料金を変更することがあります。この場合、変更後の料金の適用時期及び内容を事前に合理的な方法で周知します。',
    ],
  },
  {
    id: 'payment',
    title: '第7条（支払方法、更新、解約）',
    paragraphs: [
      'プレミアムプランの支払は、Lemon Squeezyその他当社指定の決済事業者を通じて行うものとします。',
      'トライアルが付与された場合、トライアル終了日の翌日に初回の月額利用料金が課金され、その後は1か月単位で自動更新されます。トライアル期間中に当社所定の方法で解約手続を完了した場合、料金は発生しません。',
      'トライアルが付与されない場合、利用者が申込みを完了した日を起算日として1か月単位で自動更新され、初回の月額利用料金が課金されます。',
      '利用者が次回更新日前までに当社所定の方法で解約手続を完了しない限り、同一条件で自動更新されます。',
      '解約後も、既に支払済みの利用期間の満了まではプレミアムプランを利用できます。',
      '法令上必要な場合を除き、支払済みの利用料金は返金しません。',
      '決済、請求、返金、解約その他販売条件の詳細は、当社の特定商取引法に基づく表記及び決済画面の表示によるものとします。',
    ],
  },
  {
    id: 'prohibited',
    title: '第8条（禁止事項）',
    paragraphs: ['利用者は、本サービスの利用にあたり、次の各号に該当する行為をしてはなりません。'],
    points: [
      '法令又は公序良俗に違反する行為',
      '当社又は第三者の知的財産権、名誉、信用、プライバシーその他の権利利益を侵害する行為',
      '本サービスの運営を妨害し、又はそのおそれのある行為',
      '不正アクセス、リバースエンジニアリング、ソースコード解析、脆弱性探索、過度な負荷を与える行為',
      'アカウントの譲渡、貸与、共有、なりすまし',
      '本サービス又はコンテンツの無断複製、転載、再配布、販売',
      '不正な目的で本サービスを利用する行為',
      'その他、当社が不適切と判断する行為',
    ],
  },
  {
    id: 'intellectual',
    title: '第9条（知的財産権）',
    paragraphs: [
      '本サービス及びコンテンツに関する著作権、商標権その他の知的財産権は、当社又は正当な権利者に帰属します。利用者は、当社が明示的に許諾した場合を除き、これらを利用することはできません。',
    ],
  },
  {
    id: 'suspension',
    title: '第10条（利用停止等）',
    paragraphs: [
      '当社は、利用者が本規約に違反した場合又は本サービスの運営上必要がある場合、事前の通知なく、当該利用者による本サービスの利用を制限し、アカウントを停止し、又は削除することができます。',
    ],
  },
  {
    id: 'disclaimer',
    title: '第11条（免責）',
    paragraphs: [
      '当社は、本サービスが利用者の特定の目的に適合すること、期待する機能、正確性、有用性又は継続性を有することを保証しません。',
      '当社は、本サービスの利用又は利用不能により利用者に生じた損害について、当社に故意又は重過失がある場合を除き責任を負いません。',
      '当社が利用者に対して損害賠償責任を負う場合であっても、当社の軽過失による責任は、当該損害発生月の直前1か月間に当該利用者が当社に支払った利用料金の総額を上限とします。ただし、消費者契約法その他法令によりこの制限が認められない場合はこの限りではありません。',
    ],
  },
  {
    id: 'withdrawal',
    title: '第12条（退会）',
    paragraphs: [
      '会員は、当社所定の方法により退会することができます。',
      'なお、プレミアムプランの解約とアカウント退会は別途手続が必要となる場合があります。',
    ],
  },
  {
    id: 'changes',
    title: '第13条（規約の変更）',
    paragraphs: [
      '当社は、必要がある場合、本規約を変更することがあります。重要な変更がある場合は、本サービス上で周知その他適切な方法により通知します。',
    ],
  },
  {
    id: 'jurisdiction',
    title: '第14条（準拠法・合意管轄）',
    paragraphs: [
      '本規約は日本法に準拠し、本サービスに関して当社と利用者との間に生じる一切の紛争については、訴額に応じて東京地方裁判所又は東京簡易裁判所を第一審の専属的合意管轄裁判所とします。',
    ],
  },
  {
    id: 'contact',
    title: '第15条（お問い合わせ）',
    paragraphs: [
      '本規約に関するお問い合わせ先は、以下のとおりです。',
      '合同会社KindWords',
      'メールアドレス：toshiotawa@me.com',
    ],
  },
];

const webTermsEn: TermsArticle[] = [
  {
    id: 'application',
    title: 'Article 1 (Scope)',
    paragraphs: [
      'These Terms apply to all relationships between the Company and users regarding use of the Service.',
      'Rules, guidelines, notices, and similar materials posted by the Company on the Service form part of these Terms.',
      'Handling of personal information related to the Service is governed by the Privacy Policy provided separately.',
    ],
  },
  {
    id: 'definitions',
    title: 'Article 2 (Definitions)',
    paragraphs: ['Terms used in these Terms are defined as follows.'],
    points: [
      '“User” means any person who views, registers for, or uses the Service.',
      '“Member” means a person who completes registration in the manner prescribed by the Company and is approved by the Company.',
      '“Premium Plan” means the paid plan offered by the Company through the Service.',
      '“Content” means all information provided on the Service, including text, audio, images, video, scores, data, teaching materials, and evaluation results.',
    ],
  },
  {
    id: 'registration',
    title: 'Article 3 (Registration)',
    paragraphs: [
      'Persons wishing to register shall apply in the manner prescribed by the Company.',
      'The Company may refuse registration or cancel registration after approval if it determines that any of the following applies.',
    ],
    points: [
      'False information was submitted.',
      'The person has previously been subject to suspension or other measures due to a breach of these Terms.',
      'The person is a minor and has not obtained the consent of a legal guardian.',
      'The Company otherwise deems registration inappropriate.',
    ],
  },
  {
    id: 'account',
    title: 'Article 4 (Account Management)',
    paragraphs: [
      'Members shall manage their account information at their own responsibility and shall not allow third parties to use, lend, transfer, or change the name of their account.',
      'The Company shall not be liable for damages arising from inadequate management of account information, errors in use, or use by third parties, except in cases of willful misconduct or gross negligence on the part of the Company.',
    ],
  },
  {
    id: 'service',
    title: 'Article 5 (Service Content)',
    paragraphs: [
      'The Company provides services for jazz learning support, including teaching materials, audio, performance support, evaluation, progress management, and related features.',
      'The Company may change, add to, suspend, or discontinue all or part of the Service when necessary for improvement, maintenance, legal compliance, or other reasons.',
    ],
  },
  {
    id: 'fees',
    title: 'Article 6 (Fees)',
    paragraphs: [
      'The only paid plan of the Service is the Premium Plan, and the fee is ¥4,980 per month (tax included).',
      'Eligible first-time subscribers may be granted a seven-day free trial period (the “Trial”). Some users may not be eligible.',
      'Fees are displayed on the application screen, checkout screen, or by other means specified by the Company.',
      'The Company may change fees when necessary. In such cases, the Company shall notify users in advance by reasonable means of the effective date and content of the change.',
    ],
  },
  {
    id: 'payment',
    title: 'Article 7 (Payment, Renewal, and Cancellation)',
    paragraphs: [
      'Payment for the Premium Plan shall be made through Lemon Squeezy or other payment processors designated by the Company.',
      'If a Trial is granted, the first monthly fee is charged on the day after the Trial ends, and the plan renews monthly thereafter. If the user completes cancellation in the manner prescribed by the Company during the Trial, no fees will be charged.',
      'If no Trial is granted, the Premium Plan renews monthly from the day the user completes subscription, and the first monthly fee is charged accordingly.',
      'Unless the user completes cancellation in the manner prescribed by the Company before the next renewal date, the plan renews under the same conditions.',
      'After cancellation, the user may continue to use the Premium Plan until the end of the period already paid for.',
      'Except where required by law, paid fees are non-refundable.',
      'Details of payment, billing, refunds, cancellation, and other sales conditions are as stated in the Company’s Specified Commercial Transactions Act disclosure and on the checkout screen.',
    ],
  },
  {
    id: 'prohibited',
    title: 'Article 8 (Prohibited Conduct)',
    paragraphs: ['Users shall not engage in any of the following when using the Service.'],
    points: [
      'Acts that violate laws or public order and morals.',
      'Acts that infringe the intellectual property rights, reputation, credit, privacy, or other rights or interests of the Company or third parties.',
      'Acts that interfere with or may interfere with operation of the Service.',
      'Unauthorized access, reverse engineering, source code analysis, vulnerability probing, or imposing excessive load.',
      'Transfer, lending, sharing, or impersonation of accounts.',
      'Unauthorized copying, reproduction, redistribution, or sale of the Service or Content.',
      'Use of the Service for unlawful purposes.',
      'Any other conduct the Company deems inappropriate.',
    ],
  },
  {
    id: 'intellectual',
    title: 'Article 9 (Intellectual Property)',
    paragraphs: [
      'Copyrights, trademark rights, and other intellectual property rights in the Service and Content belong to the Company or legitimate right holders. Users may not use them except where expressly permitted by the Company.',
    ],
  },
  {
    id: 'suspension',
    title: 'Article 10 (Suspension of Use)',
    paragraphs: [
      'If a user breaches these Terms or if the Company otherwise deems it necessary for operation of the Service, the Company may, without prior notice, restrict the user’s use of the Service, suspend, or delete the account.',
    ],
  },
  {
    id: 'disclaimer',
    title: 'Article 11 (Disclaimer)',
    paragraphs: [
      'The Company does not warrant that the Service will meet a user’s particular purpose or that it will have expected functions, accuracy, usefulness, or continuity.',
      'The Company shall not be liable for damages arising from use or inability to use the Service, except in cases of willful misconduct or gross negligence on the part of the Company.',
      'Even if the Company is liable for damages, liability for slight negligence shall be limited to the total amount of fees paid by the user to the Company in the month immediately preceding the month in which the damage occurred, except where such limitation is not permitted under the Consumer Contract Act or other laws.',
    ],
  },
  {
    id: 'withdrawal',
    title: 'Article 12 (Withdrawal)',
    paragraphs: [
      'Members may withdraw membership in the manner prescribed by the Company.',
      'Cancellation of the Premium Plan and account withdrawal may require separate procedures.',
    ],
  },
  {
    id: 'changes',
    title: 'Article 13 (Changes to the Terms)',
    paragraphs: [
      'The Company may change these Terms when necessary. If there are important changes, the Company will notify users through the Service or by other appropriate means.',
    ],
  },
  {
    id: 'jurisdiction',
    title: 'Article 14 (Governing Law and Jurisdiction)',
    paragraphs: [
      'These Terms are governed by the laws of Japan. All disputes between the Company and users regarding the Service shall be subject to the exclusive jurisdiction of the Tokyo District Court or Tokyo Summary Court in the first instance, depending on the amount in controversy.',
    ],
  },
  {
    id: 'contact',
    title: 'Article 15 (Contact)',
    paragraphs: [
      'For inquiries regarding these Terms, contact:',
      'KindWords LLC (Godo Kaisha KindWords)',
      'Email: toshiotawa@me.com',
    ],
  },
];

const iosTermsJa: TermsArticle[] = [
  {
    id: 'application',
    title: '第1条（適用）',
    paragraphs: [
      '本規約は、本アプリの利用に関する当社と利用者との間の一切の関係に適用されます。',
      '本アプリに関する個人情報の取扱いについては、別途定めるiOS版プライバシーポリシーによるものとします。',
      '本アプリを通じた課金には、Appleが定める利用条件、App Storeのルールその他Appleの定める条件があわせて適用されます。',
    ],
  },
  {
    id: 'definitions',
    title: '第2条（定義）',
    paragraphs: ['本規約における用語の定義は次のとおりとします。'],
    points: [
      '「利用者」とは、本アプリをダウンロード、閲覧又は利用するすべての者をいいます。',
      '「会員」とは、当社所定の方法により利用登録を完了した者をいいます。',
      '「プレミアムプラン」とは、本アプリ内で提供される有料の自動更新サブスクリプションをいいます。',
      '「コンテンツ」とは、本アプリ上で提供されるテキスト、音声、画像、動画、譜面、データ、教材、判定結果その他一切の情報をいいます。',
    ],
  },
  {
    id: 'registration',
    title: '第3条（利用登録）',
    paragraphs: [
      '利用者は、当社所定の方法によりアカウント登録を行うことができます。',
      '当社は、次の各号のいずれかに該当すると判断した場合、登録を拒否し、又は承認後に登録を取り消すことがあります。',
    ],
    points: [
      '虚偽の情報を届け出た場合',
      '過去に本規約違反等により利用停止その他の措置を受けたことがある場合',
      '未成年者が法定代理人の同意を得ていない場合',
      'その他、当社が不適切と判断した場合',
    ],
  },
  {
    id: 'account',
    title: '第4条（アカウント管理）',
    paragraphs: [
      '利用者は、自己の責任においてアカウント情報を管理するものとします。',
      '利用者は、アカウントを第三者に利用させ、貸与し、譲渡し、又は名義変更してはなりません。',
      'アカウント情報の管理不十分等により生じた損害について、当社は当社に故意又は重過失がある場合を除き責任を負いません。',
    ],
  },
  {
    id: 'service',
    title: '第5条（本アプリの内容）',
    paragraphs: [
      '当社は、ジャズ学習支援を目的として、教材、音源、演奏支援機能、判定機能、進捗管理機能その他これに関連するサービスを提供します。',
      '当社は、サービス改善、保守、法令対応その他必要がある場合、本アプリの全部又は一部を変更、追加、停止又は終了することがあります。',
    ],
  },
  {
    id: 'fees',
    title: '第6条（利用料金）',
    paragraphs: [
      '本アプリの有料プランはプレミアムプランのみです。',
      'プレミアムプランの利用料金は、App Store上で利用者に表示される金額とします。',
      '日本のApp Storeにおける基準価格は、月額4,980円（税込）です。',
      '国又は地域、通貨、税制、Appleによる価格設定上の処理その他の事情により、利用者に表示される価格が異なる場合があります。',
      '当社所定の条件に該当する場合、Appleの定める方法により7日間の無料トライアル（又はこれに相当する無料お試し期間）が付与されることがあります。内容はApp Store上の表示に従います。',
    ],
  },
  {
    id: 'iap',
    title: '第7条（課金、更新、解約、返金）',
    paragraphs: [
      'プレミアムプランの購入、請求及び決済は、AppleのIn-App Purchase（アプリ内課金）を通じて行われます。',
      '無料トライアルが付与された場合、トライアル終了後の取扱い（初回課金のタイミング、解約方法等）は、App Storeの表示及びAppleの定める条件に従います。トライアル期間中の解約により料金が発生しない場合があります。',
      'プレミアムプランは、利用者が解約しない限り、1か月ごとに自動更新されます。',
      'プレミアムプランの管理、解約及び請求方法は、利用者のApple Account又はApp Storeのサブスクリプション管理画面に従うものとします。',
      '本アプリを削除しただけでは、サブスクリプションは解約されません。',
      '返金の可否及び手続はAppleの定める条件及び運用に従うものとし、当社が独自に返金を行えない場合があります。',
      '当社は、Appleから提供される購入確認情報その他必要な情報に基づき、利用権限の付与、継続、停止その他必要な処理を行います。',
    ],
  },
  {
    id: 'prohibited',
    title: '第8条（禁止事項）',
    paragraphs: ['利用者は、本アプリの利用にあたり、次の各号に該当する行為をしてはなりません。'],
    points: [
      '法令又は公序良俗に違反する行為',
      '当社又は第三者の知的財産権、名誉、信用、プライバシーその他の権利利益を侵害する行為',
      '本アプリの運営を妨害し、又はそのおそれのある行為',
      '不正アクセス、リバースエンジニアリング、ソースコード解析、脆弱性探索、過度な負荷を与える行為',
      'アカウントの譲渡、貸与、共有、なりすまし',
      '本アプリ又はコンテンツの無断複製、転載、再配布、販売',
      '不正な目的で本アプリを利用する行為',
      'その他、当社が不適切と判断する行為',
    ],
  },
  {
    id: 'intellectual',
    title: '第9条（知的財産権）',
    paragraphs: [
      '本アプリ及びコンテンツに関する著作権、商標権その他の知的財産権は、当社又は正当な権利者に帰属します。利用者は、当社が明示的に許諾した場合を除き、これらを利用することはできません。',
    ],
  },
  {
    id: 'suspension',
    title: '第10条（利用停止等）',
    paragraphs: [
      '当社は、利用者が本規約に違反した場合又は本アプリの運営上必要がある場合、事前の通知なく、当該利用者による本アプリの利用を制限し、アカウントを停止し、又は削除することができます。',
    ],
  },
  {
    id: 'disclaimer',
    title: '第11条（免責）',
    paragraphs: [
      '当社は、本アプリが利用者の特定の目的に適合すること、期待する機能、正確性、有用性又は継続性を有することを保証しません。',
      '当社は、本アプリの利用又は利用不能により利用者に生じた損害について、当社に故意又は重過失がある場合を除き責任を負いません。',
      '当社が利用者に対して損害賠償責任を負う場合であっても、当社の軽過失による責任は、当該損害発生月の直前1か月間に当該利用者が当社に支払った利用料金相当額を上限とします。ただし、消費者契約法その他法令によりこの制限が認められない場合はこの限りではありません。',
    ],
  },
  {
    id: 'withdrawal',
    title: '第12条（退会）',
    paragraphs: [
      '利用者は、当社所定の方法によりアカウント退会を申請することができます。',
      'なお、アカウント退会とApp Storeサブスクリプションの解約は別手続です。',
    ],
  },
  {
    id: 'changes',
    title: '第13条（規約の変更）',
    paragraphs: [
      '当社は、必要がある場合、本規約を変更することがあります。重要な変更がある場合は、本アプリ内、当社ウェブサイトその他適切な方法により通知します。',
    ],
  },
  {
    id: 'jurisdiction',
    title: '第14条（準拠法・合意管轄）',
    paragraphs: [
      '本規約は日本法に準拠し、本アプリに関して当社と利用者との間に生じる一切の紛争については、訴額に応じて東京地方裁判所又は東京簡易裁判所を第一審の専属的合意管轄裁判所とします。',
    ],
  },
  {
    id: 'contact',
    title: '第15条（お問い合わせ）',
    paragraphs: [
      '本規約に関するお問い合わせ先は、以下のとおりです。',
      '合同会社KindWords',
      'メールアドレス：toshiotawa@me.com',
    ],
  },
];

const iosTermsEn: TermsArticle[] = [
  {
    id: 'application',
    title: 'Article 1 (Scope)',
    paragraphs: [
      'These Terms apply to all relationships between the Company and users regarding use of the App.',
      'Handling of personal information related to the App is governed by the iOS Privacy Policy provided separately.',
      'Purchases through the App are also subject to Apple’s terms of use, App Store rules, and other conditions set by Apple.',
    ],
  },
  {
    id: 'definitions',
    title: 'Article 2 (Definitions)',
    paragraphs: ['Terms used in these Terms are defined as follows.'],
    points: [
      '“User” means any person who downloads, views, or uses the App.',
      '“Member” means a person who has completed account registration in the manner prescribed by the Company.',
      '“Premium Plan” means the paid auto-renewing subscription offered within the App.',
      '“Content” means all information provided in the App, including text, audio, images, video, scores, data, teaching materials, and evaluation results.',
    ],
  },
  {
    id: 'registration',
    title: 'Article 3 (Registration)',
    paragraphs: [
      'Users may register an account in the manner prescribed by the Company.',
      'The Company may refuse registration or cancel registration after approval if it determines that any of the following applies.',
    ],
    points: [
      'False information was submitted.',
      'The person has previously been subject to suspension or other measures due to a breach of these Terms.',
      'The person is a minor and has not obtained the consent of a legal guardian.',
      'The Company otherwise deems registration inappropriate.',
    ],
  },
  {
    id: 'account',
    title: 'Article 4 (Account Management)',
    paragraphs: [
      'Users shall manage their account information at their own responsibility.',
      'Users shall not allow third parties to use, lend, transfer, or change the name of their account.',
      'The Company shall not be liable for damages arising from inadequate management of account information or similar causes, except in cases of willful misconduct or gross negligence on the part of the Company.',
    ],
  },
  {
    id: 'service',
    title: 'Article 5 (App Content)',
    paragraphs: [
      'The Company provides services for jazz learning support, including teaching materials, audio, performance support, evaluation, progress management, and related features.',
      'The Company may change, add to, suspend, or discontinue all or part of the App when necessary for improvement, maintenance, legal compliance, or other reasons.',
    ],
  },
  {
    id: 'fees',
    title: 'Article 6 (Fees)',
    paragraphs: [
      'The only paid plan in the App is the Premium Plan.',
      'The fee for the Premium Plan is the amount displayed to the user on the App Store.',
      'The reference price on the Japan App Store is ¥4,980 per month (tax included).',
      'The price displayed may differ depending on country or region, currency, tax rules, Apple’s pricing, or other factors.',
      'Where eligible under the Company’s conditions, a seven-day free trial (or equivalent introductory offer) may be offered through Apple as shown on the App Store.',
    ],
  },
  {
    id: 'iap',
    title: 'Article 7 (Billing, Renewal, Cancellation, and Refunds)',
    paragraphs: [
      'Purchase, billing, and payment for the Premium Plan are made through Apple In-App Purchase.',
      'If a free trial is offered, timing of the first charge, cancellation, and other conditions follow the App Store display and Apple’s terms. Cancelling during the trial may result in no charge, as described by Apple.',
      'The Premium Plan automatically renews every month unless the user cancels.',
      'Management, cancellation, and billing methods for the Premium Plan follow the user’s Apple Account or App Store subscription settings.',
      'Deleting the App alone does not cancel the subscription.',
      'Whether a refund is available and the procedure follow Apple’s terms and operations; the Company may be unable to issue refunds on its own.',
      'The Company grants, continues, suspends, or otherwise processes entitlements based on purchase confirmation and other information provided by Apple.',
    ],
  },
  {
    id: 'prohibited',
    title: 'Article 8 (Prohibited Conduct)',
    paragraphs: ['Users shall not engage in any of the following when using the App.'],
    points: [
      'Acts that violate laws or public order and morals.',
      'Acts that infringe the intellectual property rights, reputation, credit, privacy, or other rights or interests of the Company or third parties.',
      'Acts that interfere with or may interfere with operation of the App.',
      'Unauthorized access, reverse engineering, source code analysis, vulnerability probing, or imposing excessive load.',
      'Transfer, lending, sharing, or impersonation of accounts.',
      'Unauthorized copying, reproduction, redistribution, or sale of the App or Content.',
      'Use of the App for unlawful purposes.',
      'Any other conduct the Company deems inappropriate.',
    ],
  },
  {
    id: 'intellectual',
    title: 'Article 9 (Intellectual Property)',
    paragraphs: [
      'Copyrights, trademark rights, and other intellectual property rights in the App and Content belong to the Company or legitimate right holders. Users may not use them except where expressly permitted by the Company.',
    ],
  },
  {
    id: 'suspension',
    title: 'Article 10 (Suspension of Use)',
    paragraphs: [
      'If a user breaches these Terms or if the Company otherwise deems it necessary for operation of the App, the Company may, without prior notice, restrict the user’s use of the App, suspend, or delete the account.',
    ],
  },
  {
    id: 'disclaimer',
    title: 'Article 11 (Disclaimer)',
    paragraphs: [
      'The Company does not warrant that the App will meet a user’s particular purpose or that it will have expected functions, accuracy, usefulness, or continuity.',
      'The Company shall not be liable for damages arising from use or inability to use the App, except in cases of willful misconduct or gross negligence on the part of the Company.',
      'Even if the Company is liable for damages, liability for slight negligence shall be limited to the equivalent of fees paid by the user to the Company in the month immediately preceding the month in which the damage occurred, except where such limitation is not permitted under the Consumer Contract Act or other laws.',
    ],
  },
  {
    id: 'withdrawal',
    title: 'Article 12 (Account Deletion)',
    paragraphs: [
      'Users may request account deletion in the manner prescribed by the Company.',
      'Account deletion and cancellation of an App Store subscription are separate procedures.',
    ],
  },
  {
    id: 'changes',
    title: 'Article 13 (Changes to the Terms)',
    paragraphs: [
      'The Company may change these Terms when necessary. If there are important changes, the Company will notify users within the App, on its website, or by other appropriate means.',
    ],
  },
  {
    id: 'jurisdiction',
    title: 'Article 14 (Governing Law and Jurisdiction)',
    paragraphs: [
      'These Terms are governed by the laws of Japan. All disputes between the Company and users regarding the App shall be subject to the exclusive jurisdiction of the Tokyo District Court or Tokyo Summary Court in the first instance, depending on the amount in controversy.',
    ],
  },
  {
    id: 'contact',
    title: 'Article 15 (Contact)',
    paragraphs: [
      'For inquiries regarding these Terms, contact:',
      'KindWords LLC (Godo Kaisha KindWords)',
      'Email: toshiotawa@me.com',
    ],
  },
];

const webHighlightsJa: string[] = [
  '本サービスはジャズ学習支援を目的としたウェブサービスです。',
  '有料プランはプレミアムのみで、月額4,980円（税込）。初回利用者に限り7日間の無料トライアルが付与される場合があります（対象外となる場合があります）。',
  'お支払いはLemon Squeezy等を通じて行い、トライアル終了後は1か月単位で自動更新されます。解約は次回更新前までに所定の手続きが必要です。',
  '禁止事項、免責、個人情報の取扱いは本規約およびプライバシーポリシーに従います。',
];

const webHighlightsEn: string[] = [
  'The Service is a web-based platform for jazz learning support.',
  'The only paid plan is Premium at ¥4,980 per month (tax included). Eligible first-time subscribers may receive a seven-day free trial.',
  'Payment is processed through Lemon Squeezy or other designated processors; after any trial, the plan renews monthly. Cancel before the next renewal as instructed.',
  'Prohibited conduct, disclaimers, and personal data handling are governed by these Terms and the Privacy Policy.',
];

const iosHighlightsJa: string[] = [
  '本アプリはジャズ学習支援を目的としたiOSアプリです。',
  '有料プランはプレミアムのみで、価格はApp Storeの表示に従います（日本の基準価格は月額4,980円（税込））。所定の条件で7日間の無料トライアルが付与される場合があります。',
  '課金・解約・返金はAppleのIn-App PurchaseおよびApp Storeの設定に従います。アプリを削除しただけではサブスクリプションは解約されません。',
  '個人情報はiOS版プライバシーポリシーに従います。',
];

const iosHighlightsEn: string[] = [
  'The App is an iOS application for jazz learning support.',
  'The only paid plan is Premium; pricing follows the App Store (reference price in Japan: ¥4,980 per month, tax included). A seven-day free trial may be offered when eligible.',
  'Billing, cancellation, and refunds follow Apple In-App Purchase and App Store settings. Deleting the App does not cancel the subscription.',
  'Personal information is handled under the iOS Privacy Policy.',
];

const LAST_UPDATED = '2026年4月3日';
const LAST_UPDATED_EN = 'April 3, 2026';

const TERMS_COPY: Record<TermsVariant, Record<TermsLocale, TermsCopy>> = {
  web: {
    ja: {
      articles: webTermsJa,
      highlights: webHighlightsJa,
      lastUpdated: LAST_UPDATED,
      summaryHeading: '利用規約（要約）',
      detailLinkLabel: '詳細な利用規約を確認する',
    },
    en: {
      articles: webTermsEn,
      highlights: webHighlightsEn,
      lastUpdated: LAST_UPDATED_EN,
      summaryHeading: 'Terms of Service (Summary)',
      detailLinkLabel: 'Read the full Terms of Service',
    },
  },
  ios: {
    ja: {
      articles: iosTermsJa,
      highlights: iosHighlightsJa,
      lastUpdated: LAST_UPDATED,
      summaryHeading: '利用規約（要約）',
      detailLinkLabel: '詳細な利用規約を確認する',
    },
    en: {
      articles: iosTermsEn,
      highlights: iosHighlightsEn,
      lastUpdated: LAST_UPDATED_EN,
      summaryHeading: 'Terms of Service (Summary)',
      detailLinkLabel: 'Read the full Terms of Service',
    },
  },
};

export interface GetTermsContentOptions {
  variant: TermsVariant;
  locale: TermsLocale;
}

export const getTermsContent = ({ variant, locale }: GetTermsContentOptions): TermsCopy =>
  TERMS_COPY[variant][locale];

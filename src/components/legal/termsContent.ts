export interface TermsArticle {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
}

export type TermsLocale = 'ja' | 'en';

interface TermsCopy {
  articles: TermsArticle[];
  highlights: string[];
  lastUpdated: string;
  summaryHeading: string;
  detailLinkLabel: string;
}

const termsArticlesJa: TermsArticle[] = [
  {
    id: 'application',
    title: '第1条（本規約の適用）',
    paragraphs: [
      '本規約は、合同会社KindWords（以下「当社」といいます。）が提供するジャズ音楽学習サービス「Jazzify」（以下「本サービス」といいます。）の利用条件を定めるものです。利用者は、本規約に同意した上で本サービスを利用するものとし、本規約に同意しない場合は本サービスを利用できません。',
    ],
  },
  {
    id: 'definitions',
    title: '第2条（定義）',
    paragraphs: ['本規約における用語の定義は次のとおりとします。'],
    points: [
      '「利用者」とは、本サービスを閲覧または利用するすべての方をいいます。',
      '「会員」とは、当社所定の手続により本サービスの利用登録を完了し、アカウントを保有する方をいいます。',
      '「コンテンツ」とは、当社または第三者が本サービスにおいて提供する音声、映像、画像、テキスト、データ等をいいます。',
      '「プラットフォーム」とは、本サービスを提供するウェブサイト、アプリケーション、その他関連するシステムをいいます。',
    ],
  },
  {
    id: 'agreement',
    title: '第3条（規約の変更）',
    paragraphs: [
      '当社は、必要と判断した場合には、本規約の内容をいつでも改定できるものとします。改定後の本規約は、本サービス内に掲載した時点または当社が別途定める効力発生日から効力を生じるものとし、利用者は最新の内容を確認の上で本サービスを利用するものとします。改定後に利用者が本サービスを利用した場合、当該利用者は改定後の本規約に同意したものとみなします。',
    ],
  },
  {
    id: 'registration',
    title: '第4条（利用登録）',
    paragraphs: [
      '本サービスの利用を希望する方は、当社所定の方法により利用登録を行い、当社が当該登録を承認した時点で会員としての地位を取得します。当社は、登録希望者が以下の各号のいずれかに該当すると判断した場合、登録を拒否することがあります。',
    ],
    points: [
      '虚偽の情報を届け出た場合',
      '過去に本規約に違反したことがある場合',
      '未成年者等が法定代理人の同意を得ていない場合',
      'その他、当社が登録を不適切と判断した場合',
    ],
  },
  {
    id: 'account',
    title: '第5条（アカウントの管理）',
    paragraphs: [
      '会員は、自己の責任においてアカウント情報（メールアドレス、パスワード等）を厳重に管理するものとし、第三者に貸与、譲渡、名義変更、売買等をしてはならないものとします。当社は、アカウント情報の不正利用によって会員に生じた損害について、当社に故意または重大な過失がある場合を除き、一切の責任を負いません。',
    ],
  },
  {
    id: 'service',
    title: '第6条（本サービスの内容）',
    paragraphs: [
      '当社は、ジャズ演奏の学習を支援するための教材、音源、判定機能、進捗管理等のコンテンツおよび機能を提供します。当社は、サービス品質の向上またはその他必要と認める場合、会員に通知することなく本サービスの内容を変更することができます。',
    ],
  },
  {
    id: 'fees',
    title: '第7条（利用料金および支払方法）',
    paragraphs: [
      '本サービスの有料プランの月額利用料金は、スタンダードプラン2,980円（税込）、プレミアムプラン8,980円（税込）、プラチナプラン12,800円（税込）、ゴールドプラン19,800円（税込）とします。当社は、料金体系を変更する場合、事前に本サービス上で公表します。',
      '会員は、Stripe等の決済代行サービスを通じたクレジットカード決済により利用料金を支払うものとし、支払方法に起因して利用者に費用が発生する場合は利用者の負担とします。',
    ],
  },
  {
    id: 'billing-cycle',
    title: '第8条（課金サイクル）',
    paragraphs: [
      '本サービスには新規登録時から7日間の無料トライアル期間（以下「トライアル」といいます。）が付与されます。トライアル終了日の翌日に初回課金が行われ、その後は1か月ごとに自動で更新・課金されます。',
      '会員がトライアル期間中に解約手続きを完了した場合は、料金は発生しません。トライアル終了後に解約した場合、既に支払われた利用料金の返金は行いません。',
    ],
  },
  {
    id: 'prohibited',
    title: '第9条（禁止事項）',
    paragraphs: ['利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。'],
    points: [
      '法令または公序良俗に違反する行為',
      '当社または第三者の知的財産権、肖像権、プライバシー権等を侵害する行為',
      '本サービスの運営を妨げ、またはそのおそれのある行為',
      '不正アクセス、プログラムの改変、リバースエンジニアリング等の行為',
      '他の利用者になりすます行為',
      '本サービスで得た情報を無断で複製、転用、販売する行為',
      'その他、当社が不適切と判断する行為',
    ],
  },
  {
    id: 'suspension',
    title: '第10条（サービスの提供停止等）',
    paragraphs: [
      '当社は、以下のいずれかに該当すると判断した場合、利用者に事前に通知することなく、本サービスの全部または一部の提供を停止または中断することができます。'],
    points: [
      '本サービス用設備の保守点検または更新を行う場合',
      '地震、落雷、火災、停電、天災等の不可抗力により本サービスの提供が困難となった場合',
      'コンピューターまたは通信回線等が事故により停止した場合',
      'その他、当社が本サービスの提供を困難と判断した場合',
    ],
  },
  {
    id: 'termination',
    title: '第11条（利用停止・契約解除）',
    paragraphs: [
      '当社は、利用者が本規約に違反した場合、または当社が必要と判断した場合には、事前の通知なく当該利用者のアカウントを停止または削除し、本サービスの利用を制限することができます。その際、当社が既に受領した料金については返金しません。',
      '利用者が解約を希望する場合は、マイページから所定の手続に従って解約するものとし、解約後も契約期間満了日までは本サービスを利用できます。',
    ],
  },
  {
    id: 'intellectual',
    title: '第12条（知的財産権）',
    paragraphs: [
      '本サービスに含まれるコンテンツに関する著作権、商標権、その他一切の知的財産権は当社または正当な権利者に帰属します。利用者は、当社が明示的に許可した場合を除き、本サービスを通じて提供されるコンテンツを複製、転載、公衆送信、改変、頒布等してはなりません。',
    ],
  },
  {
    id: 'disclaimer',
    title: '第13条（保証の否認および免責）',
    paragraphs: [
      '当社は、本サービスが利用者の特定の目的に適合すること、期待する機能・価値・正確性・有用性を有すること、利用者による利用が第三者の権利を侵害しないことについて、明示または黙示を問わず一切保証しません。',
      '当社は、本サービスの利用または利用不能により利用者に生じた損害について、当社に故意または重大な過失がある場合を除き、一切の責任を負いません。',
    ],
  },
  {
    id: 'damages',
    title: '第14条（損害賠償）',
    paragraphs: [
      '利用者が本規約に違反し、当社に損害を与えた場合、当社は当該利用者に対し、直接・間接を問わず一切の損害（弁護士費用を含みます。）の賠償を請求できるものとします。',
    ],
  },
  {
    id: 'privacy',
    title: '第15条（個人情報の取扱い）',
    paragraphs: [
      '当社は、利用者の個人情報を本サービスの提供および運営のために利用します。当社による個人情報の取扱いは、別途定めるプライバシーポリシーに従うものとし、利用者は本サービスの利用に際してプライバシーポリシーに同意するものとします。',
    ],
  },
  {
    id: 'notice',
    title: '第16条（通知または連絡）',
    paragraphs: [
      '当社から利用者への通知または連絡は、本サービス内の掲示、電子メール、またはその他当社が適切と判断する方法によって行うものとします。利用者から当社への通知または連絡は、当社が指定する方法に従って行うものとします。',
    ],
  },
  {
    id: 'assignment',
    title: '第17条（権利義務の譲渡禁止）',
    paragraphs: [
      '利用者は、当社の書面による事前の承諾なく、本規約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡、移転、担保設定等することはできません。',
    ],
  },
  {
    id: 'severability',
    title: '第18条（分離可能性）',
    paragraphs: [
      '本規約のいずれかの条項またはその一部が法令により無効または執行不能と判断された場合でも、本規約の残りの規定および一部有効な規定は継続して完全に効力を有するものとします。',
    ],
  },
  {
    id: 'jurisdiction',
    title: '第19条（準拠法および合意管轄）',
    paragraphs: [
      '本規約の解釈および適用については、日本法を準拠法とします。本サービスに関して当社と利用者との間で紛争が生じた場合、訴額に応じて東京地方裁判所または東京簡易裁判所を第一審の専属的合意管轄裁判所とします。',
    ],
  },
];

const termsHighlightsJa: string[] = [
  '本サービスはジャズ演奏学習を目的としたサブスクリプション型サービスです。',
  '新規登録者には7日間の無料トライアルが付与され、終了後は月額自動更新となります。',
  '利用料金はプランに応じて2,980円〜19,800円（税込）で、Stripeを通じてクレジットカード決済されます。',
  'マイページからいつでも解約でき、解約後も契約期間満了日までは利用が可能です。',
  '禁止事項や免責事項、個人情報の取り扱いは本規約およびプライバシーポリシーに従います。',
];

const termsArticlesEn: TermsArticle[] = [
  {
    id: 'application',
    title: 'Article 1 (Application)',
    paragraphs: [
      'These Terms of Service govern the use of “Jazzify” (the “Service”), a jazz learning platform provided by KindWords LLC (the “Company”). Users may access and use the Service only after agreeing to these Terms. If a user does not agree, the Service cannot be used.',
    ],
  },
  {
    id: 'definitions',
    title: 'Article 2 (Definitions)',
    paragraphs: ['Terms used in this agreement are defined as follows.'],
    points: [
      '“User” means any individual who browses or uses the Service.',
      '“Member” means a user who has completed the registration process designated by the Company and holds an account.',
      '“Content” means audio, video, images, text, data, and other materials provided by the Company or third parties through the Service.',
      '“Platform” means the websites, applications, and other systems that deliver the Service.',
    ],
  },
  {
    id: 'agreement',
    title: 'Article 3 (Amendments)',
    paragraphs: [
      'The Company may revise these Terms whenever deemed necessary. Revised Terms become effective when posted within the Service or on any date separately specified by the Company. Users must review the latest Terms before using the Service, and continued use after an amendment constitutes acceptance of the revised Terms.',
    ],
  },
  {
    id: 'registration',
    title: 'Article 4 (Registration)',
    paragraphs: [
      'Individuals who wish to use the Service must register in the manner prescribed by the Company. Membership is granted when the Company approves such registration. The Company may refuse registration if it determines that an applicant falls under any of the following.',
    ],
    points: [
      'False or misleading information was submitted.',
      'The applicant previously violated these Terms.',
      'A minor or ward has not obtained the consent of a legal guardian.',
      'Any other case where the Company deems registration inappropriate.',
    ],
  },
  {
    id: 'account',
    title: 'Article 5 (Account Management)',
    paragraphs: [
      'Members must manage their account credentials (email address, password, etc.) responsibly and must not lend, transfer, sell, or otherwise share them with third parties. Except in cases of willful misconduct or gross negligence by the Company, the Company shall not be liable for damages resulting from unauthorized use of account information.',
    ],
  },
  {
    id: 'service',
    title: 'Article 6 (Scope of the Service)',
    paragraphs: [
      'The Service provides learning materials, audio, performance evaluation, progress tracking, and other features that support jazz practice. The Company may change the contents of the Service without prior notice when necessary to improve quality or for other reasons.',
    ],
  },
  {
    id: 'fees',
    title: 'Article 7 (Fees and Payment)',
    paragraphs: [
      'The monthly subscription fee for international users is $19 USD per month. The Company will announce any changes to the fee structure in advance within the Service.',
      'Members shall pay subscription fees via credit card through Stripe, Lemon Squeezy, or other payment processors. Any costs arising from the selected payment method shall be borne by the member.',
    ],
  },
  {
    id: 'billing-cycle',
    title: 'Article 8 (Billing Cycle)',
    paragraphs: [
      'New members receive a seven-day free trial. The first charge occurs on the day after the trial ends, and billing continues automatically each month thereafter.',
      'If the member cancels within the trial period, no fees will be charged. Fees already paid are non-refundable after the trial ends.',
    ],
  },
  {
    id: 'prohibited',
    title: 'Article 9 (Prohibited Conduct)',
    paragraphs: ['Users must not engage in any of the following acts while using the Service.'],
    points: [
      'Acts that violate laws or public order and morals.',
      'Infringing upon the intellectual property, portrait rights, privacy, or other rights of the Company or third parties.',
      'Interfering with the operation of the Service or actions likely to do so.',
      'Unauthorized access, program alteration, reverse engineering, or similar acts.',
      'Impersonating other users.',
      'Copying, reusing, or reselling information obtained through the Service without authorization.',
      'Any other conduct the Company deems inappropriate.',
    ],
  },
  {
    id: 'suspension',
    title: 'Article 10 (Service Suspension)',
    paragraphs: [
      'The Company may suspend or interrupt the Service in whole or in part without prior notice to users if any of the following applies.'],
    points: [
      'Maintenance or updates to Service infrastructure are required.',
      'Provision of the Service becomes difficult due to force majeure such as earthquakes, lightning, fire, power outages, or natural disasters.',
      'Accidents involving computers or communication lines occur.',
      'Any other case in which the Company deems continuation of the Service difficult.',
    ],
  },
  {
    id: 'termination',
    title: 'Article 11 (Restriction and Termination)',
    paragraphs: [
      'If a user violates these Terms or if the Company otherwise deems it necessary, the Company may suspend or delete the user’s account without prior notice. Fees already received will not be refunded.',
      'Users wishing to cancel must follow the procedure on the My Page. Even after cancellation, the Service remains available until the end of the current billing period.',
    ],
  },
  {
    id: 'intellectual',
    title: 'Article 12 (Intellectual Property)',
    paragraphs: [
      'All intellectual property rights related to content within the Service belong to the Company or legitimate right holders. Users must not reproduce, modify, distribute, or publicly transmit such content without explicit permission from the Company.',
    ],
  },
  {
    id: 'disclaimer',
    title: 'Article 13 (Disclaimer)',
    paragraphs: [
      'The Company makes no warranties, express or implied, that the Service satisfies a user’s particular purpose, provides specific functionalities, accuracy, or usefulness, or that the use of the Service will not infringe the rights of third parties.',
      'Except in cases of willful misconduct or gross negligence, the Company shall not be liable for damages arising from the use or inability to use the Service.',
    ],
  },
  {
    id: 'damages',
    title: 'Article 14 (Damages)',
    paragraphs: [
      'If a user violates these Terms and causes damage to the Company, the Company may claim compensation for all damages, whether direct or indirect (including attorneys’ fees).',
    ],
  },
  {
    id: 'privacy',
    title: 'Article 15 (Handling of Personal Information)',
    paragraphs: [
      'The Company uses personal information to provide and operate the Service. The handling of personal information follows the Privacy Policy, and users agree to the Privacy Policy when using the Service.',
    ],
  },
  {
    id: 'notice',
    title: 'Article 16 (Notices)',
    paragraphs: [
      'The Company may notify or contact users via postings within the Service, email, or other methods deemed appropriate. Users must contact the Company through methods designated by the Company.',
    ],
  },
  {
    id: 'assignment',
    title: 'Article 17 (Prohibition on Assignment)',
    paragraphs: [
      'Users may not assign, transfer, set as collateral, or otherwise dispose of their status or rights and obligations under these Terms to third parties without prior written consent from the Company.',
    ],
  },
  {
    id: 'severability',
    title: 'Article 18 (Severability)',
    paragraphs: [
      'If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.',
    ],
  },
  {
    id: 'jurisdiction',
    title: 'Article 19 (Governing Law and Jurisdiction)',
    paragraphs: [
      'These Terms are governed by the laws of Japan. Any disputes between the Company and users regarding the Service shall be subject to the exclusive jurisdiction of the Tokyo District Court or the Tokyo Summary Court, depending on the amount in controversy.',
    ],
  },
];

const termsHighlightsEn: string[] = [
  'Jazzify is a subscription-based platform for learning jazz performance.',
  'A seven-day free trial is included for new members, after which monthly billing renews automatically.',
  'The monthly subscription fee is $19 USD per month, charged via Stripe, Lemon Squeezy, or other payment processors.',
  'You can cancel anytime from My Page, and you retain access until the end of the billing cycle.',
  'Prohibited activities, disclaimers, and handling of personal data are defined by these Terms and the Privacy Policy.',
];

const TERMS_CONTENT: Record<TermsLocale, TermsCopy> = {
  ja: {
    articles: termsArticlesJa,
    highlights: termsHighlightsJa,
    lastUpdated: '2025年11月4日',
    summaryHeading: '利用規約（要約）',
    detailLinkLabel: '詳細な利用規約を確認する',
  },
  en: {
    articles: termsArticlesEn,
    highlights: termsHighlightsEn,
    lastUpdated: 'November 4, 2025',
    summaryHeading: 'Terms of Service (Summary)',
    detailLinkLabel: 'Read the full Terms of Service',
  },
};

export const getTermsContent = (locale: TermsLocale = 'ja'): TermsCopy => TERMS_CONTENT[locale];

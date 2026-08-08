import {
  HELP_IOS_MIDI_PATH,
  HELP_MIDI_KEYBOARD_CHOICE_PATH,
} from '@/components/landing/landingLinks';

/**
 * 新LP（2026年版）の日英コピーを一元管理するモジュール。
 * セクションコンポーネントは getLandingCopy(shouldUseEnglishCopy()) で参照する。
 */

interface LandingNavLink {
  id: string;
  label: string;
}

interface LandingHeaderCopy {
  nav: LandingNavLink[];
  login: string;
  signup: string;
  logoAlt: string;
}

interface LandingHeroCopy {
  /** 改行位置を制御するため行単位で持つ */
  titleLines: string[];
  subtitle: string[];
  demoCta: string;
  signupCta: string;
  appStoreCta: string;
  note: string;
  videoAlt: string;
  videoBadge: string;
}

interface LandingDemoCopy {
  eyebrow: string;
  heading: string;
  sub: string[];
  startButton: string;
  finishCta: string;
  midiLabel: string;
  midiHelper: string;
  loading: string;
  exit: string;
  lazyPlaceholder: string;
}

interface LandingPromoVideoCopy {
  eyebrow: string;
  heading: string;
  sub: string[];
  videoAlt: string;
}

interface LandingPainCopy {
  heading: string[];
  cards: string[];
  body: string[];
}

interface LandingValueItem {
  title: string;
  description: string;
}

interface LandingSolutionCopy {
  heading: string;
  body: string[];
  values: LandingValueItem[];
}

interface LandingMainQuestCopy {
  heading: string;
  body: string[];
  note: string;
  imageAlt: string;
}

export interface LandingRoadmapStep {
  /** メインクエストの章番号。目的別コースなど章に紐づかない段は null */
  blockNumber: number | null;
  chapter: string;
  title: string;
  description: string;
}

interface LandingRoadmapCopy {
  eyebrow: string;
  heading: string;
  body: string[];
  steps: LandingRoadmapStep[];
  freeBadge: string;
  note: string;
}

interface LandingBeforeAfterCopy {
  heading: string;
  beforeLabel: string;
  beforeItems: string[];
  afterLabel: string;
  afterItems: string[];
}

interface LandingCourseItem {
  title: string;
  description: string;
}

interface LandingCoursesCopy {
  heading: string;
  body: string[];
  items: LandingCourseItem[];
  imageAlt: string;
}

export interface LandingModeItem {
  title: string;
  tagline: string;
  description: string[];
  imageAlt: string;
}

export interface LandingViralTweetCopy {
  translationText?: string;
}

interface LandingModesCopy {
  eyebrow: string;
  heading: string;
  chordRun: LandingModeItem;
  survival: LandingModeItem;
  battle: LandingModeItem;
  viralTweet: LandingViralTweetCopy;
}

interface LandingPlatformCard {
  title: string;
  description: string;
  linkTo?: string;
  linkLabel?: string;
}

interface LandingPlatformsCopy {
  heading: string;
  body: string[];
  cards: LandingPlatformCard[];
  appStoreCta: string;
  webCta: string;
}

interface LandingRequirementsCopy {
  heading: string;
  choiceLinkLabel: string;
  body: string[];
  badges: string[];
}

interface LandingDeveloperCopy {
  heading: string;
  body: string[];
  stats: string[];
  name: string;
  role: string;
  photoAlt: string;
}

interface LandingPricingHighlight {
  text: string;
  jpyAmount: number | null;
}

export interface LandingPricingPlan {
  name: string;
  price: string;
  jpyAmount: number | null;
  priceSuffix: string;
  badge: string | null;
  highlights: LandingPricingHighlight[];
  features: string[];
  cta: string;
}

interface LandingPricingTrialCopy {
  heading: string;
  body: string[];
}

interface LandingPricingCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  freeIntro: string[];
  trial: LandingPricingTrialCopy;
  free: LandingPricingPlan;
  monthly: LandingPricingPlan;
  yearly: LandingPricingPlan;
  notes: string[];
}

interface LandingFitCopy {
  heading: string;
  forYouHeading: string;
  forYouItems: string[];
  notForYouHeading: string;
  notForYouItems: string[];
}

interface LandingFaqInlineLink {
  to: string;
  label: string;
  suffix?: string;
}

interface LandingFaqItem {
  question: string;
  answer: string[];
  inlineLink?: LandingFaqInlineLink;
}

interface LandingFaqCopy {
  heading: string;
  items: LandingFaqItem[];
}

interface LandingFinalCtaCopy {
  heading: string;
  body: string[];
  cta: string;
  note: string;
}

interface LandingFooterCopy {
  blurb: string;
  serviceHeading: string;
  signupLink: string;
  loginLink: string;
  supportHeading: string;
  followHeading: string;
  faqLink: string;
  iosMidiLink: string;
  midiChoiceLink: string;
  contactLink: string;
  termsLink: string;
  privacyLink: string;
  tokushohoLink: string;
  appStoreAria: string;
  xAria: string;
  instagramAria: string;
}

interface LandingSeoCopy {
  title: string;
  description: string;
}

interface LandingCopy {
  seo: LandingSeoCopy;
  header: LandingHeaderCopy;
  hero: LandingHeroCopy;
  promoVideo: LandingPromoVideoCopy;
  demo: LandingDemoCopy;
  pain: LandingPainCopy;
  solution: LandingSolutionCopy;
  mainQuest: LandingMainQuestCopy;
  roadmap: LandingRoadmapCopy;
  beforeAfter: LandingBeforeAfterCopy;
  courses: LandingCoursesCopy;
  modes: LandingModesCopy;
  platforms: LandingPlatformsCopy;
  requirements: LandingRequirementsCopy;
  developer: LandingDeveloperCopy;
  pricing: LandingPricingCopy;
  fit: LandingFitCopy;
  faq: LandingFaqCopy;
  finalCta: LandingFinalCtaCopy;
  footer: LandingFooterCopy;
}

const NAV_JA: LandingNavLink[] = [
  { id: 'pricing', label: '料金' },
  { id: 'faq', label: 'FAQ' },
];

const NAV_EN: LandingNavLink[] = [
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

const COPY_JA: LandingCopy = {
  seo: {
    title: 'Jazzify | ジャズピアノを、ゲームのように弾いて覚える',
    description:
      'Jazzifyは、MIDIキーボードをつないで遊ぶジャズピアノ学習サービス。コード、リズム、耳コピ、アドリブを、実際に鍵盤を弾きながらゲーム感覚で身につけます。無料で始められます。',
  },
  header: {
    nav: NAV_JA,
    login: 'ログイン',
    signup: '無料で始める',
    logoAlt: 'Jazzify ロゴ',
  },
  hero: {
    titleLines: ['はじめてのジャズアドリブを、', 'ブルースから。'],
    subtitle: [
      'コードは分かる。でも、アドリブになると何を弾けばいいか分からない。',
      'Jazzifyなら、MIDIキーボードを弾くだけ。ゲームを進めながら、コード・リズム・アドリブが身につきます。',
    ],
    demoCta: '今すぐ弾いてみる',
    signupCta: '無料で始める',
    appStoreCta: 'App Storeでダウンロード',
    note: '無料登録はクレジットカード不要 / 画面鍵盤またはMIDIキーボードで体験',
    videoAlt: 'Jazzify サバイバルモードのプレイ映像',
    videoBadge: '演奏をリアルタイムで判定',
  },
  promoVideo: {
    eyebrow: 'PROMO VIDEO',
    heading: 'Jazzifyの世界を、90秒で。',
    sub: [
      'ゲーム感覚でジャズピアノを学ぶ様子を、音声付きでご覧ください。',
    ],
    videoAlt: 'Jazzify 宣伝動画',
  },
  demo: {
    eyebrow: 'DEMO PLAY',
    heading: '説明を読む前に、1分だけ弾いてみよう。',
    sub: [
      'このページ内で、サバイバルモードのチュートリアルを実際に体験できます。',
      '画面の鍵盤でも、MIDIキーボードでもプレイできます。',
    ],
    startButton: 'デモプレイを始める',
    finishCta: '無料で始める',
    midiLabel: 'MIDIキーボードを使う（任意）',
    midiHelper: '未接続でも、画面の鍵盤をタップ・クリックして体験できます。',
    loading: 'デモを読み込み中...',
    exit: '終了',
    lazyPlaceholder: 'この位置までスクロールするとデモを読み込みます。',
  },
  pain: {
    heading: ['理論は分かる。', 'でも、手が動かない。'],
    cards: [
      'コードは知っているのに、曲の中で使えない。',
      'レッスン動画は見るが、次に何を練習すればいいか分からない。',
      'アドリブになると、手が止まってしまう。',
      'スケールの反復だけでは、音楽を弾いている実感がない。',
    ],
    body: [],
  },
  solution: {
    heading: '弾いて、反応をもらい、音楽の中で練習する。',
    body: [],
    values: [
      {
        title: '本物の鍵盤を弾く',
        description: 'MIDIキーボードを接続するか、画面鍵盤から始められます。',
      },
      {
        title: '即座にフィードバック',
        description: 'Jazzifyが弾いた音を認識し、その場で反応します。',
      },
      {
        title: '音楽の中で反復',
        description: 'コード、リズム、フレーズを、プレイ可能な課題の中で繰り返します。',
      },
    ],
  },
  mainQuest: {
    heading: '最初の到達点：Cブルースを通して演奏する。',
    body: [
      'メインクエストは、最初の成功体験までの一本道です。',
      '日数の約束はしません。次に何を練習すればいいかは、常に画面が示します。',
    ],
    note: '最初のゴールは、Cブルースを1曲とおして演奏すること。',
    imageAlt: 'メインクエストのチャプター画面',
  },
  roadmap: {
    eyebrow: 'FIRST GOAL',
    heading: 'Cブルースまでの道筋',
    body: [],
    steps: [
      {
        blockNumber: 1,
        chapter: 'ステップ1',
        title: '1〜2音でアドリブする',
        description: '少ない音から、伴奏の上で自分のフレーズを試します。',
      },
      {
        blockNumber: 2,
        chapter: 'ステップ2',
        title: '必要なコードを押さえる',
        description: 'ブルースで使うコードを、考えずに出せるまで練習します。',
      },
      {
        blockNumber: 3,
        chapter: 'ステップ3',
        title: 'リズムに乗る',
        description: '伴奏に合わせて、手を止めずに弾き続けます。',
      },
      {
        blockNumber: 4,
        chapter: 'ステップ4',
        title: 'ブルース進行を追う',
        description: 'フォームに沿って、コードとフレーズをつなげます。',
      },
      {
        blockNumber: 5,
        chapter: 'ステップ5',
        title: '最初から最後まで通して演奏する',
        description: 'テーマ→アドリブ→テーマで、Cブルースを1曲演奏します。',
      },
      {
        blockNumber: null,
        chapter: 'その先',
        title: '目的別コースで伸ばす',
        description: '両手ヴォイシング、耳コピ、コードランなど、テーマごとに力を伸ばせます。',
      },
    ],
    freeBadge: '無料',
    note: '',
  },
  beforeAfter: {
    heading: '練習の仕方が変わると、演奏が変わる。',
    beforeLabel: 'Before',
    beforeItems: [
      '今日やる課題が決まっていない',
      '練習しても、正しく弾けているか判断できない',
      '覚えた音を伴奏の中で試す場面がない',
      'クリアした練習が、演奏技術として積み上がらない',
    ],
    afterLabel: 'After',
    afterItems: [
      '今日やる課題が決まっている',
      '音を弾くと、その場で判定される',
      '覚えた音を伴奏の中で試せる',
      'クリアした課題が、自分の演奏技術として積み上がる',
    ],
  },
  courses: {
    heading: '学べる内容',
    body: [
      'メインクエストで基本を身につけたら、目的に合わせたコースでさらに練習できます。',
    ],
    items: [
      {
        title: 'コード基礎',
        description: 'ジャズで使うコードを、反射的に押さえられるまで鍛えます。',
      },
      {
        title: 'リズムとタイム',
        description: '伴奏に乗り、手を止めずに弾き続ける力を身につけます。',
      },
      {
        title: '耳コピ',
        description: '聴こえた音やフレーズを鍵盤で弾き返し、耳と手をつなぎます。',
      },
      {
        title: 'アドリブ',
        description: '限られた音から始めて、自分のフレーズを作る力を育てます。',
      },
      {
        title: '両手ヴォイシング',
        description: '両手で響きのあるコードを弾く。伴奏やソロピアノに必要なヴォイシングを身につけます。',
      },
    ],
    imageAlt: '目的別コースのクエストマップ画面',
  },
  modes: {
    eyebrow: 'HOW IT WORKS',
    heading: '同じ練習を、ゲームとして続ける。',
    chordRun: {
      title: 'コードラン',
      tagline: 'コードを弾いて、走る・跳ぶ。',
      description: [
        'コードフォームを、ゲーム感覚で反復練習します。',
      ],
      imageAlt: 'コードランモードのプレイ画面',
    },
    survival: {
      title: 'サバイバル',
      tagline: '正しい音で戦い、生き残る。',
      description: [
        '正しい音やコードを弾いて、制限時間を生き残ります。',
      ],
      imageAlt: 'サバイバルモードのプレイ画面',
    },
    battle: {
      title: 'バトル',
      tagline: '聴いて、弾き返す。',
      description: [
        '聴こえたフレーズを鍵盤で弾き返し、耳と手を鍛えます。',
      ],
      imageAlt: 'バトルモードのプレイ画面',
    },
    viralTweet: {},
  },
  platforms: {
    heading: '始めるのに必要なもの',
    body: [
      'JazzifyはWebブラウザとiPhone/iPadアプリで使えます。同じアカウントで、コースや進行状況を続けられます。',
    ],
    cards: [
      {
        title: 'Webで使う',
        description:
          'PC / Mac のブラウザで利用できます。MIDIキーボードを接続して練習できます。',
      },
      {
        title: 'iPhone / iPadで使う',
        description:
          'App Storeからダウンロード。対応MIDIキーボードを接続して練習できます。同じアカウントで、コースや進行状況を続けられます。',
        linkTo: HELP_IOS_MIDI_PATH,
        linkLabel: '接続方法を見る →',
      },
      {
        title: 'まずは画面鍵盤で体験',
        description:
          'MIDIキーボードがなくても、一部課題は画面上の鍵盤で試せます。',
      },
    ],
    appStoreCta: 'App Storeでダウンロード',
    webCta: '無料で始める',
  },
  requirements: {
    heading: 'MIDIキーボードをつなげば、すぐに始められます。',
    choiceLinkLabel: 'MIDIキーボードの選び方を見る →',
    body: [
      'Jazzifyは、MIDI対応の電子ピアノやMIDIキーボードと接続して使用します。49鍵以上を推奨しています。61鍵や88鍵の電子ピアノでも利用できます。',
      'まず試してみたい場合は、画面上の鍵盤でも一部の課題を体験できます。',
    ],
    badges: ['推奨：49鍵以上', '対応：MIDIキーボード / 電子ピアノ', '画面鍵盤で一部体験OK'],
  },
  developer: {
    heading: '現役ジャズピアニストが、実際のレッスン経験をもとに開発。',
    body: [
      'Jazzifyは、ジャズピアニスト・講師として500名以上を指導してきた永吉俊雄が開発しています。',
      '多くの学習者を見てきて感じたのは、才能よりも先に、練習方法でつまずいている人が多いということでした。何を弾けばいいか分からない。できているか判断できない。単調な練習が続かない。',
      'Jazzifyは、そうしたつまずきを減らし、一人でも鍵盤に向かえる環境を作るために生まれました。',
    ],
    stats: ['指導経験 500名以上', '現役ジャズピアニスト / 講師'],
    name: '永吉 俊雄',
    role: 'Jazzify 開発者 / ジャズピアニスト',
    photoAlt: '開発者 ジャズクラブでの演奏風景',
  },
  pricing: {
    eyebrow: 'PRICING',
    heading: '料金',
    lead: '無料で試して、必要になったらプレミアムへ。',
    freeIntro: [
      '無料登録後、MIDIキーボードを接続し、Jazzifyの基本的な練習を体験できます。',
      'クレジットカード登録は不要です。',
    ],
    trial: {
      heading: '7日間無料トライアル',
      body: [
        'プレミアムの手続きを開始したときに、7日間の無料トライアルが始まります（WebのCheckoutまたはApp Store）。',
        '無料登録だけではトライアルは開始されません。トライアル開始時には支払い方法の登録が必要です。',
      ],
    },
    free: {
      name: 'フリー',
      price: '¥0',
      jpyAmount: null,
      priceSuffix: '',
      badge: null,
      highlights: [],
      features: ['基本体験（メインクエスト第1章）', 'MIDIキーボードの接続確認', '画面鍵盤での一部体験'],
      cta: '無料で始める',
    },
    monthly: {
      name: 'プレミアム 月額',
      price: '¥3,980',
      jpyAmount: 3980,
      priceSuffix: '/月（税込）',
      badge: null,
      highlights: [],
      features: ['すべてのコース', 'すべてのモード', '目的別コース', '学習記録・称号'],
      cta: '月額プランを始める',
    },
    yearly: {
      name: 'プレミアム 年額',
      price: '¥34,800',
      jpyAmount: 34800,
      priceSuffix: '/年（税込）',
      badge: 'おすすめ',
      highlights: [
        { text: '月あたり¥2,900', jpyAmount: null },
        { text: '月額払いより年間¥12,960お得', jpyAmount: null },
      ],
      features: ['すべてのコース', 'すべてのモード', '目的別コース', '学習記録・称号'],
      cta: '年額プランを始める',
    },
    notes: [
      'いつでも解約できます。解約後も、支払済み期間の終了までは利用できます。',
      'WebとiOSで同じアカウントを使えますが、課金はどちらか一方のみです（Webで購読中はiOSの課金画面は表示されず、その逆も同様）。',
    ],
  },
  fit: {
    heading: '向いている人・向いていない人',
    forYouHeading: 'Jazzifyが向いている人',
    forYouItems: [
      '鍵盤の位置はおおまかに分かる',
      'コード記号から弾いたり、アドリブしたい',
      'MIDI対応のキーボードまたは電子ピアノを持っている（または購入予定）',
      '長い動画より、弾きながら学ぶ方が合う',
    ],
    notForYouHeading: 'Jazzifyが向いていない人',
    notForYouItems: [
      'クラシックのテクニックを一から学びたい',
      '鍵盤の位置をゼロから覚える必要がある',
      'MIDI非対応の生ピアノしかない',
    ],
  },
  faq: {
    heading: 'よくある質問',
    items: [
      {
        question: '楽譜が読めなくても使えますか？',
        answer: [
          '使えます。',
          '鍵盤表示や音を使った課題も多く、すべての練習で楽譜を読む必要はありません。必要な場面では、少しずつ楽譜にも慣れられるようになっています。',
        ],
      },
      {
        question: 'iPhone/iPadでMIDIを使えますか？',
        answer: [
          'はい。iPhone・iPadでは、JazzifyのiOSアプリからUSB経由でMIDIキーボードを接続できます。',
          '接続方法や対応機材の詳細は、サポートページ「',
        ],
        inlineLink: {
          to: HELP_IOS_MIDI_PATH,
          label: 'iPhone/iPadでMIDIを使う',
          suffix: '」をご覧ください。',
        },
      },
      {
        question: '無料で自動課金されますか？',
        answer: [
          '無料範囲の利用に、クレジットカード登録は必要ありません。',
          '有料プランを自分で申し込まない限り、料金は発生しません。',
        ],
      },
      {
        question: 'WebとiOSで同じアカウントを使えますか？',
        answer: [
          'はい。同じアカウントでWebとiOSのどちらからもログインできます。コースや進行状況も引き継がれます。',
          'ただし、課金はWeb（Checkout）とiOS（App Store）のどちらか一方のみです。一方で購読中は、もう一方から新たに課金することはできません。',
        ],
      },
      {
        question: 'ジャズ経験者にも役立ちますか？',
        answer: [
          'コードフォーム、耳コピ、フレーズ、リズムなどをゲーム形式で反復したい人には役立ちます。',
          '現時点では、上級理論教材よりも、初心者から中級者の演奏基礎を重視しています。',
        ],
      },
    ],
  },
  finalCta: {
    heading: '今日から、ジャズを「勉強」ではなく「演奏」に変えよう。',
    body: [
      '最初から、自由にアドリブできなくても構いません。',
      'まずは一つの音を弾く。次に、コードを一つ覚える。そして、音楽に合わせて鳴らしてみる。',
      '小さな成功を積み重ねれば、ジャズは「難しい音楽」から、自分で演奏できる音楽に変わります。',
    ],
    cta: '無料で始める',
    note: '無料登録はクレジットカード不要 / 画面鍵盤またはMIDIキーボードで体験',
  },
  footer: {
    blurb: 'ジャズピアノを、ゲームのように弾いて覚える学習サービス。理論は分かるがアドリブで手が止まる人向け。',
    serviceHeading: 'サービス',
    signupLink: '新規登録',
    loginLink: 'ログイン',
    supportHeading: 'サポート',
    followHeading: 'フォローする',
    faqLink: 'よくある質問',
    iosMidiLink: 'iPhone/iPadでMIDIを使う',
    midiChoiceLink: 'MIDIキーボードの選び方',
    contactLink: 'お問い合わせ',
    termsLink: '利用規約',
    privacyLink: 'プライバシーポリシー',
    tokushohoLink: '特定商取引法に基づく表記',
    appStoreAria: 'App StoreでJazzifyをダウンロード',
    xAria: 'Jazzify公式X（@jazz_ad_lib）',
    instagramAria: '開発者Instagram（@toshio_jazzpiano）',
  },
};

const COPY_EN: LandingCopy = {
  seo: {
    title: 'Jazzify | Learn jazz piano by playing it like a game',
    description:
      'Jazzify is a jazz piano learning service you play with a MIDI keyboard. Build chords, rhythm, ear training, and improvisation by actually playing — like a game. Start for free.',
  },
  header: {
    nav: NAV_EN,
    login: 'Log in',
    signup: 'Start for free',
    logoAlt: 'Jazzify logo',
  },
  hero: {
    titleLines: ['Your first jazz improvisation,', 'starting with the blues.'],
    subtitle: [
      'You know the chords. But when it\u2019s time to improvise, you freeze \u2014 what should you play?',
      'With Jazzify, just play a MIDI keyboard. Progress through the game, and chords, rhythm, and improvisation stick.',
    ],
    demoCta: 'Start playing now',
    signupCta: 'Start for free',
    appStoreCta: 'Download on the App Store',
    note: 'No credit card required for free signup / Use on-screen keys or connect a MIDI keyboard',
    videoAlt: 'Jazzify Survival mode gameplay video',
    videoBadge: 'Your playing judged in real time',
  },
  promoVideo: {
    eyebrow: 'PROMO VIDEO',
    heading: 'See Jazzify in 90 seconds.',
    sub: [
      'Watch how jazz piano practice feels like a game — with sound.',
    ],
    videoAlt: 'Jazzify promotional video',
  },
  demo: {
    eyebrow: 'DEMO PLAY',
    heading: 'Before you read anything, play for one minute.',
    sub: [
      'Try the Survival mode tutorial right here on this page.',
      'Play with the on-screen keyboard or your MIDI keyboard.',
    ],
    startButton: 'Start the demo',
    finishCta: 'Start for free',
    midiLabel: 'Use a MIDI keyboard (optional)',
    midiHelper: 'No device? You can tap or click the on-screen keys.',
    loading: 'Loading demo...',
    exit: 'Exit',
    lazyPlaceholder: 'The demo loads when you scroll here.',
  },
  pain: {
    heading: ['You understand the theory.', 'But your hands still don\u2019t know what to play.'],
    cards: [
      'You know some chords, but cannot use them in a song.',
      'You watch lessons, but do not know what to practice next.',
      'When improvisation starts, your hands freeze.',
      'Repeating scales does not feel like making music.',
    ],
    body: [],
  },
  solution: {
    heading: 'Play, get feedback, and practice inside music.',
    body: [],
    values: [
      {
        title: 'Play real keys',
        description: 'Connect a MIDI keyboard or begin with the on-screen keyboard.',
      },
      {
        title: 'Get instant feedback',
        description: 'Jazzify recognizes what you play and responds immediately.',
      },
      {
        title: 'Practice inside music',
        description: 'Repeat chords, rhythm, and phrases in playable challenges.',
      },
    ],
  },
  mainQuest: {
    heading: 'Your first goal: play a complete C blues.',
    body: [
      'The Main Quest is a single path to your first success.',
      'We don\u2019t promise a timeline. The screen always tells you what to practice next.',
    ],
    note: 'Your first goal: play a full C blues, start to finish.',
    imageAlt: 'Main Quest chapter screen',
  },
  roadmap: {
    eyebrow: 'FIRST GOAL',
    heading: 'The path to your C blues',
    body: [],
    steps: [
      {
        blockNumber: 1,
        chapter: 'Step 1',
        title: 'Improvise with one or two notes',
        description: 'Start with a small set of notes and try your own phrases over the backing track.',
      },
      {
        blockNumber: 2,
        chapter: 'Step 2',
        title: 'Add essential chords',
        description: 'Practice until you can grab blues chords without thinking.',
      },
      {
        blockNumber: 3,
        chapter: 'Step 3',
        title: 'Lock into the rhythm',
        description: 'Stay with the groove and keep your hands moving.',
      },
      {
        blockNumber: 4,
        chapter: 'Step 4',
        title: 'Follow the blues form',
        description: 'Connect chords and phrases through the blues progression.',
      },
      {
        blockNumber: 5,
        chapter: 'Step 5',
        title: 'Play from start to finish',
        description: 'Play a full C blues: theme \u2192 improvisation \u2192 theme.',
      },
      {
        blockNumber: null,
        chapter: 'Beyond',
        title: 'Grow with goal-based courses',
        description: 'Two-hand voicings, ear training, chord runs, and more \u2014 one theme at a time.',
      },
    ],
    freeBadge: 'Free',
    note: '',
  },
  beforeAfter: {
    heading: 'Change how you practice, and your playing changes.',
    beforeLabel: 'Before',
    beforeItems: [
      "You don't know what to practice today",
      "You can't tell if you're playing correctly",
      'You have no place to try the notes you learned over a backing track',
      'Completed drills never become real playing skills',
    ],
    afterLabel: 'After',
    afterItems: [
      "Today's lesson is already decided",
      'Every note gets instant feedback',
      'You can try the notes you learned over a backing track',
      'Every cleared quest becomes part of your playing',
    ],
  },
  courses: {
    heading: 'What you can learn',
    body: [
      'Once you have the basics from the Main Quest, keep going with courses built around specific goals.',
    ],
    items: [
      {
        title: 'Chord fundamentals',
        description: 'Drill the chord shapes jazz uses most, until you can grab them reflexively.',
      },
      {
        title: 'Rhythm and time',
        description: 'Stay with the groove and keep your hands moving over the backing track.',
      },
      {
        title: 'Ear training',
        description: 'Echo notes and short phrases on the keys, connecting your ears to your hands.',
      },
      {
        title: 'Improvisation',
        description: 'Start with a limited set of notes and grow your ability to create your own phrases.',
      },
      {
        title: 'Two-handed voicings',
        description: 'Practice rich, two-handed chords. Build the voicings you need for comping and solo piano.',
      },
    ],
    imageAlt: 'Quest map screen for focused courses',
  },
  modes: {
    eyebrow: 'HOW IT WORKS',
    heading: 'Keep practicing by playing the game.',
    chordRun: {
      title: 'Chord Run',
      tagline: 'Play chords to run and jump.',
      description: [
        'Repeat chord shapes in a game until you can play them without thinking.',
      ],
      imageAlt: 'Chord Run mode gameplay screen',
    },
    survival: {
      title: 'Survival',
      tagline: 'Play the right notes. Survive.',
      description: [
        'Play the right notes and chords to survive until time runs out.',
      ],
      imageAlt: 'Survival mode gameplay screen',
    },
    battle: {
      title: 'Battle',
      tagline: 'Listen, then play it back.',
      description: [
        'Listen to a phrase, then play it back on the keys.',
      ],
      imageAlt: 'Battle mode gameplay screen',
    },
    viralTweet: {
      translationText:
        'What if a jazz-learning game where the only way to attack is to parry? Enemy plays a phrase → you play the same notes back in time → parry success → the jazz enemy goes down. I\'m building this pretty nonsensical game.',
    },
  },
  platforms: {
    heading: 'What you need to get started',
    body: [
      'Use Jazzify in your PC browser or on the iPhone/iPad app. Pick up your courses and progress with the same account.',
    ],
    cards: [
      {
        title: 'Use on the Web',
        description:
          'Play in a PC or Mac browser. Connect a MIDI keyboard to practice.',
      },
      {
        title: 'Use on iPhone / iPad',
        description:
          'Download from the App Store. Connect a compatible MIDI keyboard to practice. Pick up your courses and progress with the same account.',
        linkTo: HELP_IOS_MIDI_PATH,
        linkLabel: 'See connection guide →',
      },
      {
        title: 'Try with on-screen keys',
        description:
          'No MIDI keyboard yet? Some exercises work with the on-screen keyboard.',
      },
    ],
    appStoreCta: 'Download on the App Store',
    webCta: 'Start for free',
  },
  requirements: {
    heading: 'Connect a MIDI keyboard and start right away.',
    choiceLinkLabel: 'Choosing a MIDI keyboard →',
    body: [
      'Jazzify works with MIDI-compatible digital pianos and MIDI keyboards. We recommend 49 keys or more — 61-key and 88-key digital pianos work too.',
      'Want to try it first? You can experience some exercises with the on-screen keyboard.',
    ],
    badges: ['Recommended: 49+ keys', 'Works with: MIDI keyboards / digital pianos', 'Partial play with on-screen keys'],
  },
  developer: {
    heading: 'Built by a working jazz pianist, from real teaching experience.',
    body: [
      'Jazzify is developed by Toshio Nagayoshi, a jazz pianist and instructor who has taught more than 500 students.',
      "Watching so many learners, one thing became clear: long before talent matters, most people get stuck on how to practice. Not knowing what to play. Not knowing if they're doing it right. Not being able to sustain repetitive practice.",
      'Jazzify was born to remove those obstacles and create an environment where anyone can sit down at the keys on their own.',
    ],
    stats: ['500+ students taught', 'Working jazz pianist / instructor'],
    name: 'Toshio Nagayoshi',
    role: 'Jazzify Developer / Jazz Pianist',
    photoAlt: 'The developer performing at a jazz club',
  },
  pricing: {
    eyebrow: 'PRICING',
    heading: 'Pricing',
    lead: 'Try it free. Upgrade to Premium when you need more.',
    freeIntro: [
      'After free registration, connect your MIDI keyboard and try Jazzify\u2019s core practice experience.',
      'No credit card required.',
    ],
    trial: {
      heading: '7-day free trial',
      body: [
        'The 7-day free trial starts when you begin a Premium subscription (Web checkout or App Store).',
        'It does not start at free signup. A payment method is required when the trial begins.',
      ],
    },
    free: {
      name: 'Free',
      price: '$0',
      jpyAmount: null,
      priceSuffix: '',
      badge: null,
      highlights: [],
      features: ['Core experience (Main Quest chapter 1)', 'MIDI keyboard connection check', 'Partial play with on-screen keys'],
      cta: 'Start for free',
    },
    monthly: {
      name: 'Premium Monthly',
      price: '$24.99',
      jpyAmount: null,
      priceSuffix: '/month',
      badge: null,
      highlights: [],
      features: ['All courses', 'All game modes', 'Focused courses', 'Progress tracking & titles'],
      cta: 'Start monthly plan',
    },
    yearly: {
      name: 'Premium Yearly',
      price: '$199',
      jpyAmount: null,
      priceSuffix: '/year',
      badge: 'Best value',
      highlights: [
        { text: '$16.58 per month', jpyAmount: null },
        { text: 'Save $100.88 a year vs monthly', jpyAmount: null },
      ],
      features: ['All courses', 'All game modes', 'Focused courses', 'Progress tracking & titles'],
      cta: 'Start yearly plan',
    },
    notes: [
      'Cancel anytime. After cancellation, you keep access until the end of the period you have paid for.',
      'You can use the same account on Web and iOS, but billing is exclusive to one platform (if you subscribe on Web, iOS billing is unavailable, and vice versa).',
      'Prices are charged in US dollars (USD).',
    ],
  },
  fit: {
    heading: 'Is Jazzify for you?',
    forYouHeading: 'Jazzify is for you if:',
    forYouItems: [
      'You already know where the notes are.',
      'You want to improvise or play from chord symbols.',
      'You own a MIDI-compatible keyboard or digital piano.',
      'You prefer learning by playing rather than watching long videos.',
    ],
    notForYouHeading: 'Jazzify may not be for you if:',
    notForYouItems: [
      'You are looking for classical technique lessons.',
      'You need to learn basic keyboard geography from zero.',
      'You only have an acoustic piano without MIDI.',
    ],
  },
  faq: {
    heading: 'Frequently asked questions',
    items: [
      {
        question: "I can't read sheet music. Is that a problem?",
        answer: [
          'Not at all.',
          'Many exercises use keyboard displays and sound, so you don\u2019t need to read notation for everything. Where it helps, you\u2019ll get comfortable with notation gradually.',
        ],
      },
      {
        question: 'Can I use MIDI on iPhone / iPad?',
        answer: [
          'Yes. On iPhone and iPad, you can connect a MIDI keyboard via USB through the Jazzify iOS app.',
          'For setup steps and compatible gear, see our support page: ',
        ],
        inlineLink: {
          to: HELP_IOS_MIDI_PATH,
          label: 'MIDI on iPhone / iPad',
          suffix: '.',
        },
      },
      {
        question: 'Will I be charged automatically on the free plan?',
        answer: [
          'No credit card is required for the free tier.',
          'You will never be charged unless you sign up for a paid plan yourself.',
        ],
      },
      {
        question: 'Can I use the same account on Web and iOS?',
        answer: [
          'Yes. You can log in with the same account on Web and iOS. Your courses and progress carry over.',
          'However, billing is exclusive to one platform. If you subscribe on Web, you cannot start a new subscription on iOS (and vice versa).',
        ],
      },
      {
        question: 'Is Jazzify useful for experienced jazz players?',
        answer: [
          'If you want game-style repetition for chord shapes, ear training, phrases, and rhythm, yes.',
          'For now, Jazzify focuses on beginner-to-intermediate playing fundamentals rather than advanced theory material.',
        ],
      },
    ],
  },
  finalCta: {
    heading: 'Starting today, turn jazz from studying into playing.',
    body: [
      "You don't need to improvise freely from day one.",
      'Play one note. Learn one chord. Then play it along with the music.',
      'Stack up small wins, and jazz changes from "difficult music" into music you can play yourself.',
    ],
    cta: 'Start for free',
    note: 'No credit card required for free signup / Use on-screen keys or connect a MIDI keyboard',
  },
  footer: {
    blurb: 'Learn jazz piano by playing it like a game. For pianists who know the notes but freeze when it\u2019s time to improvise.',
    serviceHeading: 'Service',
    signupLink: 'Sign up',
    loginLink: 'Log in',
    supportHeading: 'Support',
    followHeading: 'Follow',
    faqLink: 'FAQ',
    iosMidiLink: 'MIDI on iPhone / iPad',
    midiChoiceLink: 'Choosing a MIDI keyboard',
    contactLink: 'Contact',
    termsLink: 'Terms of Service',
    privacyLink: 'Privacy Policy',
    tokushohoLink: 'Legal Notice',
    appStoreAria: 'Download Jazzify on the App Store',
    xAria: 'Jazzify on X (@jazz_ad_lib)',
    instagramAria: 'Developer Instagram (@toshio_jazzpiano)',
  },
};

export const getLandingCopy = (english: boolean): LandingCopy => (english ? COPY_EN : COPY_JA);

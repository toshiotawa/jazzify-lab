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
  steps: string[];
  note: string;
  imageAlt: string;
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

interface LandingModesCopy {
  eyebrow: string;
  heading: string;
  chordRun: LandingModeItem;
  survival: LandingModeItem;
  battle: LandingModeItem;
}

interface LandingSkillsCopy {
  heading: string;
  body: string[];
  items: string[];
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

interface LandingFreeTierCopy {
  heading: string;
  body: string[];
  checks: string[];
  cta: string;
  note: string;
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

interface LandingPricingCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  free: LandingPricingPlan;
  monthly: LandingPricingPlan;
  yearly: LandingPricingPlan;
  notes: string[];
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
  demo: LandingDemoCopy;
  pain: LandingPainCopy;
  solution: LandingSolutionCopy;
  mainQuest: LandingMainQuestCopy;
  courses: LandingCoursesCopy;
  modes: LandingModesCopy;
  platforms: LandingPlatformsCopy;
  skills: LandingSkillsCopy;
  requirements: LandingRequirementsCopy;
  developer: LandingDeveloperCopy;
  freeTier: LandingFreeTierCopy;
  pricing: LandingPricingCopy;
  faq: LandingFaqCopy;
  finalCta: LandingFinalCtaCopy;
  footer: LandingFooterCopy;
}

const NAV_JA: LandingNavLink[] = [
  { id: 'features', label: '特徴' },
  { id: 'courses', label: 'コース' },
  { id: 'modes', label: 'モード' },
  { id: 'pricing', label: '料金' },
  { id: 'faq', label: 'FAQ' },
];

const NAV_EN: LandingNavLink[] = [
  { id: 'features', label: 'Features' },
  { id: 'courses', label: 'Courses' },
  { id: 'modes', label: 'Modes' },
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
    titleLines: ['ジャズピアノを、', 'ゲームのように', '弾いて覚える。'],
    subtitle: [
      'Jazzifyは、MIDIキーボードをつないで遊ぶ、ジャズピアノ学習サービスです。',
      'コード、リズム、耳コピ、アドリブを、実際に鍵盤を弾きながら身につけます。',
    ],
    demoCta: '1分だけ体験する',
    signupCta: '無料で始める',
    appStoreCta: 'App Storeでダウンロード',
    note: 'クレジットカード登録不要 / Web・iPhone・iPad対応 / 画面鍵盤でも一部体験OK',
    videoAlt: 'Jazzify サバイバルモードのプレイ映像',
    videoBadge: 'コードを弾く → キャラが動く',
  },
  demo: {
    eyebrow: 'DEMO PLAY',
    heading: '説明を読む前に、1分だけ弾いてみよう。',
    sub: [
      'このページ内で、サバイバルモードのチュートリアルを実際に体験できます。',
      '画面の鍵盤でも、MIDIキーボードでもプレイできます。',
    ],
    startButton: 'デモプレイを始める',
    finishCta: '無料登録して続きをプレイする',
    midiLabel: 'MIDIキーボードを使う（任意）',
    midiHelper: '未接続でも、画面の鍵盤をタップ・クリックして体験できます。',
    loading: 'デモを読み込み中...',
    exit: '終了',
    lazyPlaceholder: 'この位置までスクロールするとデモを読み込みます。',
  },
  pain: {
    heading: ['ジャズを始めたい。', 'でも、何から練習すればいいのか分からない。'],
    cards: [
      '教則本を買っても、説明ばかりで手が動かない。',
      'YouTubeを見ても、内容がバラバラで迷ってしまう。',
      'コードやスケールを覚えても、曲の中で使えない。',
      'アドリブになると、何を弾いていいか分からない。',
    ],
    body: [
      'ジャズは自由な音楽です。しかし、自由に弾けるようになるまでの練習は、多くの人にとって分かりにくく、続けにくいものでした。',
      'Jazzifyは、その練習をゲームとして作り直します。',
    ],
  },
  solution: {
    heading: '読むだけではなく、弾いて進む。',
    body: [
      'Jazzifyでは、画面の指示に合わせて実際に鍵盤を弾きます。正しいコードを弾く。リズムに合わせる。聴こえたフレーズを弾き返す。限られた音だけでアドリブする。',
      '理解したつもりで終わらず、弾けたことを確認しながら先へ進みます。',
    ],
    values: [
      {
        title: '実際に鍵盤を弾いて進む',
        description: '読むだけ・見るだけでは先に進めません。弾けたら次へ、が基本ルールです。',
      },
      {
        title: 'その場で正誤や反応が分かる',
        description: '弾いた音にゲームが即座に反応。できているかを自分で判断する必要がありません。',
      },
      {
        title: '反復練習をゲームとして続けられる',
        description: '単調になりがちな反復練習を、クリアしたくなるステージとして設計しています。',
      },
    ],
  },
  mainQuest: {
    heading: 'まずは、Cブルースから。',
    body: [
      'メインクエストは、ジャズ初心者が順番に進める一本道のコースです。',
      '最初から難しい理論を詰め込むのではなく、少ない音でアドリブするところから始め、コード、リズム、ブルース進行へと少しずつ進んでいきます。',
      '「次に何を練習すればいいか」で迷わず、実際に弾きながらジャズの基本を身につけます。',
    ],
    steps: ['少ない音でアドリブ', 'コードを弾く', 'リズムに合わせる', 'ブルース進行へ'],
    note: '最初のゴールは、Cブルースを1曲とおして演奏すること。',
    imageAlt: 'メインクエストのチャプター画面',
  },
  courses: {
    heading: '目的別に、鍛える。',
    body: [
      'メインクエストで基本を身につけたら、目的に合わせたコースでさらに練習できます。',
      '両手ヴォイシング、アドリブ、コード基礎、耳コピなど、ジャズピアノに必要な力をテーマごとに鍛えられます。',
    ],
    items: [
      {
        title: '両手ヴォイシングコース',
        description: '両手で響きのあるコードを弾く練習。伴奏やソロピアノに必要なヴォイシングを身につけます。',
      },
      {
        title: 'アドリブコース',
        description: '限られた音から始めて、少しずつ自分のフレーズを作る力を育てます。',
      },
      {
        title: 'コード基礎コース',
        description: 'ジャズでよく使うコードフォームを、反射的に押さえられるまで練習します。',
      },
      {
        title: '耳コピコース',
        description: '聴こえた音や短いフレーズを鍵盤で弾き返し、耳と手のつながりを鍛えます。',
      },
    ],
    imageAlt: '目的別コースのクエストマップ画面',
  },
  modes: {
    eyebrow: 'GAME MODES',
    heading: '同じ練習でも、遊び方が変わる。',
    chordRun: {
      title: 'コードラン',
      tagline: 'コードを弾いて、走る・跳ぶ。',
      description: [
        'コードを弾くと、キャラクターが走り、ジャンプします。',
        'コードフォームを考え込まずに出せるまで、ゲーム感覚で繰り返し練習できます。',
      ],
      imageAlt: 'コードランモードのプレイ画面',
    },
    survival: {
      title: 'サバイバル',
      tagline: '正しい音で戦い、生き残る。',
      description: [
        '正しい音やコードを弾いて敵に攻撃し、制限時間を生き残るモードです。',
        '反復練習を単調な作業で終わらせず、集中して続けられる形にします。',
      ],
      imageAlt: 'サバイバルモードのプレイ画面',
    },
    battle: {
      title: 'バトル',
      tagline: '聴いて、弾き返す。',
      description: [
        '相手が演奏した音やフレーズを聴き、同じように鍵盤で弾き返します。',
        'ジャズに必要な「聴いて反応する力」を鍛えます。',
      ],
      imageAlt: 'バトルモードのプレイ画面',
    },
  },
  platforms: {
    heading: 'Webでも、iPhone/iPadでも。',
    body: [
      'Jazzifyは、PCブラウザでもiPhone/iPadアプリでも使えます。',
      'MIDIキーボードを接続すれば、画面の指示に合わせて実際に弾きながら練習できます。',
      'まずは画面上の鍵盤でも、一部の課題を体験できます。',
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
    webCta: 'Webで無料体験する',
  },
  skills: {
    heading: 'バラバラだった練習を、「ジャズを弾く力」につなげる。',
    body: [
      'Jazzifyで練習するのは、知識だけではありません。それぞれの力を別々に覚えるのではなく、演奏しながら結びつけていきます。',
    ],
    items: [
      'コードをすぐ押さえる力',
      'リズムを止めない力',
      '聴いて反応する力',
      'フレーズを覚えて使う力',
      '少ない音からアドリブする力',
    ],
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
  freeTier: {
    heading: 'まずは無料で、実際に弾いてみてください。',
    body: [
      '無料登録後、MIDIキーボードを接続し、Jazzifyの基本的な練習を体験できます。',
      '料金を払う前に、次のことを確認できます。',
    ],
    checks: [
      '自分の機材で接続できるか',
      'ゲーム形式の練習が自分に合うか',
      '本当に続けられそうか',
    ],
    cta: '無料で始める',
    note: 'クレジットカード登録不要',
  },
  pricing: {
    eyebrow: 'PRICING',
    heading: '料金',
    lead: '無料で試して、必要になったらプレミアムへ。',
    free: {
      name: 'フリー',
      price: '¥0',
      jpyAmount: null,
      priceSuffix: '',
      badge: null,
      highlights: [],
      features: ['基本体験（メインクエスト第1チャプター）', 'MIDIキーボードの接続確認', '画面鍵盤での一部体験'],
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
      '初回登録時には7日間の無料トライアルが付与されます。',
    ],
  },
  faq: {
    heading: 'よくある質問',
    items: [
      {
        question: '初心者でも使えますか？',
        answer: [
          '基本的な鍵盤の位置が分かれば始められます。',
          'ただし、クラシックピアノの基礎や読譜を一から教えるサービスではありません。ピアノ経験が少ない人でも、コードやアドリブを少しずつ学べるように設計しています。',
        ],
      },
      {
        question: '楽譜が読めなくても使えますか？',
        answer: [
          '使えます。',
          '鍵盤表示や音を使った課題も多く、すべての練習で楽譜を読む必要はありません。必要な場面では、少しずつ楽譜にも慣れられるようになっています。',
        ],
      },
      {
        question: '生ピアノで使えますか？',
        answer: [
          'MIDI出力に対応していない生ピアノだけでは、演奏を認識できません。',
          'MIDI対応の電子ピアノまたはMIDIキーボードが必要です。',
        ],
      },
      {
        question: 'スマートフォンだけでも利用できますか？',
        answer: [
          '一部の課題は画面鍵盤でも体験できます。',
          '本格的に練習する場合は、MIDIキーボードの接続を推奨します。iPhone・iPadではiOSアプリからUSB経由でMIDIキーボードを接続できます。接続方法は「',
        ],
        inlineLink: {
          to: HELP_IOS_MIDI_PATH,
          label: 'iPhone/iPadでMIDIを使う',
          suffix: '」をご覧ください。',
        },
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
    cta: '無料でJazzifyを始める',
    note: 'クレジットカード登録不要 / Web・iPhone・iPad対応 / 画面鍵盤でも一部体験OK',
  },
  footer: {
    blurb: 'ジャズピアノを、ゲームのように弾いて覚える学習サービス。',
    serviceHeading: 'サービス',
    signupLink: '新規登録',
    loginLink: 'ログイン',
    supportHeading: 'サポート',
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
    titleLines: ['Learn jazz piano', 'by playing it', 'like a game.'],
    subtitle: [
      'Jazzify is a jazz piano learning service you play with a MIDI keyboard.',
      'Build chords, rhythm, ear training, and improvisation by actually playing the keys.',
    ],
    demoCta: 'Try the 1-minute demo',
    signupCta: 'Start for free',
    appStoreCta: 'Download on the App Store',
    note: 'No credit card required / Works on Web, iPhone & iPad / On-screen keys for some exercises',
    videoAlt: 'Jazzify Survival mode gameplay video',
    videoBadge: 'Play a chord → your character moves',
  },
  demo: {
    eyebrow: 'DEMO PLAY',
    heading: 'Before you read anything, play for one minute.',
    sub: [
      'Try the Survival mode tutorial right here on this page.',
      'Play with the on-screen keyboard or your MIDI keyboard.',
    ],
    startButton: 'Start the demo',
    finishCta: 'Sign up free and keep playing',
    midiLabel: 'Use a MIDI keyboard (optional)',
    midiHelper: 'No device? You can tap or click the on-screen keys.',
    loading: 'Loading demo...',
    exit: 'Exit',
    lazyPlaceholder: 'The demo loads when you scroll here.',
  },
  pain: {
    heading: ['You want to start jazz.', "But you don't know what to practice first."],
    cards: [
      'Method books are all explanation — your hands never move.',
      'YouTube lessons are scattered, and you get lost.',
      "You memorize chords and scales, but can't use them in songs.",
      "When it's time to improvise, you don't know what to play.",
    ],
    body: [
      'Jazz is free music. But the practice it takes to play freely has been confusing and hard to sustain for most people.',
      'Jazzify rebuilds that practice as a game.',
    ],
  },
  solution: {
    heading: "Don't just read. Play your way forward.",
    body: [
      'In Jazzify, you play real keys along with on-screen prompts. Play the right chord. Lock into the rhythm. Echo the phrase you just heard. Improvise with a limited set of notes.',
      "You don't stop at understanding — you confirm you can play it, then move on.",
    ],
    values: [
      {
        title: 'Progress by actually playing',
        description: "Reading and watching won't move you forward. Play it, then advance — that's the rule.",
      },
      {
        title: 'Instant feedback on every note',
        description: 'The game reacts to what you play, so you never have to judge yourself.',
      },
      {
        title: 'Repetition that feels like a game',
        description: 'Drills that would feel tedious become stages you want to clear.',
      },
    ],
  },
  mainQuest: {
    heading: 'It starts with the C blues.',
    body: [
      'The Main Quest is a single guided path for jazz beginners.',
      'Instead of front-loading difficult theory, you start by improvising with just a few notes, then move gradually through chords, rhythm, and the blues progression.',
      'No more wondering what to practice next — you learn the fundamentals of jazz by playing them.',
    ],
    steps: ['Improvise with a few notes', 'Play chords', 'Lock into rhythm', 'On to the blues progression'],
    note: 'Your first goal: play a full C blues, start to finish.',
    imageAlt: 'Main Quest chapter screen',
  },
  courses: {
    heading: 'Train with purpose.',
    body: [
      'Once you have the basics from the Main Quest, keep going with courses built around specific goals.',
      'Train the skills jazz piano demands — two-hand voicings, improvisation, chord fundamentals, and ear training — one theme at a time.',
    ],
    items: [
      {
        title: 'Two-Hand Voicings',
        description: 'Practice rich, two-handed chords. Build the voicings you need for comping and solo piano.',
      },
      {
        title: 'Improvisation',
        description: 'Start with a limited set of notes and grow your ability to create your own phrases.',
      },
      {
        title: 'Chord Fundamentals',
        description: 'Drill the chord shapes jazz uses most, until you can grab them reflexively.',
      },
      {
        title: 'Ear Training',
        description: 'Echo notes and short phrases on the keys, connecting your ears to your hands.',
      },
    ],
    imageAlt: 'Quest map screen for focused courses',
  },
  modes: {
    eyebrow: 'GAME MODES',
    heading: 'Same practice, different ways to play.',
    chordRun: {
      title: 'Chord Run',
      tagline: 'Play chords to run and jump.',
      description: [
        'Every chord you play makes your character run and jump.',
        'Repeat chord shapes in a game until you can play them without thinking.',
      ],
      imageAlt: 'Chord Run mode gameplay screen',
    },
    survival: {
      title: 'Survival',
      tagline: 'Play the right notes. Survive.',
      description: [
        'Attack enemies by playing the right notes and chords, and survive until time runs out.',
        'Repetition stays focused and fun instead of turning into a chore.',
      ],
      imageAlt: 'Survival mode gameplay screen',
    },
    battle: {
      title: 'Battle',
      tagline: 'Listen, then play it back.',
      description: [
        'Listen to the notes and phrases your opponent plays, then play them back on the keys.',
        'Train the listen-and-respond reflexes that jazz demands.',
      ],
      imageAlt: 'Battle mode gameplay screen',
    },
  },
  platforms: {
    heading: 'Works on Web, iPhone, and iPad.',
    body: [
      'Use Jazzify in your PC browser or on the iPhone/iPad app.',
      'Connect a MIDI keyboard and practice by actually playing along with on-screen prompts.',
      'You can also try some exercises with the on-screen keyboard first.',
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
    webCta: 'Try free on the Web',
  },
  skills: {
    heading: 'Connect scattered practice into the ability to play jazz.',
    body: [
      "What you build in Jazzify isn't just knowledge. Instead of learning each skill in isolation, you connect them while you play.",
    ],
    items: [
      'Grab chords instantly',
      'Keep the rhythm going',
      'Hear and respond',
      'Remember and use phrases',
      'Improvise from a few notes',
    ],
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
  freeTier: {
    heading: 'Start free — and actually play.',
    body: [
      'After free registration, connect your MIDI keyboard and try Jazzify\u2019s core practice experience.',
      'Before paying anything, you can confirm:',
    ],
    checks: [
      'Your gear connects properly',
      'Game-style practice suits you',
      'You can really stick with it',
    ],
    cta: 'Start for free',
    note: 'No credit card required',
  },
  pricing: {
    eyebrow: 'PRICING',
    heading: 'Pricing',
    lead: 'Try it free. Upgrade to Premium when you need more.',
    free: {
      name: 'Free',
      price: '¥0',
      jpyAmount: null,
      priceSuffix: '',
      badge: null,
      highlights: [],
      features: ['Core experience (Main Quest chapter 1)', 'MIDI keyboard connection check', 'Partial play with on-screen keys'],
      cta: 'Start for free',
    },
    monthly: {
      name: 'Premium Monthly',
      price: '¥3,980',
      jpyAmount: 3980,
      priceSuffix: '/month (tax incl.)',
      badge: null,
      highlights: [],
      features: ['All courses', 'All game modes', 'Focused courses', 'Progress tracking & titles'],
      cta: 'Start monthly plan',
    },
    yearly: {
      name: 'Premium Yearly',
      price: '¥34,800',
      jpyAmount: 34800,
      priceSuffix: '/year (tax incl.)',
      badge: 'Best value',
      highlights: [
        { text: '¥2,900 per month', jpyAmount: 2900 },
        { text: 'Save ¥12,960 a year vs monthly', jpyAmount: 12960 },
      ],
      features: ['All courses', 'All game modes', 'Focused courses', 'Progress tracking & titles'],
      cta: 'Start yearly plan',
    },
    notes: [
      'Cancel anytime. After cancellation, you keep access until the end of the period you have paid for.',
      'New users receive a 7-day free trial.',
      'Prices are charged in Japanese yen (JPY). USD amounts are approximate, based on daily exchange rates, and shown for reference only.',
    ],
  },
  faq: {
    heading: 'Frequently asked questions',
    items: [
      {
        question: 'Can beginners use Jazzify?',
        answer: [
          'Yes — if you know where the notes are on a keyboard, you can start.',
          "That said, Jazzify is not a service that teaches classical piano technique or sight-reading from scratch. It's designed so that players with little piano experience can learn chords and improvisation step by step.",
        ],
      },
      {
        question: "I can't read sheet music. Is that a problem?",
        answer: [
          'Not at all.',
          'Many exercises use keyboard displays and sound, so you don\u2019t need to read notation for everything. Where it helps, you\u2019ll get comfortable with notation gradually.',
        ],
      },
      {
        question: 'Can I use an acoustic piano?',
        answer: [
          'An acoustic piano without MIDI output cannot be recognized.',
          'You need a MIDI-compatible digital piano or a MIDI keyboard.',
        ],
      },
      {
        question: 'Can I use it on just a smartphone?',
        answer: [
          'Some exercises work with the on-screen keyboard.',
          'For serious practice, we recommend connecting a MIDI keyboard. On iPhone and iPad, you can connect one via USB using the iOS app. See ',
        ],
        inlineLink: {
          to: HELP_IOS_MIDI_PATH,
          label: 'MIDI on iPhone / iPad',
          suffix: ' for setup steps.',
        },
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
    cta: 'Start Jazzify for free',
    note: 'No credit card required / Works on Web, iPhone & iPad / On-screen keys for some exercises',
  },
  footer: {
    blurb: 'A learning service where you learn jazz piano by playing it like a game.',
    serviceHeading: 'Service',
    signupLink: 'Sign up',
    loginLink: 'Log in',
    supportHeading: 'Support',
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

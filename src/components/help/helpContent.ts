export type HelpLocale = 'ja' | 'en';

export interface HelpConnectionExampleCopy {
  heading: string;
  imageAlt: string;
  diagram: string;
}

export interface HelpIosMidiCopy {
  pageTitle: string;
  helmetTitle: string;
  backButtonLabel: string;
  backButtonAria: string;
  intro: string;
  lightningHeading: string;
  lightningBody: string;
  lightningExamples: HelpConnectionExampleCopy[];
  usbcHeading: string;
  usbcBody: string;
  usbcExamples: HelpConnectionExampleCopy[];
  usbcClosing: string;
  tipsHeading: string;
  tips: string[];
  contactLinkLabel: string;
}

export interface HelpKeyboardModelCopy {
  badge: string;
  title: string;
  imageAlt: string;
  body: string;
}

export interface HelpMidiKeyboardChoiceCopy {
  pageTitle: string;
  helmetTitle: string;
  backButtonLabel: string;
  backButtonAria: string;
  conclusionHeading: string;
  conclusionLead: string;
  conclusionSmallKeyboard: string;
  conclusionFullSize: string;
  conclusionSummaryLabel: string;
  conclusionSummary: string;
  sizeHeading: string;
  sizeTable: string;
  sizeNote: string;
  modelsHeading: string;
  modelsIntro: string;
  models: HelpKeyboardModelCopy[];
  disclaimerHeading: string;
  disclaimerBody: string;
  disclaimerNote: string;
  iosMidiCrossLinkPrefix: string;
  iosMidiCrossLinkLabel: string;
  iosMidiCrossLinkSuffix: string;
}

const HELP_IOS_MIDI_JA: HelpIosMidiCopy = {
  pageTitle: 'iPhone/iPad での MIDI 機器利用について',
  helmetTitle: 'iPhone/iPad での MIDI 接続 — Jazzify',
  backButtonLabel: '← 戻る',
  backButtonAria: '前のページに戻る',
  intro:
    'MIDIキーボード（電子ピアノ）をiPhone/iPadに接続すると、より本格的な演奏練習が可能になります。ここでは接続方法を説明します。',
  lightningHeading: 'Lightning端子のiPhone / iPadの場合',
  lightningBody:
    'Lightning端子のiPhone/iPadでは、Apple純正の「Lightning - USBカメラアダプタ」が必要です。以下の順番で接続してください。',
  lightningExamples: [
    {
      heading: 'iPhone（Lightning端子）',
      imageAlt: 'Lightning端子のiPhoneとMIDIキーボードの接続例',
      diagram: 'iPhone ― カメラアダプタ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード',
    },
    {
      heading: 'iPad（Lightning端子）',
      imageAlt: 'Lightning端子のiPadとMIDIキーボードの接続例',
      diagram: 'iPad ― カメラアダプタ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード',
    },
  ],
  usbcHeading: 'USB Type-C端子のiPhone / iPadの場合',
  usbcBody: 'USB Type-C端子のiPhone/iPadでは、カメラアダプタなしで直接接続できる場合があります。',
  usbcExamples: [
    {
      heading: 'iPhone — パターン1（Type-C → Type-Bケーブル）',
      imageAlt: 'USB Type-C端子のiPhoneとMIDIキーボードの直接接続例',
      diagram: 'iPhone ― ケーブル（Type-C ↔ Type-B） ― MIDIキーボード',
    },
    {
      heading: 'iPhone — パターン2（Type-A → Type-Bケーブル + ハブ）',
      imageAlt: 'USB Type-C端子のiPhoneとType-Cハブ経由のMIDIキーボード接続例',
      diagram: 'iPhone ― TypeCハブ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード',
    },
    {
      heading: 'iPad — パターン1（Type-C → Type-Bケーブル）',
      imageAlt: 'USB Type-C端子のiPadとMIDIキーボードの直接接続例',
      diagram: 'iPad ― ケーブル（Type-C ↔ Type-B） ― MIDIキーボード',
    },
    {
      heading: 'iPad — パターン2（Type-A → Type-Bケーブル + ハブ）',
      imageAlt: 'USB Type-C端子のiPadとType-Cハブ経由のMIDIキーボード接続例',
      diagram: 'iPad ― TypeCハブ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード',
    },
  ],
  usbcClosing: 'お使いのMIDIキーボードの端子に合わせて、適切なケーブルを選んでください。',
  tipsHeading: '接続のヒント',
  tips: [
    'MIDIキーボードの電源が入っていることを確認してください。',
    '接続すると、アプリが自動的にMIDIデバイスを検出します。',
    'うまく接続できない場合は、ケーブルを抜き差ししたり、アプリを再起動してみてください。',
  ],
  contactLinkLabel: 'お問い合わせフォーム',
};

const HELP_IOS_MIDI_EN: HelpIosMidiCopy = {
  pageTitle: 'Using MIDI Devices on iPhone / iPad',
  helmetTitle: 'MIDI on iPhone / iPad — Jazzify',
  backButtonLabel: '← Back',
  backButtonAria: 'Go back to the previous page',
  intro:
    'Connecting a MIDI keyboard (digital piano) to your iPhone or iPad lets you practice with a more realistic playing setup. This page explains how to connect.',
  lightningHeading: 'iPhone / iPad with a Lightning Port',
  lightningBody:
    'For iPhone/iPad models with a Lightning port, you need Apple\'s official "Lightning to USB Camera Adapter." Connect in the order shown below.',
  lightningExamples: [
    {
      heading: 'iPhone (Lightning port)',
      imageAlt: 'Example connection between a Lightning iPhone and a MIDI keyboard',
      diagram: 'iPhone — Camera Adapter — Cable (Type-A ↔ Type-B) — MIDI keyboard',
    },
    {
      heading: 'iPad (Lightning port)',
      imageAlt: 'Example connection between a Lightning iPad and a MIDI keyboard',
      diagram: 'iPad — Camera Adapter — Cable (Type-A ↔ Type-B) — MIDI keyboard',
    },
  ],
  usbcHeading: 'iPhone / iPad with a USB Type-C Port',
  usbcBody:
    'On iPhone/iPad models with USB Type-C, you may be able to connect directly without a camera adapter.',
  usbcExamples: [
    {
      heading: 'iPhone — Pattern 1 (Type-C → Type-B cable)',
      imageAlt: 'Example direct connection between a USB-C iPhone and a MIDI keyboard',
      diagram: 'iPhone — Cable (Type-C ↔ Type-B) — MIDI keyboard',
    },
    {
      heading: 'iPhone — Pattern 2 (Type-A → Type-B cable + hub)',
      imageAlt: 'Example MIDI keyboard connection via a USB-C hub on iPhone',
      diagram: 'iPhone — Type-C hub — Cable (Type-A ↔ Type-B) — MIDI keyboard',
    },
    {
      heading: 'iPad — Pattern 1 (Type-C → Type-B cable)',
      imageAlt: 'Example direct connection between a USB-C iPad and a MIDI keyboard',
      diagram: 'iPad — Cable (Type-C ↔ Type-B) — MIDI keyboard',
    },
    {
      heading: 'iPad — Pattern 2 (Type-A → Type-B cable + hub)',
      imageAlt: 'Example MIDI keyboard connection via a USB-C hub on iPad',
      diagram: 'iPad — Type-C hub — Cable (Type-A ↔ Type-B) — MIDI keyboard',
    },
  ],
  usbcClosing: 'Choose the cable that matches the ports on your MIDI keyboard.',
  tipsHeading: 'Connection Tips',
  tips: [
    'Make sure your MIDI keyboard is powered on.',
    'Once connected, the app should detect your MIDI device automatically.',
    'If connection fails, try unplugging and replugging the cable, or restart the app.',
  ],
  contactLinkLabel: 'Contact form',
};

const HELP_MIDI_KEYBOARD_CHOICE_JA: HelpMidiKeyboardChoiceCopy = {
  pageTitle: 'MIDIキーボードの選び方',
  helmetTitle: 'MIDIキーボードの選び方 — Jazzify',
  backButtonLabel: '← 戻る',
  backButtonAria: '前のページに戻る',
  conclusionHeading: 'まず結論',
  conclusionLead:
    'このアプリをしっかり楽しむなら、49鍵以上のMIDIキーボードがおすすめです。迷ったら 61鍵 を選んでください。コード練習、左手・右手を使った練習、ジャズのボイシング練習にちょうどよいサイズです。',
  conclusionSmallKeyboard:
    '25〜37鍵の小型キーボードでも接続できますが、鍵盤数が少ないため、両手を使った練習や広い音域のコード練習では窮屈に感じることがあります。',
  conclusionFullSize: '88鍵は、本格的なピアノ練習やほかの音楽制作にも使いたい方向けです。',
  conclusionSummaryLabel: 'ひとことで：',
  conclusionSummary: '迷ったら61鍵。安く始めるなら49鍵以上。88鍵は本格派向け。',
  sizeHeading: '鍵数の位置づけ（目安）',
  sizeTable: `鍵盤数     位置づけ                    アプリでの考え方
25〜37鍵   お試し・持ち運び向き        使えるがジャズピアノ練習には狭い
49鍵       最低おすすめライン          まず楽しむならここから
61鍵       一番おすすめ               迷ったらこれ
88鍵       本格派・ピアノ兼用         ほか用途もあるなら選ぶ価値あり`,
  sizeNote:
    'ジャズピアノでは左手のルートやシェルボイシング、右手のコードやメロディを同時に扱うことが多く、鍵が少ないとすぐ狭く感じます。',
  modelsHeading: '機種の例（参考・リンクなし）',
  modelsIntro:
    'USB‑MIDIでシンプルに使える製品として、M‑Audio Keystation シリーズの一例です。価格は店舗・在庫・時期で変わるため、ここには固定では書きません。',
  models: [
    {
      badge: 'まず試したい・省スペース',
      title: 'Keystation Mini 32',
      imageAlt: 'Keystation Mini 32 イメージ',
      body: 'アプリに触ってみたい・持ち運びたいとき向け。本格的な両手でのジャズピアノ練習というより、まず環境をそろえる段階向けです。',
    },
    {
      badge: '迷ったらこれ',
      title: 'Keystation 61 MK3',
      imageAlt: 'Keystation 61 MK3 イメージ',
      body: 'Jazzifyでのコード練習や両手ワークのバランスが一番取りやすいサイズです。迷ったときの標準になる機種クラスです。',
    },
    {
      badge: 'フルレンジ／兼用したい人',
      title: 'Keystation 88 MK3',
      imageAlt: 'Keystation 88 MK3 イメージ',
      body: '88鍵すべてを使えるため、両手で広く音域を取る練習や、ピアノと同じ段数に慣れるのに向いています。DAWでの制作とも兼用しやすいです。設置場所と予算に余裕があるかもあわせて検討してください。',
    },
  ],
  disclaimerHeading: 'MIDIキーボード単体では音は鳴りません',
  disclaimerBody:
    'MIDIキーボードは、そのまま電子ピアノのように内蔵スピーカーから鳴らす機器とは限りません。iPhone / iPad / PC / Mac などに接続し、対応するアプリやソフトウェア音源から音を出します。このアプリでも、対応するMIDIキーボードをホスト側に認識させたうえで練習します。',
  disclaimerNote:
    '多くの製品は説明文で「コンピューター上のバーチャル楽器などを演奏するためのUSB‑MIDIコントローラー」と案内されています。つまり音源本体ではなく、音源ソフトウェアへ演奏情報を送る入力デバイスと考えるとずれがありません。',
  iosMidiCrossLinkPrefix: 'ケーブルや接続手順は、',
  iosMidiCrossLinkLabel: 'iPhone/iPadでMIDIを使う',
  iosMidiCrossLinkSuffix: 'もあわせてご覧ください。',
};

const HELP_MIDI_KEYBOARD_CHOICE_EN: HelpMidiKeyboardChoiceCopy = {
  pageTitle: 'Choosing a MIDI Keyboard',
  helmetTitle: 'Choosing a MIDI Keyboard — Jazzify',
  backButtonLabel: '← Back',
  backButtonAria: 'Go back to the previous page',
  conclusionHeading: 'Quick Answer',
  conclusionLead:
    'For a solid Jazzify experience, we recommend a MIDI keyboard with at least 49 keys. If you are unsure, choose 61 keys — a good balance for chord practice, left-hand and right-hand work, and jazz voicing exercises.',
  conclusionSmallKeyboard:
    'Compact 25–37 key keyboards can connect, but the smaller range can feel cramped for two-hand practice and wide chord voicings.',
  conclusionFullSize:
    '88 keys are best if you also want full piano practice or plan to use the keyboard for music production.',
  conclusionSummaryLabel: 'In short:',
  conclusionSummary: 'Unsure? Go with 61 keys. Starting on a budget? At least 49 keys. 88 keys for serious players.',
  sizeHeading: 'Key Count Guide',
  sizeTable: `Keys       Role                         In Jazzify
25–37      Try-out / portable           Works, but tight for jazz piano practice
49         Minimum recommended          Good starting point for the app
61         Best all-around pick         Choose this if unsure
88         Full piano / multi-purpose   Worth it if you need the full range`,
  sizeNote:
    'Jazz piano often uses left-hand roots and shell voicings while the right hand handles chords and melody — a smaller keyboard feels cramped quickly.',
  modelsHeading: 'Example Models (reference only, no affiliate links)',
  modelsIntro:
    'As a simple USB-MIDI option, the M-Audio Keystation series is a common choice. Prices vary by store, stock, and season, so we do not list fixed prices here.',
  models: [
    {
      badge: 'Try it out / save space',
      title: 'Keystation Mini 32',
      imageAlt: 'Keystation Mini 32 image',
      body: 'Good for trying the app or traveling. Better for getting set up than for serious two-hand jazz piano practice.',
    },
    {
      badge: 'Best default pick',
      title: 'Keystation 61 MK3',
      imageAlt: 'Keystation 61 MK3 image',
      body: 'The easiest size to balance chord practice and two-hand work in Jazzify. A solid default if you are unsure.',
    },
    {
      badge: 'Full range / multi-use',
      title: 'Keystation 88 MK3',
      imageAlt: 'Keystation 88 MK3 image',
      body: 'All 88 keys for wide two-hand practice and getting used to a full piano layout. Also works well with a DAW. Consider space and budget too.',
    },
  ],
  disclaimerHeading: 'A MIDI Keyboard Does Not Make Sound on Its Own',
  disclaimerBody:
    'A MIDI keyboard is not always a self-contained digital piano with built-in speakers. You connect it to an iPhone, iPad, PC, or Mac and hear sound from a compatible app or software instrument. In Jazzify, you practice after the host device recognizes your MIDI keyboard.',
  disclaimerNote:
    'Many products describe themselves as "USB-MIDI controllers for playing virtual instruments on a computer." Think of them as input devices that send performance data to a sound source — not as the sound source itself.',
  iosMidiCrossLinkPrefix: 'For cables and connection steps, also see ',
  iosMidiCrossLinkLabel: 'MIDI on iPhone / iPad',
  iosMidiCrossLinkSuffix: '.',
};

const HELP_IOS_MIDI_COPY: Record<HelpLocale, HelpIosMidiCopy> = {
  ja: HELP_IOS_MIDI_JA,
  en: HELP_IOS_MIDI_EN,
};

const HELP_MIDI_KEYBOARD_CHOICE_COPY: Record<HelpLocale, HelpMidiKeyboardChoiceCopy> = {
  ja: HELP_MIDI_KEYBOARD_CHOICE_JA,
  en: HELP_MIDI_KEYBOARD_CHOICE_EN,
};

export const getHelpIosMidiCopy = (locale: HelpLocale): HelpIosMidiCopy => HELP_IOS_MIDI_COPY[locale];

export const getHelpMidiKeyboardChoiceCopy = (locale: HelpLocale): HelpMidiKeyboardChoiceCopy =>
  HELP_MIDI_KEYBOARD_CHOICE_COPY[locale];

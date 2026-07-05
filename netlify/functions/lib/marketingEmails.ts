export type MarketingEmailKey = 'day0' | 'day1' | 'day2' | 'day3' | 'trial_start';
export type MarketingEmailLocale = 'ja' | 'en';
export type MarketingEmailPlatform = 'web' | 'ios';

export interface MarketingEmailInput {
  locale: MarketingEmailLocale;
  unsubscribeUrl: string;
  /** day3のみ使用。falseならトライアル誘導ブロックを丸ごと省く */
  includeTrialCta: boolean;
  /** day3のみ使用。iOSはApple IAP専用のためWebのLemon課金導線（URL_ACCOUNT）を出さない */
  platform: MarketingEmailPlatform;
}

export interface MarketingEmailContent {
  subject: string;
  html: string;
}

export const MARKETING_EMAIL_FROM = 'Jazzify <noreply@jazzify.jp>';

const URL_MAIN_LESSONS = 'https://jazzify.jp/main/lessons';
const URL_ACCOUNT = 'https://jazzify.jp/main/account';
const URL_IOS_MIDI = 'https://jazzify.jp/help/ios-midi';
const URL_MIDI_KEYBOARD = 'https://jazzify.jp/help/midi-keyboard-choice';
const URL_PDF = 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-1-5.pdf';
const URL_TOKUSHOHO = 'https://jazzify.jp/legal/tokushoho';

const LICKS = [
  {
    label: 'Lick 1',
    slow: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-01-120_slow_loop4_ci.mp3',
    normal: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-01-240_loop4_ci.mp3',
  },
  {
    label: 'Lick 2',
    slow: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-02-80_slow_loop4_ci.mp3',
    normal: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-02-160_loop4_ci.mp3',
  },
  {
    label: 'Lick 3',
    slow: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-03-80_slow_loop4_ci.mp3',
    normal: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-03-160_loop4_ci.mp3',
  },
  {
    label: 'Lick 4',
    slow: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-04-100_slow_loop4_ci.mp3',
    normal: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-04-200_loop4_ci.mp3',
  },
  {
    label: 'Lick 5',
    slow: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-05-120_slow_loop4_ci.mp3',
    normal: 'https://jazzify.jp/sozai/bluesy-licks/bluesy-licks-05-240_loop4_ci.mp3',
  },
] as const;

const STYLE_BODY =
  "margin:0;padding:0;background-color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;";
const STYLE_WRAPPER = 'max-width:600px;margin:0 auto;padding:40px 20px;';
const STYLE_CARD = 'background-color:#334155;border-radius:12px;padding:32px;text-align:left;';
const STYLE_H1 = 'color:#ffffff;font-size:22px;margin:0 0 24px;line-height:1.4;';
const STYLE_P = 'color:#cbd5e1;font-size:15px;line-height:1.9;margin:0 0 20px;';
const STYLE_CTA =
  'display:inline-block;background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;';
const STYLE_LINK = 'color:#93c5fd;text-decoration:none;';
const STYLE_FOOTER = 'color:#64748b;font-size:12px;line-height:1.8;margin:20px 0 0;';
const STYLE_TABLE = 'width:100%;border-collapse:collapse;font-size:14px;color:#cbd5e1;margin:0 0 24px;';
const STYLE_TD = 'padding:6px 0;vertical-align:top;';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const link = (href: string, text: string): string =>
  `<a href="${escapeHtml(href)}" style="${STYLE_LINK}">${text}</a>`;

const paragraph = (html: string): string => `<p style="${STYLE_P}">${html}</p>`;

const ctaButton = (href: string, text: string): string =>
  `<p style="margin:0 0 24px;"><a href="${escapeHtml(href)}" style="${STYLE_CTA}">${text}</a></p>`;

const buildLickTable = (locale: MarketingEmailLocale): string => {
  const slowLabel = locale === 'ja' ? 'スロー' : 'Slow';
  const normalLabel = locale === 'ja' ? '通常' : 'Normal';
  const rows = LICKS.map(
    (lick) =>
      `<tr><td style="${STYLE_TD}">${lick.label}</td><td style="${STYLE_TD}">${link(lick.slow, slowLabel)} / ${link(lick.normal, normalLabel)}</td></tr>`,
  ).join('');
  const caption =
    locale === 'ja'
      ? '音で聴きたい方はこちら'
      : 'Prefer to hear them? Listen here';
  return `<p style="color:#94a3b8;font-size:14px;margin:0 0 8px;">${caption}</p><table style="${STYLE_TABLE}">${rows}</table>`;
};

const buildLick1Links = (locale: MarketingEmailLocale): string => {
  const slowLabel = locale === 'ja' ? 'スロー版' : 'Slow version';
  const normalLabel = locale === 'ja' ? '通常テンポ' : 'Normal tempo';
  const lick = LICKS[0];
  return `${link(lick.slow, slowLabel)} / ${link(lick.normal, normalLabel)}`;
};

const buildFooter = (
  locale: MarketingEmailLocale,
  unsubscribeUrl: string,
  key: MarketingEmailKey,
): string => {
  const year = new Date().getFullYear();
  const safeUrl = escapeHtml(unsubscribeUrl);

  if (locale === 'ja') {
    const reasonText =
      key === 'trial_start'
        ? 'このメールはJazzifyのトライアルを開始された方にお送りしています。'
        : 'このメールはJazzify登録時に配信を希望された方にお送りしています。';
    return `<div style="${STYLE_FOOTER}">
      <p style="margin:0 0 8px;">配信元: Jazzify（合同会社KindWords）</p>
      <p style="margin:0 0 8px;">${link(URL_TOKUSHOHO, '特定商取引法に基づく表記')}</p>
      <p style="margin:0 0 8px;">${reasonText}</p>
      <p style="margin:0 0 8px;"><a href="${safeUrl}" style="${STYLE_LINK}">配信停止はこちら</a></p>
      <p style="margin:0;">© ${year} Jazzify</p>
    </div>`;
  }

  const reasonText =
    key === 'trial_start'
      ? 'You are receiving this email because you started a Jazzify trial.'
      : 'You are receiving this email because you opted in when signing up for Jazzify.';
  return `<div style="${STYLE_FOOTER}">
    <p style="margin:0 0 8px;">From: Jazzify (KindWords LLC)</p>
    <p style="margin:0 0 8px;">${link(URL_TOKUSHOHO, 'Specified Commercial Transactions Act')}</p>
    <p style="margin:0 0 8px;">${reasonText}</p>
    <p style="margin:0 0 8px;"><a href="${safeUrl}" style="${STYLE_LINK}">Unsubscribe</a></p>
    <p style="margin:0;">© ${year} Jazzify</p>
  </div>`;
};

const wrapHtml = (
  locale: MarketingEmailLocale,
  title: string,
  body: string,
  key: MarketingEmailKey,
  unsubscribeUrl: string,
): string => `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${STYLE_BODY}">
  <div style="${STYLE_WRAPPER}">
    <div style="${STYLE_CARD}">
      <h1 style="${STYLE_H1}">${title}</h1>
      ${body}
    </div>
    ${buildFooter(locale, unsubscribeUrl, key)}
  </div>
</body>
</html>`;

const buildDay0Body = (locale: MarketingEmailLocale): string => {
  if (locale === 'ja') {
    return [
      paragraph('Jazzifyへのご登録、ありがとうございます。'),
      paragraph(
        '登録特典として、ブルース向けの短いフレーズ5つを集めたPDF「Bluesy Licks 5選」をお届けします。まずは音を聴いて、気になる1フレーズだけ鍵盤で返してみてください。うまく弾けなくて大丈夫です。',
      ),
      ctaButton(URL_PDF, 'PDFをダウンロードする'),
      buildLickTable('ja'),
      paragraph(
        'PDFはただ読むためのものではありません。できれば今日中に、1フレーズだけでも鍵盤で弾いてみてほしいです。理論を全部理解してから始めようとすると、意外と足が止まりやすいもの。まずは「聴く → 反応する → 弾く」から入ってみてください。',
      ),
      paragraph(
        `${link(URL_MAIN_LESSONS, '最初のクエストを始める')} — Jazzifyのメインクエストで、聴いた音に反応する練習ができます。`,
      ),
      paragraph('今日の一歩、応援しています。'),
    ].join('');
  }

  return [
    paragraph('Thanks for signing up for Jazzify.'),
    paragraph(
      'As a welcome gift, here is your free PDF — <em>Bluesy Licks: 5 Essential Phrases</em>. Pick one phrase, listen to it, and try playing it back on your keyboard. It does not have to be perfect.',
    ),
    ctaButton(URL_PDF, 'Download the PDF'),
    buildLickTable('en'),
    paragraph(
      'Do not just read the PDF — try playing at least one phrase today. Waiting until you understand all the theory first is often what keeps people stuck. Start with listen → react → play.',
    ),
    paragraph(
      `${link(URL_MAIN_LESSONS, 'Start your first quest')} — the main quest in Jazzify is built around reacting to what you hear.`,
    ),
    paragraph('Cheering you on for today.'),
  ].join('');
};

const buildDay1Body = (locale: MarketingEmailLocale): string => {
  if (locale === 'ja') {
    return [
      paragraph(
        '昨日、Jazzifyに触れましたか？まだでも大丈夫です。今日は1つだけ、短い時間で始めてみましょう。',
      ),
      paragraph(
        'ジャズが難しく感じるのは、コード・スケール・理論・リズム・左手・右手…と、頭で考えることが多すぎるからかもしれません。Jazzifyはまずゲームのように「聴いた音に反応して返す」ところから始めます。理論より先に、体の反応速度を育てていくイメージです。',
      ),
      paragraph(
        '今日やることは1つだけ。メインクエストの最初の課題を10分だけ。うまく弾けなくてOK。音を聴いて、鍵盤で返してみる。今日はそれだけで十分です。',
      ),
      ctaButton(URL_MAIN_LESSONS, '最初のクエストをプレイする'),
      paragraph('小さな一歩が、続く練習につながります。'),
    ].join('');
  }

  return [
    paragraph(
      'Did you get a chance to try Jazzify yesterday? No worries if not — today is a fresh start, and you only need a few minutes.',
    ),
    paragraph(
      'Jazz often feels overwhelming because there is so much to think about — chords, scales, theory, rhythm, both hands at once. Jazzify starts differently: like a game, you listen and react on the keyboard. We build your reflexes before we pile on theory.',
    ),
    paragraph(
      'Your one task today: play the first lesson in the main quest for about 10 minutes. It does not have to sound good. Just listen, respond on the keys, and call it a win.',
    ),
    ctaButton(URL_MAIN_LESSONS, 'Play your first quest'),
    paragraph('Small steps add up. See you inside.'),
  ].join('');
};

const buildDay2Body = (locale: MarketingEmailLocale): string => {
  if (locale === 'ja') {
    return [
      paragraph(
        'MIDIキーボードをつなぐと、Jazzifyでの練習が一気にしやすくなります。音を聴いて、すぐ鍵盤で返す——この流れがスムーズになるだけで、続けやすさが変わります。',
      ),
      paragraph(
        '選ぶときの目安は4つです。<br>・49鍵以上<br>・フルサイズ鍵盤<br>・USB-MIDI対応<br>・できればサスティンペダル端子',
      ),
      paragraph(
        '高級機やノブ・パッドがたくさん付いた機種は必須ではありません。大事なのは「音を聴いて、すぐ鍵盤で返せること」です。',
      ),
      paragraph(
        `目安として、安く始めるなら Alesis V49 MKII や M-Audio Keystation 49 MK3、しっかり使うなら Nektar Impact LX49 Mk3、DAW制作にも使うなら Novation Launchkey 49 MK4 あたりが選びやすいです。詳しくは${link(URL_MIDI_KEYBOARD, '選び方ガイド')}をご覧ください。`,
      ),
      paragraph(
        'すでに電子ピアノやキーボードをお持ちなら、USB-MIDI対応ならそのまま使える可能性が高いです。',
      ),
      ctaButton(URL_IOS_MIDI, '接続方法を見る'),
    ].join('');
  }

  return [
    paragraph(
      'Connecting a MIDI keyboard makes practicing in Jazzify much smoother. When you can hear a phrase and immediately play it back, everything clicks faster.',
    ),
    paragraph(
      'Four things to look for:<br>· At least 49 keys<br>· Full-size keys<br>· USB-MIDI support<br>· Sustain pedal input (nice to have)',
    ),
    paragraph(
      'You do not need a fancy controller with lots of knobs and pads. What matters is being able to hear something and respond on the keys right away.',
    ),
    paragraph(
      `Budget-friendly picks: Alesis V49 MKII or M-Audio Keystation 49 MK3. For a solid daily driver: Nektar Impact LX49 Mk3. If you also produce: Novation Launchkey 49 MK4. See our ${link(URL_MIDI_KEYBOARD, 'keyboard buying guide')} for more detail.`,
    ),
    paragraph(
      'Already own a digital piano or keyboard? If it supports USB-MIDI, you can probably use it as-is.',
    ),
    ctaButton(URL_IOS_MIDI, 'See how to connect'),
  ].join('');
};

const buildTrialCtaParagraph = (
  locale: MarketingEmailLocale,
  platform: MarketingEmailPlatform,
): string => {
  if (locale === 'ja') {
    return platform === 'ios'
      ? paragraph(
          'もっと先のフレーズや実践課題に進みたい方は、Jazzifyアプリの「設定 → サブスクリプション」から7日間の無料トライアルを始められます。',
        )
      : paragraph(
          `もっと先のフレーズや実践課題に進みたい方は、7日間の無料トライアルでBluesy Licksコースも試せます。${link(URL_ACCOUNT, '無料トライアルを見てみる')}`,
        );
  }

  return platform === 'ios'
    ? paragraph(
        'Want to go further? Open the Jazzify app and go to Settings → Subscriptions to start your 7-day free trial.',
      )
    : paragraph(
        `Want to go further? A 7-day free trial unlocks the full Bluesy Licks course and more. ${link(URL_ACCOUNT, 'See the free trial')}`,
      );
};

const buildDay3Body = (
  locale: MarketingEmailLocale,
  includeTrialCta: boolean,
  platform: MarketingEmailPlatform,
): string => {
  if (locale === 'ja') {
    const parts = [
      paragraph(
        'PDF「Bluesy Licks 5選」は見ていただけましたか？今日は全部ではなく、最初のフレーズ（Lick 1）だけ、ゆっくり弾いてみてほしいです。',
      ),
      paragraph(
        `まず${buildLick1Links('ja')}で音を確認してから、通常テンポでまねてみてください。`,
      ),
      paragraph(
        'ポイントは3つです。<br>1. まず音だけ確認する<br>2. リズムをまねる<br>3. Jazzifyのクエストで「反応する」練習に戻る',
      ),
      paragraph(
        'フレーズを手癖で覚えただけだと、アドリブの場面では出てこないことがあります。音を聴いて反応する回路は、Jazzifyのゲームで作る——PDFと組み合わせると、より実感しやすくなります。',
      ),
      ctaButton(URL_MAIN_LESSONS, 'Jazzifyで練習する'),
      paragraph(`${link(URL_PDF, 'PDFをもう一度見る')}`),
    ];

    if (includeTrialCta) {
      parts.push(buildTrialCtaParagraph('ja', platform));
    }

    return parts.join('');
  }

  const parts = [
    paragraph(
      'Have you had a look at the Bluesy Licks PDF yet? Today, just pick Lick 1 — play it slowly, nothing more.',
    ),
    paragraph(
      `Start with the ${buildLick1Links('en')} to hear the phrase, then try matching it at normal tempo.`,
    ),
    paragraph(
      'Three tips:<br>1. Listen first<br>2. Copy the rhythm<br>3. Head back to Jazzify quests to train your reactions',
    ),
    paragraph(
      'Muscle memory alone will not save you in a solo. The PDF gives you vocabulary; Jazzify builds the reflex to use it when you hear something.',
    ),
    ctaButton(URL_MAIN_LESSONS, 'Practice in Jazzify'),
    paragraph(`${link(URL_PDF, 'View the PDF again')}`),
  ];

  if (includeTrialCta) {
    parts.push(buildTrialCtaParagraph('en', platform));
  }

  return parts.join('');
};

const buildTrialStartBody = (locale: MarketingEmailLocale): string => {
  if (locale === 'ja') {
    return [
      paragraph('Jazzifyのトライアルを開始いただき、ありがとうございます。'),
      paragraph(
        '最初にやることは多くありません。迷ったら、まずメインクエスト（Jazzifyの基本ルート）から。「音を聴く → 鍵盤で返す → 短いフレーズをまねる」——この流れで、少しずつジャズの反応速度を作っていきましょう。',
      ),
      ctaButton(URL_MAIN_LESSONS, '最初のクエストを始める'),
      paragraph(
        'その後は目的に合わせて選べます。コードを見てすぐ弾けるようになりたいなら「コードラン」——コードネームを見て、考え込まずに鍵盤で反応する練習です。短いフレーズや音の反応を繰り返して体に入れたいなら「サバイバル」——クエストの内容をゲーム感覚で反復できます。',
      ),
      paragraph(
        'おすすめの順番:<br>1. メインクエストの最初の課題<br>2. Bluesy Licks PDFから1フレーズ<br>3. Bluesy Licksコース・コードラン・サバイバルから、目的に合うもの',
      ),
      paragraph(
        'トライアル期間中に全部やろうとしなくて大丈夫です。「ただ動画を見るより、実際に弾ける感覚があるか」を確かめてみてください。',
      ),
      paragraph(
        `MIDIキーボードをまだ接続していない場合は、先に接続しておくとスムーズです。${link(URL_IOS_MIDI, '接続方法を見る')}`,
      ),
      paragraph('分からないことや不具合があれば、このメールにそのまま返信してください。'),
    ].join('');
  }

  return [
    paragraph('Thanks for starting your Jazzify trial — glad you are here.'),
    paragraph(
      'You do not need to do everything at once. When in doubt, start with the main quest — Jazzify\'s core path. Listen → play it back → mimic short phrases. That is how you build jazz reflexes, one step at a time.',
    ),
    ctaButton(URL_MAIN_LESSONS, 'Start your first quest'),
    paragraph(
      'From there, pick what fits your goal. Want to see a chord name and play it without overthinking? Try Chord Run. Want to drill short phrases until they feel natural? Survival mode turns quest material into a game-like loop.',
    ),
    paragraph(
      'Suggested order:<br>1. First lesson in the main quest<br>2. One phrase from the Bluesy Licks PDF<br>3. Bluesy Licks course, Chord Run, or Survival — whichever matches your focus',
    ),
    paragraph(
      'You do not have to finish everything during the trial. The real question is: does it feel like you are actually playing, not just watching?',
    ),
    paragraph(
      `No MIDI keyboard yet? Connecting one first makes a big difference. ${link(URL_IOS_MIDI, 'See how to connect')}.`,
    ),
    paragraph('Questions or bugs? Just reply to this email — we read every message.'),
  ].join('');
};

interface EmailDefinition {
  subjectJa: string;
  subjectEn: string;
  titleJa: string;
  titleEn: string;
  buildBody: (locale: MarketingEmailLocale, input: MarketingEmailInput) => string;
}

const EMAIL_DEFINITIONS: Record<MarketingEmailKey, EmailDefinition> = {
  day0: {
    subjectJa: '無料PDF「Bluesy Licks 5選」をお届けします',
    subjectEn: 'Your free Bluesy Licks PDF is here',
    titleJa: 'Bluesy Licks 5選',
    titleEn: 'Bluesy Licks: 5 Essential Phrases',
    buildBody: (locale) => buildDay0Body(locale),
  },
  day1: {
    subjectJa: 'まずは「ジャズの反応速度」を作りましょう',
    subjectEn: 'Build your jazz reflexes — start here',
    titleJa: 'ジャズの反応速度を作る',
    titleEn: 'Build your jazz reflexes',
    buildBody: (locale) => buildDay1Body(locale),
  },
  day2: {
    subjectJa: 'Jazzifyで使うMIDIキーボードの選び方',
    subjectEn: 'Pick the right MIDI keyboard for Jazzify',
    titleJa: 'MIDIキーボードの選び方',
    titleEn: 'Choosing a MIDI keyboard',
    buildBody: (locale) => buildDay2Body(locale),
  },
  day3: {
    subjectJa: 'PDFのフレーズを、Jazzifyで使ってみましょう',
    subjectEn: 'Take a phrase from the PDF into Jazzify',
    titleJa: 'PDFのフレーズをJazzifyで',
    titleEn: 'From PDF to practice',
    buildBody: (locale, input) => buildDay3Body(locale, input.includeTrialCta, input.platform),
  },
  trial_start: {
    subjectJa: 'トライアル開始ありがとうございます。まずはここから',
    subjectEn: 'Your trial starts now — begin here',
    titleJa: 'トライアル、ここから始めましょう',
    titleEn: 'Welcome to your trial',
    buildBody: (locale) => buildTrialStartBody(locale),
  },
};

export const buildMarketingEmail = (
  key: MarketingEmailKey,
  input: MarketingEmailInput,
): MarketingEmailContent => {
  const def = EMAIL_DEFINITIONS[key];
  const isJa = input.locale === 'ja';
  const subject = isJa ? def.subjectJa : def.subjectEn;
  const title = isJa ? def.titleJa : def.titleEn;
  const body = def.buildBody(input.locale, input);
  const html = wrapHtml(input.locale, title, body, key, input.unsubscribeUrl);
  return { subject, html };
};

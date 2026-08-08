import {
  buildLickAudioContentKey,
  buildMarketingTrackedUrl,
  MARKETING_CHORD_RUN_VIDEO_URL,
  MARKETING_EMAIL_PATHS,
  MARKETING_LICK_AUDIO_PATHS,
  MARKETING_YOUTUBE_CHANNEL_URL,
  type MarketingEmailKey,
  type MarketingEmailLocale,
} from './marketingEmailUrls';

export type { MarketingEmailKey, MarketingEmailLocale } from './marketingEmailUrls';
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

interface MarketingEmailBuildContext {
  locale: MarketingEmailLocale;
  emailKey: MarketingEmailKey;
  includeTrialCta: boolean;
  platform: MarketingEmailPlatform;
}

/** Resend で検証済みの auth.jazzify.jp を使用（ルート jazzify.jp は未検証） */
export const MARKETING_EMAIL_FROM = 'Jazzify <noreply@auth.jazzify.jp>';

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

const trackedUrl = (
  ctx: MarketingEmailBuildContext,
  content: string,
  path: string,
): string => buildMarketingTrackedUrl(ctx.locale, ctx.emailKey, content, path);

const link = (href: string, text: string): string =>
  `<a href="${escapeHtml(href)}" style="${STYLE_LINK}">${text}</a>`;

const trackedLink = (
  ctx: MarketingEmailBuildContext,
  content: string,
  path: string,
  text: string,
): string => link(trackedUrl(ctx, content, path), text);

const paragraph = (html: string): string => `<p style="${STYLE_P}">${html}</p>`;

const ctaButton = (href: string, text: string): string =>
  `<p style="margin:0 0 24px;"><a href="${escapeHtml(href)}" style="${STYLE_CTA}">${text}</a></p>`;

const trackedCta = (
  ctx: MarketingEmailBuildContext,
  content: string,
  path: string,
  text: string,
): string => ctaButton(trackedUrl(ctx, content, path), text);

/** 質問・不具合の受け口。メール返信ではなくお問い合わせフォームに集約する */
const contactLink = (ctx: MarketingEmailBuildContext, text: string): string =>
  trackedLink(ctx, 'link_contact', MARKETING_EMAIL_PATHS.contact, text);

const buildLickTable = (ctx: MarketingEmailBuildContext): string => {
  const slowLabel = ctx.locale === 'ja' ? 'スロー' : 'Slow';
  const normalLabel = ctx.locale === 'ja' ? '通常' : 'Normal';
  const rows = MARKETING_LICK_AUDIO_PATHS.map((lick, index) => {
    const slowHref = trackedUrl(ctx, buildLickAudioContentKey(index, 'slow'), lick.slow);
    const normalHref = trackedUrl(ctx, buildLickAudioContentKey(index, 'normal'), lick.normal);
    return `<tr><td style="${STYLE_TD}">${lick.label}</td><td style="${STYLE_TD}">${link(slowHref, slowLabel)} / ${link(normalHref, normalLabel)}</td></tr>`;
  }).join('');
  const caption =
    ctx.locale === 'ja'
      ? '音で聴きたい方はこちら'
      : 'Prefer to hear them? Listen here';
  return `<p style="color:#94a3b8;font-size:14px;margin:0 0 8px;">${caption}</p><table style="${STYLE_TABLE}">${rows}</table>`;
};

const buildLick1Links = (ctx: MarketingEmailBuildContext): string => {
  const slowLabel = ctx.locale === 'ja' ? 'スロー版' : 'Slow version';
  const normalLabel = ctx.locale === 'ja' ? '通常テンポ' : 'Normal tempo';
  const lick = MARKETING_LICK_AUDIO_PATHS[0];
  const slowHref = trackedUrl(ctx, buildLickAudioContentKey(0, 'slow'), lick.slow);
  const normalHref = trackedUrl(ctx, buildLickAudioContentKey(0, 'normal'), lick.normal);
  return `${link(slowHref, slowLabel)} / ${link(normalHref, normalLabel)}`;
};

const buildFooter = (
  ctx: MarketingEmailBuildContext,
  unsubscribeUrl: string,
): string => {
  const year = new Date().getFullYear();
  const safeUrl = escapeHtml(unsubscribeUrl);
  const tokushohoHref = trackedUrl(ctx, 'footer_tokushoho', MARKETING_EMAIL_PATHS.tokushoho);

  if (ctx.locale === 'ja') {
    const reasonText =
      ctx.emailKey === 'trial_start'
        ? 'このメールはJazzifyのトライアルを開始された方にお送りしています。'
        : 'このメールはJazzify登録時に配信を希望された方にお送りしています。';
    return `<div style="${STYLE_FOOTER}">
      <p style="margin:0 0 8px;">配信元: Jazzify（合同会社KindWords）</p>
      <p style="margin:0 0 8px;">${link(tokushohoHref, '特定商取引法に基づく表記')}</p>
      <p style="margin:0 0 8px;">${reasonText}</p>
      <p style="margin:0 0 8px;"><a href="${safeUrl}" style="${STYLE_LINK}">配信停止はこちら</a></p>
      <p style="margin:0;">© ${year} Jazzify</p>
    </div>`;
  }

  const reasonText =
    ctx.emailKey === 'trial_start'
      ? 'You are receiving this email because you started a Jazzify trial.'
      : 'You are receiving this email because you opted in when signing up for Jazzify.';
  return `<div style="${STYLE_FOOTER}">
    <p style="margin:0 0 8px;">From: Jazzify (KindWords LLC)</p>
    <p style="margin:0 0 8px;">${link(tokushohoHref, 'Specified Commercial Transactions Act')}</p>
    <p style="margin:0 0 8px;">${reasonText}</p>
    <p style="margin:0 0 8px;"><a href="${safeUrl}" style="${STYLE_LINK}">Unsubscribe</a></p>
    <p style="margin:0;">© ${year} Jazzify</p>
  </div>`;
};

const wrapHtml = (
  ctx: MarketingEmailBuildContext,
  title: string,
  body: string,
  unsubscribeUrl: string,
): string => `<!DOCTYPE html>
<html lang="${ctx.locale}">
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
    ${buildFooter(ctx, unsubscribeUrl)}
  </div>
</body>
</html>`;

const buildDay0Body = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    return [
      paragraph('Jazzifyへのご登録、ありがとうございます。'),
      paragraph(
        '登録特典として、ブルース向けの短いフレーズ5つを集めたPDF「Bluesy Licks 5選」をお届けします。まずは音を聴いて、気になる1フレーズだけ鍵盤で返してみてください。うまく弾けなくて大丈夫です。',
      ),
      trackedCta(ctx, 'cta_pdf_download', MARKETING_EMAIL_PATHS.pdf, 'PDFをダウンロードする'),
      buildLickTable(ctx),
      paragraph(
        'PDFはただ読むためのものではありません。できれば今日中に、1フレーズだけでも鍵盤で弾いてみてほしいです。理論を全部理解してから始めようとすると、意外と足が止まりやすいもの。まずは「聴く → 反応する → 弾く」から入ってみてください。',
      ),
      paragraph(
        `${trackedLink(ctx, 'link_lessons', MARKETING_EMAIL_PATHS.mainLessons, '最初のクエストを始める')} — Jazzifyのメインクエストで、聴いた音に反応する練習ができます。`,
      ),
      paragraph('今日の一歩、応援しています。'),
    ].join('');
  }

  return [
    paragraph('Thanks for signing up for Jazzify.'),
    paragraph(
      'As a welcome gift, here is your free PDF — <em>Bluesy Licks: 5 Essential Phrases</em>. Pick one phrase, listen to it, and try playing it back on your keyboard. It does not have to be perfect.',
    ),
    trackedCta(ctx, 'cta_pdf_download', MARKETING_EMAIL_PATHS.pdf, 'Download the PDF'),
    buildLickTable(ctx),
    paragraph(
      'Do not just read the PDF — try playing at least one phrase today. Waiting until you understand all the theory first is often what keeps people stuck. Start with listen → react → play.',
    ),
    paragraph(
      `${trackedLink(ctx, 'link_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Start your first quest')} — the main quest in Jazzify is built around reacting to what you hear.`,
    ),
    paragraph('Cheering you on for today.'),
  ].join('');
};

const buildDay1Body = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
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
      trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, '最初のクエストをプレイする'),
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
    trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Play your first quest'),
    paragraph('Small steps add up. See you inside.'),
  ].join('');
};

const buildDay2Body = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
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
        `目安として、安く始めるなら Alesis V49 MKII や M-Audio Keystation 49 MK3、しっかり使うなら Nektar Impact LX49 Mk3、DAW制作にも使うなら Novation Launchkey 49 MK4 あたりが選びやすいです。詳しくは${trackedLink(ctx, 'link_midi_guide', MARKETING_EMAIL_PATHS.midiKeyboard, '選び方ガイド')}をご覧ください。`,
      ),
      paragraph(
        'すでに電子ピアノやキーボードをお持ちなら、USB-MIDI対応ならそのまま使える可能性が高いです。',
      ),
      trackedCta(ctx, 'cta_midi_connect', MARKETING_EMAIL_PATHS.iosMidi, '接続方法を見る'),
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
      `Budget-friendly picks: Alesis V49 MKII or M-Audio Keystation 49 MK3. For a solid daily driver: Nektar Impact LX49 Mk3. If you also produce: Novation Launchkey 49 MK4. See our ${trackedLink(ctx, 'link_midi_guide', MARKETING_EMAIL_PATHS.midiKeyboard, 'keyboard buying guide')} for more detail.`,
    ),
    paragraph(
      'Already own a digital piano or keyboard? If it supports USB-MIDI, you can probably use it as-is.',
    ),
    trackedCta(ctx, 'cta_midi_connect', MARKETING_EMAIL_PATHS.iosMidi, 'See how to connect'),
  ].join('');
};

const buildTrialCtaParagraph = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    return ctx.platform === 'ios'
      ? paragraph(
          'もっと先のフレーズや実践課題に進みたい方は、Jazzifyアプリの「設定 → サブスクリプション」から7日間の無料トライアルを始められます。',
        )
      : paragraph(
          `もっと先のフレーズや実践課題に進みたい方は、7日間の無料トライアルでBluesy Licksコースも試せます。${trackedLink(ctx, 'cta_trial', MARKETING_EMAIL_PATHS.account, '無料トライアルを見てみる')}`,
        );
  }

  return ctx.platform === 'ios'
    ? paragraph(
        'Want to go further? Open the Jazzify app and go to Settings → Subscriptions to start your 7-day free trial.',
      )
    : paragraph(
        `Want to go further? A 7-day free trial unlocks the full Bluesy Licks course and more. ${trackedLink(ctx, 'cta_trial', MARKETING_EMAIL_PATHS.account, 'See the free trial')}`,
      );
};

const buildDay3Body = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    const parts = [
      paragraph(
        'PDF「Bluesy Licks 5選」は見ていただけましたか？今日は全部ではなく、最初のフレーズ（Lick 1）だけ、ゆっくり弾いてみてほしいです。',
      ),
      paragraph(
        `まず${buildLick1Links(ctx)}で音を確認してから、通常テンポでまねてみてください。`,
      ),
      paragraph(
        'ポイントは3つです。<br>1. まず音だけ確認する<br>2. リズムをまねる<br>3. Jazzifyのクエストで「反応する」練習に戻る',
      ),
      paragraph(
        'フレーズを手癖で覚えただけだと、アドリブの場面では出てこないことがあります。音を聴いて反応する回路は、Jazzifyのゲームで作る——PDFと組み合わせると、より実感しやすくなります。',
      ),
      trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Jazzifyで練習する'),
      paragraph(`${trackedLink(ctx, 'cta_pdf_view', MARKETING_EMAIL_PATHS.pdf, 'PDFをもう一度見る')}`),
    ];

    if (ctx.includeTrialCta) {
      parts.push(buildTrialCtaParagraph(ctx));
    }

    return parts.join('');
  }

  const parts = [
    paragraph(
      'Have you had a look at the Bluesy Licks PDF yet? Today, just pick Lick 1 — play it slowly, nothing more.',
    ),
    paragraph(
      `Start with the ${buildLick1Links(ctx)} to hear the phrase, then try matching it at normal tempo.`,
    ),
    paragraph(
      'Three tips:<br>1. Listen first<br>2. Copy the rhythm<br>3. Head back to Jazzify quests to train your reactions',
    ),
    paragraph(
      'Muscle memory alone will not save you in a solo. The PDF gives you vocabulary; Jazzify builds the reflex to use it when you hear something.',
    ),
    trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Practice in Jazzify'),
    paragraph(`${trackedLink(ctx, 'cta_pdf_view', MARKETING_EMAIL_PATHS.pdf, 'View the PDF again')}`),
  ];

  if (ctx.includeTrialCta) {
    parts.push(buildTrialCtaParagraph(ctx));
  }

  return parts.join('');
};

const buildPaywallNudgeBody = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    const trialBlock = ctx.includeTrialCta
      ? (ctx.platform === 'ios'
        ? paragraph(
            '7日間の無料トライアルは、Jazzifyアプリの「設定 → サブスクリプション」から始められます。',
          )
        : paragraph(
            `7日間の無料トライアルで、第2チャプター以降とBluesy Licksコースが開きます。${trackedLink(ctx, 'cta_trial', MARKETING_EMAIL_PATHS.account, '無料トライアルを見てみる')}`,
          ))
      : (ctx.platform === 'ios'
        ? paragraph(
            '続きをプレイするには、Jazzifyアプリの「設定 → サブスクリプション」からプレミアムに加入できます。',
          )
        : paragraph(
            `続きをプレイするには、プレミアムでメインクエストの先を開けます。${trackedLink(ctx, 'cta_premium', MARKETING_EMAIL_PATHS.account, 'プレミアムを見る')}`,
          ));

    return [
      paragraph(
        'メインクエストの無料範囲を最後まで進めて、その先でロックに当たったところですね。中断させてしまってすみません。',
      ),
      paragraph(
        '止められた側からすると「この先に何があるか分からないのに払えない」というのが正直なところだと思うので、第2チャプター以降の中身を先にお伝えします。',
      ),
      paragraph(
        '第2チャプターでは、Cブルースのコードを実際に押さえながら、コードネームを見て手が出るところまで持っていきます。第1チャプターで作った「聴いて返す」反応を、今度はコード進行の上でやる形です。ここを抜けると、ブルースのセッションで最低限ついていける状態になります。',
      ),
      trialBlock,
      paragraph(
        `すぐ決めなくて大丈夫です。無料で遊べるサバイバルの最初のブロックも残っています。${trackedLink(ctx, 'link_survival', MARKETING_EMAIL_PATHS.survival, 'サバイバルを開く')}`,
      ),
      paragraph(
        `判断に必要な情報が足りなければ、${contactLink(ctx, 'お問い合わせフォーム')}から聞いてください。`,
      ),
    ].join('');
  }

  const trialBlock = ctx.includeTrialCta
    ? (ctx.platform === 'ios'
      ? paragraph(
          'To start your 7-day free trial, open the Jazzify app and go to Settings → Subscriptions.',
        )
      : paragraph(
          `A 7-day free trial unlocks Chapter 2 onward plus the Bluesy Licks course. ${trackedLink(ctx, 'cta_trial', MARKETING_EMAIL_PATHS.account, 'See the free trial')}`,
        ))
    : (ctx.platform === 'ios'
      ? paragraph(
          'To keep going, open the Jazzify app and go to Settings → Subscriptions.',
        )
      : paragraph(
          `To keep going, Premium unlocks the rest of Main Quest. ${trackedLink(ctx, 'cta_premium', MARKETING_EMAIL_PATHS.account, 'See Premium')}`,
        ));

  return [
    paragraph(
      'You played through the free part of Main Quest and hit the lock right after. Sorry for the interruption.',
    ),
    paragraph(
      'From your side it probably feels like "I can\'t pay for something when I don\'t know what\'s behind it," so here is what Chapter 2 onward actually contains.',
    ),
    paragraph(
      'In Chapter 2 you put your hands on C Blues chords until seeing a chord name is enough to make your hands move. It takes the listen-and-respond reflex from Chapter 1 and puts it on top of a chord progression. Clear it and you can hold your own in a blues session.',
    ),
    trialBlock,
    paragraph(
      `No rush on deciding. The first block of Survival is still free to play. ${trackedLink(ctx, 'link_survival', MARKETING_EMAIL_PATHS.survival, 'Open Survival')}`,
    ),
    paragraph(
      `If you need more information to decide, ask us through the ${contactLink(ctx, 'contact form')}.`,
    ),
  ].join('');
};

const buildDay7Body = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    return [
      paragraph('Jazzifyに登録いただいてから、1週間が経ちました。'),
      paragraph(
        'もう何度か触っていただけた方も、まだ開けていない方もいると思います。開けていなくても気にしないでください。ここで止まる人はとても多いです。',
      ),
      paragraph(
        'よくあるつまずきを3つ挙げます。心当たりのあるものだけ、解消してみてください。',
      ),
      paragraph(
        `<strong style="color:#e2e8f0;">1. MIDIキーボードが認識されない</strong><br>充電専用のUSBケーブルを使っている、あるいは他のアプリが先に鍵盤をつかんでいる、というのがよくある原因です。${trackedLink(ctx, 'link_midi_connect', MARKETING_EMAIL_PATHS.iosMidi, '接続方法はこちら')}にまとめました。鍵盤が手元になくても、画面上の鍵盤で最初のクエストは遊べます。`,
      ),
      paragraph(
        '<strong style="color:#e2e8f0;">2. テンポが速くて追いつかない</strong><br>速度は落として構いません。ゆっくり正確に返せるほうが、速く曖昧に叩くよりずっと身につきます。',
      ),
      paragraph(
        '<strong style="color:#e2e8f0;">3. 理論が分からないまま進めていいのか不安</strong><br>大丈夫です。Jazzifyは「聴いて反応する」を先に作る設計になっています。理論は後から意味がつながります。',
      ),
      trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'クエストの続きを開く'),
      paragraph(
        `この3つで解決しないときは、${contactLink(ctx, 'お問い合わせフォーム')}から状況を教えてください。環境まわりの問題は、こちらで再現できることが多いです。`,
      ),
      paragraph(
        `新しいクエストやフレーズの紹介は、YouTube「${link(MARKETING_YOUTUBE_CHANNEL_URL, 'ジャズ沼ラジオ')}」でも流しています。`,
      ),
    ].join('');
  }

  return [
    paragraph('It has been a week since you signed up for Jazzify.'),
    paragraph(
      'Maybe you have played a few times, maybe you have not opened it yet. If you have not, do not worry about it — this is where most people stall.',
    ),
    paragraph('Here are the three most common sticking points. Fix only the ones that apply to you.'),
    paragraph(
      `<strong style="color:#e2e8f0;">1. Your MIDI keyboard is not detected</strong><br>Usually it is a charge-only USB cable, or another app grabbed the keyboard first. ${trackedLink(ctx, 'link_midi_connect', MARKETING_EMAIL_PATHS.iosMidi, 'Here is how to connect')}. No keyboard on hand? The on-screen keys are enough for the first quest.`,
    ),
    paragraph(
      '<strong style="color:#e2e8f0;">2. The tempo is too fast to keep up</strong><br>Slow it down. Playing back slowly and accurately builds far more than hitting fast and vague.',
    ),
    paragraph(
      '<strong style="color:#e2e8f0;">3. You are unsure about moving on without the theory</strong><br>You are fine. Jazzify builds the listen-and-respond reflex first. The theory starts making sense afterwards.',
    ),
    trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Pick up where you left off'),
    paragraph(
      `If none of these three solve it, tell us what is happening through the ${contactLink(ctx, 'contact form')}. Setup issues are usually reproducible on our side.`,
    ),
  ].join('');
};

const buildDay14Body = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    return [
      paragraph(
        'メインクエストの第1チャプターまで進んだところで、続きがロックされて止まってしまった方もいると思います。',
      ),
      paragraph(
        '実は、無料のままでも遊べる場所がもう1つあります。サバイバルモードの最初のブロックです。',
      ),
      paragraph(
        'サバイバルは、クエストで出てきた短いフレーズやコードを、ゲームとして繰り返し反復するモードです。同じ課題を「練習」として何度もやるのは飽きますが、ゲームの形になっていると自然と回数が増えます。ジャズの反応速度は、結局のところ回数で決まります。',
      ),
      trackedCta(ctx, 'cta_survival', MARKETING_EMAIL_PATHS.survival, 'サバイバルを開く'),
      paragraph(
        `どんな雰囲気のモードかは、${link(MARKETING_CHORD_RUN_VIDEO_URL, 'この動画（コードランのプレイ回）')}が分かりやすいと思います。`,
      ),
      paragraph(
        `もし第1チャプターをまだ終えていなければ、そちらが先です。10分で終わります。${trackedLink(ctx, 'link_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'メインクエストに戻る')}`,
      ),
    ].join('');
  }

  return [
    paragraph(
      'If you reached the end of Main Quest Chapter 1 and hit the lock, you may have stopped there.',
    ),
    paragraph(
      'There is one more place you can play for free: the first block of Survival mode.',
    ),
    paragraph(
      'Survival turns the short phrases and chords from the quests into a repeatable game. Drilling the same material as "practice" gets old fast; as a game, the reps add up on their own. And reps are what jazz reflexes are made of.',
    ),
    trackedCta(ctx, 'cta_survival', MARKETING_EMAIL_PATHS.survival, 'Open Survival'),
    paragraph(
      `Have not finished Chapter 1 yet? Do that first — it takes about 10 minutes. ${trackedLink(ctx, 'link_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Back to Main Quest')}`,
    ),
  ].join('');
};

const buildDay21Body = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    const parts = [
      paragraph(
        'ジャズの教則動画やレッスン動画は、いまいくらでもあります。それでも「知識は増えたのに、いざセッションになると手が動かない」という状態になりやすい。',
      ),
      paragraph('理由はシンプルで、動画を見ている間、こちらは反応していないからです。'),
      paragraph(
        'コードネームを見て手が動く。フレーズを聴いてすぐ返せる。これは知識ではなく反応で、反応は反応した回数でしか育ちません。Jazzifyがゲームの形をしているのはそのためです。正解を教わるのではなく、その場で返す回数を稼ぐ設計にしています。',
      ),
      paragraph(
        '第2チャプター以降では、Cブルースのコードを実際につかみながら、この反応を曲の中で使えるところまで持っていきます。',
      ),
    ];

    if (ctx.includeTrialCta) {
      parts.push(buildTrialCtaParagraph(ctx));
    }

    parts.push(
      paragraph(
        `まだ迷っている段階でしたら、無理に進めなくて大丈夫です。気になることがあれば、${contactLink(ctx, 'お問い合わせフォーム')}からどうぞ。`,
      ),
    );

    return parts.join('');
  }

  const parts = [
    paragraph(
      'There is no shortage of jazz tutorials and lesson videos now. And yet the usual outcome is: more knowledge, hands that still freeze at a session.',
    ),
    paragraph('The reason is simple. While you watch, you are not responding.'),
    paragraph(
      'Seeing a chord name and having your hands move. Hearing a phrase and playing it straight back. That is not knowledge, it is reflex — and reflex only grows from the number of times you respond. That is why Jazzify is shaped like a game: instead of being told the answer, you rack up reps of responding on the spot.',
    ),
    paragraph(
      'From Chapter 2 onward, you put your hands on C Blues chords and carry that reflex into an actual tune.',
    ),
  ];

  if (ctx.includeTrialCta) {
    parts.push(buildTrialCtaParagraph(ctx));
  }

  parts.push(
    paragraph(
      `Still undecided? No need to push. If anything is unclear, reach us through the ${contactLink(ctx, 'contact form')}.`,
    ),
  );

  return parts.join('');
};

const buildDay30Body = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    return [
      paragraph('登録から1ヶ月になります。ここまでお付き合いいただき、ありがとうございました。'),
      paragraph(
        '最初の1ヶ月でお送りしていた練習のヒントは、今回で最後です。今後は、新しいクエストの追加やアップデートがあったときに、月に1回程度のお知らせをお送りします。頻度はぐっと下がります。',
      ),
      paragraph(
        'もし内容が合わなければ、下の配信停止リンクからいつでも止められます。止めてもJazzifyのアカウントはそのまま使えます。',
      ),
      paragraph(
        `逆に「こういう内容が読みたい」「ここが分かりにくい」といったご要望は、${contactLink(ctx, 'お問い合わせフォーム')}からお寄せください。すべて読んでいます。`,
      ),
      trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Jazzifyを開く'),
    ].join('');
  }

  return [
    paragraph('It has been a month since you signed up. Thank you for reading this far.'),
    paragraph(
      'This is the last of the practice tips from your first month. From here on, you will hear from us roughly once a month, when new quests or updates ship. Much lower frequency.',
    ),
    paragraph(
      'If it is not for you, the unsubscribe link below stops it any time. Your Jazzify account keeps working either way.',
    ),
    paragraph(
      `If instead you have a request — something you want to read about, or something that is hard to follow — send it through the ${contactLink(ctx, 'contact form')}. We read all of them.`,
    ),
    trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Open Jazzify'),
  ].join('');
};

const buildDormant14dBody = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    return [
      paragraph(
        '最後にJazzifyで練習してから、少し時間が空きました。忙しい時期もあると思うので、それ自体は問題ありません。',
      ),
      paragraph(
        'ただ、ジャズの反応速度は落ちるのも早いです。取り戻すのに一番効くのは、長時間の練習ではなく「短くても、また触る」ことです。',
      ),
      paragraph(
        '今日は1つだけ。最初のクエストを10分。前にできていたことが、思ったより残っているはずです。',
      ),
      trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'クエストを開く'),
      paragraph(
        `止まってしまった理由が操作や環境の問題（鍵盤がつながらない、音が出ないなど）であれば、${contactLink(ctx, 'お問い合わせフォーム')}から教えてください。`,
      ),
    ].join('');
  }

  return [
    paragraph(
      'It has been a while since your last practice session in Jazzify. Busy stretches happen — that part is fine.',
    ),
    paragraph(
      'Jazz reflexes fade quickly, though. What brings them back is not a long session; it is touching the keys again, even briefly.',
    ),
    paragraph(
      'Just one thing today: ten minutes on the first quest. More of it stayed with you than you think.',
    ),
    trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Open the quest'),
    paragraph(
      `If what stopped you was a setup problem — the keyboard will not connect, no sound, anything like that — tell us through the ${contactLink(ctx, 'contact form')}.`,
    ),
  ].join('');
};

const buildNeverPlayed5dBody = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    return [
      paragraph('Jazzifyに登録いただいたあと、まだ一度も演奏を始めていないようです。'),
      paragraph(
        'こういうとき、原因はやる気ではなく環境であることがほとんどです。よくあるのは次の2つです。',
      ),
      paragraph(
        `<strong style="color:#e2e8f0;">MIDIキーボードが手元にない</strong><br>画面上の鍵盤でも最初のクエストは遊べます。マウスやタップでも「聴いて返す」体験はできるので、まずそれで構いません。手持ちの電子ピアノを使いたい場合は、${trackedLink(ctx, 'link_midi_connect', MARKETING_EMAIL_PATHS.iosMidi, '接続方法')}をご覧ください。`,
      ),
      paragraph(
        '<strong style="color:#e2e8f0;">何から始めればいいか分からない</strong><br>メインクエストの最初の課題、1つだけです。それ以外は今は見なくて大丈夫です。10分で終わります。',
      ),
      trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, '最初のクエストを始める'),
      paragraph(
        `別の理由で止まっているなら、${contactLink(ctx, 'お問い合わせフォーム')}から教えてください。改善します。`,
      ),
    ].join('');
  }

  return [
    paragraph('It looks like you have not started playing since you signed up for Jazzify.'),
    paragraph(
      'When that happens, the cause is almost always setup rather than motivation. Two common ones:',
    ),
    paragraph(
      `<strong style="color:#e2e8f0;">No MIDI keyboard on hand</strong><br>The on-screen keys work for the first quest. Mouse or touch is enough to get the listen-and-respond experience, so start there. If you want to use a digital piano you already own, see ${trackedLink(ctx, 'link_midi_connect', MARKETING_EMAIL_PATHS.iosMidi, 'how to connect it')}.`,
    ),
    paragraph(
      '<strong style="color:#e2e8f0;">Not sure where to start</strong><br>The first lesson of the main quest. That is all. Ignore everything else for now — it takes about 10 minutes.',
    ),
    trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Start the first quest'),
    paragraph(
      `If something else is in the way, tell us through the ${contactLink(ctx, 'contact form')} and we will fix it.`,
    ),
  ].join('');
};

const buildTrialStartBody = (ctx: MarketingEmailBuildContext): string => {
  if (ctx.locale === 'ja') {
    return [
      paragraph('Jazzifyのトライアルを開始いただき、ありがとうございます。'),
      paragraph(
        '最初にやることは多くありません。迷ったら、まずメインクエスト（Jazzifyの基本ルート）から。「音を聴く → 鍵盤で返す → 短いフレーズをまねる」——この流れで、少しずつジャズの反応速度を作っていきましょう。',
      ),
      trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, '最初のクエストを始める'),
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
        `MIDIキーボードをまだ接続していない場合は、先に接続しておくとスムーズです。${trackedLink(ctx, 'link_midi_connect', MARKETING_EMAIL_PATHS.iosMidi, '接続方法を見る')}`,
      ),
      paragraph(
        `分からないことや不具合があれば、${contactLink(ctx, 'お問い合わせフォーム')}から教えてください。`,
      ),
    ].join('');
  }

  return [
    paragraph('Thanks for starting your Jazzify trial — glad you are here.'),
    paragraph(
      'You do not need to do everything at once. When in doubt, start with the main quest — Jazzify\'s core path. Listen → play it back → mimic short phrases. That is how you build jazz reflexes, one step at a time.',
    ),
    trackedCta(ctx, 'cta_lessons', MARKETING_EMAIL_PATHS.mainLessons, 'Start your first quest'),
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
      `No MIDI keyboard yet? Connecting one first makes a big difference. ${trackedLink(ctx, 'link_midi_connect', MARKETING_EMAIL_PATHS.iosMidi, 'See how to connect')}.`,
    ),
    paragraph(
      `Questions or bugs? Send them through the ${contactLink(ctx, 'contact form')} — we read every message.`,
    ),
  ].join('');
};

interface EmailDefinition {
  subjectJa: string;
  subjectEn: string;
  titleJa: string;
  titleEn: string;
  buildBody: (ctx: MarketingEmailBuildContext) => string;
}

const EMAIL_DEFINITIONS: Record<MarketingEmailKey, EmailDefinition> = {
  day0: {
    subjectJa: '無料PDF「Bluesy Licks 5選」をお届けします',
    subjectEn: 'Your free Bluesy Licks PDF is here',
    titleJa: 'Bluesy Licks 5選',
    titleEn: 'Bluesy Licks: 5 Essential Phrases',
    buildBody: (ctx) => buildDay0Body(ctx),
  },
  day1: {
    subjectJa: 'まずは「ジャズの反応速度」を作りましょう',
    subjectEn: 'Build your jazz reflexes — start here',
    titleJa: 'ジャズの反応速度を作る',
    titleEn: 'Build your jazz reflexes',
    buildBody: (ctx) => buildDay1Body(ctx),
  },
  day2: {
    subjectJa: 'Jazzifyで使うMIDIキーボードの選び方',
    subjectEn: 'Pick the right MIDI keyboard for Jazzify',
    titleJa: 'MIDIキーボードの選び方',
    titleEn: 'Choosing a MIDI keyboard',
    buildBody: (ctx) => buildDay2Body(ctx),
  },
  day3: {
    subjectJa: 'PDFのフレーズを、Jazzifyで使ってみましょう',
    subjectEn: 'Take a phrase from the PDF into Jazzify',
    titleJa: 'PDFのフレーズをJazzifyで',
    titleEn: 'From PDF to practice',
    buildBody: (ctx) => buildDay3Body(ctx),
  },
  day7: {
    subjectJa: '最初の1週間でつまずきやすい3つのこと',
    subjectEn: 'Three things that trip people up in week one',
    titleJa: 'つまずきやすい3つのこと',
    titleEn: 'Three common sticking points',
    buildBody: (ctx) => buildDay7Body(ctx),
  },
  day14: {
    subjectJa: '無料のままでも、まだ遊べる場所があります',
    subjectEn: 'There is still more you can play for free',
    titleJa: '無料で遊べる場所',
    titleEn: 'What you can still play for free',
    buildBody: (ctx) => buildDay14Body(ctx),
  },
  day21: {
    subjectJa: '動画でジャズを学んで、弾けるようにならなかった方へ',
    subjectEn: 'For everyone who watched the videos and still cannot play',
    titleJa: '動画と、反応速度の話',
    titleEn: 'Videos, and why reflexes matter',
    buildBody: (ctx) => buildDay21Body(ctx),
  },
  day30: {
    subjectJa: 'ここまでありがとうございます（今後の配信について）',
    subjectEn: 'Thanks for reading (what happens next)',
    titleJa: '今後の配信について',
    titleEn: 'About future emails',
    buildBody: (ctx) => buildDay30Body(ctx),
  },
  trial_start: {
    subjectJa: 'トライアル開始ありがとうございます。まずはここから',
    subjectEn: 'Your trial starts now — begin here',
    titleJa: 'トライアル、ここから始めましょう',
    titleEn: 'Welcome to your trial',
    buildBody: (ctx) => buildTrialStartBody(ctx),
  },
  paywall_nudge: {
    subjectJa: '続きが気になったところで、止まりましたね',
    subjectEn: 'You stopped right where it got interesting',
    titleJa: '第2チャプターの中身',
    titleEn: "What's inside Chapter 2",
    buildBody: (ctx) => buildPaywallNudgeBody(ctx),
  },
  dormant_14d: {
    subjectJa: '久しぶりに、10分だけ鍵盤に触れてみませんか',
    subjectEn: 'Ten minutes at the keys, for old times',
    titleJa: '10分だけ、戻ってきませんか',
    titleEn: 'Come back for ten minutes',
    buildBody: (ctx) => buildDormant14dBody(ctx),
  },
  never_played_5d: {
    subjectJa: 'まだ一度も弾いていない方へ',
    subjectEn: 'If you have not played a single note yet',
    titleJa: 'まだ弾けていない場合',
    titleEn: 'If you have not started yet',
    buildBody: (ctx) => buildNeverPlayed5dBody(ctx),
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
  const ctx: MarketingEmailBuildContext = {
    locale: input.locale,
    emailKey: key,
    includeTrialCta: input.includeTrialCta,
    platform: input.platform,
  };
  const body = def.buildBody(ctx);
  const html = wrapHtml(ctx, title, body, input.unsubscribeUrl);
  return { subject, html };
};

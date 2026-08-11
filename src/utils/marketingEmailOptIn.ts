export const MARKETING_EMAIL_OPT_IN_LABEL_JA =
  '無料PDF「Bluesy Licks 5選」と、Jazzifyからの練習ヒント・お知らせをメールで受け取る';

export const MARKETING_EMAIL_OPT_IN_LABEL_EN =
  'Get the free "5 Bluesy Licks" PDF plus Jazzify practice tips and updates by email';

/** バナー・登録フォーム共通の説明（チェックボックス専用の注記は含まない） */
export const MARKETING_EMAIL_OPT_IN_DESCRIPTION_JA =
  '登録後、特典PDFに加え、練習のヒントやサービスに関するお知らせをお送りします。※いつでも配信停止できます。';

export const MARKETING_EMAIL_OPT_IN_DESCRIPTION_EN =
  "After signing up, we'll email you the PDF, practice tips, and product updates. Unsubscribe anytime.";

/** 登録時チェックボックス専用。バナーには出さない */
const MARKETING_EMAIL_OPT_IN_SIGNUP_NOTE_JA =
  'チェックしなくても無料登録できます。';

const MARKETING_EMAIL_OPT_IN_SIGNUP_NOTE_EN =
  'You can sign up without checking this box.';

export const MARKETING_EMAIL_OPT_IN_DESCRIPTION_SIGNUP_JA =
  `${MARKETING_EMAIL_OPT_IN_DESCRIPTION_JA}${MARKETING_EMAIL_OPT_IN_SIGNUP_NOTE_JA}`;

export const MARKETING_EMAIL_OPT_IN_DESCRIPTION_SIGNUP_EN =
  `${MARKETING_EMAIL_OPT_IN_DESCRIPTION_EN} ${MARKETING_EMAIL_OPT_IN_SIGNUP_NOTE_EN}`;

// 同意の証跡としてDB（profiles.marketing_email_opt_in_text）に保存する文言
export const MARKETING_EMAIL_OPT_IN_TEXT_JA =
  `${MARKETING_EMAIL_OPT_IN_LABEL_JA}。${MARKETING_EMAIL_OPT_IN_DESCRIPTION_SIGNUP_JA}`;

export const MARKETING_EMAIL_OPT_IN_TEXT_EN =
  `${MARKETING_EMAIL_OPT_IN_LABEL_EN}. ${MARKETING_EMAIL_OPT_IN_DESCRIPTION_SIGNUP_EN}`;

/** ダッシュボードバナーからの同意証跡（チェックボックス注記なし） */
export const MARKETING_EMAIL_OPT_IN_BANNER_TEXT_JA =
  `${MARKETING_EMAIL_OPT_IN_LABEL_JA}。${MARKETING_EMAIL_OPT_IN_DESCRIPTION_JA}`;

export const MARKETING_EMAIL_OPT_IN_BANNER_TEXT_EN =
  `${MARKETING_EMAIL_OPT_IN_LABEL_EN}. ${MARKETING_EMAIL_OPT_IN_DESCRIPTION_EN}`;

export const MARKETING_EMAIL_OPT_IN_SOURCE = 'signup_wizard';

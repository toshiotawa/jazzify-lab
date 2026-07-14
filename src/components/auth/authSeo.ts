export type AuthLandingMode = 'signup' | 'login';

export interface AuthLandingSeoMeta {
  title: string;
  description: string;
}

const AUTH_SEO: Record<AuthLandingMode, { ja: AuthLandingSeoMeta; en: AuthLandingSeoMeta }> = {
  signup: {
    ja: {
      title: '会員登録 — Jazzify',
      description:
        'Jazzifyに無料登録。MIDIキーボードでジャズピアノをゲーム感覚で学べるオンライン学習サービスです。',
    },
    en: {
      title: 'Sign Up — Jazzify',
      description:
        'Create a free Jazzify account. Learn jazz piano like a game with your MIDI keyboard.',
    },
  },
  login: {
    ja: {
      title: 'ログイン — Jazzify',
      description: 'Jazzifyにログイン。メールアドレスで認証コードを受け取り、学習を再開できます。',
    },
    en: {
      title: 'Log In — Jazzify',
      description: 'Log in to Jazzify with your email and a verification code to continue learning.',
    },
  },
};

export const getAuthLandingSeo = (mode: AuthLandingMode, isEnglish: boolean): AuthLandingSeoMeta =>
  AUTH_SEO[mode][isEnglish ? 'en' : 'ja'];

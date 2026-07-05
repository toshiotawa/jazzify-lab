export type ContactLocale = 'ja' | 'en';

export interface ContactPageCopy {
  pageTitle: string;
  helmetTitle: string;
  backButtonLabel: string;
  backButtonAria: string;
  intro: string;
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  honeypotLabel: string;
}

const CONTACT_COPY: Record<ContactLocale, ContactPageCopy> = {
  ja: {
    pageTitle: 'お問い合わせ',
    helmetTitle: 'お問い合わせ — Jazzify',
    backButtonLabel: '← 戻る',
    backButtonAria: '前のページに戻る',
    intro: 'ご質問・ご要望などありましたら、以下のフォームからお送りください。（プレースホルダー）',
    nameLabel: 'お名前',
    emailLabel: 'メールアドレス',
    messageLabel: 'お問い合わせ内容',
    submitLabel: '送信',
    honeypotLabel: "Don't fill this out if you're human:",
  },
  en: {
    pageTitle: 'Contact',
    helmetTitle: 'Contact — Jazzify',
    backButtonLabel: '← Back',
    backButtonAria: 'Go back to the previous page',
    intro: 'If you have questions or feedback, please send us a message using the form below.',
    nameLabel: 'Name',
    emailLabel: 'Email address',
    messageLabel: 'Message',
    submitLabel: 'Send',
    honeypotLabel: "Don't fill this out if you're human:",
  },
};

export const getContactPageCopy = (locale: ContactLocale): ContactPageCopy => CONTACT_COPY[locale];

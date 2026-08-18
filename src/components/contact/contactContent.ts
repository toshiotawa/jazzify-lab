export type ContactLocale = 'ja' | 'en';

export interface ContactPageCopy {
  pageTitle: string;
  helmetTitle: string;
  seoDescription: string;
  backButtonLabel: string;
  backButtonAria: string;
  intro: string;
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  sendingLabel: string;
  successMessage: string;
  errorMessage: string;
  validationMessage: string;
  honeypotLabel: string;
}

const CONTACT_COPY: Record<ContactLocale, ContactPageCopy> = {
  ja: {
    pageTitle: 'お問い合わせ',
    helmetTitle: 'お問い合わせ — Jazzify',
    seoDescription: 'Jazzifyへのお問い合わせフォーム。ご質問・ご要望はこちらからお送りください。',
    backButtonLabel: '← 戻る',
    backButtonAria: '前のページに戻る',
    intro: 'ご質問・ご要望などありましたら、以下のフォームからお送りください。（プレースホルダー）',
    nameLabel: 'お名前',
    emailLabel: 'メールアドレス',
    messageLabel: 'お問い合わせ内容',
    submitLabel: '送信',
    sendingLabel: '送信中…',
    successMessage: 'お問い合わせを受け付けました。内容を確認の上、ご連絡いたします。',
    errorMessage: '送信に失敗しました。もう一度お試しください。',
    validationMessage: 'お名前・メールアドレス・お問い合わせ内容を正しく入力してください。',
    honeypotLabel: "Don't fill this out if you're human:",
  },
  en: {
    pageTitle: 'Contact',
    helmetTitle: 'Contact — Jazzify',
    seoDescription: 'Contact Jazzify. Send questions or feedback using our contact form.',
    backButtonLabel: '← Back',
    backButtonAria: 'Go back to the previous page',
    intro: 'If you have questions or feedback, please send us a message using the form below.',
    nameLabel: 'Name',
    emailLabel: 'Email address',
    messageLabel: 'Message',
    submitLabel: 'Send',
    sendingLabel: 'Sending…',
    successMessage: 'Your inquiry has been received. We will review it and get back to you.',
    errorMessage: 'Failed to send. Please try again.',
    validationMessage: 'Please enter your name, email address, and message correctly.',
    honeypotLabel: "Don't fill this out if you're human:",
  },
};

export const getContactPageCopy = (locale: ContactLocale): ContactPageCopy => CONTACT_COPY[locale];

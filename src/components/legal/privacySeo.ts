import type { PrivacyVariant } from '@/components/legal/privacyContent';
import type { TermsLocale } from '@/components/legal/termsContent';

export interface PrivacyPageSeoMeta {
  title: string;
  description: string;
}

const PRIVACY_SEO: Record<PrivacyVariant, Record<TermsLocale, PrivacyPageSeoMeta>> = {
  web: {
    ja: {
      title: 'プライバシーポリシー — Jazzify',
      description:
        'Jazzifyのプライバシーポリシー。取得する個人情報、利用目的、第三者提供、Cookie、お問い合わせ先を説明しています。',
    },
    en: {
      title: 'Privacy Policy — Jazzify',
      description:
        'Jazzify Privacy Policy. What data we collect, how we use it, third-party services, cookies, and contact information.',
    },
  },
  ios: {
    ja: {
      title: 'プライバシーポリシー（iOSアプリ版）— Jazzify',
      description:
        'Jazzify iOSアプリのプライバシーポリシー。取得する情報、利用目的、App Store課金に関する取扱いなど。',
    },
    en: {
      title: 'Privacy Policy (iOS) — Jazzify',
      description:
        'Privacy Policy for the Jazzify iOS app. Data collection, usage, App Store billing-related handling, and contact.',
    },
  },
};

export const getPrivacyPageSeo = (variant: PrivacyVariant, locale: TermsLocale): PrivacyPageSeoMeta =>
  PRIVACY_SEO[variant][locale];

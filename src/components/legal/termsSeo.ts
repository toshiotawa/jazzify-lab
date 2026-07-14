import type { TermsLocale, TermsVariant } from '@/components/legal/termsContent';

export interface TermsPageSeoMeta {
  title: string;
  description: string;
}

const TERMS_SEO: Record<TermsVariant, Record<TermsLocale, TermsPageSeoMeta>> = {
  web: {
    ja: {
      title: '利用規約 — Jazzify',
      description:
        'Jazzify（ジャズピアノ学習ゲーム）の利用規約。サービスの利用条件、会員登録、有料プラン、禁止事項などを定めています。',
    },
    en: {
      title: 'Terms of Service — Jazzify',
      description:
        'Terms of Service for Jazzify, the jazz piano learning game. Membership, Premium plans, acceptable use, and other conditions.',
    },
  },
  ios: {
    ja: {
      title: '利用規約（iOSアプリ版）— Jazzify',
      description:
        'Jazzify iOSアプリの利用規約。App Store経由の課金、利用条件、禁止事項などを定めています。',
    },
    en: {
      title: 'Terms of Service (iOS) — Jazzify',
      description:
        'Terms of Service for the Jazzify iOS app. App Store billing, membership, acceptable use, and related conditions.',
    },
  },
};

export const getTermsPageSeo = (variant: TermsVariant, locale: TermsLocale): TermsPageSeoMeta =>
  TERMS_SEO[variant][locale];

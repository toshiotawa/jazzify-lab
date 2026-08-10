import type { PaywallSource } from '@/utils/analytics/paywallSource';
import type { BillingCurrency } from '@/utils/billingCurrency';
import { PREMIUM_PRICING_JPY, PREMIUM_PRICING_USD } from '@/utils/premiumPricing';

export interface WebPaywallResolvedCopy {
  headline: string;
  subheadline: string;
  features: readonly string[];
  ctaLabel: string;
  trialUsedNotice?: string;
  ctaFootnote?: string;
}

const yearlyPricePhrase = (currency: BillingCurrency, isEnglishCopy: boolean): string => {
  if (currency === 'USD') {
    return isEnglishCopy ? `$${PREMIUM_PRICING_USD.yearly}/year` : `$${PREMIUM_PRICING_USD.yearly}/年`;
  }
  return isEnglishCopy
    ? `¥${PREMIUM_PRICING_JPY.yearly.toLocaleString('en-US')}/year`
    : `年額¥${PREMIUM_PRICING_JPY.yearly.toLocaleString('ja-JP')}`;
};

const trialUsedNoticeFor = (currency: BillingCurrency, isEnglishCopy: boolean): string => {
  const yearly = yearlyPricePhrase(currency, isEnglishCopy);
  if (isEnglishCopy) {
    return `Your free trial has already been used. You will be charged ${yearly} at purchase.`;
  }
  return `無料トライアルは利用済みです。購入時に${yearly}が請求されます。`;
};

const trialCtaFootnoteFor = (currency: BillingCurrency, isEnglishCopy: boolean): string => {
  const yearly = yearlyPricePhrase(currency, isEnglishCopy);
  if (isEnglishCopy) {
    return `No charge today. ${yearly} after 7 days. Cancel anytime.`;
  }
  return `本日のお支払いはありません。7日後から${yearly}。いつでもキャンセルできます。`;
};

const COPY = {
  ja: {
    headline: 'ジャズの練習を、ここから先へ。',
    subheadline: 'Jazzify Premiumで、全コース・全ステージ・学習記録を開放。',
    mainQuestHeadline: '第2章の続きをプレイしよう',
    mainQuestSubheadlineTrial: '7日間無料で、第2章のCブルースの続きがプレイできます。',
    mainQuestSubheadlineSubscribe: '第2章のCブルースの続きがプレイできます。',
    chapterCompleteHeadline: 'メインクエストの続きを開放',
    chapterCompleteSubheadlineTrial:
      'コードの響きをつかんで、アドリブを続けよう。次はCブルースのコードをつかむチャプターへ進みます。',
    chapterCompleteSubheadlineSubscribe:
      'コードの響きをつかんで、アドリブを続けよう。次はCブルースのコードをつかむチャプターへ進みます。',
    softLandingHeadline: 'このコースの続きを開放',
    softLandingSubheadlineTrial:
      '第1ブロックをクリアしました。7日間無料で、残りのブロックもすべてプレイできます。',
    softLandingSubheadlineSubscribe:
      '第1ブロックをクリアしました。プレミアムで残りのブロックもすべてプレイできます。',
    features: [
      '初心者向けメインクエストを最後まで進められる',
      'アドリブ・両手ヴォイシングなど目的別に練習できる',
      'サバイバル全ステージで反復練習できる',
      '学習記録で成長を確認できる',
    ],
    chapterCompleteFeatures: [
      'メインクエストの全チャプター',
      'ブルースで使える音・リズム・コードを段階的に習得',
      'サバイバルで繰り返し実践',
      '学習記録を保存',
    ],
    ctaTrialGeneric: '7日間無料で始める',
    ctaTrialChapter: '7日間無料で第2チャプターを始める',
    ctaTrialChapterComplete: '7日間無料で次のチャプターを始める',
    ctaTrialSoftLanding: '7日間無料ですべて開放する',
    ctaSubscribeGeneric: 'すべてのクエストを解放する',
    ctaSubscribeChapter: '次のチャプターへ進む',
    ctaSubscribeSoftLanding: 'コースの続きへ進む',
  },
  en: {
    headline: 'Take your jazz practice further.',
    subheadline: 'Unlock all courses, stages, and learning records with Jazzify Premium.',
    mainQuestHeadline: 'Play the rest of Chapter 2',
    mainQuestSubheadlineTrial: 'Start a 7-day free trial and play Chapter 2 — C Blues and beyond.',
    mainQuestSubheadlineSubscribe: 'Play Chapter 2 — C Blues and beyond.',
    chapterCompleteHeadline: 'Unlock the rest of Main Quest',
    chapterCompleteSubheadlineTrial:
      'Keep improvising by learning chord colors. Next up: Get a Grip on C Blues Chords.',
    chapterCompleteSubheadlineSubscribe:
      'Keep improvising by learning chord colors. Next up: Get a Grip on C Blues Chords.',
    softLandingHeadline: 'Unlock the rest of this course',
    softLandingSubheadlineTrial:
      'You cleared Block 1. Start a 7-day free trial to play every remaining block.',
    softLandingSubheadlineSubscribe:
      'You cleared Block 1. Go Premium to play every remaining block.',
    features: [
      'Finish the beginner Main Quest from start to end',
      'Practice by goal—improv, two-hand voicings, and more',
      'Drill every Survival stage tier',
      'Track your progress with learning records',
    ],
    chapterCompleteFeatures: [
      'All Main Quest chapters',
      'Learn blues notes, rhythm, and chords step by step',
      'Practice repeatedly in Survival',
      'Save your learning records',
    ],
    ctaTrialGeneric: 'Start 7-day free trial',
    ctaTrialChapter: 'Start Chapter 2 free for 7 days',
    ctaTrialChapterComplete: 'Start the next chapter free for 7 days',
    ctaTrialSoftLanding: 'Unlock everything free for 7 days',
    ctaSubscribeGeneric: 'Unlock all quests',
    ctaSubscribeChapter: 'Continue to the next chapter',
    ctaSubscribeSoftLanding: 'Continue this course',
  },
} as const;

const isChapterOrientedSource = (source: PaywallSource): boolean =>
  source === 'main_quest' || source === 'chapter_complete' || source === 'resume_modal';

export function resolveWebPaywallCopy(
  source: PaywallSource,
  isEnglishCopy: boolean,
  trialUsed: boolean,
  billingCurrency: BillingCurrency = 'JPY',
): WebPaywallResolvedCopy {
  const base = isEnglishCopy ? COPY.en : COPY.ja;
  const chapterOriented = isChapterOrientedSource(source);
  const trialUsedNotice = trialUsed ? trialUsedNoticeFor(billingCurrency, isEnglishCopy) : undefined;
  const trialCtaFootnote = trialUsed ? undefined : trialCtaFootnoteFor(billingCurrency, isEnglishCopy);

  if (source === 'soft_landing') {
    return {
      headline: base.softLandingHeadline,
      subheadline: trialUsed
        ? base.softLandingSubheadlineSubscribe
        : base.softLandingSubheadlineTrial,
      features: base.features,
      ctaLabel: trialUsed ? base.ctaSubscribeSoftLanding : base.ctaTrialSoftLanding,
      trialUsedNotice,
      ctaFootnote: trialCtaFootnote,
    };
  }

  if (source === 'chapter_complete' || source === 'resume_modal') {
    return {
      headline: base.chapterCompleteHeadline,
      subheadline: trialUsed
        ? base.chapterCompleteSubheadlineSubscribe
        : base.chapterCompleteSubheadlineTrial,
      features: base.chapterCompleteFeatures,
      ctaLabel: trialUsed ? base.ctaSubscribeChapter : base.ctaTrialChapterComplete,
      trialUsedNotice,
      ctaFootnote: trialCtaFootnote,
    };
  }

  if (source === 'main_quest') {
    return {
      headline: base.mainQuestHeadline,
      subheadline: trialUsed
        ? base.mainQuestSubheadlineSubscribe
        : base.mainQuestSubheadlineTrial,
      features: base.features,
      ctaLabel: trialUsed ? base.ctaSubscribeChapter : base.ctaTrialChapter,
      trialUsedNotice,
      ctaFootnote: trialCtaFootnote,
    };
  }

  return {
    headline: base.headline,
    subheadline: base.subheadline,
    features: base.features,
    ctaLabel: trialUsed
      ? (chapterOriented ? base.ctaSubscribeChapter : base.ctaSubscribeGeneric)
      : (chapterOriented ? base.ctaTrialChapter : base.ctaTrialGeneric),
    trialUsedNotice,
    ctaFootnote: trialCtaFootnote,
  };
}

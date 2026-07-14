import type { PaywallSource } from '@/utils/analytics/paywallSource';

export interface WebPaywallResolvedCopy {
  headline: string;
  subheadline: string;
  features: readonly string[];
  ctaLabel: string;
  trialUsedNotice?: string;
  ctaFootnote?: string;
}

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
    ctaSubscribeGeneric: 'すべてのクエストを解放する',
    ctaSubscribeChapter: '次のチャプターへ進む',
    trialUsedNotice: '無料トライアルは利用済みです。購入時に年額¥34,800が請求されます。',
    trialCtaFootnote: '本日のお支払いはありません。7日後から年額¥34,800。いつでもキャンセルできます。',
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
    ctaSubscribeGeneric: 'Unlock all quests',
    ctaSubscribeChapter: 'Continue to the next chapter',
    trialUsedNotice: 'Your free trial has already been used. You will be charged ¥34,800/year at purchase.',
    trialCtaFootnote: 'No charge today. ¥34,800/year after 7 days. Cancel anytime.',
  },
} as const;

const isChapterOrientedSource = (source: PaywallSource): boolean =>
  source === 'main_quest' || source === 'chapter_complete';

export function resolveWebPaywallCopy(
  source: PaywallSource,
  isEnglishCopy: boolean,
  trialUsed: boolean,
): WebPaywallResolvedCopy {
  const base = isEnglishCopy ? COPY.en : COPY.ja;
  const chapterOriented = isChapterOrientedSource(source);

  if (source === 'chapter_complete') {
    return {
      headline: base.chapterCompleteHeadline,
      subheadline: trialUsed
        ? base.chapterCompleteSubheadlineSubscribe
        : base.chapterCompleteSubheadlineTrial,
      features: base.chapterCompleteFeatures,
      ctaLabel: trialUsed ? base.ctaSubscribeChapter : base.ctaTrialChapterComplete,
      trialUsedNotice: trialUsed ? base.trialUsedNotice : undefined,
      ctaFootnote: trialUsed ? undefined : base.trialCtaFootnote,
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
    };
  }

  return {
    headline: base.headline,
    subheadline: base.subheadline,
    features: base.features,
    ctaLabel: trialUsed
      ? (chapterOriented ? base.ctaSubscribeChapter : base.ctaSubscribeGeneric)
      : (chapterOriented ? base.ctaTrialChapter : base.ctaTrialGeneric),
  };
}

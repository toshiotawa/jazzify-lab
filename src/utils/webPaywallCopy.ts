import type { PaywallSource } from '@/utils/analytics/paywallSource';

export interface WebPaywallResolvedCopy {
  headline: string;
  subheadline: string;
  features: readonly string[];
  ctaLabel: string;
}

const COPY = {
  ja: {
    headline: 'ジャズの練習を、ここから先へ。',
    subheadline: 'Jazzify Premiumで、全コース・全ステージ・学習記録を開放。',
    mainQuestHeadline: '第2章の続きをプレイしよう',
    mainQuestSubheadlineTrial: '7日間無料で、第2章のCブルースの続きがプレイできます。',
    mainQuestSubheadlineSubscribe: '第2章のCブルースの続きがプレイできます。',
    chapterCompleteHeadline: '第1チャプタークリア！',
    chapterCompleteSubheadlineTrial: 'Cブルースでアドリブする第一歩を習得しました。',
    chapterCompleteSubheadlineSubscribe: 'Cブルースでアドリブする第一歩を習得しました。次のチャプターでさらに上達できます。',
    features: [
      '初心者向けメインクエストを最後まで進められる',
      'アドリブ・両手ヴォイシングなど目的別に練習できる',
      'サバイバル全ステージで反復練習できる',
      '学習記録で成長を確認できる',
    ],
    chapterCompleteFeatures: [
      '使える音を増やす',
      'コードに合わせて弾く',
      '実践的なフレーズを身につける',
    ],
    ctaTrialGeneric: '7日間無料で始める',
    ctaTrialChapter: '7日間無料で第2チャプターを始める',
    ctaSubscribeGeneric: 'すべてのクエストを解放する',
    ctaSubscribeChapter: '次のチャプターへ進む',
  },
  en: {
    headline: 'Take your jazz practice further.',
    subheadline: 'Unlock all courses, stages, and learning records with Jazzify Premium.',
    mainQuestHeadline: 'Play the rest of Chapter 2',
    mainQuestSubheadlineTrial: 'Start a 7-day free trial and play Chapter 2 — C Blues and beyond.',
    mainQuestSubheadlineSubscribe: 'Play Chapter 2 — C Blues and beyond.',
    chapterCompleteHeadline: 'Chapter 1 complete!',
    chapterCompleteSubheadlineTrial: 'You took your first step improvising over C Blues.',
    chapterCompleteSubheadlineSubscribe: 'You took your first step improvising over C Blues. Keep building in the next chapter.',
    features: [
      'Finish the beginner Main Quest from start to end',
      'Practice by goal—improv, two-hand voicings, and more',
      'Drill every Survival stage tier',
      'Track your progress with learning records',
    ],
    chapterCompleteFeatures: [
      'Expand the notes you can use',
      'Play along with the changes',
      'Build practical phrases',
    ],
    ctaTrialGeneric: 'Start 7-day free trial',
    ctaTrialChapter: 'Start Chapter 2 free for 7 days',
    ctaSubscribeGeneric: 'Unlock all quests',
    ctaSubscribeChapter: 'Continue to the next chapter',
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
      ctaLabel: trialUsed ? base.ctaSubscribeChapter : base.ctaTrialChapter,
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

interface TrainingAccordionCategory {
  readonly id: string;
  readonly trainingIds: readonly string[];
}

/**
 * カテゴリを閉じる ID 集合を返す。
 * - 直前プレイがある: そのカテゴリだけ開く
 * - それ以外: 現在の目標に含まれるカテゴリだけ開く
 * - 該当なし: 全て閉じる
 */
export const resolveCollapsedTrainingCategoryIds = (
  categories: readonly TrainingAccordionCategory[],
  goalTrainingIds: readonly string[],
  lastPlayedTrainingId: string | null,
): ReadonlySet<string> => {
  const openIds = new Set<string>();

  if (lastPlayedTrainingId) {
    const playedCategory = categories.find((category) =>
      category.trainingIds.includes(lastPlayedTrainingId),
    );
    if (playedCategory) {
      openIds.add(playedCategory.id);
    }
  }

  if (openIds.size === 0 && goalTrainingIds.length > 0) {
    const goalIds = new Set(goalTrainingIds);
    for (const category of categories) {
      if (category.trainingIds.some((trainingId) => goalIds.has(trainingId))) {
        openIds.add(category.id);
      }
    }
  }

  const collapsed = new Set<string>();
  for (const category of categories) {
    if (!openIds.has(category.id)) {
      collapsed.add(category.id);
    }
  }
  return collapsed;
};

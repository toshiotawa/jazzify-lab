export type LessonCompletionCopyState = 'ready' | 'blocked' | 'completed' | 'submitting';

type LessonCompletionStateInput = {
  isCompleted: boolean;
  isSubmitting: boolean;
  allRequirementsCompleted: boolean;
};

export const resolveLessonCompletionState = ({
  isCompleted,
  isSubmitting,
  allRequirementsCompleted,
}: LessonCompletionStateInput): LessonCompletionCopyState => {
  if (isCompleted) {
    return 'completed';
  }
  if (isSubmitting) {
    return 'submitting';
  }
  if (allRequirementsCompleted) {
    return 'ready';
  }
  return 'blocked';
};

export const lessonCompletionSectionTitle = (isEnglish: boolean): string =>
  isEnglish ? 'Final step' : '最後のステップ';

export type LessonCompletionButtonCopy = {
  primary: string;
  secondary?: string;
};

export const lessonCompletionButtonCopy = (
  state: LessonCompletionCopyState,
  isEnglish: boolean,
): LessonCompletionButtonCopy => {
  switch (state) {
    case 'completed':
      return {
        primary: isEnglish ? 'Quest completed' : 'クエスト完了済み',
      };
    case 'submitting':
      return {
        primary: isEnglish ? 'Completing…' : '完了処理中…',
      };
    case 'ready':
      return {
        primary: isEnglish ? 'Complete this quest' : 'クエストを完了する',
        secondary: isEnglish ? 'Unlock the next quest' : '次のクエストを解放',
      };
    case 'blocked':
      return {
        primary: isEnglish ? 'Complete this quest' : 'クエストを完了する',
      };
  }
};

export const lessonCompletionCalloutCopy = (
  state: LessonCompletionCopyState,
  isEnglish: boolean,
): string => {
  switch (state) {
    case 'ready':
      return isEnglish
        ? 'Clearing tasks or watching videos alone does not finish the quest. Tap here to mark it complete and move on.'
        : '課題のクリアや動画の視聴だけでは完了になりません。ここを押して初めてクエスト完了となり、次に進めます。';
    case 'blocked':
      return isEnglish
        ? 'Clear all practice tasks first, then tap the button below to finish.'
        : 'すべての実習課題をクリアしてから、下のボタンで完了してください。';
    case 'completed':
      return isEnglish
        ? 'This quest is already complete.'
        : 'このクエストは完了済みです。';
    case 'submitting':
      return isEnglish
        ? 'Saving your progress…'
        : '進捗を保存しています…';
  }
};

export const lessonCompletionBlockedToastCopy = (isEnglish: boolean): string =>
  isEnglish
    ? 'Complete all practice tasks before marking this quest complete.'
    : 'すべての実習課題を完了してからクエストを完了してください。';

export const lessonCompletionSuccessToastCopy = (isEnglish: boolean): string =>
  isEnglish ? 'Quest marked complete.' : 'クエストを完了しました！';

export const lessonCompletionSuccessToastTitleCopy = (isEnglish: boolean): string =>
  isEnglish ? '🎉 Done' : '🎉 完了';

export const lessonCompletionErrorToastCopy = (isEnglish: boolean): string =>
  isEnglish ? 'Could not complete the quest.' : '完了処理に失敗しました。';

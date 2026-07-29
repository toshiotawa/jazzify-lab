import { describe, expect, it } from 'vitest';
import {
  lessonCompletionBlockedToastCopy,
  lessonCompletionButtonCopy,
  lessonCompletionCalloutCopy,
  lessonCompletionSectionTitle,
  questReadyToCompletePromptCopy,
  resolveLessonCompletionState,
} from '@/utils/lessonCompletionCopy';

describe('resolveLessonCompletionState', () => {
  it('完了済みを最優先する', () => {
    expect(
      resolveLessonCompletionState({
        isCompleted: true,
        isSubmitting: true,
        allRequirementsCompleted: true,
      }),
    ).toBe('completed');
  });

  it('送信中は blocked より submitting', () => {
    expect(
      resolveLessonCompletionState({
        isCompleted: false,
        isSubmitting: true,
        allRequirementsCompleted: false,
      }),
    ).toBe('submitting');
  });

  it('課題完了かつ未完了なら ready', () => {
    expect(
      resolveLessonCompletionState({
        isCompleted: false,
        isSubmitting: false,
        allRequirementsCompleted: true,
      }),
    ).toBe('ready');
  });

  it('課題未完了なら blocked', () => {
    expect(
      resolveLessonCompletionState({
        isCompleted: false,
        isSubmitting: false,
        allRequirementsCompleted: false,
      }),
    ).toBe('blocked');
  });
});

describe('lessonCompletionSectionTitle', () => {
  it('日本語と英語で見出しを返す', () => {
    expect(lessonCompletionSectionTitle(false)).toBe('最後のステップ');
    expect(lessonCompletionSectionTitle(true)).toBe('Final step');
  });
});

describe('lessonCompletionButtonCopy', () => {
  it('ready 状態で 2 行ラベルを返す', () => {
    expect(lessonCompletionButtonCopy('ready', false)).toEqual({
      primary: 'クエストを完了する',
      secondary: '次のクエストを解放',
    });
    expect(lessonCompletionButtonCopy('ready', true)).toEqual({
      primary: 'Complete this quest',
      secondary: 'Unlock the next quest',
    });
  });

  it('completed 状態では secondary を返さない', () => {
    expect(lessonCompletionButtonCopy('completed', true)).toEqual({
      primary: 'Quest completed',
    });
  });
});

describe('lessonCompletionCalloutCopy', () => {
  it('ready 説明に課題だけでは完了しない旨を含む', () => {
    expect(lessonCompletionCalloutCopy('ready', false)).toContain('課題のクリアや動画の視聴だけでは完了になりません');
    expect(lessonCompletionCalloutCopy('ready', true)).toContain(
      'Clearing tasks or watching videos alone does not finish the quest',
    );
  });

  it('blocked 説明に下のボタン案内を含む', () => {
    expect(lessonCompletionCalloutCopy('blocked', false)).toContain('下のボタン');
    expect(lessonCompletionCalloutCopy('blocked', true)).toContain('button below');
  });
});

describe('lessonCompletionBlockedToastCopy', () => {
  it('toast 文言を返す', () => {
    expect(lessonCompletionBlockedToastCopy(false)).toContain('実習課題');
    expect(lessonCompletionBlockedToastCopy(true)).toContain('practice tasks');
  });
});

describe('questReadyToCompletePromptCopy', () => {
  it('任意課題が残る場合は完了可能の案内とおまけ課題ボタンを返す', () => {
    const copy = questReadyToCompletePromptCopy(false, { hasOptionalRemaining: true });
    expect(copy.heading).toBe('クエスト完了できます！');
    expect(copy.body).toContain('おまけ課題');
    expect(copy.tryOptionalTask).toBe('おまけ課題に挑戦');
  });

  it('全課題完了時は従来の文言を返す', () => {
    const copy = questReadyToCompletePromptCopy(false);
    expect(copy.heading).toBe('クエスト完了です！');
    expect(copy.body).toContain('全ての課題が完了しました');
    expect(copy.tryOptionalTask).toBeUndefined();
  });
});

import type { SurvivalTutorialV3UiOverrides } from './survivalTutorialV3ScriptTypes';

/** v3 SceneHost と各シーンへのコールバック束。親が OnboardingOverlay / CTA と同期する。 */
export interface SurvivalTutorialV3Bindings {
  readonly isEnglishCopy: boolean;
  readonly ui: SurvivalTutorialV3UiOverrides;
  /** 現在のキャラクター／セリフ行 */
  readonly setCharacterLine: (text: string) => void;
  readonly onExit: () => void;
  /** 親が「完了」（CTA）でコールバックしたとき */
  readonly onLessonTutorialCompleted?: () => void | Promise<void>;
}

import type { SurvivalTutorialV3UiOverrides } from './survivalTutorialV3ScriptTypes';

import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';

/** v3 SceneHost と各シーンへのコールバック束。親が OnboardingOverlay / CTA と同期する。 */
export interface SurvivalTutorialV3Bindings {
  readonly isEnglishCopy: boolean;
  readonly ui: SurvivalTutorialV3UiOverrides;
  /** Onboarding のキャラセリフ（複数色セグメント） */
  readonly setCharacterSegments: (segments: readonly TutorialResolvedTextSegment[]) => void;
  /** 画面中央下のナレーション字幕 */
  readonly setNarrationText: (text: string) => void;
  /** ジャ爺 Canvas 吹き出し（styled セグメント） */
  readonly setJajiiSpeechSegments: (segments: readonly TutorialResolvedTextSegment[]) => void;
  readonly onExit: () => void;
  /** 親が「完了」（CTA）でコールバックしたとき */
  readonly onLessonTutorialCompleted?: () => void | Promise<void>;
  /** 固定秒またはタップのどちらか先で完了（iOS `waitForTapOrTimeout` 相当）。 */
  readonly waitForTapOrTimeout: (seconds: number, signal?: AbortSignal) => Promise<void>;
  readonly setTapAdvanceCueVisible: (visible: boolean) => void;
  /** フレーズ BGM 用に親のドラムループを一時停止 */
  readonly pauseSharedDrumLoop?: () => void;
  readonly resumeSharedDrumLoop?: () => void;
}

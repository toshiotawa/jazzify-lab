import type {
  SurvivalTutorialV3DemoPlayScene,
  SurvivalTutorialV3UiOverrides,
} from './survivalTutorialV3ScriptTypes';

/** v3 SceneHost と各シーンへのコールバック束。親が OnboardingOverlay / CTA と同期する。 */
export interface SurvivalTutorialV3Bindings {
  readonly isEnglishCopy: boolean;
  readonly ui: SurvivalTutorialV3UiOverrides;
  /** Onboarding のキャラセリフ（単色） */
  readonly setCharacterText: (text: string) => void;
  /** 画面中央下のナレーション字幕 */
  readonly setNarrationText: (text: string) => void;
  /** ジャ爺 Canvas 吹き出し */
  readonly setJajiiSpeechText: (text: string) => void;
  readonly onExit: () => void;
  /** 親が「完了」（CTA）でコールバックしたとき */
  readonly onLessonTutorialCompleted?: () => void | Promise<void>;
  /** 固定秒またはタップのどちらか先で完了（iOS `waitForTapOrTimeout` 相当）。 */
  readonly waitForTapOrTimeout: (seconds: number, signal?: AbortSignal) => Promise<void>;
  readonly setTapAdvanceCueVisible: (visible: boolean) => void;
  /** フレーズ BGM 用に親のドラムループを一時停止 */
  readonly pauseSharedDrumLoop?: () => void;
  readonly resumeSharedDrumLoop?: () => void;
  /** demo_play 開始前会話中の BGM 停止（無音） */
  readonly stopDemoBgm?: () => void;
  /** demo_play 本編開始時にドラムループを先頭から再生し、再生開始まで待つ */
  readonly startDemoBgmFromStart?: (scene: SurvivalTutorialV3DemoPlayScene) => Promise<void>;
  /** demo_play(livePlayback) で各和音開始時にアプリ音源(ピアノ)で voicing を発音する。 */
  readonly playDemoChordAudio?: (midis: readonly number[]) => void;
  /** demo ロール和音: 新音のみ sustain 発音。 */
  readonly playDemoSustainChordAudio?: (midis: readonly number[]) => void;
  /** demo ロール和音: sustain 中の音を release。省略時は全 release。 */
  readonly releaseDemoSustainAudio?: (midis?: readonly number[]) => void;
  /** demo_play / play で staff3 ベースをアプリ音源(ベース)で発音する。 */
  readonly playDemoBassAudio?: (midis: readonly number[]) => void;
}

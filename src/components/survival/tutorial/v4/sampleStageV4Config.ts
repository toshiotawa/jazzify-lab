/**
 * Survival Tutorial V4 — サンプルステージの制御設定(明示的中間情報)。
 *
 * sceneType / bgm などの制御情報はここで明示する。
 * id は MusicXML のリハーサルマーク(S1/S2/S3)と一致させる。
 * 生成スクリプトとテストの両方から参照する。
 */
import type { SurvivalTutorialV4BuildConfig } from './buildSurvivalTutorialV4Manifest';

// ts-prune-ignore-next 生成スクリプト/テストから利用
export const SAMPLE_STAGE_V4_CONFIG: SurvivalTutorialV4BuildConfig = {
  id: 'sample_stage_v4',
  assets: {
    midi: 'sampleStageV4.mid',
    bgm: { url: 'sample_bgm_loop.mp3' },
  },
  ui: {
    hidePlayerHpBar: true,
    hideSettingsButton: true,
    hideBackButton: true,
    hideMidiToggle: true,
    showExitButton: true,
    playerInvincible: true,
    disableEnemyAttacks: true,
    keyboardHintsDefault: true,
  },
  scenes: [
    { id: 'S1', sceneType: 'dialogue', bgmUrl: 'sample_bgm_loop.mp3' },
    { id: 'S2', sceneType: 'demo', bgmUrl: 'sample_bgm_loop.mp3' },
    { id: 'S3', sceneType: 'play', bgmUrl: 'sample_bgm_loop.mp3' },
  ],
};

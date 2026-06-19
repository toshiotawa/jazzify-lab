/**
 * 開発者テストコース用 — ロール和音（1|2段またがり）V4 manifest 設定。
 */
import type { SurvivalTutorialV4BuildConfig } from './buildSurvivalTutorialV4Manifest';

const BGM_URL =
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3';

// ts-prune-ignore-next 生成スクリプト/マイグレーション生成から利用
export const DEVELOPER_V4_ROLL_GRAND_STAFF_CONFIG: SurvivalTutorialV4BuildConfig = {
  id: 'developer_v4_roll_grand_staff',
  assets: {
    bgm: { url: BGM_URL },
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
    { id: 'S1', sceneType: 'dialogue', bgmUrl: BGM_URL },
    { id: 'S2', sceneType: 'demo', bgmUrl: BGM_URL },
    { id: 'S3', sceneType: 'play', bgmUrl: BGM_URL },
  ],
};

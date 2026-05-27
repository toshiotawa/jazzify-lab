import { MAP_CONFIG } from '@/components/survival/SurvivalTypes';

/** 風船ラッシュのプレイフィールド（サバイバルマップの 1/2）。iOS `BalloonRushMap` と同期。 */
export const BALLOON_RUSH_MAP_CONFIG = {
  width: MAP_CONFIG.width / 2,
  height: MAP_CONFIG.height / 2,
  tileSize: MAP_CONFIG.tileSize,
} as const;

/** `public/Drums160Loop.mp3` → R2（`scripts/upload-drums160-loop-r2.mjs`） */
export const BALLOON_RUSH_DRUM_LOOP_BGM_URL =
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3';

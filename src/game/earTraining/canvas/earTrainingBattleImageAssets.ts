import {
  BACKGROUND_IMAGE_URLS,
  PLAYER_POSE_IMAGE_URLS,
} from '@/game/earTraining/canvas/earTrainingBattleBackground';
import {
  EFFECT_ASSET_PATH,
  ENEMY_ATTACK_HAMMER_ASSET_URL,
  FUKIDASHI_ASSET_URL,
  MAGIC_CIRCLE_ASSET_URL,
} from '@/game/earTraining/canvas/earTrainingBattleLayout';

/** キャラ表示・ハンマー等、バトル開始直後に必要なスプライト */
export const BATTLE_UI_SPRITE_URLS: Record<string, string> = {
  hammer: ENEMY_ATTACK_HAMMER_ASSET_URL,
  fukidashi: FUKIDASHI_ASSET_URL,
};

export const BATTLE_MAGIC_CIRCLE_URL = MAGIC_CIRCLE_ASSET_URL;

export const BATTLE_EFFECT_SPRITE_URLS: Record<string, string> = {
  fireball: `${EFFECT_ASSET_PATH}effect-fireball-transparent.webp`,
  fireRing: `${EFFECT_ASSET_PATH}effect-fire-ring-transparent.webp`,
  snowflake: `${EFFECT_ASSET_PATH}effect-snowflake-transparent.webp`,
  lightning: `${EFFECT_ASSET_PATH}effect-lightning-transparent.webp`,
  meteor: `${EFFECT_ASSET_PATH}effect-meteor-transparent.webp`,
  cloud: `${EFFECT_ASSET_PATH}effect-cloud-transparent.webp`,
};

export const EFFECT_IMAGE_URLS: Record<string, string> = {
  ...BATTLE_EFFECT_SPRITE_URLS,
  ...BATTLE_UI_SPRITE_URLS,
  magicCircle: BATTLE_MAGIC_CIRCLE_URL,
  ...PLAYER_POSE_IMAGE_URLS,
};

export const getEarTrainingBattleCriticalUrls = (
  avatarUrls: readonly string[],
): string[] => [
  ...new Set([
    ...avatarUrls.filter(Boolean),
    ...Object.values(BATTLE_UI_SPRITE_URLS),
  ]),
];

export const getEarTrainingBattleDeferredUrls = (): string[] => [
  ...new Set([
    ...Object.values(BATTLE_EFFECT_SPRITE_URLS),
    ...Object.values(BACKGROUND_IMAGE_URLS),
    ...Object.values(PLAYER_POSE_IMAGE_URLS),
    BATTLE_MAGIC_CIRCLE_URL,
  ]),
];

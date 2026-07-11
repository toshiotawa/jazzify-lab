import type { EarTrainingMode } from '@/types';
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

const OSMD_CRITICAL_POSE_KEYS = ['guardD', 'guardE', 'finish', 'cast'] as const;
const OSMD_SECONDARY_POSE_KEYS = ['skill1', 'skill2', 'skill3', 'skill4', 'skill5', 'skill6'] as const;
const OSMD_EFFECT_KEYS = ['meteor', 'fireRing', 'snowflake', 'lightning', 'cloud'] as const;

const isOsmdLikeMode = (mode?: EarTrainingMode): boolean =>
  mode === 'chord_osmd' || mode === 'chord_precision';

const pickRecordKeys = (
  source: Record<string, string>,
  keys: readonly string[],
): Record<string, string> => {
  const picked: Record<string, string> = {};
  keys.forEach((key) => {
    const url = source[key];
    if (url) {
      picked[key] = url;
    }
  });
  return picked;
};

export const getEarTrainingBattleCriticalPoseSpritesForMode = (
  mode?: EarTrainingMode,
): Record<string, string> => {
  if (isOsmdLikeMode(mode)) {
    return pickRecordKeys(PLAYER_POSE_IMAGE_URLS, OSMD_CRITICAL_POSE_KEYS);
  }
  return {};
};

export const getEarTrainingBattleSecondaryEffectSpritesForMode = (
  mode?: EarTrainingMode,
): Record<string, string> => {
  if (isOsmdLikeMode(mode)) {
    return pickRecordKeys(BATTLE_EFFECT_SPRITE_URLS, OSMD_EFFECT_KEYS);
  }
  return {};
};

export const getEarTrainingBattleCriticalEffectSpritesForMode = (
  _mode?: EarTrainingMode,
): Record<string, string> => ({});

export const getEarTrainingBattleSecondaryPoseSpritesForMode = (
  mode?: EarTrainingMode,
): Record<string, string> => {
  if (isOsmdLikeMode(mode)) {
    return pickRecordKeys(PLAYER_POSE_IMAGE_URLS, OSMD_SECONDARY_POSE_KEYS);
  }
  return {};
};

export const getEarTrainingBattleSpriteRegistryForMode = (
  mode?: EarTrainingMode,
): {
  uiSprites: Record<string, string>;
  effectSprites: Record<string, string>;
  poseSprites: Record<string, string>;
  backgroundSprites: Record<string, string>;
} => {
  if (!isOsmdLikeMode(mode)) {
    return {
      uiSprites: { ...BATTLE_UI_SPRITE_URLS },
      effectSprites: {
        ...BATTLE_EFFECT_SPRITE_URLS,
        magicCircle: BATTLE_MAGIC_CIRCLE_URL,
      },
      poseSprites: { ...PLAYER_POSE_IMAGE_URLS },
      backgroundSprites: { ...BACKGROUND_IMAGE_URLS },
    };
  }

  return {
    uiSprites: { ...BATTLE_UI_SPRITE_URLS },
    effectSprites: {
      ...getEarTrainingBattleCriticalEffectSpritesForMode(mode),
      ...getEarTrainingBattleSecondaryEffectSpritesForMode(mode),
    },
    poseSprites: {
      ...getEarTrainingBattleCriticalPoseSpritesForMode(mode),
      ...getEarTrainingBattleSecondaryPoseSpritesForMode(mode),
    },
    backgroundSprites: { ...BACKGROUND_IMAGE_URLS },
  };
};

export const getEarTrainingBattleCriticalUrls = (
  avatarUrls: readonly string[],
  mode?: EarTrainingMode,
): string[] => [
  ...new Set([
    ...avatarUrls.filter(Boolean),
    ...Object.values(BATTLE_UI_SPRITE_URLS),
    ...Object.values(getEarTrainingBattleCriticalPoseSpritesForMode(mode)),
    ...Object.values(getEarTrainingBattleCriticalEffectSpritesForMode(mode)),
  ]),
];

export const getEarTrainingBattleSecondaryUrls = (
  mode?: EarTrainingMode,
): string[] => {
  if (!isOsmdLikeMode(mode)) {
    return [];
  }
  return [
    ...new Set([
      ...Object.values(getEarTrainingBattleSecondaryEffectSpritesForMode(mode)),
      ...Object.values(getEarTrainingBattleSecondaryPoseSpritesForMode(mode)),
    ]),
  ];
};

export const getEarTrainingBattleDeferredUrls = (
  mode?: EarTrainingMode,
): string[] => {
  if (!mode) {
    return [
      ...new Set([
        ...Object.values(BATTLE_EFFECT_SPRITE_URLS),
        ...Object.values(BACKGROUND_IMAGE_URLS),
        ...Object.values(PLAYER_POSE_IMAGE_URLS),
        BATTLE_MAGIC_CIRCLE_URL,
      ]),
    ];
  }

  if (isOsmdLikeMode(mode)) {
    return [...new Set([...Object.values(BACKGROUND_IMAGE_URLS)])];
  }

  return [
    ...new Set([
      ...Object.values(BATTLE_EFFECT_SPRITE_URLS),
      ...Object.values(BACKGROUND_IMAGE_URLS),
      ...Object.values(PLAYER_POSE_IMAGE_URLS),
      BATTLE_MAGIC_CIRCLE_URL,
    ]),
  ];
};

import type { Direction } from '@/components/survival/SurvivalTypes';

/** デフォルト5方向スプライト（右向きベース）。左向きは flipX で対応 */
export type SurvivalDefaultSpriteVariant =
  | 'migi'
  | 'naname_migi_shita'
  | 'naname_migi_ue'
  | 'shita'
  | 'ue';

export const SURVIVAL_DEFAULT_SPRITE_PATHS: Record<SurvivalDefaultSpriteVariant, string> = {
  migi: '/default_avater/muki/migi.png',
  naname_migi_shita: '/default_avater/muki/naname_migi_shita.png',
  naname_migi_ue: '/default_avater/muki/naname_migi_ue.png',
  shita: '/default_avater/muki/shita.png',
  ue: '/default_avater/muki/ue.png',
};

export const SURVIVAL_DEFAULT_SPRITE_VARIANTS: readonly SurvivalDefaultSpriteVariant[] = [
  'migi',
  'naname_migi_shita',
  'naname_migi_ue',
  'shita',
  'ue',
] as const;

interface SurvivalDefaultSpriteSelection {
  variant: SurvivalDefaultSpriteVariant;
  flipX: boolean;
}

/**
 * 8方向の移動状態から、表示する右向きベースのバリアントと水平反転の要否を返す。
 */
export function getSurvivalDefaultSpriteForDirection(direction: Direction): SurvivalDefaultSpriteSelection {
  switch (direction) {
    case 'right':
      return { variant: 'migi', flipX: false };
    case 'down-right':
      return { variant: 'naname_migi_shita', flipX: false };
    case 'up-right':
      return { variant: 'naname_migi_ue', flipX: false };
    case 'down':
      return { variant: 'shita', flipX: false };
    case 'up':
      return { variant: 'ue', flipX: false };
    case 'left':
      return { variant: 'migi', flipX: true };
    case 'down-left':
      return { variant: 'naname_migi_shita', flipX: true };
    case 'up-left':
      return { variant: 'naname_migi_ue', flipX: true };
  }
}

/**
 * 下降マップの立ち絵向き（左右中央）用。中央は正面（下）スプライト。
 */
export function getSurvivalDescentSpriteForFacing(
  facing: 'left' | 'right' | 'center'
): SurvivalDefaultSpriteSelection {
  switch (facing) {
    case 'right':
      return { variant: 'migi', flipX: false };
    case 'left':
      return { variant: 'migi', flipX: true };
    case 'center':
      return { variant: 'shita', flipX: false };
  }
}

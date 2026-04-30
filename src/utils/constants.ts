/**
 * アプリケーション全体で使用する定数
 */

// デフォルトアバター
export const DEFAULT_AVATAR_URL = '/default_avatar/default_avatar.svg';

/** 耳コピバトル画面のプレイヤー（自分）側キャラ立ち絵 */
export const EAR_TRAINING_PLAYER_AVATAR_URL = '/default_avater/default-avater.png';

/** 耳コピバトル画面の敵キャラ候補 */
export const EAR_TRAINING_ENEMY_AVATAR_URLS: readonly string[] = [
  '/stage_icons/1.png',
  '/stage_icons/2.png',
  '/stage_icons/3.png',
  '/stage_icons/4.png',
  '/stage_icons/5.png',
  '/stage_icons/6.png',
  '/stage_icons/7.png',
  '/stage_icons/8.png',
  '/stage_icons/9.png',
  '/stage_icons/10.png',
];

/** 右向きの素材を敵側で左向きに表示するための対象URL */
export const EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS: ReadonlySet<string> = new Set([
  '/stage_icons/1.png',
  '/stage_icons/2.png',
  '/stage_icons/4.png',
  '/stage_icons/7.png',
  '/stage_icons/8.png',
  '/stage_icons/9.png',
]);

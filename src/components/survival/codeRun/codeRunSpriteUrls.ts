const MAIN_CHAR_BASE = '/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC';
const MAIN_CHAR_VER = '64';

export const mainCharSprite = (name: string): string => `${MAIN_CHAR_BASE}/${name}?v=${MAIN_CHAR_VER}`;

/** 開始画面などマップ生成を伴わない画面から参照する立ち絵（39x64）。 */
export const CODE_RUN_HERO_SPRITE_URL = mainCharSprite('sprite_01.png');
export const CODE_RUN_HERO_SPRITE_WIDTH = 39;
export const CODE_RUN_HERO_SPRITE_HEIGHT = 64;

/**
 * 魔王城降下マップ: ブロック別ビジュアルテーマ
 * ブロックインデックス (0..20) を 5 つの Tier に分類し、
 * プレートカラー / 背景色相 / 封印魔法陣色 / 提灯色を統一する。
 */

export type BlockTier = 'stone' | 'ember' | 'violet' | 'crimson' | 'abyss';

export interface BlockThemeColors {
  tier: BlockTier;
  /** ヘッダープレート グラデ上端 */
  plateTop: string;
  /** ヘッダープレート グラデ下端 */
  plateBottom: string;
  /** プレート枠色 */
  plateBorder: string;
  /** プレート文字色 */
  plateText: string;
  /** クリア時グロー色 */
  plateClearedGlow: string;
  /** 封印魔法陣 主線色 */
  sealStroke: string;
  /** 封印魔法陣 グロー色 */
  sealGlow: string;
  /** 提灯コア色 */
  lanternCore: string;
  /** 提灯外炎色 */
  lanternOuter: string;
  /** 背景壁ティント (上端) */
  tintTop: string;
  /** 背景壁ティント (下端) */
  tintBottom: string;
  /** ラベル (accessibility / debug) */
  label: string;
}

const TIER_COLORS: Record<BlockTier, Omit<BlockThemeColors, 'tier'>> = {
  stone: {
    plateTop: 'rgba(78,82,100,0.96)',
    plateBottom: 'rgba(32,34,48,0.96)',
    plateBorder: 'rgba(170,178,196,0.55)',
    plateText: '#e6eaf2',
    plateClearedGlow: 'rgba(220,226,240,0.6)',
    sealStroke: 'rgba(200,214,240,0.85)',
    sealGlow: 'rgba(140,180,230,0.7)',
    lanternCore: 'rgba(255,236,190,1)',
    lanternOuter: 'rgba(255,186,96,0.85)',
    tintTop: 'rgba(120,140,180,0.18)',
    tintBottom: 'rgba(80,96,140,0.22)',
    label: 'Stone Hall',
  },
  ember: {
    plateTop: 'rgba(130,80,50,0.96)',
    plateBottom: 'rgba(60,28,18,0.96)',
    plateBorder: 'rgba(230,160,90,0.7)',
    plateText: '#ffe2ae',
    plateClearedGlow: 'rgba(255,180,90,0.75)',
    sealStroke: 'rgba(255,196,120,0.92)',
    sealGlow: 'rgba(255,150,70,0.75)',
    lanternCore: 'rgba(255,220,140,1)',
    lanternOuter: 'rgba(255,140,60,0.9)',
    tintTop: 'rgba(180,110,70,0.22)',
    tintBottom: 'rgba(140,60,40,0.26)',
    label: 'Ember Corridor',
  },
  violet: {
    plateTop: 'rgba(86,60,130,0.96)',
    plateBottom: 'rgba(38,22,66,0.96)',
    plateBorder: 'rgba(190,150,240,0.65)',
    plateText: '#efdcff',
    plateClearedGlow: 'rgba(200,150,255,0.72)',
    sealStroke: 'rgba(220,180,255,0.92)',
    sealGlow: 'rgba(170,110,240,0.8)',
    lanternCore: 'rgba(230,210,255,1)',
    lanternOuter: 'rgba(180,120,240,0.85)',
    tintTop: 'rgba(110,70,180,0.24)',
    tintBottom: 'rgba(70,30,120,0.28)',
    label: 'Violet Sanctum',
  },
  crimson: {
    plateTop: 'rgba(150,40,60,0.96)',
    plateBottom: 'rgba(60,10,22,0.96)',
    plateBorder: 'rgba(255,120,140,0.7)',
    plateText: '#ffd6dc',
    plateClearedGlow: 'rgba(255,110,130,0.78)',
    sealStroke: 'rgba(255,160,170,0.92)',
    sealGlow: 'rgba(230,60,90,0.85)',
    lanternCore: 'rgba(255,210,210,1)',
    lanternOuter: 'rgba(230,70,90,0.9)',
    tintTop: 'rgba(180,50,70,0.26)',
    tintBottom: 'rgba(110,20,30,0.32)',
    label: 'Crimson Abyss',
  },
  abyss: {
    plateTop: 'rgba(24,22,40,0.98)',
    plateBottom: 'rgba(4,2,12,0.98)',
    plateBorder: 'rgba(255,196,120,0.85)',
    plateText: '#fff0c2',
    plateClearedGlow: 'rgba(255,210,120,0.95)',
    sealStroke: 'rgba(255,220,140,0.98)',
    sealGlow: 'rgba(255,170,60,0.95)',
    lanternCore: 'rgba(255,240,190,1)',
    lanternOuter: 'rgba(255,160,40,0.95)',
    tintTop: 'rgba(40,20,60,0.32)',
    tintBottom: 'rgba(10,4,20,0.42)',
    label: 'Throne of Ruin',
  },
};

/**
 * ブロックインデックス (0..20) → Tier マッピング
 * Major/Minor 系 → stone
 * M7/m7/7/m7b5/mM7 → ember
 * dim7/aug7/6/m6/M7(9) → violet
 * m7(9)/7(9,13)/7(b9,b13)/6(9)/m6(9)/7(b9,13) → crimson
 * 7(#9,b13)/m7(b5)(11)/dim(M7) → abyss
 */
function indexToTier(blockIndex: number): BlockTier {
  if (blockIndex <= 1) return 'stone';        // major, minor
  if (blockIndex <= 6) return 'ember';        // M7, m7, 7, m7b5, mM7
  if (blockIndex <= 11) return 'violet';      // dim7, aug7, 6, m6, M7(9)
  if (blockIndex <= 17) return 'crimson';     // m7(9), 7(9,13), 7(b9,b13), 6(9), m6(9), 7(b9,13)
  return 'abyss';                              // 7(#9,b13), m7(b5)(11), dim(M7)
}

export function getBlockTheme(blockIndex: number): BlockThemeColors {
  const tier = indexToTier(blockIndex);
  return { tier, ...TIER_COLORS[tier] };
}

export function getBlockTint(blockIndex: number): { top: string; bottom: string } {
  const theme = getBlockTheme(blockIndex);
  return { top: theme.tintTop, bottom: theme.tintBottom };
}

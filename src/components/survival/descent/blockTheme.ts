/**
 * 魔王城降下マップ: ブロック別ビジュアルテーマ
 * ブロックインデックス (0..20) を 7 つの Tier に分類。
 * さらにブロック毎の hue-rotate / saturate / contrast フィルターを定義し、
 * 同じ石壁テクスチャでもブロック毎に全く違う雰囲気に見えるようにする。
 */

export type BlockTier =
  | 'moss'      // 青銀・苔生した城壁 (0-1)
  | 'stone'     // 中性石灰・素の石壁 (2-3)
  | 'ember'     // 赤銅・篝火の回廊 (4-6)
  | 'violet'   // 紫水晶・魔法の間 (7-9)
  | 'azure'    // 蒼氷・氷結した廊下 (10-12)
  | 'crimson'   // 深紅・血の祭壇 (13-16)
  | 'abyss';    // 黒金・玉座の間 (17-20)

export interface BlockThemeColors {
  tier: BlockTier;
  plateTop: string;
  plateBottom: string;
  plateBorder: string;
  plateText: string;
  plateClearedGlow: string;
  sealStroke: string;
  sealGlow: string;
  lanternCore: string;
  lanternOuter: string;
  tintTop: string;
  tintBottom: string;
  label: string;
}

/** 背景テクスチャ・踊り場・扉に掛ける CSS filter 値 */
export interface BlockFilter {
  /** background texture 用 */
  background: string;
  /** landing platform 用 */
  platform: string;
  /** door 用 */
  door: string;
  /** 階段コネクタの色相 (highlighted でない線用)  */
  connectorHueDeg: number;
}

const TIER_COLORS: Record<BlockTier, Omit<BlockThemeColors, 'tier'>> = {
  moss: {
    plateTop: 'rgba(48,78,78,0.96)',
    plateBottom: 'rgba(14,32,32,0.96)',
    plateBorder: 'rgba(140,220,200,0.6)',
    plateText: '#dff6ed',
    plateClearedGlow: 'rgba(150,240,200,0.7)',
    sealStroke: 'rgba(180,240,220,0.9)',
    sealGlow: 'rgba(100,200,170,0.75)',
    lanternCore: 'rgba(210,255,230,1)',
    lanternOuter: 'rgba(90,220,170,0.9)',
    tintTop: 'rgba(80,180,150,0.28)',
    tintBottom: 'rgba(30,90,80,0.32)',
    label: 'Mossgate',
  },
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
    tintTop: 'rgba(120,140,180,0.22)',
    tintBottom: 'rgba(80,96,140,0.26)',
    label: 'Stone Hall',
  },
  ember: {
    plateTop: 'rgba(130,80,50,0.96)',
    plateBottom: 'rgba(60,28,18,0.96)',
    plateBorder: 'rgba(230,160,90,0.7)',
    plateText: '#ffe2ae',
    plateClearedGlow: 'rgba(255,180,90,0.75)',
    sealStroke: 'rgba(255,196,120,0.92)',
    sealGlow: 'rgba(255,150,70,0.8)',
    lanternCore: 'rgba(255,220,140,1)',
    lanternOuter: 'rgba(255,140,60,0.9)',
    tintTop: 'rgba(200,120,60,0.3)',
    tintBottom: 'rgba(140,60,30,0.34)',
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
    lanternOuter: 'rgba(180,120,240,0.9)',
    tintTop: 'rgba(130,80,210,0.3)',
    tintBottom: 'rgba(70,30,140,0.34)',
    label: 'Violet Sanctum',
  },
  azure: {
    plateTop: 'rgba(40,90,130,0.96)',
    plateBottom: 'rgba(14,40,70,0.96)',
    plateBorder: 'rgba(130,200,240,0.65)',
    plateText: '#d9efff',
    plateClearedGlow: 'rgba(130,200,255,0.75)',
    sealStroke: 'rgba(180,220,255,0.95)',
    sealGlow: 'rgba(80,170,255,0.85)',
    lanternCore: 'rgba(210,240,255,1)',
    lanternOuter: 'rgba(110,180,255,0.92)',
    tintTop: 'rgba(80,160,230,0.28)',
    tintBottom: 'rgba(20,60,120,0.34)',
    label: 'Azure Glacier',
  },
  crimson: {
    plateTop: 'rgba(150,40,60,0.96)',
    plateBottom: 'rgba(60,10,22,0.96)',
    plateBorder: 'rgba(255,120,140,0.7)',
    plateText: '#ffd6dc',
    plateClearedGlow: 'rgba(255,110,130,0.8)',
    sealStroke: 'rgba(255,160,170,0.95)',
    sealGlow: 'rgba(230,60,90,0.9)',
    lanternCore: 'rgba(255,210,210,1)',
    lanternOuter: 'rgba(230,70,90,0.95)',
    tintTop: 'rgba(210,60,80,0.32)',
    tintBottom: 'rgba(110,10,20,0.38)',
    label: 'Crimson Altar',
  },
  abyss: {
    plateTop: 'rgba(24,22,40,0.98)',
    plateBottom: 'rgba(4,2,12,0.98)',
    plateBorder: 'rgba(255,196,120,0.9)',
    plateText: '#fff0c2',
    plateClearedGlow: 'rgba(255,210,120,0.98)',
    sealStroke: 'rgba(255,220,140,0.98)',
    sealGlow: 'rgba(255,170,60,0.98)',
    lanternCore: 'rgba(255,240,190,1)',
    lanternOuter: 'rgba(255,160,40,0.98)',
    tintTop: 'rgba(60,30,80,0.38)',
    tintBottom: 'rgba(10,4,20,0.48)',
    label: 'Throne of Ruin',
  },
};

/**
 * ブロックインデックス (0..20) → Tier
 * 21 ブロックに 7 Tier を割り当て。3 ブロック毎に段階変化。
 */
function indexToTier(blockIndex: number): BlockTier {
  if (blockIndex <= 1) return 'moss';        // 0-1
  if (blockIndex <= 3) return 'stone';       // 2-3
  if (blockIndex <= 6) return 'ember';       // 4-6
  if (blockIndex <= 9) return 'violet';      // 7-9
  if (blockIndex <= 12) return 'azure';      // 10-12
  if (blockIndex <= 16) return 'crimson';    // 13-16
  return 'abyss';                             // 17-20
}

/**
 * ブロック毎の背景フィルター。
 * 同じ石壁テクスチャに対して hue-rotate / saturate / brightness / contrast を細かく変えることで、
 * 21 ブロック分の見た目をすべて異なる雰囲気にする。
 */
const BLOCK_FILTERS: BlockFilter[] = [
  // 0: major  (moss) 青緑 苔
  { background: 'hue-rotate(90deg) saturate(1.3) brightness(0.85) contrast(1.05)', platform: 'hue-rotate(80deg) saturate(1.2) brightness(0.95)', door: 'hue-rotate(80deg) saturate(1.2)', connectorHueDeg: 130 },
  // 1: minor  (moss) 深緑
  { background: 'hue-rotate(110deg) saturate(1.1) brightness(0.75) contrast(1.1)', platform: 'hue-rotate(100deg) saturate(1.1) brightness(0.9)', door: 'hue-rotate(100deg) saturate(1.05)', connectorHueDeg: 145 },
  // 2: M7  (stone) 銀灰
  { background: 'hue-rotate(-10deg) saturate(0.6) brightness(1.0) contrast(1.05)', platform: 'hue-rotate(-8deg) saturate(0.7) brightness(1.05)', door: 'saturate(0.8)', connectorHueDeg: 0 },
  // 3: m7 (stone) やや寒色寄り石灰
  { background: 'hue-rotate(20deg) saturate(0.55) brightness(0.92) contrast(1.1)', platform: 'hue-rotate(18deg) saturate(0.7) brightness(0.98)', door: 'hue-rotate(10deg) saturate(0.8)', connectorHueDeg: 20 },
  // 4: 7 (ember) 赤銅
  { background: 'hue-rotate(-50deg) saturate(1.2) brightness(0.85) contrast(1.1)', platform: 'hue-rotate(-40deg) saturate(1.2) brightness(0.95)', door: 'hue-rotate(-30deg) saturate(1.15)', connectorHueDeg: -30 },
  // 5: m7b5 (ember) 焦げ茶
  { background: 'hue-rotate(-35deg) saturate(1.0) brightness(0.7) contrast(1.15)', platform: 'hue-rotate(-30deg) saturate(1.05) brightness(0.85)', door: 'hue-rotate(-20deg) saturate(1.0)', connectorHueDeg: -20 },
  // 6: mM7 (ember) 濃オレンジ
  { background: 'hue-rotate(-60deg) saturate(1.3) brightness(0.82) contrast(1.1)', platform: 'hue-rotate(-50deg) saturate(1.25) brightness(0.92)', door: 'hue-rotate(-40deg) saturate(1.2)', connectorHueDeg: -40 },
  // 7: dim7 (violet) 暗紫
  { background: 'hue-rotate(-110deg) saturate(1.3) brightness(0.7) contrast(1.2)', platform: 'hue-rotate(-100deg) saturate(1.2) brightness(0.85)', door: 'hue-rotate(-90deg) saturate(1.15)', connectorHueDeg: -90 },
  // 8: aug7 (violet) 明紫
  { background: 'hue-rotate(-130deg) saturate(1.5) brightness(0.8) contrast(1.15)', platform: 'hue-rotate(-120deg) saturate(1.4) brightness(0.9)', door: 'hue-rotate(-110deg) saturate(1.3)', connectorHueDeg: -110 },
  // 9: 6 (violet) マゼンタ
  { background: 'hue-rotate(-150deg) saturate(1.3) brightness(0.78) contrast(1.2)', platform: 'hue-rotate(-140deg) saturate(1.3) brightness(0.9)', door: 'hue-rotate(-130deg) saturate(1.2)', connectorHueDeg: -130 },
  // 10: m6 (azure) 青氷
  { background: 'hue-rotate(40deg) saturate(1.1) brightness(0.95) contrast(1.15)', platform: 'hue-rotate(40deg) saturate(1.1) brightness(1.05)', door: 'hue-rotate(40deg) saturate(1.1)', connectorHueDeg: 60 },
  // 11: M7(9) (azure) 白氷
  { background: 'hue-rotate(30deg) saturate(0.9) brightness(1.05) contrast(1.15)', platform: 'hue-rotate(30deg) saturate(0.9) brightness(1.1)', door: 'hue-rotate(30deg) saturate(0.9) brightness(1.05)', connectorHueDeg: 50 },
  // 12: m7(9) (azure) 深青
  { background: 'hue-rotate(55deg) saturate(1.3) brightness(0.75) contrast(1.2)', platform: 'hue-rotate(55deg) saturate(1.25) brightness(0.88)', door: 'hue-rotate(55deg) saturate(1.2)', connectorHueDeg: 70 },
  // 13: 7(9,13) (crimson) 血色
  { background: 'hue-rotate(-70deg) saturate(1.6) brightness(0.72) contrast(1.2)', platform: 'hue-rotate(-60deg) saturate(1.5) brightness(0.85)', door: 'hue-rotate(-50deg) saturate(1.4)', connectorHueDeg: -50 },
  // 14: 7(b9,b13) (crimson) 深紅
  { background: 'hue-rotate(-80deg) saturate(1.7) brightness(0.68) contrast(1.25)', platform: 'hue-rotate(-70deg) saturate(1.55) brightness(0.82)', door: 'hue-rotate(-60deg) saturate(1.45)', connectorHueDeg: -60 },
  // 15: 6(9) (crimson) 薔薇
  { background: 'hue-rotate(-90deg) saturate(1.5) brightness(0.75) contrast(1.2)', platform: 'hue-rotate(-80deg) saturate(1.4) brightness(0.88)', door: 'hue-rotate(-70deg) saturate(1.35)', connectorHueDeg: -70 },
  // 16: m6(9) (crimson) 黒赤
  { background: 'hue-rotate(-100deg) saturate(1.4) brightness(0.6) contrast(1.3)', platform: 'hue-rotate(-90deg) saturate(1.35) brightness(0.78)', door: 'hue-rotate(-80deg) saturate(1.3)', connectorHueDeg: -80 },
  // 17: 7(b9,13) (abyss) 黒金
  { background: 'hue-rotate(-40deg) saturate(0.8) brightness(0.55) contrast(1.35)', platform: 'hue-rotate(-30deg) saturate(1.0) brightness(0.7)', door: 'hue-rotate(-30deg) saturate(1.1) brightness(0.9)', connectorHueDeg: -20 },
  // 18: 7(#9,b13) (abyss) より深黒
  { background: 'hue-rotate(-20deg) saturate(0.6) brightness(0.5) contrast(1.4)', platform: 'hue-rotate(-20deg) saturate(0.9) brightness(0.65)', door: 'hue-rotate(-20deg) saturate(1.05) brightness(0.85)', connectorHueDeg: -10 },
  // 19: m7(b5)(11) (abyss) 黄金の闇
  { background: 'hue-rotate(-30deg) saturate(1.0) brightness(0.48) contrast(1.4)', platform: 'hue-rotate(-25deg) saturate(1.1) brightness(0.7)', door: 'hue-rotate(-25deg) saturate(1.2) brightness(0.95)', connectorHueDeg: -15 },
  // 20: dim(M7) (abyss) 最深部・黒紫金
  { background: 'hue-rotate(-160deg) saturate(1.0) brightness(0.42) contrast(1.45)', platform: 'hue-rotate(-150deg) saturate(1.05) brightness(0.65)', door: 'hue-rotate(-140deg) saturate(1.2) brightness(0.95)', connectorHueDeg: -150 },
];

export function getBlockTheme(blockIndex: number): BlockThemeColors {
  const tier = indexToTier(blockIndex);
  return { tier, ...TIER_COLORS[tier] };
}

export function getBlockTint(blockIndex: number): { top: string; bottom: string } {
  const theme = getBlockTheme(blockIndex);
  return { top: theme.tintTop, bottom: theme.tintBottom };
}

export function getBlockFilter(blockIndex: number): BlockFilter {
  const clamped = Math.max(0, Math.min(BLOCK_FILTERS.length - 1, blockIndex));
  return BLOCK_FILTERS[clamped];
}

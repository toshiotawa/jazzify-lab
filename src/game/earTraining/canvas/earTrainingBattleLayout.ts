import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';

export const PIANO_OVERLAY_HEIGHT = 88;
export const HUD_HEIGHT = 150;
export const PHRASE_INTRO_FADE_MS = 2600;
export const PHRASE_INTRO_EMPHASIS_FADE_MS = 3900;
export const FLOOR_CLEARANCE_FROM_PIANO = 100;
export const CHARACTER_DISPLAY_SIZE = 116;
export const CHARACTER_SHADOW_WIDTH = 104;
export const CHARACTER_SHADOW_HEIGHT = 22;
export const PLAYER_QUOTE_GAP_BELOW_SPRITE_PX = 12 + 18;
export const PLAYER_QUOTE_PAD_X = 10;
export const PLAYER_QUOTE_PAD_Y = 6;
export const PLAYER_QUOTE_CORNER_RADIUS = 8;
export const PLAYER_QUOTE_TAIL_HEIGHT = 10;
export const PLAYER_QUOTE_FONT_PX = 16;
export const PLAYER_QUOTE_CUE_GAP_PX = 8;

export const EFFECT_ASSET_PATH = '/ear-training/tutorial-earcopy-test/';
export const FUKIDASHI_ASSET_URL = `${EFFECT_ASSET_PATH}fukidashi.webp`;
export const MAGIC_CIRCLE_ASSET_URL = '/data/27304123.webp';
export const ENEMY_ATTACK_HAMMER_ASSET_URL = '/hammer.svg';

export interface EarTrainingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterAnchors {
  x: number;
  footY: number;
  bodyY: number;
  headY: number;
  castY: number;
  resultTextY: number;
}

export interface BattleAnchors {
  player: CharacterAnchors;
  enemy: CharacterAnchors;
}

export const clampPercent = (value: number, max: number): number => {
  if (max <= 0) return 0;
  return Math.min(Math.max(value / max, 0), 1);
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const getPianoHeight = (): number => PIANO_OVERLAY_HEIGHT;

export const getFloorY = (height: number): number =>
  Math.max(260, height - getPianoHeight() - FLOOR_CLEARANCE_FROM_PIANO);

export const colorForHp = (percent: number, high: number, middle: number, low: number): string => {
  if (percent > 0.5) return `#${high.toString(16).padStart(6, '0')}`;
  if (percent > 0.25) return `#${middle.toString(16).padStart(6, '0')}`;
  return `#${low.toString(16).padStart(6, '0')}`;
};

export const hashText = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return `ear-${Math.abs(hash)}`;
};

export const getBattleAnchors = (
  width: number,
  height: number,
  playerX: number,
  enemyX: number,
): BattleAnchors => {
  const floorY = getFloorY(height);
  const createAnchors = (x: number): CharacterAnchors => ({
    x,
    footY: floorY,
    bodyY: floorY - CHARACTER_DISPLAY_SIZE * 0.52,
    headY: floorY - CHARACTER_DISPLAY_SIZE * 0.96,
    castY: floorY - CHARACTER_DISPLAY_SIZE * 0.42,
    resultTextY: floorY - CHARACTER_DISPLAY_SIZE * 1.12,
  });
  return {
    player: createAnchors(playerX),
    enemy: createAnchors(enemyX),
  };
};

export const getHpBarLayout = (width: number): { barWidth: number; leftX: number; rightX: number } => {
  const barWidth = Math.max(118, width * 0.29);
  return {
    barWidth,
    leftX: 18,
    rightX: width - barWidth - 18,
  };
};

export interface PhraseSlotViewport {
  slotSize: number;
  gap: number;
  startX: number;
  y: number;
  firstVisibleIndex: number;
  visibleCount: number;
}

export const getPhraseSlotViewport = (
  width: number,
  height: number,
  snapshot: Pick<EarTrainingBattleSnapshot, 'phraseSlots' | 'currentNoteIndex'>,
): PhraseSlotViewport => {
  const slots = snapshot.phraseSlots.length > 0 ? snapshot.phraseSlots : ['_'];
  const slotSize = clamp((width - 48) / Math.min(Math.max(8, slots.length), 11), 22, 36);
  const gap = 5;
  const availableWidth = Math.max(slotSize, width - 40);
  const visibleCount = Math.max(1, Math.min(slots.length, Math.floor((availableWidth + gap) / (slotSize + gap))));
  const focusedIndex = clamp(snapshot.currentNoteIndex, 0, Math.max(0, slots.length - 1));
  const firstVisibleIndex = clamp(
    focusedIndex - Math.floor(visibleCount / 2),
    0,
    Math.max(0, slots.length - visibleCount),
  );
  const visibleSlotsCount = Math.min(visibleCount, slots.length - firstVisibleIndex);
  const totalWidth = visibleSlotsCount * slotSize + (visibleSlotsCount - 1) * gap;
  const startX = Math.max(16, (width - totalWidth) / 2);
  const y = height - getPianoHeight() - slotSize - 18;
  return { slotSize, gap, startX, y, firstVisibleIndex, visibleCount: visibleSlotsCount };
};

export const getChordHudLayout = (
  width: number,
  snapshot: Pick<EarTrainingBattleSnapshot, 'chords'>,
): { itemWidth: number; startX: number; y: number; firstVisibleIndex: number; visibleCount: number } => {
  const itemWidth = 82;
  const leftMargin = 16;
  const rightMargin = 16;
  const availableWidth = Math.max(itemWidth, width - leftMargin - rightMargin);
  const visibleCount = Math.max(1, Math.min(snapshot.chords.length, Math.floor(availableWidth / itemWidth)));
  const activeIndex = snapshot.chords.findIndex(chord => chord.active);
  const firstVisibleIndex = clamp(
    activeIndex >= 0 ? activeIndex - visibleCount + 1 : 0,
    0,
    Math.max(0, snapshot.chords.length - visibleCount),
  );
  const chordsCount = Math.min(visibleCount, snapshot.chords.length - firstVisibleIndex);
  const startX = Math.max(leftMargin, leftMargin + (availableWidth - itemWidth * chordsCount) / 2);
  return { itemWidth, startX, y: 104, firstVisibleIndex, visibleCount: chordsCount };
};

export const getEnemyAttackGaugePosition = (width: number, height: number): { x: number; y: number } => {
  const floorY = getFloorY(height);
  return {
    x: width * 0.77,
    y: Math.max(HUD_HEIGHT + 12, floorY - 166),
  };
};

export const getDemoBubblePosition = (width: number, height: number): { x: number; y: number } => {
  const floorY = getFloorY(height);
  return {
    x: clamp(width * 0.77 + 62, 56, Math.max(320, width) - 56),
    y: Math.max(HUD_HEIGHT + 46, floorY - CHARACTER_DISPLAY_SIZE - 38),
  };
};

export const getPhraseIntroY = (height: number): number =>
  Math.max(HUD_HEIGHT + 20, Math.round(height * 0.3));

export const getCountInOverlayLayout = (width: number, height: number): { x: number; y: number; radius: number } => {
  const radius = clamp(Math.round(Math.min(width, height) * 0.08), 44, 70);
  return { x: width / 2, y: Math.round(height * 0.42), radius };
};

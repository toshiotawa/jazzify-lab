export type BattleCharacterSide = 'player' | 'enemy';

export interface BattleCharacterMotionRange {
  homeX: number;
  minX: number;
  maxX: number;
  speed: number;
}

const PLAYER_HOME_X_RATIO = 0.23;
const ENEMY_HOME_X_RATIO = 0.77;
const WALK_RANGE_X_RATIO = 0.052;
const MIN_WALK_RANGE_X = 28;
const MAX_WALK_RANGE_X = 84;
const MIN_DISTANCE_X = 220;
const MIN_DISTANCE_WIDTH_RATIO = 0.28;
const MIN_DISTANCE_LOWER_BOUND = 96;
const PLAYER_SPEED = 34;
const ENEMY_SPEED = 31;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const getBattleCharacterMinDistance = (stageWidth: number): number => {
  const responsiveDistance = stageWidth * MIN_DISTANCE_WIDTH_RATIO;
  return Math.min(MIN_DISTANCE_X, Math.max(MIN_DISTANCE_LOWER_BOUND, responsiveDistance));
};

export const getBattleCharacterMotionRange = (
  side: BattleCharacterSide,
  stageWidth: number,
): BattleCharacterMotionRange => {
  const homeX = stageWidth * (side === 'player' ? PLAYER_HOME_X_RATIO : ENEMY_HOME_X_RATIO);
  const halfRange = clamp(stageWidth * WALK_RANGE_X_RATIO, MIN_WALK_RANGE_X, MAX_WALK_RANGE_X);
  const centerX = stageWidth * 0.5;
  const centerGap = getBattleCharacterMinDistance(stageWidth) * 0.5;
  const minX = side === 'player' ? homeX - halfRange : Math.max(homeX - halfRange, centerX + centerGap);
  const maxX = side === 'player' ? Math.min(homeX + halfRange, centerX - centerGap) : homeX + halfRange;

  return {
    homeX: clamp(homeX, minX, maxX),
    minX,
    maxX,
    speed: side === 'player' ? PLAYER_SPEED : ENEMY_SPEED,
  };
};

export const clampBattleCharacterX = (x: number, range: BattleCharacterMotionRange): number =>
  clamp(x, range.minX, range.maxX);

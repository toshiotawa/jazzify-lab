export type CodeRunTileKind = 'ground' | 'brick' | 'platform' | 'block';

export type CodeRunEditorTool =
  | CodeRunTileKind
  | 'spike'
  | 'pit'
  | 'enemy'
  | 'spawn'
  | 'goal'
  | 'eraser';

export interface CodeRunGridPoint {
  c: number;
  r: number;
}

export interface CodeRunPitRange {
  c0: number;
  c1: number;
}

export interface CodeRunEnemyPlacement {
  c: number;
  r: number;
  id: string;
  minX?: number;
  maxX?: number;
  speed?: number;
}

export interface CodeRunMapLayoutJson {
  layoutVersion: number;
  viewWidth: number;
  viewHeight: number;
  tileSize: number;
  worldTilesWide: number;
  worldTilesHigh: number;
  worldHeight: number;
  groundRow: number;
  manualGround?: boolean;
  spawn: CodeRunGridPoint;
  goal?: CodeRunGridPoint;
  goalColumn?: number;
  goalOffsetX: number;
  pits: CodeRunPitRange[];
  solids: Record<string, unknown>[];
  spikes: Record<string, unknown>[];
  enemies: Record<string, unknown>[];
}

export interface CodeRunEditorSettings {
  worldTilesWide: number;
  gridRows: number;
  tileSize: number;
  groundRow: number;
  manualGround: boolean;
  viewWidth: number;
  viewHeight: number;
  worldHeight: number;
  goalOffsetX: number;
  useGoalColumn: boolean;
  goalColumn: number;
}

export const CODE_RUN_TILE_KINDS: readonly CodeRunTileKind[] = ['ground', 'brick', 'platform', 'block'];
export const DEFAULT_TILE_SIZE = 48;
export const DISPLAY_TILE_BASE = 28;
export const ENEMY_W = 38;
export const ENEMY_H = 34;

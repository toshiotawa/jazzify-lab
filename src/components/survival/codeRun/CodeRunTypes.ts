export type CodeRunTileKind = 'ground' | 'brick' | 'platform' | 'block';

export interface CodeRunRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CodeRunTileRect extends CodeRunRect {
  kind: CodeRunTileKind;
}

export interface CodeRunEnemySpec extends CodeRunRect {
  id: string;
  speed?: number;
  minX?: number;
  maxX?: number;
}

export interface CodeRunAssets {
  background: string;
  player: readonly string[];
  slime: readonly string[];
  tiles: {
    ground: string;
    brick: string;
    platform: string;
    block: string;
    spike: string;
    flag: string;
  };
}

export type CodeRunAssetsOverride = {
  background?: string;
  player?: readonly string[];
  slime?: readonly string[];
  tiles?: Partial<CodeRunAssets['tiles']>;
};

export interface CodeRunMapSpec {
  id: string;
  name: string;
  viewWidth: number;
  viewHeight: number;
  worldWidth: number;
  worldHeight: number;
  tileSize: number;
  groundRow: number;
  spawn: { x: number; y: number };
  goalX: number;
  timeLimitSec: number;
  solids: readonly CodeRunTileRect[];
  spikes: readonly CodeRunRect[];
  enemies: readonly CodeRunEnemySpec[];
  assets: CodeRunAssets;
}

export interface CodeRunPlayer extends CodeRunRect {
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  jumpCount: number;
  chordLockedUntilLanding: boolean;
  respawnGraceSec: number;
  runPhase: number;
}

export interface CodeRunEnemy extends CodeRunRect {
  id: string;
  vx: number;
  alive: boolean;
  anim: number;
  minX: number;
  maxX: number;
}

export type CodeRunStatus = 'playing' | 'clear' | 'failed';

export interface CodeRunState {
  map: CodeRunMapSpec;
  player: CodeRunPlayer;
  enemies: readonly CodeRunEnemy[];
  elapsedSec: number;
  cameraX: number;
  status: CodeRunStatus;
}

export interface CodeRunInputState {
  left: boolean;
  right: boolean;
  analogX: number;
}

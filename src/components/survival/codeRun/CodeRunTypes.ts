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
  playerHurt: string;
  slime: readonly string[];
  tiles: {
    ground: string;
    /** 歩行面（groundRow）用。未指定時は ground を使用 */
    groundTop?: string;
    /** 床左端（隣に床タイルがない列） */
    groundTopLeft?: string;
    /** 床右端 */
    groundTopRight?: string;
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
  playerHurt?: string;
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
  goalY?: number;
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
  hp: number;
  maxHp: number;
  invulFrames: number;
  hurtFrames: number;
  runPhase: number;
  coyoteFrames: number;
  jumpBufferFrames: number;
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
  lives: number;
  elapsedSec: number;
  cameraX: number;
  cameraY: number;
  status: CodeRunStatus;
}

export interface CodeRunInputState {
  left: boolean;
  right: boolean;
  analogX: number;
}

import type { CodeRunEnemyPlacement, CodeRunGridPoint, CodeRunTileKind } from './codeRunMapEditorTypes';
import { ENEMY_H, ENEMY_W } from './codeRunMapEditorTypes';

const TOOL_COLORS: Record<string, string> = {
  ground: '#6b5344',
  brick: '#7a8499',
  platform: '#c9a66b',
  block: '#d4783a',
  spike: '#e74c3c',
  enemy: '#8fd14f',
};

const isTileKind = (kind: string): kind is CodeRunTileKind => (
  kind === 'ground' || kind === 'brick' || kind === 'platform' || kind === 'block'
);

const drawTile = (
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  kind: string,
  ts: number,
): void => {
  const x = c * ts;
  const y = r * ts;
  const pad = Math.max(1, Math.floor(ts * 0.08));
  if (kind === 'platform') {
    ctx.fillStyle = TOOL_COLORS.platform;
    ctx.fillRect(x + pad, y + ts * 0.55, ts - pad * 2, ts * 0.2);
    ctx.strokeStyle = '#8a6d3b';
    ctx.strokeRect(x + pad, y + ts * 0.55, ts - pad * 2, ts * 0.2);
    return;
  }
  if (kind === 'spike') {
    ctx.fillStyle = TOOL_COLORS.spike;
    ctx.beginPath();
    ctx.moveTo(x + ts * 0.5, y + ts * 0.85);
    ctx.lineTo(x + ts * 0.15, y + ts * 0.35);
    ctx.lineTo(x + ts * 0.85, y + ts * 0.35);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (!isTileKind(kind)) return;
  ctx.fillStyle = TOOL_COLORS[kind] ?? '#888';
  ctx.fillRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2);
  if (kind === 'block') {
    ctx.strokeStyle = '#8a4a20';
    ctx.strokeRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2);
  }
};

const drawMarker = (
  ctx: CanvasRenderingContext2D,
  point: CodeRunGridPoint,
  label: string,
  color: string,
  ts: number,
): void => {
  const x = point.c * ts;
  const y = point.r * ts;
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
  ctx.fillStyle = '#111';
  ctx.font = `bold ${Math.floor(ts * 0.45)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + ts / 2, y + ts / 2);
};

const drawEnemy = (
  ctx: CanvasRenderingContext2D,
  enemy: CodeRunEnemyPlacement,
  selected: boolean,
  groundRow: number,
  tileSize: number,
  ts: number,
): void => {
  const r = enemy.r;
  const x = enemy.c * ts + (ts - (ENEMY_W / tileSize) * ts) / 2;
  const y = r * ts - (ENEMY_H / tileSize) * ts;
  const w = (ENEMY_W / tileSize) * ts;
  const h = (ENEMY_H / tileSize) * ts;
  ctx.fillStyle = selected ? '#b8ff7a' : TOOL_COLORS.enemy;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2d5016';
  ctx.stroke();
};

export interface CodeRunEditorDrawParams {
  cells: ReadonlyMap<string, string>;
  pitColumns: ReadonlySet<number>;
  enemies: readonly CodeRunEnemyPlacement[];
  spawn: CodeRunGridPoint | null;
  goal: CodeRunGridPoint | null;
  settings: {
    worldTilesWide: number;
    gridRows: number;
    groundRow: number;
    manualGround: boolean;
    useGoalColumn: boolean;
    goalColumn: number;
    tileSize: number;
  };
  displayTile: number;
  selectedEnemyIndex: number;
}

export const drawCodeRunMapCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: CodeRunEditorDrawParams,
): void => {
  const {
    cells,
    pitColumns,
    enemies,
    spawn,
    goal,
    settings,
    displayTile: ts,
    selectedEnemyIndex,
  } = params;

  ctx.clearRect(0, 0, width, height);

  for (let r = 0; r < settings.gridRows; r += 1) {
    for (let c = 0; c < settings.worldTilesWide; c += 1) {
      const x = c * ts;
      const y = r * ts;
      ctx.fillStyle = (c + r) % 2 === 0 ? '#1e2430' : '#1a1f28';
      ctx.fillRect(x, y, ts, ts);
      if (pitColumns.has(c) && r >= settings.groundRow) {
        ctx.fillStyle = 'rgba(80, 40, 120, 0.35)';
        ctx.fillRect(x, y, ts, ts);
      }
    }
  }

  for (const [key, kind] of cells) {
    if (!isTileKind(kind) && kind !== 'spike') continue;
    const [cs, rs] = key.split(',');
    const c = Number(cs);
    const row = Number(rs);
    if (!Number.isFinite(c) || !Number.isFinite(row)) continue;
    drawTile(ctx, c, row, kind, ts);
  }

  if (!settings.manualGround) {
    ctx.strokeStyle = 'rgba(90, 180, 255, 0.5)';
    ctx.setLineDash([4, 4]);
    const y = settings.groundRow * ts;
    ctx.strokeRect(0, y, width, ts * 2);
    ctx.setLineDash([]);
  }

  enemies.forEach((enemy, i) => {
    drawEnemy(ctx, enemy, i === selectedEnemyIndex, settings.groundRow, settings.tileSize, ts);
  });

  if (spawn) drawMarker(ctx, spawn, 'S', '#4da3ff', ts);
  if (goal && !settings.useGoalColumn) drawMarker(ctx, goal, 'G', '#ffd54f', ts);
  if (settings.useGoalColumn && settings.goalColumn >= 0 && settings.goalColumn < settings.worldTilesWide) {
    drawMarker(ctx, { c: settings.goalColumn, r: settings.groundRow }, 'G', '#ffd54f', ts);
  }
};

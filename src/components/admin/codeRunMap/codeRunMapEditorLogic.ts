import type {
  CodeRunEditorSettings,
  CodeRunEnemyPlacement,
  CodeRunGridPoint,
  CodeRunMapLayoutJson,
  CodeRunPitRange,
  CodeRunTileKind,
} from './codeRunMapEditorTypes';
import { CODE_RUN_TILE_KINDS, DEFAULT_TILE_SIZE, ENEMY_H, ENEMY_W } from './codeRunMapEditorTypes';

export const cellKey = (c: number, r: number): string => `${c},${r}`;

/** ゲーム側の worldHeight（px）= worldTilesHigh × tileSize */
export const computeWorldHeightFromGrid = (gridRows: number, tileSize: number): number => {
  const rows = Math.floor(gridRows);
  const ts = Math.floor(tileSize);
  return rows > 0 && ts > 0 ? rows * ts : 0;
};

const withDerivedWorldHeight = (settings: CodeRunEditorSettings): CodeRunEditorSettings => ({
  ...settings,
  worldHeight: computeWorldHeightFromGrid(settings.gridRows, settings.tileSize),
});

export const patchEditorSettings = (
  current: CodeRunEditorSettings,
  patch: Partial<CodeRunEditorSettings>,
): CodeRunEditorSettings => {
  const merged = { ...current, ...patch };
  const gridRows = Math.min(80, Math.max(4, Math.floor(merged.gridRows) || 4));
  const tileSize = Math.max(16, Math.floor(merged.tileSize) || DEFAULT_TILE_SIZE);
  const groundRow = Math.min(gridRows - 1, Math.max(0, Math.floor(merged.groundRow) || 0));
  return withDerivedWorldHeight({
    ...merged,
    gridRows,
    tileSize,
    groundRow,
  });
};

/** 穴列の追加／削除。erase または既存列の再クリックで削除する。 */
export const applyPitColumn = (
  pitColumns: Set<number>,
  c: number,
  erase: boolean,
): void => {
  if (erase || pitColumns.has(c)) pitColumns.delete(c);
  else pitColumns.add(c);
};

export const mergePits = (pitColumns: ReadonlySet<number>): CodeRunPitRange[] => {
  const cols = [...pitColumns].sort((a, b) => a - b);
  const pits: CodeRunPitRange[] = [];
  let start: number | null = null;
  let prev: number | null = null;
  for (const c of cols) {
    if (start === null) {
      start = c;
      prev = c;
      continue;
    }
    if (c === (prev ?? c) + 1) {
      prev = c;
      continue;
    }
    pits.push({ c0: start, c1: prev ?? start });
    start = c;
    prev = c;
  }
  if (start !== null && prev !== null) pits.push({ c0: start, c1: prev });
  return pits;
};

const isTileKind = (value: string): value is CodeRunTileKind => (
  CODE_RUN_TILE_KINDS.includes(value as CodeRunTileKind)
);

/** トゲを載せられる固体タイル（床・足場・クレート等） */
export const isSpikeAnchorSolid = (kind: string | undefined): kind is CodeRunTileKind => (
  kind !== undefined && isTileKind(kind)
);

/**
 * クリック行を、同セルまたは真下・斜め下の固体タイル上面行へスナップする。
 * 足場・クレートの上／直上をクリックしたときも正しい row で配置する。
 */
export const resolveSpikeRow = (
  cells: ReadonlyMap<string, string>,
  c: number,
  r: number,
  gridRows: number,
): number => {
  const kindAt = (col: number, row: number): string | undefined => {
    if (row < 0 || row >= gridRows || col < 0) return undefined;
    return cells.get(cellKey(col, row));
  };

  if (isSpikeAnchorSolid(kindAt(c, r))) return r;

  const below = kindAt(c, r + 1);
  if (isSpikeAnchorSolid(below)) return r + 1;

  const above = kindAt(c, r - 1);
  if (isSpikeAnchorSolid(above)) return r - 1;

  const rowBelow = r + 1;
  if (rowBelow < gridRows) {
    if (isSpikeAnchorSolid(kindAt(c - 1, rowBelow))) return rowBelow;
    if (isSpikeAnchorSolid(kindAt(c + 1, rowBelow))) return rowBelow;
  }

  return r;
};

export const spikeRowsToClear = (
  cells: ReadonlyMap<string, string>,
  c: number,
  r: number,
  gridRows: number,
): number[] => {
  const rows = new Set<number>([r, resolveSpikeRow(cells, c, r, gridRows)]);
  return [...rows];
};

export const exportSolids = (
  cells: ReadonlyMap<string, string>,
  gridRows: number,
  worldTilesWide: number,
): Record<string, unknown>[] => {
  const solids: Record<string, unknown>[] = [];
  const getCell = (c: number, r: number): string | undefined => cells.get(cellKey(c, r));

  for (const kind of CODE_RUN_TILE_KINDS) {
    for (let r = 0; r < gridRows; r += 1) {
      let runStart: number | null = null;
      for (let c = 0; c <= worldTilesWide; c += 1) {
        const cell = c < worldTilesWide ? getCell(c, r) : null;
        if (cell === kind) {
          if (runStart === null) runStart = c;
        } else if (runStart !== null) {
          const c0 = runStart;
          const c1 = c - 1;
          if (c0 === c1) solids.push({ kind, c: c0, r });
          else solids.push({ kind, row: r, c0, c1 });
          runStart = null;
        }
      }
    }
  }
  return solids;
};

export const exportSpikes = (spikeCells: ReadonlySet<string>): Record<string, unknown>[] => {
  const spikes: Record<string, unknown>[] = [];
  for (const key of spikeCells) {
    const [cs, rs] = key.split(',');
    const c = Number(cs);
    const r = Number(rs);
    if (!Number.isFinite(c) || !Number.isFinite(r)) continue;
    spikes.push({ c, row: r });
  }
  return spikes.sort((a, b) => {
    const rowA = typeof a.row === 'number' ? a.row : 0;
    const rowB = typeof b.row === 'number' ? b.row : 0;
    if (rowA !== rowB) return rowA - rowB;
    const colA = typeof a.c === 'number' ? a.c : 0;
    const colB = typeof b.c === 'number' ? b.c : 0;
    return colA - colB;
  });
};

export const exportEnemies = (
  enemies: readonly CodeRunEnemyPlacement[],
  groundRow: number,
): Record<string, unknown>[] => enemies.map((e) => {
  const row: Record<string, unknown> = { c: e.c };
  if (e.r !== groundRow) row.r = e.r;
  if (e.id) row.id = e.id;
  if (e.speed !== undefined && e.speed !== 1.25) row.speed = e.speed;
  return row;
});

export const findEnemyIndexAt = (
  enemies: readonly CodeRunEnemyPlacement[],
  c: number,
  r: number,
): number => enemies.findIndex((e) => e.c === c && e.r === r);

export const buildMapLayoutJson = (
  cells: ReadonlyMap<string, string>,
  spikeCells: ReadonlySet<string>,
  pitColumns: ReadonlySet<number>,
  enemies: readonly CodeRunEnemyPlacement[],
  spawn: CodeRunGridPoint | null,
  goal: CodeRunGridPoint | null,
  settings: CodeRunEditorSettings,
): CodeRunMapLayoutJson => {
  const layout: CodeRunMapLayoutJson = {
    layoutVersion: 1,
    viewWidth: settings.viewWidth,
    viewHeight: settings.viewHeight,
    tileSize: settings.tileSize,
    worldTilesWide: settings.worldTilesWide,
    worldTilesHigh: settings.gridRows,
    worldHeight: computeWorldHeightFromGrid(settings.gridRows, settings.tileSize),
    groundRow: settings.groundRow,
    spawn: spawn ?? { c: 2, r: settings.groundRow },
    pits: settings.manualGround ? [] : mergePits(pitColumns),
    solids: exportSolids(cells, settings.gridRows, settings.worldTilesWide),
    spikes: exportSpikes(spikeCells),
    enemies: exportEnemies(enemies, settings.groundRow),
    goalOffsetX: settings.goalOffsetX,
  };
  if (settings.manualGround) layout.manualGround = true;
  if (settings.useGoalColumn) layout.goalColumn = settings.goalColumn;
  else if (goal) layout.goal = { c: goal.c, r: goal.r };
  return layout;
};

const positiveInt = (v: unknown, fallback: number): number => (
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback
);

const nonNegInt = (v: unknown, fallback: number): number => (
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback
);

const nonNegNumber = (v: unknown, fallback: number): number => (
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback
);

export interface ImportedMapState {
  settings: CodeRunEditorSettings;
  cells: Map<string, string>;
  spikeCells: Set<string>;
  pitColumns: Set<number>;
  enemies: CodeRunEnemyPlacement[];
  spawn: CodeRunGridPoint | null;
  goal: CodeRunGridPoint | null;
}

const applySolidPlacement = (cells: Map<string, string>, s: Record<string, unknown>): void => {
  const kind = s.kind;
  if (typeof kind !== 'string' || !isTileKind(kind)) return;
  if (typeof s.c === 'number' && typeof s.r === 'number') {
    cells.set(cellKey(s.c, s.r), kind);
    return;
  }
  if (typeof s.row === 'number' && typeof s.c0 === 'number' && typeof s.c1 === 'number') {
    for (let c = s.c0; c <= s.c1; c += 1) cells.set(cellKey(c, s.row), kind);
    return;
  }
  if (typeof s.col === 'number' && typeof s.r0 === 'number' && typeof s.r1 === 'number') {
    for (let r = s.r0; r <= s.r1; r += 1) cells.set(cellKey(s.col, r), kind);
  }
};

export const applyAutoGroundPreview = (
  cells: Map<string, string>,
  pitColumns: ReadonlySet<number>,
  settings: Pick<CodeRunEditorSettings, 'worldTilesWide' | 'groundRow' | 'gridRows'>,
): void => {
  for (let c = 0; c < settings.worldTilesWide; c += 1) {
    if (pitColumns.has(c)) continue;
    cells.set(cellKey(c, settings.groundRow), 'ground');
    if (settings.groundRow + 1 < settings.gridRows) {
      cells.set(cellKey(c, settings.groundRow + 1), 'ground');
    }
  }
};

export const parseMapLayoutJson = (raw: string): ImportedMapState => {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('JSON must be an object');
  }
  const root = parsed as Record<string, unknown>;
  const source = typeof root.layout === 'object' && root.layout !== null
    ? root.layout as Record<string, unknown>
    : root;

  const tileSize = positiveInt(source.tileSize, DEFAULT_TILE_SIZE);
  const worldTilesWide = positiveInt(source.worldTilesWide, 64);
  const groundRow = nonNegInt(source.groundRow, 9);
  const gridRows = positiveInt(
    source.worldTilesHigh,
    Math.ceil(positiveInt(source.worldHeight, 528) / tileSize),
  );

  const settings: CodeRunEditorSettings = withDerivedWorldHeight({
    worldTilesWide,
    gridRows,
    tileSize,
    groundRow,
    viewWidth: positiveInt(source.viewWidth, 960),
    viewHeight: positiveInt(source.viewHeight, 528),
    worldHeight: 0,
    goalOffsetX: nonNegNumber(source.goalOffsetX, 18),
    manualGround: source.manualGround === true,
    useGoalColumn: !source.goal,
    goalColumn: nonNegInt(source.goalColumn, 60),
  });

  const cells = new Map<string, string>();
  const pitColumns = new Set<number>();
  if (!settings.manualGround) {
    const pits = Array.isArray(source.pits) ? source.pits : [];
    for (const pit of pits) {
      if (typeof pit !== 'object' || pit === null) continue;
      const row = pit as Record<string, unknown>;
      if (typeof row.c0 !== 'number' || typeof row.c1 !== 'number') continue;
      for (let c = row.c0; c <= row.c1; c += 1) pitColumns.add(c);
    }
  }

  const solids = Array.isArray(source.solids) ? source.solids : [];
  for (const s of solids) {
    if (typeof s === 'object' && s !== null) applySolidPlacement(cells, s as Record<string, unknown>);
  }

  const spikeCells = new Set<string>();
  const spikes = Array.isArray(source.spikes) ? source.spikes : [];
  for (const sp of spikes) {
    if (typeof sp !== 'object' || sp === null) continue;
    const row = sp as Record<string, unknown>;
    if (typeof row.c !== 'number') continue;
    const r = typeof row.row === 'number' ? row.row : groundRow;
    spikeCells.add(cellKey(row.c, r));
  }

  let spawn: CodeRunGridPoint | null = null;
  if (typeof source.spawn === 'object' && source.spawn !== null) {
    const sp = source.spawn as Record<string, unknown>;
    if (typeof sp.c === 'number' && typeof sp.r === 'number') spawn = { c: sp.c, r: sp.r };
  }

  let goal: CodeRunGridPoint | null = null;
  if (typeof source.goal === 'object' && source.goal !== null) {
    const g = source.goal as Record<string, unknown>;
    if (typeof g.c === 'number' && typeof g.r === 'number') goal = { c: g.c, r: g.r };
  }

  const enemies: CodeRunEnemyPlacement[] = [];
  const enemyRows = Array.isArray(source.enemies) ? source.enemies : [];
  for (const e of enemyRows) {
    if (typeof e !== 'object' || e === null) continue;
    const row = e as Record<string, unknown>;
    if (typeof row.c !== 'number') continue;
    const r = typeof row.r === 'number' ? row.r : groundRow;
    enemies.push({
      c: row.c,
      r,
      id: typeof row.id === 'string' ? row.id : `slime-${row.c}-${r}`,
      speed: typeof row.speed === 'number' ? row.speed : undefined,
    });
  }

  if (!settings.manualGround) applyAutoGroundPreview(cells, pitColumns, settings);

  return { settings, cells, spikeCells, pitColumns, enemies, spawn, goal };
};

export const defaultEnemyPlacement = (c: number, r: number): CodeRunEnemyPlacement => ({
  c,
  r,
  id: `slime-${c}-${r}`,
});

export const defaultEditorSettings = (): CodeRunEditorSettings => withDerivedWorldHeight({
  worldTilesWide: 64,
  gridRows: 11,
  tileSize: DEFAULT_TILE_SIZE,
  groundRow: 9,
  manualGround: true,
  viewWidth: 960,
  viewHeight: 528,
  worldHeight: 0,
  goalOffsetX: 18,
  useGoalColumn: true,
  goalColumn: 60,
});

export { ENEMY_H, ENEMY_W };

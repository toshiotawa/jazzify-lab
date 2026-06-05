import type {
  CodeRunAssets,
  CodeRunAssetsOverride,
  CodeRunEnemySpec,
  CodeRunMapSpec,
  CodeRunTileKind,
  CodeRunTileRect,
} from './CodeRunTypes';
import graveyardRun02LayoutJson from './layouts/graveyard_run_02.layout.json';
import snowRun01LayoutJson from './layouts/snow_run_01.layout.json';

import { CODE_RUN_TIME_LIMIT_SECONDS } from './CodeRunEngine';

export const CODE_RUN_TILE = 48;
export const CODE_RUN_PLAYER_H = 42;

const MAIN_CHAR_BASE = '/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC';
const MAIN_CHAR_VER = '64';
const mainCharSprite = (name: string): string => `${MAIN_CHAR_BASE}/${name}?v=${MAIN_CHAR_VER}`;

const TILE = CODE_RUN_TILE;
const VIEW_W = 960;
const VIEW_H = 528;
const LEVEL_TILES_W = 168;
const GROUND_ROW = 9;
const PLAYER_W = 34;
const PLAYER_H = CODE_RUN_PLAYER_H;
const ENEMY_W = 38;
const ENEMY_H = 34;
const DEFAULT_SPIKE_H = 26;
const DEFAULT_SPIKE_X_OFFSET = 9;

const GRAVEYARD_TILE_BASE = '/RUN/tiles/graveyard';
const GRAVEYARD_OBJECT_BASE = '/RUN/graveyardtilesetnew/png/Objects';

const DEFAULT_ASSETS: CodeRunAssets = {
  background: '/RUN/background.png',
  player: [
    mainCharSprite('sprite_01.png'),
    mainCharSprite('sprite_02.png'),
    mainCharSprite('sprite_03.png'),
    mainCharSprite('sprite_04.png'),
  ],
  playerHurt: mainCharSprite('sprite_11.png'),
  slime: [
    '/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png',
    '/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png',
  ],
  tiles: {
    ground: `${GRAVEYARD_TILE_BASE}/ground_fill.png`,
    groundTop: `${GRAVEYARD_TILE_BASE}/ground_top.png`,
    groundTopLeft: `${GRAVEYARD_TILE_BASE}/ground_top_left.png`,
    groundTopRight: `${GRAVEYARD_TILE_BASE}/ground_top_right.png`,
    brick: `${GRAVEYARD_TILE_BASE}/brick.png`,
    platform: '/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png',
    block: `${GRAVEYARD_OBJECT_BASE}/Crate.png`,
    spike: `${GRAVEYARD_TILE_BASE}/spike.png`,
    flag: `${GRAVEYARD_TILE_BASE}/flag.png`,
  },
};

interface CodeRunPitPlacement {
  readonly c0: number;
  readonly c1: number;
}

interface CodeRunGridPoint {
  readonly c: number;
  readonly r: number;
}

interface CodeRunSolidPlacement {
  readonly kind: CodeRunTileKind;
  readonly c?: number;
  readonly r?: number;
  readonly row?: number;
  readonly col?: number;
  readonly c0?: number;
  readonly c1?: number;
  readonly r0?: number;
  readonly r1?: number;
}

interface CodeRunSpikePlacement {
  readonly c: number;
  readonly row?: number;
  readonly offsetX?: number;
  readonly width?: number;
  readonly height?: number;
}

interface CodeRunEnemyPlacement {
  readonly c: number;
  readonly r?: number;
  readonly id?: string;
  readonly width?: number;
  readonly height?: number;
  readonly speed?: number;
  readonly minX?: number;
  readonly maxX?: number;
}

interface CodeRunLayoutData {
  readonly id: string;
  readonly name: string;
  readonly viewWidth?: number;
  readonly viewHeight?: number;
  readonly tileSize?: number;
  readonly worldTilesWide?: number;
  readonly worldHeight?: number;
  readonly groundRow?: number;
  /** true のとき自動床（groundRow 沿い）を敷かず、solids の ground のみ使う。 */
  readonly manualGround?: boolean;
  readonly spawn?: CodeRunGridPoint;
  readonly goal?: CodeRunGridPoint;
  readonly goalColumn?: number;
  readonly goalOffsetX?: number;
  readonly pits: readonly CodeRunPitPlacement[];
  readonly solids: readonly CodeRunSolidPlacement[];
  readonly spikes: readonly CodeRunSpikePlacement[];
  readonly enemies: readonly CodeRunEnemyPlacement[];
}

const tile = (kind: CodeRunTileKind, c: number, r: number, tileSize = TILE): CodeRunTileRect => ({
  kind,
  x: c * tileSize,
  y: r * tileSize,
  width: tileSize,
  height: tileSize,
});

const row = (kind: CodeRunTileKind, r: number, c0: number, c1: number): CodeRunSolidPlacement => ({
  kind,
  row: r,
  c0,
  c1,
});

const col = (kind: CodeRunTileKind, c: number, r0: number, r1: number): CodeRunSolidPlacement => ({
  kind,
  col: c,
  r0,
  r1,
});

const single = (kind: CodeRunTileKind, c: number, r: number): CodeRunSolidPlacement => ({ kind, c, r });

const spike = (c: number): CodeRunSpikePlacement => ({ c });

const enemy = (c: number, r = GROUND_ROW): CodeRunEnemyPlacement => ({ c, r });

const inPit = (pits: readonly CodeRunPitPlacement[], c: number): boolean => {
  return pits.some((pit) => c >= pit.c0 && c <= pit.c1);
};

const buildGround = (
  solids: CodeRunTileRect[],
  pits: readonly CodeRunPitPlacement[],
  worldTilesWide: number,
  groundRow: number,
  tileSize: number,
): void => {
  for (let c = 0; c < worldTilesWide; c += 1) {
    if (!inPit(pits, c)) {
      solids.push(tile('ground', c, groundRow, tileSize));
      solids.push(tile('ground', c, groundRow + 1, tileSize));
    }
  }
};

const addSolidPlacement = (
  solids: CodeRunTileRect[],
  placement: CodeRunSolidPlacement,
  tileSize: number,
): void => {
  if (placement.row !== undefined && placement.c0 !== undefined && placement.c1 !== undefined) {
    for (let c = placement.c0; c <= placement.c1; c += 1) {
      solids.push(tile(placement.kind, c, placement.row, tileSize));
    }
    return;
  }
  if (placement.col !== undefined && placement.r0 !== undefined && placement.r1 !== undefined) {
    for (let r = placement.r0; r <= placement.r1; r += 1) {
      solids.push(tile(placement.kind, placement.col, r, tileSize));
    }
    return;
  }
  if (placement.c !== undefined && placement.r !== undefined) {
    solids.push(tile(placement.kind, placement.c, placement.r, tileSize));
  }
};

const buildSpikeRect = (
  placement: CodeRunSpikePlacement,
  groundRow: number,
  tileSize: number,
): CodeRunTileRect => {
  const height = placement.height ?? DEFAULT_SPIKE_H;
  return {
    kind: 'block',
    x: placement.c * tileSize + (placement.offsetX ?? DEFAULT_SPIKE_X_OFFSET),
    y: (placement.row ?? groundRow) * tileSize - height,
    width: placement.width ?? tileSize - DEFAULT_SPIKE_X_OFFSET * 2,
    height,
  };
};

const buildEnemySpec = (
  placement: CodeRunEnemyPlacement,
  worldWidth: number,
  groundRow: number,
  tileSize: number,
): CodeRunEnemySpec => {
  const width = placement.width ?? ENEMY_W;
  const height = placement.height ?? ENEMY_H;
  const r = placement.r ?? groundRow;
  const x = placement.c * tileSize + (tileSize - width) / 2;
  const y = r * tileSize - height;
  return {
    id: placement.id ?? `slime-${placement.c}-${r}`,
    x,
    y,
    width,
    height,
    minX: placement.minX ?? Math.max(0, x - tileSize * 2),
    maxX: placement.maxX ?? Math.min(worldWidth - width, x + tileSize * 2),
    speed: placement.speed ?? 1.25,
  };
};

const buildMapFromLayout = (
  layout: CodeRunLayoutData,
  timeLimitSec: number,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec => {
  const tileSize = layout.tileSize ?? TILE;
  const viewWidth = layout.viewWidth ?? VIEW_W;
  const viewHeight = layout.viewHeight ?? VIEW_H;
  const worldTilesWide = layout.worldTilesWide ?? LEVEL_TILES_W;
  const groundRow = layout.groundRow ?? GROUND_ROW;
  const worldWidth = worldTilesWide * tileSize;
  const worldHeight = layout.worldHeight ?? viewHeight;
  const spawnPoint = layout.spawn ?? { c: 2, r: groundRow };
  const goalPoint = layout.goal ?? { c: layout.goalColumn ?? 160, r: groundRow };
  const solids: CodeRunTileRect[] = [];

  if (!layout.manualGround) {
    buildGround(solids, layout.pits, worldTilesWide, groundRow, tileSize);
  }
  for (const placement of layout.solids) {
    addSolidPlacement(solids, placement, tileSize);
  }

  const spikes = layout.spikes.map((placement) => buildSpikeRect(placement, groundRow, tileSize));
  const enemies = layout.enemies.map((placement) => buildEnemySpec(placement, worldWidth, groundRow, tileSize));

  return {
    id: layout.id,
    name: layout.name,
    viewWidth,
    viewHeight,
    worldWidth,
    worldHeight,
    tileSize,
    groundRow,
    spawn: { x: spawnPoint.c * tileSize, y: spawnPoint.r * tileSize - PLAYER_H },
    goalX: goalPoint.c * tileSize + (layout.goalOffsetX ?? 18),
    goalY: goalPoint.r * tileSize - 84,
    timeLimitSec,
    solids,
    spikes,
    enemies,
    assets: mergeAssets(assets),
  };
};

type CodeRunMapBuilder = (timeLimitSec?: number, assets?: CodeRunAssetsOverride) => CodeRunMapSpec;

const mergeAssets = (assets?: CodeRunAssetsOverride): CodeRunAssets => ({
  ...DEFAULT_ASSETS,
  ...assets,
  player: assets?.player?.length ? assets.player : DEFAULT_ASSETS.player,
  playerHurt: assets?.playerHurt ?? DEFAULT_ASSETS.playerHurt,
  slime: assets?.slime?.length ? assets.slime : DEFAULT_ASSETS.slime,
  tiles: {
    ...DEFAULT_ASSETS.tiles,
    ...(assets?.tiles ?? {}),
  },
});

const NIGHT_CITY_RUN_01_LAYOUT: CodeRunLayoutData = {
  id: 'night_city_run_01',
  name: 'Night City Run 01',
  pits: [{ c0: 26, c1: 28 }, { c0: 60, c1: 63 }, { c0: 96, c1: 98 }, { c0: 128, c1: 129 }],
  solids: [
    single('block', 9, 6),
    row('brick', 8, 21, 23),
    row('platform', 7, 32, 35),
    single('block', 38, 6),
    single('block', 39, 6),
    col('brick', 47, 8, 8),
    col('brick', 48, 7, 8),
    col('brick', 49, 6, 8),
    col('brick', 50, 5, 8),
    row('platform', 7, 61, 62),
    single('block', 70, 6),
    single('block', 71, 6),
    single('block', 84, 6),
    row('platform', 7, 88, 88),
    row('platform', 6, 90, 90),
    row('platform', 5, 92, 92),
    row('platform', 7, 97, 97),
    row('platform', 7, 106, 106),
    row('platform', 6, 108, 108),
    single('block', 112, 6),
    single('block', 113, 6),
    single('block', 114, 6),
    single('block', 136, 6),
    col('brick', 148, 8, 8),
    col('brick', 149, 7, 8),
    col('brick', 150, 6, 8),
    col('brick', 151, 5, 8),
    col('brick', 152, 4, 8),
  ],
  spikes: [spike(75), spike(76), spike(120), spike(121)],
  enemies: [
    enemy(17),
    enemy(33, 7),
    enemy(42),
    enemy(66),
    enemy(72),
    enemy(86),
    enemy(90),
    enemy(104),
    enemy(110),
    enemy(118),
    enemy(134),
    enemy(140),
  ],
};

type GraveyardRun02LayoutFields = Omit<CodeRunLayoutData, 'id' | 'name'>;

const GRAVEYARD_RUN_02_LAYOUT: CodeRunLayoutData = {
  id: 'graveyard_run_02',
  name: 'Graveyard Run 02',
  ...(graveyardRun02LayoutJson as GraveyardRun02LayoutFields),
};

const GRAVEYARD_RUN_03_LAYOUT: CodeRunLayoutData = {
  id: 'graveyard_run_03',
  name: 'Graveyard Run 03',
  pits: [{ c0: 30, c1: 31 }, { c0: 66, c1: 68 }, { c0: 104, c1: 106 }, { c0: 144, c1: 145 }],
  solids: [
    row('platform', 7, 12, 14),
    row('platform', 7, 19, 22),
    row('platform', 6, 25, 26),
    single('block', 36, 6),
    single('block', 37, 6),
    row('platform', 7, 45, 49),
    row('brick', 8, 56, 58),
    row('platform', 7, 70, 72),
    row('platform', 6, 75, 76),
    row('platform', 7, 81, 84),
    single('block', 94, 6),
    single('block', 95, 6),
    col('brick', 99, 8, 8),
    col('brick', 100, 7, 8),
    col('brick', 101, 6, 8),
    row('platform', 7, 109, 111),
    row('platform', 6, 114, 116),
    row('platform', 7, 122, 126),
    row('platform', 7, 136, 138),
    row('platform', 6, 140, 141),
    col('brick', 152, 8, 8),
    col('brick', 153, 7, 8),
    col('brick', 154, 6, 8),
    col('brick', 155, 5, 8),
    col('brick', 156, 4, 8),
  ],
  spikes: [
    spike(20),
    spike(21),
    spike(46),
    spike(47),
    spike(48),
    spike(82),
    spike(83),
    spike(123),
    spike(124),
    spike(125),
  ],
  enemies: [
    enemy(13, 7),
    enemy(27),
    enemy(40),
    enemy(48, 7),
    enemy(60),
    enemy(75, 6),
    enemy(88),
    enemy(110, 7),
    enemy(116, 6),
    enemy(130),
    enemy(141, 6),
    enemy(151),
    enemy(158),
  ],
};

type SnowRun01LayoutFields = Omit<CodeRunLayoutData, 'id' | 'name'>;

const SNOW_RUN_01_LAYOUT: CodeRunLayoutData = {
  id: 'snow_run_01',
  name: 'Snow Run 01',
  ...(snowRun01LayoutJson as SnowRun01LayoutFields),
};

const TOWER_RUN_01_LAYOUT: CodeRunLayoutData = {
  id: 'tower_run_01',
  name: 'Tower Run 01',
  viewWidth: 960,
  viewHeight: 528,
  worldTilesWide: 32,
  worldHeight: 1248,
  groundRow: 24,
  spawn: { c: 2, r: 24 },
  goal: { c: 27, r: 3 },
  goalOffsetX: 8,
  pits: [{ c0: 7, c1: 10 }, { c0: 17, c1: 19 }],
  solids: [
    row('brick', 23, 0, 5),
    row('brick', 23, 11, 16),
    row('brick', 23, 20, 31),
    row('platform', 21, 5, 8),
    row('platform', 20, 12, 15),
    row('platform', 18, 18, 21),
    row('platform', 17, 24, 27),
    row('platform', 15, 20, 22),
    row('platform', 14, 14, 17),
    row('platform', 12, 8, 11),
    row('platform', 11, 3, 6),
    row('platform', 9, 8, 10),
    row('platform', 8, 14, 17),
    row('platform', 6, 20, 23),
    row('platform', 5, 25, 28),
    row('brick', 3, 26, 30),
    col('brick', 0, 18, 24),
    col('brick', 31, 15, 24),
    col('brick', 1, 8, 12),
    col('brick', 30, 4, 9),
    single('block', 9, 16),
    single('block', 16, 10),
    single('block', 24, 4),
  ],
  spikes: [
    { c: 13, row: 23 },
    { c: 14, row: 23 },
    { c: 21, row: 23 },
    { c: 22, row: 23 },
    { c: 15, row: 14 },
    { c: 21, row: 6 },
  ],
  enemies: [
    enemy(13, 20),
    enemy(20, 18),
    enemy(25, 17),
    enemy(15, 14),
    enemy(9, 12),
    enemy(16, 8),
    enemy(27, 5),
  ],
};

export function createDefaultCodeRunMap(
  timeLimitSec = CODE_RUN_TIME_LIMIT_SECONDS,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  return buildMapFromLayout(NIGHT_CITY_RUN_01_LAYOUT, timeLimitSec, assets);
}

export function createGraveyardRun02Map(
  timeLimitSec = CODE_RUN_TIME_LIMIT_SECONDS,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  return buildMapFromLayout(GRAVEYARD_RUN_02_LAYOUT, timeLimitSec, assets);
}

export function createGraveyardRun03Map(
  timeLimitSec = CODE_RUN_TIME_LIMIT_SECONDS,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  return buildMapFromLayout(GRAVEYARD_RUN_03_LAYOUT, timeLimitSec, assets);
}

export function createTowerRun01Map(
  timeLimitSec = CODE_RUN_TIME_LIMIT_SECONDS,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  return buildMapFromLayout(TOWER_RUN_01_LAYOUT, timeLimitSec, assets);
}

export function createSnowRun01Map(
  timeLimitSec = CODE_RUN_TIME_LIMIT_SECONDS,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  return buildMapFromLayout(SNOW_RUN_01_LAYOUT, timeLimitSec, assets);
}

const MAP_BUILDERS: Record<string, CodeRunMapBuilder> = {
  night_city_run_01: createDefaultCodeRunMap,
  graveyard_run_02: createGraveyardRun02Map,
  graveyard_run_03: createGraveyardRun03Map,
  tower_run_01: createTowerRun01Map,
  snow_run_01: createSnowRun01Map,
};

export function createCodeRunMapById(
  mapId: string,
  timeLimitSec = CODE_RUN_TIME_LIMIT_SECONDS,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  const builder = MAP_BUILDERS[mapId] ?? createDefaultCodeRunMap;
  return builder(timeLimitSec, assets);
}

const stringArray = (raw: unknown): string[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const values = raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return values.length > 0 ? values : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const readFiniteNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const readPositiveNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = readFiniteNumber(record, key);
  return value !== undefined && value > 0 ? value : undefined;
};

const readNonNegativeNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = readFiniteNumber(record, key);
  return value !== undefined && value >= 0 ? value : undefined;
};

const readInteger = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = readFiniteNumber(record, key);
  return value !== undefined && Number.isInteger(value) ? value : undefined;
};

const readNonNegativeInteger = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = readInteger(record, key);
  return value !== undefined && value >= 0 ? value : undefined;
};

const isCodeRunTileKind = (value: unknown): value is CodeRunTileKind => (
  value === 'ground' || value === 'brick' || value === 'platform' || value === 'block'
);

const parseGridPoint = (raw: unknown): CodeRunGridPoint | undefined => {
  if (!isRecord(raw)) return undefined;
  const c = readNonNegativeInteger(raw, 'c');
  const r = readNonNegativeInteger(raw, 'r');
  return c !== undefined && r !== undefined ? { c, r } : undefined;
};

const parsePitPlacement = (raw: unknown): CodeRunPitPlacement | undefined => {
  if (!isRecord(raw)) return undefined;
  const c0 = readNonNegativeInteger(raw, 'c0');
  const c1 = readNonNegativeInteger(raw, 'c1');
  return c0 !== undefined && c1 !== undefined && c0 <= c1 ? { c0, c1 } : undefined;
};

const parseSolidPlacement = (raw: unknown): CodeRunSolidPlacement | undefined => {
  if (!isRecord(raw) || !isCodeRunTileKind(raw.kind)) return undefined;
  const c = readNonNegativeInteger(raw, 'c');
  const r = readNonNegativeInteger(raw, 'r');
  if (c !== undefined && r !== undefined) return { kind: raw.kind, c, r };

  const rowValue = readNonNegativeInteger(raw, 'row');
  const c0 = readNonNegativeInteger(raw, 'c0');
  const c1 = readNonNegativeInteger(raw, 'c1');
  if (rowValue !== undefined && c0 !== undefined && c1 !== undefined && c0 <= c1) {
    return { kind: raw.kind, row: rowValue, c0, c1 };
  }

  const colValue = readNonNegativeInteger(raw, 'col');
  const r0 = readNonNegativeInteger(raw, 'r0');
  const r1 = readNonNegativeInteger(raw, 'r1');
  if (colValue !== undefined && r0 !== undefined && r1 !== undefined && r0 <= r1) {
    return { kind: raw.kind, col: colValue, r0, r1 };
  }

  return undefined;
};

const parseSpikePlacement = (raw: unknown): CodeRunSpikePlacement | undefined => {
  if (!isRecord(raw)) return undefined;
  const c = readNonNegativeInteger(raw, 'c');
  if (c === undefined) return undefined;
  return {
    c,
    row: readNonNegativeInteger(raw, 'row'),
    offsetX: readNonNegativeNumber(raw, 'offsetX'),
    width: readPositiveNumber(raw, 'width'),
    height: readPositiveNumber(raw, 'height'),
  };
};

const parseEnemyPlacement = (raw: unknown): CodeRunEnemyPlacement | undefined => {
  if (!isRecord(raw)) return undefined;
  const c = readNonNegativeInteger(raw, 'c');
  if (c === undefined) return undefined;
  return {
    c,
    r: readNonNegativeInteger(raw, 'r'),
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined,
    width: readPositiveNumber(raw, 'width'),
    height: readPositiveNumber(raw, 'height'),
    speed: readPositiveNumber(raw, 'speed'),
    minX: readNonNegativeNumber(raw, 'minX'),
    maxX: readNonNegativeNumber(raw, 'maxX'),
  };
};

const parseArray = <T>(
  raw: unknown,
  parseItem: (item: unknown) => T | undefined,
): T[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const parsed: T[] = [];
  for (const item of raw) {
    const value = parseItem(item);
    if (value === undefined) return undefined;
    parsed.push(value);
  }
  return parsed;
};

const parseCodeRunLayoutFromDb = (
  mapId: string,
  mapData: Record<string, unknown>,
): CodeRunLayoutData | undefined => {
  const source = isRecord(mapData.layout) ? mapData.layout : mapData;
  const pits = parseArray(source.pits, parsePitPlacement);
  const solids = parseArray(source.solids, parseSolidPlacement);
  const spikes = parseArray(source.spikes, parseSpikePlacement);
  const enemies = parseArray(source.enemies, parseEnemyPlacement);
  if (!pits || !solids || !spikes || !enemies) return undefined;

  const id = typeof source.id === 'string' && source.id.trim() ? source.id.trim() : mapId;
  const name = typeof mapData.name === 'string' && mapData.name.trim()
    ? mapData.name.trim()
    : typeof source.name === 'string' && source.name.trim()
      ? source.name.trim()
      : id;

  return {
    id,
    name,
    viewWidth: readPositiveNumber(source, 'viewWidth'),
    viewHeight: readPositiveNumber(source, 'viewHeight'),
    tileSize: readPositiveNumber(source, 'tileSize'),
    worldTilesWide: readPositiveNumber(source, 'worldTilesWide'),
    worldHeight: readPositiveNumber(source, 'worldHeight'),
    groundRow: readNonNegativeInteger(source, 'groundRow'),
    manualGround: source.manualGround === true,
    spawn: parseGridPoint(source.spawn),
    goal: parseGridPoint(source.goal),
    goalColumn: readNonNegativeInteger(source, 'goalColumn'),
    goalOffsetX: readNonNegativeNumber(source, 'goalOffsetX'),
    pits,
    solids,
    spikes,
    enemies,
  };
};

export function createCodeRunMapFromDb(mapId: string, mapData: Record<string, unknown>, timeLimitSec: number): CodeRunMapSpec {
  const assetsRecord = mapData.assets && typeof mapData.assets === 'object'
    ? mapData.assets as Record<string, unknown>
    : {};
  const tileAssets = assetsRecord.tiles && typeof assetsRecord.tiles === 'object'
    ? assetsRecord.tiles as Partial<CodeRunAssets['tiles']>
    : undefined;
  const assetOverride: CodeRunAssetsOverride = {
    background: typeof assetsRecord.background === 'string' ? assetsRecord.background : undefined,
    player: stringArray(assetsRecord.player),
    playerHurt: typeof assetsRecord.playerHurt === 'string' ? assetsRecord.playerHurt : undefined,
    slime: stringArray(assetsRecord.slime),
    tiles: tileAssets,
  };
  const dbLayout = parseCodeRunLayoutFromDb(mapId, mapData);
  const map = dbLayout
    ? buildMapFromLayout(dbLayout, timeLimitSec, assetOverride)
    : createCodeRunMapById(mapId, timeLimitSec, assetOverride);
  return {
    ...map,
    id: mapId || map.id,
    name: typeof mapData.name === 'string' && mapData.name.trim() ? mapData.name.trim() : map.name,
  };
}

import type {
  CodeRunAssets,
  CodeRunAssetsOverride,
  CodeRunEnemySpec,
  CodeRunMapSpec,
  CodeRunTileKind,
  CodeRunTileRect,
} from './CodeRunTypes';

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
    platform: `${GRAVEYARD_TILE_BASE}/platform.png`,
    block: `${GRAVEYARD_OBJECT_BASE}/Crate.png`,
    spike: `${GRAVEYARD_TILE_BASE}/spike.png`,
    flag: `${GRAVEYARD_TILE_BASE}/flag.png`,
  },
};

const tile = (kind: CodeRunTileKind, c: number, r: number): CodeRunTileRect => ({
  kind,
  x: c * TILE,
  y: r * TILE,
  width: TILE,
  height: TILE,
});

const rowRun = (solids: CodeRunTileRect[], kind: CodeRunTileKind, r: number, c0: number, c1: number): void => {
  for (let c = c0; c <= c1; c += 1) solids.push(tile(kind, c, r));
};

const colRun = (solids: CodeRunTileRect[], kind: CodeRunTileKind, c: number, r0: number, r1: number): void => {
  for (let r = r0; r <= r1; r += 1) solids.push(tile(kind, c, r));
};

const addBlock = (solids: CodeRunTileRect[], c: number, r: number): void => {
  solids.push(tile('block', c, r));
};

const addSpike = (spikes: CodeRunTileRect[], c: number): void => {
  spikes.push({
    kind: 'block',
    x: c * TILE + 9,
    y: GROUND_ROW * TILE - 26,
    width: TILE - 18,
    height: 26,
  });
};

const addEnemy = (enemies: CodeRunEnemySpec[], c: number, r = GROUND_ROW): void => {
  const x = c * TILE + (TILE - ENEMY_W) / 2;
  const y = r * TILE - ENEMY_H;
  enemies.push({
    id: `slime-${c}-${r}`,
    x,
    y,
    width: ENEMY_W,
    height: ENEMY_H,
    minX: Math.max(0, x - TILE * 2),
    maxX: Math.min(LEVEL_TILES_W * TILE - ENEMY_W, x + TILE * 2),
    speed: 1.25,
  });
};

const inPitNightCity = (c: number): boolean => {
  return [[26, 28], [60, 63], [96, 98], [128, 129]].some(([a, b]) => c >= a && c <= b);
};

const inPitGraveyard02 = (c: number): boolean => {
  return [[22, 24], [54, 56], [92, 94], [132, 133]].some(([a, b]) => c >= a && c <= b);
};

const inPitGraveyard03 = (c: number): boolean => {
  return [[30, 31], [66, 68], [104, 106], [144, 145]].some(([a, b]) => c >= a && c <= b);
};

const buildGround = (solids: CodeRunTileRect[], isPit: (c: number) => boolean): void => {
  for (let c = 0; c < LEVEL_TILES_W; c += 1) {
    if (!isPit(c)) {
      solids.push(tile('ground', c, GROUND_ROW));
      solids.push(tile('ground', c, GROUND_ROW + 1));
    }
  }
};

const finalizeMap = (
  id: string,
  name: string,
  solids: CodeRunTileRect[],
  spikes: CodeRunTileRect[],
  enemies: CodeRunEnemySpec[],
  timeLimitSec: number,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec => ({
  id,
  name,
  viewWidth: VIEW_W,
  viewHeight: VIEW_H,
  worldWidth: LEVEL_TILES_W * TILE,
  worldHeight: VIEW_H,
  tileSize: TILE,
  groundRow: GROUND_ROW,
  spawn: { x: 2 * TILE, y: GROUND_ROW * TILE - PLAYER_H },
  goalX: 160 * TILE + 18,
  timeLimitSec,
  solids,
  spikes,
  enemies,
  assets: mergeAssets(assets),
});

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

export function createDefaultCodeRunMap(
  timeLimitSec = 90,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  const solids: CodeRunTileRect[] = [];
  const spikes: CodeRunTileRect[] = [];
  const enemies: CodeRunEnemySpec[] = [];

  buildGround(solids, inPitNightCity);

  addBlock(solids, 9, 6);
  addEnemy(enemies, 17);
  rowRun(solids, 'brick', 8, 21, 23);
  rowRun(solids, 'platform', 7, 32, 35);
  addEnemy(enemies, 33, 7);
  addBlock(solids, 38, 6);
  addBlock(solids, 39, 6);
  addEnemy(enemies, 42);
  for (let i = 0; i < 4; i += 1) colRun(solids, 'brick', 47 + i, 8 - i, 8);
  rowRun(solids, 'platform', 7, 61, 62);
  addEnemy(enemies, 66);
  addEnemy(enemies, 72);
  addBlock(solids, 70, 6);
  addBlock(solids, 71, 6);
  addSpike(spikes, 75);
  addSpike(spikes, 76);
  addBlock(solids, 84, 6);
  addEnemy(enemies, 86);
  addEnemy(enemies, 90);
  rowRun(solids, 'platform', 7, 88, 88);
  rowRun(solids, 'platform', 6, 90, 90);
  rowRun(solids, 'platform', 5, 92, 92);
  rowRun(solids, 'platform', 7, 97, 97);
  rowRun(solids, 'platform', 7, 106, 106);
  rowRun(solids, 'platform', 6, 108, 108);
  addEnemy(enemies, 104);
  addEnemy(enemies, 110);
  addEnemy(enemies, 118);
  addBlock(solids, 112, 6);
  addBlock(solids, 113, 6);
  addBlock(solids, 114, 6);
  addSpike(spikes, 120);
  addSpike(spikes, 121);
  addEnemy(enemies, 134);
  addEnemy(enemies, 140);
  addBlock(solids, 136, 6);
  for (let i = 0; i < 5; i += 1) colRun(solids, 'brick', 148 + i, 8 - i, 8);

  return finalizeMap('night_city_run_01', 'Night City Run 01', solids, spikes, enemies, timeLimitSec, assets);
}

export function createGraveyardRun02Map(
  timeLimitSec = 90,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  const solids: CodeRunTileRect[] = [];
  const spikes: CodeRunTileRect[] = [];
  const enemies: CodeRunEnemySpec[] = [];

  buildGround(solids, inPitGraveyard02);

  addBlock(solids, 8, 6);
  addEnemy(enemies, 14);
  addEnemy(enemies, 19);
  rowRun(solids, 'platform', 7, 28, 31);
  addEnemy(enemies, 29, 7);
  rowRun(solids, 'brick', 8, 40, 42);
  for (let i = 0; i < 4; i += 1) colRun(solids, 'brick', 46 + i, 8 - i, 8);
  addEnemy(enemies, 50);
  addEnemy(enemies, 52);
  rowRun(solids, 'platform', 7, 62, 63);
  addBlock(solids, 67, 6);
  addBlock(solids, 68, 6);
  addSpike(spikes, 71);
  addSpike(spikes, 72);
  addEnemy(enemies, 74);
  addEnemy(enemies, 80);
  rowRun(solids, 'platform', 7, 84, 86);
  rowRun(solids, 'platform', 6, 88, 89);
  addEnemy(enemies, 85, 7);
  addEnemy(enemies, 90);
  addBlock(solids, 98, 6);
  addBlock(solids, 99, 6);
  addEnemy(enemies, 105);
  rowRun(solids, 'platform', 7, 110, 111);
  rowRun(solids, 'platform', 6, 113, 114);
  addEnemy(enemies, 112, 6);
  addSpike(spikes, 122);
  addSpike(spikes, 123);
  addEnemy(enemies, 128);
  addEnemy(enemies, 138);
  addBlock(solids, 140, 6);
  for (let i = 0; i < 5; i += 1) colRun(solids, 'brick', 152 + i, 8 - i, 8);
  addEnemy(enemies, 148);
  addEnemy(enemies, 154);

  return finalizeMap('graveyard_run_02', 'Graveyard Run 02', solids, spikes, enemies, timeLimitSec, assets);
}

export function createGraveyardRun03Map(
  timeLimitSec = 95,
  assets?: CodeRunAssetsOverride,
): CodeRunMapSpec {
  const solids: CodeRunTileRect[] = [];
  const spikes: CodeRunTileRect[] = [];
  const enemies: CodeRunEnemySpec[] = [];

  buildGround(solids, inPitGraveyard03);

  rowRun(solids, 'platform', 7, 12, 14);
  addEnemy(enemies, 13, 7);
  addSpike(spikes, 20);
  addSpike(spikes, 21);
  rowRun(solids, 'platform', 7, 19, 22);
  rowRun(solids, 'platform', 6, 25, 26);
  addEnemy(enemies, 27);
  addBlock(solids, 36, 6);
  addBlock(solids, 37, 6);
  addEnemy(enemies, 40);
  addSpike(spikes, 46);
  addSpike(spikes, 47);
  addSpike(spikes, 48);
  rowRun(solids, 'platform', 7, 45, 49);
  addEnemy(enemies, 48, 7);
  rowRun(solids, 'brick', 8, 56, 58);
  addEnemy(enemies, 60);
  rowRun(solids, 'platform', 7, 70, 72);
  rowRun(solids, 'platform', 6, 75, 76);
  addEnemy(enemies, 75, 6);
  addSpike(spikes, 82);
  addSpike(spikes, 83);
  rowRun(solids, 'platform', 7, 81, 84);
  addEnemy(enemies, 88);
  addBlock(solids, 94, 6);
  addBlock(solids, 95, 6);
  for (let i = 0; i < 3; i += 1) colRun(solids, 'brick', 99 + i, 8 - i, 8);
  rowRun(solids, 'platform', 7, 109, 111);
  rowRun(solids, 'platform', 6, 114, 116);
  addEnemy(enemies, 110, 7);
  addEnemy(enemies, 116, 6);
  addSpike(spikes, 123);
  addSpike(spikes, 124);
  addSpike(spikes, 125);
  rowRun(solids, 'platform', 7, 122, 126);
  addEnemy(enemies, 130);
  rowRun(solids, 'platform', 7, 136, 138);
  rowRun(solids, 'platform', 6, 140, 141);
  addEnemy(enemies, 141, 6);
  for (let i = 0; i < 5; i += 1) colRun(solids, 'brick', 152 + i, 8 - i, 8);
  addEnemy(enemies, 151);
  addEnemy(enemies, 158);

  return finalizeMap('graveyard_run_03', 'Graveyard Run 03', solids, spikes, enemies, timeLimitSec, assets);
}

const MAP_BUILDERS: Record<string, CodeRunMapBuilder> = {
  night_city_run_01: createDefaultCodeRunMap,
  graveyard_run_02: createGraveyardRun02Map,
  graveyard_run_03: createGraveyardRun03Map,
};

export function createCodeRunMapById(
  mapId: string,
  timeLimitSec = 90,
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
  const map = createCodeRunMapById(mapId, timeLimitSec, assetOverride);
  return {
    ...map,
    id: mapId || map.id,
    name: typeof mapData.name === 'string' && mapData.name.trim() ? mapData.name.trim() : map.name,
  };
}

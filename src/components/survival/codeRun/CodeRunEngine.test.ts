import {
  createCodeRunMapById,
  createCodeRunMapFromDb,
  createDefaultCodeRunMap,
  createGraveyardRun02Map,
  createTutorialMap,
  createSnowRun01Map,
  createTowerRun01Map,
  CODE_RUN_PLAYER_H,
  CODE_RUN_TILE,
} from './defaultCodeRunMap';
import devRun07LayoutJson from './layouts/dev_run_07.layout.json';
import devRun08LayoutJson from './layouts/dev_run_08.layout.json';
import devRun09LayoutJson from './layouts/dev_run_09.layout.json';
import devRun10LayoutJson from './layouts/dev_run_10.layout.json';
import devRun11LayoutJson from './layouts/dev_run_11.layout.json';
import devRun12LayoutJson from './layouts/dev_run_12.layout.json';
import tutorial2LayoutJson from './layouts/tutorial_2.layout.json';
import {
  applyDamage,
  CODE_RUN_DAMAGE_INVUL_FRAMES,
  CODE_RUN_MAX_HP,
  createInitialCodeRunState,
  failCodeRun,
  tickCodeRun,
  triggerCodeRunJump,
} from './CodeRunEngine';
import type { CodeRunPlayer } from './CodeRunTypes';

const ENGINE_GRAVITY = 0.8;
const ENGINE_JUMP_VEL = -15.4;
const ENGINE_COYOTE_FRAMES = 7;
const ENGINE_JUMP_BUFFER_FRAMES = 8;

const simulateSingleJumpHeight = (): number => {
  let vy = ENGINE_JUMP_VEL;
  let height = 0;
  while (vy < 0) {
    height += -vy;
    vy += ENGINE_GRAVITY;
  }
  return height;
};

const basePlayer = (): CodeRunPlayer => ({
  x: 96,
  y: 390,
  width: 34,
  height: 42,
  vx: 0,
  vy: 0,
  facing: 1,
  onGround: true,
  jumpCount: 0,
  chordLockedUntilLanding: false,
  hp: CODE_RUN_MAX_HP,
  maxHp: CODE_RUN_MAX_HP,
  invulFrames: 0,
  hurtFrames: 0,
  runPhase: 0,
  coyoteFrames: 0,
  jumpBufferFrames: 0,
});

const idleInput = { left: false, right: false, analogX: 0 };

describe('CodeRunEngine jump helpers', () => {
  it('simulateSingleJumpHeight は HTML 原型と同程度の高さ（約3タイル弱）', () => {
    const height = simulateSingleJumpHeight();
    expect(height).toBeGreaterThan(CODE_RUN_TILE * 3);
    expect(height).toBeLessThan(CODE_RUN_TILE * 3.5);
  });

  it('processJumpBuffer は着地前入力を保持し、接地で消費する', () => {
    const map = createDefaultCodeRunMap();
    let state = createInitialCodeRunState(map);
    state = triggerCodeRunJump({
      ...state,
      player: { ...state.player, ...basePlayer(), onGround: false, coyoteFrames: 0 },
    });
    expect(state.player.jumpBufferFrames).toBe(ENGINE_JUMP_BUFFER_FRAMES);
    const waiting = tickCodeRun(state, idleInput, 1 / 60);
    expect(waiting.player.vy).toBe(0);
    expect(waiting.player.jumpBufferFrames).toBeLessThan(ENGINE_JUMP_BUFFER_FRAMES);

    const landed = tickCodeRun({
      ...waiting,
      player: {
        ...waiting.player,
        onGround: true,
        coyoteFrames: ENGINE_COYOTE_FRAMES,
        jumpBufferFrames: ENGINE_JUMP_BUFFER_FRAMES,
      },
    }, idleInput, 1 / 60);
    expect(landed.player.vy).toBe(ENGINE_JUMP_VEL);
    expect(landed.player.jumpCount).toBe(1);
  });
});

describe('CodeRunEngine integration', () => {
  it('triggerCodeRunJump は即 vy を変えずバッファを積む', () => {
    const map = createDefaultCodeRunMap();
    const state = createInitialCodeRunState(map);
    const triggered = triggerCodeRunJump(state);
    expect(triggered.player.vy).toBe(0);
    expect(triggered.player.jumpBufferFrames).toBe(ENGINE_JUMP_BUFFER_FRAMES);
  });

  it('tickCodeRun はバッファ付き入力を次フレームでジャンプに変換する', () => {
    const map = createDefaultCodeRunMap();
    let state = createInitialCodeRunState(map);
    state = {
      ...state,
      player: {
        ...state.player,
        onGround: true,
        coyoteFrames: ENGINE_COYOTE_FRAMES,
        jumpBufferFrames: ENGINE_JUMP_BUFFER_FRAMES,
      },
    };
    const next = tickCodeRun(state, idleInput, 1 / 60);
    expect(next.player.vy).toBe(ENGINE_JUMP_VEL);
    expect(next.player.jumpCount).toBe(1);
  });

  it('2段ジャンプ後は chordLockedUntilLanding になる', () => {
    const map = createDefaultCodeRunMap();
    let state = createInitialCodeRunState(map);
    state = triggerCodeRunJump(state);
    state = tickCodeRun(state, idleInput, 1 / 60);
    state = {
      ...state,
      player: {
        ...state.player,
        onGround: false,
        jumpCount: 1,
        coyoteFrames: 0,
        jumpBufferFrames: ENGINE_JUMP_BUFFER_FRAMES,
      },
    };
    const doubleJumped = tickCodeRun(state, idleInput, 1 / 60);
    expect(doubleJumped.player.jumpCount).toBe(2);
    expect(doubleJumped.player.chordLockedUntilLanding).toBe(true);
  });

  it('コヨーテ中は空中でも1段目ジャンプが実行される', () => {
    const map = createDefaultCodeRunMap();
    const state = {
      ...createInitialCodeRunState(map),
      player: {
        ...basePlayer(),
        onGround: false,
        coyoteFrames: 3,
        jumpBufferFrames: ENGINE_JUMP_BUFFER_FRAMES,
      },
    };
    const jumped = tickCodeRun(state, idleInput, 1 / 60);
    expect(jumped.player.vy).toBe(ENGINE_JUMP_VEL);
    expect(jumped.player.jumpCount).toBe(1);
  });

  it('platform は下から通り抜けられる', () => {
    const map = createCodeRunMapFromDb('one_way_test', {
      name: 'One Way Test',
      tileSize: CODE_RUN_TILE,
      worldTilesWide: 12,
      groundRow: 9,
      spawn: { c: 1, r: 9 },
      goal: { c: 10, r: 9 },
      pits: [],
      solids: [{ kind: 'platform', row: 5, c0: 3, c1: 3 }],
      spikes: [],
      enemies: [],
    }, 30);
    const platform = map.solids.find((tile) => tile.kind === 'platform');
    expect(platform).toBeDefined();
    if (!platform) return;

    const state = {
      ...createInitialCodeRunState(map),
      player: {
        ...basePlayer(),
        x: platform.x + 6,
        y: platform.y + 10,
        vy: -10,
        onGround: false,
      },
    };
    const next = tickCodeRun(state, idleInput, 1 / 60);
    expect(next.player.y).toBeLessThan(state.player.y);
    expect(next.player.vy).toBeLessThan(0);
    expect(next.player.onGround).toBe(false);
  });

  it('platform は上から下降した時だけ着地できる', () => {
    const map = createCodeRunMapFromDb('one_way_landing_test', {
      name: 'One Way Landing Test',
      tileSize: CODE_RUN_TILE,
      worldTilesWide: 12,
      groundRow: 9,
      spawn: { c: 1, r: 9 },
      goal: { c: 10, r: 9 },
      pits: [],
      solids: [{ kind: 'platform', row: 5, c0: 3, c1: 3 }],
      spikes: [],
      enemies: [],
    }, 30);
    const platform = map.solids.find((tile) => tile.kind === 'platform');
    expect(platform).toBeDefined();
    if (!platform) return;

    const state = {
      ...createInitialCodeRunState(map),
      player: {
        ...basePlayer(),
        x: platform.x + 6,
        y: platform.y - CODE_RUN_PLAYER_H - 5,
        vy: 8,
        onGround: false,
      },
    };
    const next = tickCodeRun(state, idleInput, 1 / 60);
    expect(next.player.y + next.player.height).toBe(platform.y);
    expect(next.player.vy).toBe(0);
    expect(next.player.onGround).toBe(true);
  });
});

describe('CodeRunEngine HP and damage', () => {
  it('createInitialCodeRunState は HP10 で開始する', () => {
    const state = createInitialCodeRunState(createDefaultCodeRunMap());
    expect(state.player.hp).toBe(CODE_RUN_MAX_HP);
    expect(state.player.invulFrames).toBeGreaterThan(0);
  });

  it('無敵中は applyDamage しない', () => {
    const state = createInitialCodeRunState(createDefaultCodeRunMap());
    const damaged = applyDamage(state, state.player.x + 100);
    expect(damaged.player.hp).toBe(CODE_RUN_MAX_HP);
  });

  it('applyDamage はノックバックとHP減少を行う', () => {
    const map = createDefaultCodeRunMap();
    const state = {
      ...createInitialCodeRunState(map),
      player: { ...basePlayer(), invulFrames: 0, hp: CODE_RUN_MAX_HP, maxHp: CODE_RUN_MAX_HP },
    };
    const damaged = applyDamage(state, state.player.x + 200);
    expect(damaged.player.hp).toBe(CODE_RUN_MAX_HP - 1);
    expect(damaged.player.vx).toBe(-5.5);
    expect(damaged.player.vy).toBe(-7);
    expect(damaged.player.invulFrames).toBe(CODE_RUN_DAMAGE_INVUL_FRAMES);
  });

  it('HP0で failed になる', () => {
    const map = createDefaultCodeRunMap();
    let state = {
      ...createInitialCodeRunState(map),
      player: { ...basePlayer(), invulFrames: 0, hp: 1, maxHp: CODE_RUN_MAX_HP },
    };
    state = applyDamage(state, state.player.x + 200);
    expect(state.player.hp).toBe(0);
    expect(state.status).toBe('failed');
  });

  it('failCodeRun は failed にする', () => {
    const map = createDefaultCodeRunMap();
    const state = {
      ...createInitialCodeRunState(map),
      player: { ...basePlayer(), invulFrames: 0, hp: 1, maxHp: CODE_RUN_MAX_HP },
    };
    const over = failCodeRun(state);
    expect(over.status).toBe('failed');
  });
});

describe('defaultCodeRunMap reachability', () => {
  const map = createDefaultCodeRunMap();
  const groundFootY = map.groundRow * CODE_RUN_TILE;
  const spawnFootY = map.spawn.y + CODE_RUN_PLAYER_H;
  const singleJumpHeight = simulateSingleJumpHeight();

  const platformTopY = (row: number): number => row * CODE_RUN_TILE;

  it('スポーン位置は地面の上', () => {
    expect(spawnFootY).toBe(groundFootY);
  });

  it('row7 プラットフォーム（1タイル+α）は単発ジャンプで到達可能', () => {
    const row7Y = platformTopY(7);
    const required = groundFootY - row7Y;
    expect(required).toBe(CODE_RUN_TILE * 2);
    expect(singleJumpHeight).toBeGreaterThanOrEqual(required);
  });

  it('row6 プラットフォームは単発ジャンプで到達可能', () => {
    const row6Y = platformTopY(6);
    const required = groundFootY - row6Y;
    expect(required).toBe(CODE_RUN_TILE * 3);
    expect(singleJumpHeight).toBeGreaterThanOrEqual(required);
  });

  it('row5 col92 は単発では届かず2段ジャンプ前提（マップ変更不要）', () => {
    const row5Platform = map.solids.find((tile) => tile.kind === 'platform' && tile.y === platformTopY(5));
    expect(row5Platform).toBeDefined();
    const required = groundFootY - platformTopY(5);
    expect(required).toBe(CODE_RUN_TILE * 4);
    expect(singleJumpHeight).toBeLessThan(required);
    expect(singleJumpHeight * 2).toBeGreaterThan(required);
  });
});

describe('createGraveyardRun02Map reachability', () => {
  const map = createGraveyardRun02Map();
  const platformTopY = (row: number): number => row * CODE_RUN_TILE;

  it('横120タイル・manualGround の graveyard レイアウト', () => {
    expect(map.id).toBe('graveyard_run_02');
    expect(map.worldWidth).toBe(120 * CODE_RUN_TILE);
    expect(map.worldHeight).toBe(528);
    expect(map.solids.some((tile) => tile.kind === 'ground')).toBe(true);
    expect(map.solids.some((tile) => tile.kind === 'platform' && tile.y === platformTopY(3))).toBe(true);
  });

  it('row3 プラットフォームが2箇所ある', () => {
    const row3Platforms = map.solids.filter(
      (tile) => tile.kind === 'platform' && tile.y === platformTopY(3),
    );
    expect(row3Platforms).toHaveLength(10);
  });

  it('スパイクは9本（row12 c84-92）', () => {
    expect(map.spikes).toHaveLength(9);
  });

  it('敵は2体（row3 プラットフォーム上）', () => {
    expect(map.enemies).toHaveLength(2);
    expect(map.enemies.every((enemy) => enemy.id.startsWith('slime-'))).toBe(true);
  });

  it('旗エリアに触れた時だけクリアする', () => {
    expect(map.goalY).toBeDefined();
    expect(map.goalX).toBe(118 * CODE_RUN_TILE + 18);
    const state = createInitialCodeRunState(map);
    const pastGoalButHigh = {
      ...state,
      player: {
        ...state.player,
        x: map.goalX + 8,
        y: 0,
      },
    };
    const notClear = tickCodeRun(pastGoalButHigh, idleInput, 1 / 60);
    expect(notClear.status).toBe('playing');

    const touchingFlag = {
      ...state,
      player: {
        ...state.player,
        x: map.goalX + 8,
        y: map.goalY ?? 0,
      },
    };
    const clear = tickCodeRun(touchingFlag, idleInput, 1 / 60);
    expect(clear.status).toBe('clear');
  });
});

describe('createTutorialMap gimmick layout', () => {
  const map = createTutorialMap();
  const platformTopY = (row: number): number => row * CODE_RUN_TILE;

  it('縦のちくわ足場とスパイク帯・箱迷路の横長構成', () => {
    const chikuwaColumn = map.solids.filter(
      (tile) => tile.kind === 'platform' && tile.x >= 43 * CODE_RUN_TILE && tile.x < 45 * CODE_RUN_TILE,
    );
    expect(chikuwaColumn).toHaveLength(10);
    expect(chikuwaColumn.some((tile) => tile.y === platformTopY(4))).toBe(true);
    expect(chikuwaColumn.some((tile) => tile.y === platformTopY(8))).toBe(true);
    expect(map.spikes).toHaveLength(5);
    expect(map.enemies).toHaveLength(3);
    expect(map.worldWidth).toBe(150 * CODE_RUN_TILE);
    expect(map.assets.tiles.platform).toContain('chikuwa_ashiba.png');
  });

  it('ギミック変更として stage 112 とは異なるスパイク数にする', () => {
    const previous = createGraveyardRun02Map();
    expect(map.spikes.length).not.toBe(previous.spikes.length);
  });

  it('敵は足場または地面の上に配置される', () => {
    for (const enemy of map.enemies) {
      const footY = enemy.y + enemy.height;
      const hasSupport = map.solids.some((tile) => (
        tile.y === footY
        && enemy.x < tile.x + tile.width
        && enemy.x + enemy.width > tile.x
      ));
      expect(hasSupport).toBe(true);
    }
  });
});

describe('createTowerRun01Map vertical layout', () => {
  const map = createTowerRun01Map();

  it('viewHeight より高い worldHeight と上部ゴールを持つ', () => {
    expect(map.id).toBe('tower_run_01');
    expect(map.worldHeight).toBeGreaterThan(map.viewHeight);
    expect(map.goalY).toBeDefined();
    expect(map.goalY ?? 9999).toBeLessThan(map.spawn.y);
  });

  it('縦カメラは下層のプレイヤー位置に追従する', () => {
    const state = createInitialCodeRunState(map);
    const lowerState = {
      ...state,
      player: { ...state.player, x: map.spawn.x, y: map.spawn.y, onGround: true },
    };
    const next = tickCodeRun(lowerState, idleInput, 1 / 60);
    expect(next.cameraY).toBeGreaterThan(0);
  });

  it('明示 goal のあるマップは旗エリア接触でクリアする', () => {
    const state = createInitialCodeRunState(map);
    const nearGoal = {
      ...state,
      player: {
        ...state.player,
        x: map.goalX + 8,
        y: map.goalY ?? 0,
      },
    };
    const next = tickCodeRun(nearGoal, idleInput, 1 / 60);
    expect(next.status).toBe('clear');
  });
});

describe('createCodeRunMapById / createCodeRunMapFromDb', () => {
  it('graveyard_run_02 は stage 112 レイアウトを返す', () => {
    const direct = createGraveyardRun02Map();
    const byId = createCodeRunMapById('graveyard_run_02');
    expect(byId.id).toBe('graveyard_run_02');
    expect(byId.solids.length).toBe(direct.solids.length);
    expect(byId.enemies.length).toBe(direct.enemies.length);
    expect(byId.goalX).toBe(direct.goalX);
  });

  it('tutorial は stage 113 レイアウトを返す', () => {
    const direct = createTutorialMap();
    const byId = createCodeRunMapById('tutorial');
    expect(byId.id).toBe('tutorial');
    expect(byId.solids.length).toBe(direct.solids.length);
    expect(byId.spikes.length).toBe(5);
    expect(byId.enemies.length).toBe(3);
    expect(byId.worldWidth).toBe(150 * CODE_RUN_TILE);
    expect(byId.assets.tiles.platform).toContain('chikuwa_ashiba.png');
  });

  it('tower_run_01 は縦長ビル型レイアウトを返す', () => {
    const direct = createTowerRun01Map();
    const byId = createCodeRunMapById('tower_run_01');
    expect(byId.id).toBe('tower_run_01');
    expect(byId.worldHeight).toBe(direct.worldHeight);
    expect(byId.goalY).toBe(direct.goalY);
  });

  it('snow_run_01 はスノー登攀レイアウトを返す', () => {
    const direct = createSnowRun01Map();
    const byId = createCodeRunMapById('snow_run_01');
    expect(byId.id).toBe('snow_run_01');
    expect(byId.worldHeight).toBe(3120);
    expect(byId.solids.filter((solid) => solid.kind === 'platform').length).toBe(78);
    expect(byId.solids.some((solid) => solid.kind === 'ground')).toBe(false);
    expect(byId.assets.tiles.platform).toContain('chikuwa_ashiba.png');
    expect(byId.solids.length).toBe(direct.solids.length);
    expect(byId.enemies.length).toBe(6);
  });

  it('createCodeRunMapFromDb は mapId に応じたレイアウトを返す', () => {
    const nightCity = createDefaultCodeRunMap();
    const tutorial = createTutorialMap();
    const fromDb = createCodeRunMapFromDb('tutorial', { name: 'Tutorial' }, 95);
    expect(fromDb.id).toBe('tutorial');
    expect(fromDb.name).toBe('Tutorial');
    expect(fromDb.solids.length).toBe(tutorial.solids.length);
    expect(fromDb.solids.length).not.toBe(nightCity.solids.length);
  });

  it('createCodeRunMapFromDb は DB 配置があればローカルビルダーより優先する', () => {
    const fromDb = createCodeRunMapFromDb('night_city_run_01', {
      name: 'DB Layout',
      viewWidth: 480,
      viewHeight: 240,
      tileSize: 24,
      worldTilesWide: 12,
      groundRow: 6,
      spawn: { c: 1, r: 6 },
      goalColumn: 10,
      goalOffsetX: 3,
      goal: { c: 9, r: 3 },
      pits: [{ c0: 4, c1: 5 }],
      solids: [{ kind: 'platform', row: 4, c0: 6, c1: 7 }],
      spikes: [{ c: 8 }],
      enemies: [{ c: 7, r: 4, speed: 2 }],
    }, 30);

    expect(fromDb.name).toBe('DB Layout');
    expect(fromDb.viewWidth).toBe(480);
    expect(fromDb.tileSize).toBe(24);
    expect(fromDb.spawn).toEqual({ x: 24, y: 102 });
    expect(fromDb.goalX).toBe(219);
    expect(fromDb.goalY).toBe(-12);
    expect(fromDb.solids.some((solid) => solid.kind === 'platform' && solid.x === 144 && solid.y === 96)).toBe(true);
    expect(fromDb.solids.some((solid) => solid.kind === 'ground' && solid.x === 96)).toBe(false);
    expect(fromDb.spikes).toHaveLength(1);
    expect(fromDb.enemies).toHaveLength(1);
    expect(fromDb.enemies[0]?.speed).toBe(2);
  });

  it('dev_run_07 は段差箱の横長レイアウトを返す', () => {
    const fromDb = createCodeRunMapFromDb('dev_run_07', {
      name: 'Dev Run 07',
      ...devRun07LayoutJson,
    }, 140);
    expect(fromDb.id).toBe('dev_run_07');
    expect(fromDb.worldWidth).toBe(135 * CODE_RUN_TILE);
    expect(fromDb.worldHeight).toBe(528);
    expect(fromDb.spawn).toEqual({ x: 96, y: 8 * CODE_RUN_TILE - CODE_RUN_PLAYER_H });
    expect(fromDb.goalX).toBe(133 * CODE_RUN_TILE + 18);
    expect(fromDb.spikes).toHaveLength(0);
    expect(fromDb.enemies).toHaveLength(0);
    expect(fromDb.solids.filter((solid) => solid.kind === 'block').length).toBe(101);
    expect(fromDb.solids.filter((solid) => solid.kind === 'ground').length).toBe(270);
  });

  it('dev_run_08 は迷路と縦足場の横長レイアウトを返す', () => {
    const fromDb = createCodeRunMapFromDb('dev_run_08', {
      name: 'Dev Run 08',
      ...devRun08LayoutJson,
    }, 150);
    expect(fromDb.id).toBe('dev_run_08');
    expect(fromDb.worldWidth).toBe(130 * CODE_RUN_TILE);
    expect(fromDb.worldHeight).toBe(25 * CODE_RUN_TILE);
    expect(fromDb.groundRow).toBe(23);
    expect(fromDb.spawn).toEqual({ x: 96, y: 22 * CODE_RUN_TILE - CODE_RUN_PLAYER_H });
    expect(fromDb.spawn.y + CODE_RUN_PLAYER_H).toBe(22 * CODE_RUN_TILE);
    expect(fromDb.goalX).toBe(129 * CODE_RUN_TILE + 18);
    expect(fromDb.spikes).toHaveLength(0);
    expect(fromDb.enemies).toHaveLength(16);
    expect(fromDb.solids.filter((solid) => solid.kind === 'block').length).toBe(252);
    expect(fromDb.solids.filter((solid) => solid.kind === 'ground').length).toBe(195);
    expect(fromDb.solids.filter((solid) => solid.kind === 'platform').length).toBe(220);
  });

  it('dev_run_09 はちくわ足場と箱迷路のレイアウトを返す', () => {
    const fromDb = createCodeRunMapFromDb('dev_run_09', {
      name: 'Dev Run 09',
      ...devRun09LayoutJson,
    }, 150);
    expect(fromDb.id).toBe('dev_run_09');
    expect(fromDb.worldWidth).toBe(125 * CODE_RUN_TILE);
    expect(fromDb.worldHeight).toBe(80 * CODE_RUN_TILE);
    expect(fromDb.groundRow).toBe(9);
    expect(fromDb.spawn).toEqual({ x: 96, y: 76 * CODE_RUN_TILE - CODE_RUN_PLAYER_H });
    expect(fromDb.spawn.y + CODE_RUN_PLAYER_H).toBeLessThan(fromDb.worldHeight + 96);
    const afterFirstTick = tickCodeRun(
      createInitialCodeRunState(fromDb),
      { left: false, right: false, analogX: 0 },
      1 / 60,
    );
    expect(afterFirstTick.status).toBe('playing');
    expect(fromDb.goalX).toBe(112 * CODE_RUN_TILE + 18);
    expect(fromDb.goalY).toBe(20 * CODE_RUN_TILE - 84);
    expect(fromDb.assets.tiles.platform).toContain('chikuwa_ashiba.png');
    expect(fromDb.spikes).toHaveLength(22);
    expect(fromDb.enemies).toHaveLength(10);
    expect(fromDb.solids.filter((solid) => solid.kind === 'block').length).toBe(235);
    expect(fromDb.solids.filter((solid) => solid.kind === 'ground').length).toBe(0);
    expect(fromDb.solids.filter((solid) => solid.kind === 'platform').length).toBe(175);
  });

  it('dev_run_10 はちくわ足場と縦壁・下段ギャップのレイアウトを返す', () => {
    const fromDb = createCodeRunMapFromDb('dev_run_10', {
      name: 'Dev Run 10',
      ...devRun10LayoutJson,
    }, 150);
    expect(fromDb.id).toBe('dev_run_10');
    expect(fromDb.worldWidth).toBe(100 * CODE_RUN_TILE);
    expect(fromDb.worldHeight).toBe(40 * CODE_RUN_TILE);
    expect(fromDb.groundRow).toBe(9);
    expect(fromDb.spawn).toEqual({ x: 96, y: 35 * CODE_RUN_TILE - CODE_RUN_PLAYER_H });
    expect(fromDb.spawn.y + CODE_RUN_PLAYER_H).toBeLessThan(fromDb.worldHeight + 96);
    const afterFirstTick = tickCodeRun(
      createInitialCodeRunState(fromDb),
      { left: false, right: false, analogX: 0 },
      1 / 60,
    );
    expect(afterFirstTick.status).toBe('playing');
    expect(fromDb.goalX).toBe(98 * CODE_RUN_TILE + 18);
    expect(fromDb.goalY).toBe(3 * CODE_RUN_TILE - 84);
    expect(fromDb.assets.tiles.platform).toContain('chikuwa_ashiba.png');
    expect(fromDb.spikes).toHaveLength(0);
    expect(fromDb.enemies).toHaveLength(24);
    expect(fromDb.solids.filter((solid) => solid.kind === 'block').length).toBe(194);
    expect(fromDb.solids.filter((solid) => solid.kind === 'ground').length).toBe(202);
    expect(fromDb.solids.filter((solid) => solid.kind === 'platform').length).toBe(106);
  });

  it('tower_run_01 は縦長タワー降下レイアウトを返す', () => {
    const fromDb = createCodeRunMapFromDb('tower_run_01', {
      name: 'Tower Run 01',
      ...devRun12LayoutJson,
    }, 180);
    expect(fromDb.id).toBe('tower_run_01');
    expect(fromDb.worldWidth).toBe(20 * CODE_RUN_TILE);
    expect(fromDb.worldHeight).toBe(3840);
    expect(fromDb.groundRow).toBe(9);
    expect(fromDb.spawn).toEqual({ x: 1 * CODE_RUN_TILE, y: 5 * CODE_RUN_TILE - CODE_RUN_PLAYER_H });
    expect(fromDb.goalX).toBe(1 * CODE_RUN_TILE + 18);
    expect(fromDb.goalY).toBe(69 * CODE_RUN_TILE - 84);
    expect(fromDb.spikes).toHaveLength(23);
    expect(fromDb.enemies).toHaveLength(2);
    expect(fromDb.solids.every((solid) => solid.kind === 'brick')).toBe(true);
  });

  it('dev_run_12 は縦長タワー降下レイアウトを返す', () => {
    const fromDb = createCodeRunMapFromDb('dev_run_12', {
      name: 'Dev Run 12',
      ...devRun12LayoutJson,
    }, 180);
    expect(fromDb.id).toBe('dev_run_12');
    expect(fromDb.worldWidth).toBe(20 * CODE_RUN_TILE);
    expect(fromDb.worldHeight).toBe(3840);
    expect(fromDb.groundRow).toBe(9);
    expect(fromDb.spawn).toEqual({ x: 1 * CODE_RUN_TILE, y: 5 * CODE_RUN_TILE - CODE_RUN_PLAYER_H });
    expect(fromDb.goalX).toBe(1 * CODE_RUN_TILE + 18);
    expect(fromDb.goalY).toBe(69 * CODE_RUN_TILE - 84);
    expect(fromDb.spikes).toHaveLength(23);
    expect(fromDb.enemies).toHaveLength(2);
    expect(fromDb.solids.every((solid) => solid.kind === 'brick')).toBe(true);
  });

  it('tutorial_2 は横長床とスライム1体のレイアウトを返す', () => {
    const fromDb = createCodeRunMapFromDb('tutorial_2', {
      name: 'Tutorial 2',
      ...tutorial2LayoutJson,
    }, 90);
    expect(fromDb.id).toBe('tutorial_2');
    expect(fromDb.worldWidth).toBe(48 * CODE_RUN_TILE);
    expect(fromDb.worldHeight).toBe(720);
    expect(fromDb.groundRow).toBe(9);
    expect(fromDb.spawn).toEqual({ x: 2 * CODE_RUN_TILE, y: 9 * CODE_RUN_TILE - CODE_RUN_PLAYER_H });
    expect(fromDb.goalX).toBe(42 * CODE_RUN_TILE + 18);
    expect(fromDb.goalY).toBe(13 * CODE_RUN_TILE - 84);
    expect(fromDb.spikes).toHaveLength(0);
    expect(fromDb.enemies).toHaveLength(1);
    expect(fromDb.solids.filter((solid) => solid.kind === 'ground').length).toBe(96);
  });

  it('dev_run_11 は横長ちくわ足場とスライムのレイアウトを返す', () => {
    const fromDb = createCodeRunMapFromDb('dev_run_11', {
      name: 'Dev Run 11',
      ...devRun11LayoutJson,
    }, 150);
    expect(fromDb.id).toBe('dev_run_11');
    expect(fromDb.worldWidth).toBe(64 * CODE_RUN_TILE);
    expect(fromDb.worldHeight).toBe(528);
    expect(fromDb.groundRow).toBe(9);
    expect(fromDb.spawn).toEqual({ x: 8 * CODE_RUN_TILE, y: 10 * CODE_RUN_TILE - CODE_RUN_PLAYER_H });
    expect(fromDb.spawn.y + CODE_RUN_PLAYER_H).toBeLessThan(fromDb.worldHeight + 96);
    const afterFirstTick = tickCodeRun(
      createInitialCodeRunState(fromDb),
      { left: false, right: false, analogX: 0 },
      1 / 60,
    );
    expect(afterFirstTick.status).toBe('playing');
    expect(fromDb.goalX).toBe(60 * CODE_RUN_TILE + 18);
    expect(fromDb.goalY).toBe(11 * CODE_RUN_TILE - 84);
    expect(fromDb.spikes).toHaveLength(0);
    expect(fromDb.enemies).toHaveLength(6);
    expect(fromDb.solids.filter((solid) => solid.kind === 'block').length).toBe(0);
    expect(fromDb.solids.filter((solid) => solid.kind === 'ground').length).toBe(0);
    expect(fromDb.solids.filter((solid) => solid.kind === 'platform').length).toBe(53);
  });

  it('manualGround では自動床を敷かない', () => {
    const fromDb = createCodeRunMapFromDb('manual_ground_test', {
      tileSize: 48,
      worldTilesWide: 8,
      groundRow: 5,
      manualGround: true,
      spawn: { c: 1, r: 5 },
      goalColumn: 6,
      pits: [],
      solids: [{ kind: 'ground', row: 5, c0: 2, c1: 4 }],
      spikes: [],
      enemies: [],
    }, 60);
    const groundTiles = fromDb.solids.filter((solid) => solid.kind === 'ground');
    expect(groundTiles).toHaveLength(3);
    expect(groundTiles.every((solid) => solid.x >= 96 && solid.x <= 192)).toBe(true);
  });
});

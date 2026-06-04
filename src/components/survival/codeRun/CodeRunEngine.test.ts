import {
  createCodeRunMapById,
  createCodeRunMapFromDb,
  createDefaultCodeRunMap,
  createGraveyardRun02Map,
  createGraveyardRun03Map,
  createTowerRun01Map,
  CODE_RUN_PLAYER_H,
  CODE_RUN_TILE,
} from './defaultCodeRunMap';
import {
  applyDamage,
  CODE_RUN_DAMAGE_INVUL_FRAMES,
  CODE_RUN_INITIAL_LIVES,
  CODE_RUN_MAX_HP,
  createInitialCodeRunState,
  loseLife,
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

describe('CodeRunEngine lives and damage', () => {
  it('createInitialCodeRunState は残機5・HP3で開始する', () => {
    const state = createInitialCodeRunState(createDefaultCodeRunMap());
    expect(state.lives).toBe(CODE_RUN_INITIAL_LIVES);
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

  it('HP0で loseLife し残機が減る', () => {
    const map = createDefaultCodeRunMap();
    let state = {
      ...createInitialCodeRunState(map),
      player: { ...basePlayer(), invulFrames: 0, hp: 1, maxHp: CODE_RUN_MAX_HP },
    };
    state = applyDamage(state, state.player.x + 200);
    expect(state.lives).toBe(CODE_RUN_INITIAL_LIVES - 1);
    expect(state.player.hp).toBe(CODE_RUN_MAX_HP);
    expect(state.status).toBe('playing');
  });

  it('残機0で failed になる', () => {
    const map = createDefaultCodeRunMap();
    const state = {
      ...createInitialCodeRunState(map),
      lives: 1,
      player: { ...basePlayer(), invulFrames: 0, hp: 1, maxHp: CODE_RUN_MAX_HP },
    };
    const over = loseLife(state);
    expect(over.status).toBe('failed');
    expect(over.lives).toBe(0);
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
  const groundFootY = map.groundRow * CODE_RUN_TILE;
  const singleJumpHeight = simulateSingleJumpHeight();
  const platformTopY = (row: number): number => row * CODE_RUN_TILE;

  it('row5 以上の platform は存在しない', () => {
    const highPlatforms = map.solids.filter(
      (tile) => tile.kind === 'platform' && tile.y < platformTopY(6),
    );
    expect(highPlatforms).toHaveLength(0);
  });

  it('row6 プラットフォームは単発ジャンプで到達可能', () => {
    const row6Platforms = map.solids.filter((tile) => tile.kind === 'platform' && tile.y === platformTopY(6));
    expect(row6Platforms.length).toBeGreaterThan(0);
    const required = groundFootY - platformTopY(6);
    expect(required).toBe(CODE_RUN_TILE * 3);
    expect(singleJumpHeight).toBeGreaterThanOrEqual(required);
  });

  it('row7 プラットフォームは単発ジャンプで到達可能', () => {
    const row7Platforms = map.solids.filter((tile) => tile.kind === 'platform' && tile.y === platformTopY(7));
    expect(row7Platforms.length).toBeGreaterThan(0);
    const required = groundFootY - platformTopY(7);
    expect(required).toBe(CODE_RUN_TILE * 2);
    expect(singleJumpHeight).toBeGreaterThanOrEqual(required);
  });

  it('敵は14体以上配置される', () => {
    expect(map.enemies.length).toBeGreaterThanOrEqual(14);
  });

  it('旗エリアに触れた時だけクリアする', () => {
    expect(map.goalY).toBeDefined();
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

describe('createGraveyardRun03Map gimmick layout', () => {
  const map = createGraveyardRun03Map();
  const groundFootY = map.groundRow * CODE_RUN_TILE;
  const singleJumpHeight = simulateSingleJumpHeight();
  const platformTopY = (row: number): number => row * CODE_RUN_TILE;

  it('row6/row7 の低い足場でスパイク帯を渡る構成', () => {
    const row6Platforms = map.solids.filter((tile) => tile.kind === 'platform' && tile.y === platformTopY(6));
    const row7Platforms = map.solids.filter((tile) => tile.kind === 'platform' && tile.y === platformTopY(7));
    expect(row6Platforms.length).toBeGreaterThan(0);
    expect(row7Platforms.length).toBeGreaterThan(0);
    expect(map.spikes.length).toBeGreaterThanOrEqual(10);
  });

  it('最高足場は単発ジャンプで到達できる row6 に収める', () => {
    const highPlatforms = map.solids.filter(
      (tile) => tile.kind === 'platform' && tile.y < platformTopY(6),
    );
    const required = groundFootY - platformTopY(6);
    expect(highPlatforms).toHaveLength(0);
    expect(singleJumpHeight).toBeGreaterThanOrEqual(required);
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

  it('graveyard_run_03 は stage 113 レイアウトを返す', () => {
    const direct = createGraveyardRun03Map();
    const byId = createCodeRunMapById('graveyard_run_03');
    expect(byId.id).toBe('graveyard_run_03');
    expect(byId.solids.length).toBe(direct.solids.length);
    expect(byId.spikes.length).toBe(direct.spikes.length);
    expect(byId.enemies.length).toBe(direct.enemies.length);
  });

  it('tower_run_01 は縦長ビル型レイアウトを返す', () => {
    const direct = createTowerRun01Map();
    const byId = createCodeRunMapById('tower_run_01');
    expect(byId.id).toBe('tower_run_01');
    expect(byId.worldHeight).toBe(direct.worldHeight);
    expect(byId.goalY).toBe(direct.goalY);
  });

  it('createCodeRunMapFromDb は mapId に応じたレイアウトを返す', () => {
    const nightCity = createDefaultCodeRunMap();
    const graveyard = createGraveyardRun03Map();
    const fromDb = createCodeRunMapFromDb('graveyard_run_03', { name: 'Graveyard Run 03' }, 95);
    expect(fromDb.id).toBe('graveyard_run_03');
    expect(fromDb.name).toBe('Graveyard Run 03');
    expect(fromDb.solids.length).toBe(graveyard.solids.length);
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
});

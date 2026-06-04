import { createDefaultCodeRunMap, CODE_RUN_PLAYER_H, CODE_RUN_TILE } from './defaultCodeRunMap';
import {
  createInitialCodeRunState,
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
  respawnGraceSec: 0,
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

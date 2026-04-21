/**
 * サバイバル ボス戦エンジン
 *
 * 通常サバイバル（SurvivalGameEngine）とは独立した、ボス戦専用の純粋ロジック。
 * - 追尾・予兆→発動→終了の行動遷移
 * - フェーズ遷移（HP 70% / 35%）
 * - プレイヤー被弾時の無敵時間・ノックバック
 * - 召喚雑魚（自爆ボム）の生成・爆発
 * - ボス撃破/プレイヤー敗北判定
 */

import { PlayerState, MAP_CONFIG, DroppedItem } from '../SurvivalTypes';
import {
  BossBattleState,
  BossHazard,
  BossMinion,
  BossPhase,
  BossProjectile,
  BossSkillId,
  BossState,
  BossType,
  BOSS_MAX_HP,
  BOSS_PLAYER_MAX_HP,
  BOSS_HITBOX_RADIUS,
  BOSS_MINION_RADIUS,
  BOSS_MINION_EXPLOSION_RADIUS,
  I_FRAME_CONTACT_MS,
  I_FRAME_PROJECTILE_MS,
  I_FRAME_HAZARD_MS,
  KNOCKBACK_DURATION_MS,
  KNOCKBACK_SPEED,
  HEALING_DROP_RATE,
} from './SurvivalBossTypes';

// ===== パラメータ =====
/** プレイヤーの標準移動速度（update 側で decorate される速度と整合させるための基準値） */
const PLAYER_REF_SPEED_PX_PER_S = 300;

/** 開戦直後の猶予時間（ms）。この間ボスは移動もスキルも行わない。 */
const BOSS_OPENING_GRACE_MS = 2000;

export const BOSS_A_PARAMS = {
  speedFactor: 0.65,
  chargeSpeedFactor: 2.0,
  sweep: { cdMs: 4500, windupMs: 900, activeMs: 200, recoveryMs: 300, radius: BOSS_HITBOX_RADIUS * 2.5, spreadRad: Math.PI / 2, damage: 80 },
  charge: { cdMs: 7000, windupMs: 1100, travelMs: 450, recoveryMs: 800, distance: 520, thickness: BOSS_HITBOX_RADIUS, damage: 110 },
  bloodPoolMs: 3000,
  bloodPoolRadius: 70,
  bloodPoolDamagePerTick: 8, // 1 フレームあたり（dt でスケール）
} as const;

export const BOSS_B_PARAMS = {
  speedFactor: 0.55,
  spores: { cdMs: 6000, windupMs: 800, activeMs: 150, hatchMs: 2200, radius: 90 },
  acidShot: { cdMs: 5000, windupMs: 700, activeMs: 100, speed: 260, damage: 60, spread: 0.25, count: 3, poolMs: 2500, poolRadius: 60 },
  eggLimitPhase1: 3,
  eggLimitPhase2: 4,
  minionLimit: 8,
  minionHp: 35,
  minionSpeedFactor: 0.8,
  minionFuseMs: 900,
  minionTriggerRange: 72,
  explosionDamage: 120,
} as const;

export const BOSS_C_PARAMS = {
  speedFactor: 0.6,
  ring: { cdMs: 6500, windupMs: 1000, activeMs: 220, innerRadius: 140, outerRadius: 280, damage: 100 },
  cross: { cdMs: 8000, windupMs: 1200, activeMs: 250, length: 900, thickness: 46, damage: 140 },
  pull: { cdMs: 10000, windupMs: 800, activeMs: 200, range: 360, damage: 40 },
} as const;

// ===== ユーティリティ =====
let idSeq = 0;
const nextId = (prefix: string): string => {
  idSeq = (idSeq + 1) & 0x7fffffff;
  return `${prefix}_${idSeq.toString(36)}`;
};

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

const distanceBetween = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
};

const normalizedVectorTo = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): { nx: number; ny: number } => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-6) return { nx: 0, ny: 0 };
  return { nx: dx / len, ny: dy / len };
};

/** 扇形判定 */
const isInsideFan = (
  targetX: number,
  targetY: number,
  cx: number,
  cy: number,
  centerAngle: number,
  spread: number,
  radius: number
): boolean => {
  const dx = targetX - cx;
  const dy = targetY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > radius) return false;
  const theta = Math.atan2(dy, dx);
  let diff = theta - centerAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= spread / 2;
};

const isInsideCross = (
  targetX: number,
  targetY: number,
  cx: number,
  cy: number,
  length: number,
  thickness: number
): boolean => {
  const dx = Math.abs(targetX - cx);
  const dy = Math.abs(targetY - cy);
  const halfLen = length / 2;
  if (dx <= halfLen && dy <= thickness) return true;
  if (dy <= halfLen && dx <= thickness) return true;
  return false;
};

// ===== ボス生成 =====
const initialNextSkillAt = (now: number): Record<BossSkillId, number> => ({
  sweep: now + 1800,
  charge: now + 3500,
  bloodPool: now + 99999999,
  spores: now + 1500,
  acidShot: now + 99999999,
  shockRing: now + 2000,
  crossBlast: now + 99999999,
  pull: now + 99999999,
});

export const createBossBattleState = (
  bossType: BossType,
  now: number
): BossBattleState => {
  const boss: BossState = {
    id: nextId('boss'),
    bossType,
    x: MAP_CONFIG.width / 2,
    y: MAP_CONFIG.height / 2 - 240,
    hp: BOSS_MAX_HP,
    maxHp: BOSS_MAX_HP,
    facing: 'left',
    phase: 1,
    action: { kind: 'idle', skill: null, startAt: now, durationMs: 0 },
    nextSkillAt: initialNextSkillAt(now),
  };

  return {
    active: true,
    bossType,
    boss,
    minions: [],
    hazards: [],
    projectiles: [],
    player: {
      hp: BOSS_PLAYER_MAX_HP,
      maxHp: BOSS_PLAYER_MAX_HP,
      iFramesUntil: 0,
      knockbackVx: 0,
      knockbackVy: 0,
      knockbackUntil: 0,
    },
    pendingDrops: [],
    result: 'ongoing',
    startedAt: now,
  };
};

// ===== フェーズ算出 =====
const computePhase = (hp: number, maxHp: number): BossPhase => {
  const ratio = hp / maxHp;
  if (ratio > 0.7) return 1;
  if (ratio > 0.35) return 2;
  return 3;
};

// ===== ボス移動・行動 =====
interface BossTickContext {
  now: number;
  deltaMs: number;
  player: PlayerState;
}

const moveBossToward = (
  boss: BossState,
  targetX: number,
  targetY: number,
  speedPxPerS: number,
  dtMs: number
): void => {
  const { nx, ny } = normalizedVectorTo(boss.x, boss.y, targetX, targetY);
  const dt = dtMs / 1000;
  boss.x = clamp(boss.x + nx * speedPxPerS * dt, 0, MAP_CONFIG.width);
  boss.y = clamp(boss.y + ny * speedPxPerS * dt, 0, MAP_CONFIG.height);
};

const isImmobile = (action: BossState['action']): boolean => {
  return action.kind === 'windup' || action.kind === 'active' || action.kind === 'recovery';
};

const tryStartSkill = (
  state: BossBattleState,
  skill: BossSkillId,
  now: number,
  ctx: BossTickContext
): boolean => {
  const boss = state.boss;
  if (isImmobile(boss.action)) return false;
  if (now < boss.nextSkillAt[skill]) return false;

  switch (skill) {
    case 'sweep': {
      const p = BOSS_A_PARAMS.sweep;
      const angle = Math.atan2(ctx.player.y - boss.y, ctx.player.x - boss.x);
      boss.action = {
        kind: 'windup',
        skill: 'sweep',
        startAt: now,
        durationMs: p.windupMs,
        data: { angle },
      };
      state.hazards.push({
        id: nextId('hz'),
        kind: 'fanTelegraph',
        x: boss.x,
        y: boss.y,
        angle,
        spread: p.spreadRad,
        radius: p.radius,
        startAt: now,
        endAt: now + p.windupMs,
        damage: 0,
      });
      return true;
    }
    case 'charge': {
      const p = BOSS_A_PARAMS.charge;
      const angle = Math.atan2(ctx.player.y - boss.y, ctx.player.x - boss.x);
      const endX = clamp(boss.x + Math.cos(angle) * p.distance, 0, MAP_CONFIG.width);
      const endY = clamp(boss.y + Math.sin(angle) * p.distance, 0, MAP_CONFIG.height);
      boss.action = {
        kind: 'windup',
        skill: 'charge',
        startAt: now,
        durationMs: p.windupMs,
        data: { angle, startX: boss.x, startY: boss.y, endX, endY },
      };
      state.hazards.push({
        id: nextId('hz'),
        kind: 'chargeTelegraph',
        x: boss.x,
        y: boss.y,
        angle,
        length: p.distance,
        thickness: p.thickness,
        startAt: now,
        endAt: now + p.windupMs,
        damage: 0,
      });
      return true;
    }
    case 'spores': {
      const p = BOSS_B_PARAMS.spores;
      boss.action = {
        kind: 'windup',
        skill: 'spores',
        startAt: now,
        durationMs: p.windupMs,
      };
      return true;
    }
    case 'acidShot': {
      const p = BOSS_B_PARAMS.acidShot;
      const angle = Math.atan2(ctx.player.y - boss.y, ctx.player.x - boss.x);
      boss.action = {
        kind: 'windup',
        skill: 'acidShot',
        startAt: now,
        durationMs: p.windupMs,
        data: { angle },
      };
      return true;
    }
    case 'shockRing': {
      const p = BOSS_C_PARAMS.ring;
      boss.action = {
        kind: 'windup',
        skill: 'shockRing',
        startAt: now,
        durationMs: p.windupMs,
      };
      state.hazards.push({
        id: nextId('hz'),
        kind: 'ringTelegraph',
        x: boss.x,
        y: boss.y,
        innerRadius: p.innerRadius,
        radius: p.outerRadius,
        startAt: now,
        endAt: now + p.windupMs,
        damage: 0,
      });
      return true;
    }
    case 'crossBlast': {
      const p = BOSS_C_PARAMS.cross;
      boss.action = {
        kind: 'windup',
        skill: 'crossBlast',
        startAt: now,
        durationMs: p.windupMs,
      };
      state.hazards.push({
        id: nextId('hz'),
        kind: 'crossTelegraph',
        x: boss.x,
        y: boss.y,
        length: p.length,
        thickness: p.thickness,
        startAt: now,
        endAt: now + p.windupMs,
        damage: 0,
      });
      return true;
    }
    case 'pull': {
      const p = BOSS_C_PARAMS.pull;
      boss.action = {
        kind: 'windup',
        skill: 'pull',
        startAt: now,
        durationMs: p.windupMs,
      };
      state.hazards.push({
        id: nextId('hz'),
        kind: 'pullTelegraph',
        x: boss.x,
        y: boss.y,
        radius: p.range,
        startAt: now,
        endAt: now + p.windupMs,
        damage: 0,
      });
      return true;
    }
    default:
      return false;
  }
};

const advanceAction = (state: BossBattleState, ctx: BossTickContext): void => {
  const boss = state.boss;
  const now = ctx.now;
  if (boss.action.kind === 'idle' || boss.action.skill === null) return;

  const elapsed = now - boss.action.startAt;
  if (elapsed < boss.action.durationMs) return;

  if (boss.action.kind === 'windup') {
    triggerActive(state, ctx);
    return;
  }
  if (boss.action.kind === 'active') {
    triggerRecovery(state, ctx);
    return;
  }
  if (boss.action.kind === 'recovery') {
    boss.action = { kind: 'idle', skill: null, startAt: now, durationMs: 0 };
  }
};

const triggerActive = (state: BossBattleState, ctx: BossTickContext): void => {
  const boss = state.boss;
  const now = ctx.now;
  const skill = boss.action.skill;
  if (!skill) return;

  switch (skill) {
    case 'sweep': {
      const p = BOSS_A_PARAMS.sweep;
      const angle = boss.action.data?.angle ?? 0;
      state.hazards.push({
        id: nextId('hz'),
        kind: 'fanActive',
        x: boss.x,
        y: boss.y,
        angle,
        spread: p.spreadRad,
        radius: p.radius,
        startAt: now,
        endAt: now + p.activeMs,
        damage: p.damage,
        hitOnce: true,
      });
      if (boss.phase === 3) {
        state.hazards.push({
          id: nextId('hz'),
          kind: 'bloodPool',
          x: boss.x + Math.cos(angle) * (p.radius * 0.6),
          y: boss.y + Math.sin(angle) * (p.radius * 0.6),
          radius: BOSS_A_PARAMS.bloodPoolRadius,
          startAt: now,
          endAt: now + BOSS_A_PARAMS.bloodPoolMs,
          damage: BOSS_A_PARAMS.bloodPoolDamagePerTick,
        });
      }
      boss.action = { kind: 'active', skill, startAt: now, durationMs: p.activeMs, data: boss.action.data };
      boss.nextSkillAt.sweep = now + p.cdMs;
      return;
    }
    case 'charge': {
      const p = BOSS_A_PARAMS.charge;
      const data = boss.action.data ?? {};
      boss.action = {
        kind: 'active',
        skill,
        startAt: now,
        durationMs: p.travelMs,
        data: { ...data, chargeStartAt: now, chargeEndAt: now + p.travelMs },
      };
      boss.nextSkillAt.charge = now + p.cdMs;
      return;
    }
    case 'spores': {
      const p = BOSS_B_PARAMS.spores;
      const limit = boss.phase === 1 ? BOSS_B_PARAMS.eggLimitPhase1 : BOSS_B_PARAMS.eggLimitPhase2;
      for (let i = 0; i < limit; i += 1) {
        if (state.minions.length >= BOSS_B_PARAMS.minionLimit) break;
        const angle = (Math.PI * 2 * i) / limit + Math.random() * 0.3;
        const dist = p.radius * (0.6 + Math.random() * 0.4);
        const spawnX = clamp(boss.x + Math.cos(angle) * dist, 20, MAP_CONFIG.width - 20);
        const spawnY = clamp(boss.y + Math.sin(angle) * dist, 20, MAP_CONFIG.height - 20);
        state.minions.push({
          id: nextId('min'),
          kind: 'bomber',
          x: spawnX,
          y: spawnY,
          hp: BOSS_B_PARAMS.minionHp,
          maxHp: BOSS_B_PARAMS.minionHp,
          speed: PLAYER_REF_SPEED_PX_PER_S * BOSS_B_PARAMS.minionSpeedFactor,
          fuseStartedAt: null,
          explodeAt: null,
          spawnedAt: now + p.hatchMs,
        });
      }
      boss.action = { kind: 'active', skill, startAt: now, durationMs: p.activeMs };
      boss.nextSkillAt.spores = now + p.cdMs;
      return;
    }
    case 'acidShot': {
      const p = BOSS_B_PARAMS.acidShot;
      const baseAngle = boss.action.data?.angle ?? 0;
      for (let i = 0; i < p.count; i += 1) {
        const offset = (i - (p.count - 1) / 2) * p.spread;
        const a = baseAngle + offset;
        state.projectiles.push({
          id: nextId('bp'),
          x: boss.x,
          y: boss.y,
          dx: Math.cos(a),
          dy: Math.sin(a),
          speed: p.speed,
          damage: p.damage,
          radius: 14,
          leavesAcidPool: true,
          spawnedAt: now,
          expiresAt: now + 2200,
        });
      }
      boss.action = { kind: 'active', skill, startAt: now, durationMs: p.activeMs };
      boss.nextSkillAt.acidShot = now + p.cdMs;
      return;
    }
    case 'shockRing': {
      const p = BOSS_C_PARAMS.ring;
      state.hazards.push({
        id: nextId('hz'),
        kind: 'ringActive',
        x: boss.x,
        y: boss.y,
        innerRadius: p.innerRadius,
        radius: p.outerRadius,
        startAt: now,
        endAt: now + p.activeMs,
        damage: p.damage,
        hitOnce: true,
      });
      boss.action = { kind: 'active', skill, startAt: now, durationMs: p.activeMs };
      boss.nextSkillAt.shockRing = now + p.cdMs;
      return;
    }
    case 'crossBlast': {
      const p = BOSS_C_PARAMS.cross;
      state.hazards.push({
        id: nextId('hz'),
        kind: 'crossActive',
        x: boss.x,
        y: boss.y,
        length: p.length,
        thickness: p.thickness,
        startAt: now,
        endAt: now + p.activeMs,
        damage: p.damage,
        hitOnce: true,
      });
      boss.action = { kind: 'active', skill, startAt: now, durationMs: p.activeMs };
      boss.nextSkillAt.crossBlast = now + p.cdMs;
      return;
    }
    case 'pull': {
      const p = BOSS_C_PARAMS.pull;
      state.hazards.push({
        id: nextId('hz'),
        kind: 'pullActive',
        x: boss.x,
        y: boss.y,
        radius: p.range,
        startAt: now,
        endAt: now + p.activeMs,
        damage: p.damage,
      });
      boss.action = { kind: 'active', skill, startAt: now, durationMs: p.activeMs };
      boss.nextSkillAt.pull = now + p.cdMs;
      return;
    }
    default:
      return;
  }
};

const triggerRecovery = (state: BossBattleState, ctx: BossTickContext): void => {
  const boss = state.boss;
  const now = ctx.now;
  const skill = boss.action.skill;
  if (!skill) return;

  switch (skill) {
    case 'sweep':
      boss.action = { kind: 'recovery', skill, startAt: now, durationMs: BOSS_A_PARAMS.sweep.recoveryMs };
      return;
    case 'charge':
      boss.action = { kind: 'recovery', skill, startAt: now, durationMs: BOSS_A_PARAMS.charge.recoveryMs };
      return;
    default:
      boss.action = { kind: 'idle', skill: null, startAt: now, durationMs: 0 };
      return;
  }
};

// ===== ボス行動選択（アイドル時） =====
const pickNextSkill = (state: BossBattleState, ctx: BossTickContext): void => {
  const boss = state.boss;
  const now = ctx.now;
  if (boss.action.kind !== 'idle') return;
  // 開戦直後の猶予時間中はスキル発動しない
  if (now - state.startedAt < BOSS_OPENING_GRACE_MS) return;

  switch (boss.bossType) {
    case 'A': {
      if (now >= boss.nextSkillAt.sweep) {
        if (tryStartSkill(state, 'sweep', now, ctx)) return;
      }
      if (boss.phase >= 2 && now >= boss.nextSkillAt.charge) {
        const dist = distanceBetween(boss.x, boss.y, ctx.player.x, ctx.player.y);
        if (dist > 160) {
          if (tryStartSkill(state, 'charge', now, ctx)) return;
        }
      }
      return;
    }
    case 'B': {
      if (now >= boss.nextSkillAt.spores) {
        if (tryStartSkill(state, 'spores', now, ctx)) return;
      }
      if (boss.phase >= 2 && now >= boss.nextSkillAt.acidShot) {
        if (tryStartSkill(state, 'acidShot', now, ctx)) return;
      }
      return;
    }
    case 'C': {
      if (now >= boss.nextSkillAt.shockRing) {
        if (tryStartSkill(state, 'shockRing', now, ctx)) return;
      }
      if (boss.phase >= 2 && now >= boss.nextSkillAt.crossBlast) {
        if (tryStartSkill(state, 'crossBlast', now, ctx)) return;
      }
      if (boss.phase >= 3 && now >= boss.nextSkillAt.pull) {
        if (tryStartSkill(state, 'pull', now, ctx)) return;
      }
      return;
    }
    default:
      return;
  }
};

// ===== ボス移動処理 =====
const moveBoss = (state: BossBattleState, ctx: BossTickContext): void => {
  const boss = state.boss;
  const now = ctx.now;

  // 向きをプレイヤーに合わせる
  boss.facing = ctx.player.x < boss.x ? 'left' : 'right';

  // 開戦直後の猶予時間中は移動しない（突進などの進行中アクションは除外）
  if (
    now - state.startedAt < BOSS_OPENING_GRACE_MS &&
    !(boss.action.kind === 'active' && boss.action.skill === 'charge')
  ) {
    return;
  }

  if (boss.action.kind === 'active' && boss.action.skill === 'charge') {
    const data = boss.action.data ?? {};
    const startX = data.startX ?? boss.x;
    const startY = data.startY ?? boss.y;
    const endX = data.endX ?? boss.x;
    const endY = data.endY ?? boss.y;
    const t = clamp((now - (data.chargeStartAt ?? now)) / ((data.chargeEndAt ?? now) - (data.chargeStartAt ?? now) || 1), 0, 1);
    boss.x = startX + (endX - startX) * t;
    boss.y = startY + (endY - startY) * t;
    return;
  }
  if (isImmobile(boss.action)) return;

  let speedFactor = BOSS_A_PARAMS.speedFactor;
  if (boss.bossType === 'B') speedFactor = BOSS_B_PARAMS.speedFactor;
  else if (boss.bossType === 'C') speedFactor = BOSS_C_PARAMS.speedFactor;

  moveBossToward(boss, ctx.player.x, ctx.player.y, PLAYER_REF_SPEED_PX_PER_S * speedFactor, ctx.deltaMs);
};

// ===== 召喚雑魚更新 =====
const updateMinions = (state: BossBattleState, ctx: BossTickContext): void => {
  const now = ctx.now;
  const dt = ctx.deltaMs / 1000;
  const activeMinions: BossMinion[] = [];

  for (const m of state.minions) {
    if (now < m.spawnedAt) {
      activeMinions.push(m);
      continue;
    }
    // 既に爆発済み（explodeAt 過ぎ）の場合は破棄
    // 自爆時はハートをドロップしない（プレイヤー撃破時のみドロップ）
    if (m.explodeAt !== null && now >= m.explodeAt) {
      state.hazards.push({
        id: nextId('hz'),
        kind: 'bombExplosion',
        x: m.x,
        y: m.y,
        radius: BOSS_MINION_EXPLOSION_RADIUS,
        startAt: now,
        endAt: now + 280,
        damage: BOSS_B_PARAMS.explosionDamage,
        hitOnce: true,
      });
      continue;
    }
    // プレイヤーへ移動
    const { nx, ny } = normalizedVectorTo(m.x, m.y, ctx.player.x, ctx.player.y);
    m.x = clamp(m.x + nx * m.speed * dt, 0, MAP_CONFIG.width);
    m.y = clamp(m.y + ny * m.speed * dt, 0, MAP_CONFIG.height);

    // 点火判定
    if (m.fuseStartedAt === null) {
      const dist = distanceBetween(m.x, m.y, ctx.player.x, ctx.player.y);
      if (dist <= BOSS_B_PARAMS.minionTriggerRange) {
        m.fuseStartedAt = now;
        m.explodeAt = now + BOSS_B_PARAMS.minionFuseMs;
      }
    }
    activeMinions.push(m);
  }
  state.minions = activeMinions;
};

// ===== ボス弾更新 =====
const updateBossProjectiles = (state: BossBattleState, ctx: BossTickContext): void => {
  const now = ctx.now;
  const dt = ctx.deltaMs / 1000;
  const remaining: BossProjectile[] = [];

  for (const p of state.projectiles) {
    if (now >= p.expiresAt) {
      if (p.leavesAcidPool) {
        state.hazards.push({
          id: nextId('hz'),
          kind: 'acidPool',
          x: p.x,
          y: p.y,
          radius: BOSS_B_PARAMS.acidShot.poolRadius,
          startAt: now,
          endAt: now + BOSS_B_PARAMS.acidShot.poolMs,
          damage: 6,
        });
      }
      continue;
    }
    p.x += p.dx * p.speed * dt;
    p.y += p.dy * p.speed * dt;
    if (p.x < -40 || p.x > MAP_CONFIG.width + 40 || p.y < -40 || p.y > MAP_CONFIG.height + 40) {
      continue;
    }
    remaining.push(p);
  }
  state.projectiles = remaining;
};

// ===== ハザード更新 =====
const updateHazards = (state: BossBattleState, ctx: BossTickContext): void => {
  state.hazards = state.hazards.filter(h => h.endAt > ctx.now);
};

// ===== プレイヤー被弾処理 =====
const canTakeDamage = (state: BossBattleState, now: number): boolean => {
  return now >= state.player.iFramesUntil;
};

const applyDamageToPlayer = (
  state: BossBattleState,
  damage: number,
  now: number,
  iFramesMs: number,
  knockbackFromX: number | null,
  knockbackFromY: number | null,
  playerX: number,
  playerY: number
): void => {
  if (!canTakeDamage(state, now)) return;
  state.player.hp = Math.max(0, state.player.hp - damage);
  state.player.iFramesUntil = now + iFramesMs;
  if (knockbackFromX !== null && knockbackFromY !== null) {
    const { nx, ny } = normalizedVectorTo(knockbackFromX, knockbackFromY, playerX, playerY);
    state.player.knockbackVx = nx * KNOCKBACK_SPEED;
    state.player.knockbackVy = ny * KNOCKBACK_SPEED;
    state.player.knockbackUntil = now + KNOCKBACK_DURATION_MS;
  }
};

const checkContactDamage = (state: BossBattleState, ctx: BossTickContext): void => {
  const boss = state.boss;
  const dist = distanceBetween(boss.x, boss.y, ctx.player.x, ctx.player.y);
  const hitRadius = BOSS_HITBOX_RADIUS + 18; // プレイヤー半径
  if (dist < hitRadius) {
    const contactDamage =
      boss.bossType === 'A' ? 80 : boss.bossType === 'B' ? 60 : 70;
    applyDamageToPlayer(
      state,
      contactDamage,
      ctx.now,
      I_FRAME_CONTACT_MS,
      boss.x,
      boss.y,
      ctx.player.x,
      ctx.player.y
    );
  }
};

const checkProjectileDamage = (state: BossBattleState, ctx: BossTickContext): void => {
  const remaining: BossProjectile[] = [];
  for (const p of state.projectiles) {
    const dist = distanceBetween(p.x, p.y, ctx.player.x, ctx.player.y);
    if (dist < p.radius + 18) {
      applyDamageToPlayer(state, p.damage, ctx.now, I_FRAME_PROJECTILE_MS, null, null, ctx.player.x, ctx.player.y);
      if (p.leavesAcidPool) {
        state.hazards.push({
          id: nextId('hz'),
          kind: 'acidPool',
          x: p.x,
          y: p.y,
          radius: BOSS_B_PARAMS.acidShot.poolRadius,
          startAt: ctx.now,
          endAt: ctx.now + BOSS_B_PARAMS.acidShot.poolMs,
          damage: 6,
        });
      }
      continue;
    }
    remaining.push(p);
  }
  state.projectiles = remaining;
};

const checkHazardDamage = (state: BossBattleState, ctx: BossTickContext): void => {
  const now = ctx.now;
  const dt = ctx.deltaMs / 1000;
  for (const h of state.hazards) {
    if (h.hitDone) continue;
    if (now < h.startAt || now > h.endAt) continue;

    let hit = false;
    switch (h.kind) {
      case 'fanActive': {
        hit = isInsideFan(
          ctx.player.x,
          ctx.player.y,
          h.x,
          h.y,
          h.angle ?? 0,
          h.spread ?? Math.PI / 2,
          h.radius ?? 80
        );
        break;
      }
      case 'chargeActive': {
        hit = isInsideFan(
          ctx.player.x,
          ctx.player.y,
          h.x,
          h.y,
          h.angle ?? 0,
          0.4,
          h.length ?? 400
        );
        break;
      }
      case 'ringActive': {
        const d = distanceBetween(ctx.player.x, ctx.player.y, h.x, h.y);
        hit = d >= (h.innerRadius ?? 0) && d <= (h.radius ?? 0);
        break;
      }
      case 'crossActive': {
        hit = isInsideCross(ctx.player.x, ctx.player.y, h.x, h.y, h.length ?? 400, h.thickness ?? 40);
        break;
      }
      case 'bombExplosion': {
        const d = distanceBetween(ctx.player.x, ctx.player.y, h.x, h.y);
        hit = d <= (h.radius ?? 60);
        break;
      }
      case 'bloodPool':
      case 'acidPool': {
        const d = distanceBetween(ctx.player.x, ctx.player.y, h.x, h.y);
        if (d <= (h.radius ?? 50)) {
          // 継続ダメージ（dt スケール）: iFrames を消費せず少量ずつ削る
          if (canTakeDamage(state, now)) {
            state.player.hp = Math.max(0, state.player.hp - h.damage * dt * 20);
          }
        }
        continue;
      }
      default:
        break;
    }

    if (hit) {
      applyDamageToPlayer(
        state,
        h.damage,
        now,
        I_FRAME_HAZARD_MS,
        h.x,
        h.y,
        ctx.player.x,
        ctx.player.y
      );
      if (h.hitOnce) h.hitDone = true;
    }
  }
};

// ===== 引力パルス =====
const applyPullForce = (
  state: BossBattleState,
  ctx: BossTickContext
): { dx: number; dy: number } => {
  let dx = 0;
  let dy = 0;
  for (const h of state.hazards) {
    const isActive = h.kind === 'pullActive';
    const isTelegraph = h.kind === 'pullTelegraph';
    if (!isActive && !isTelegraph) continue;
    if (ctx.now < h.startAt || ctx.now > h.endAt) continue;
    const d = distanceBetween(ctx.player.x, ctx.player.y, h.x, h.y);
    if (d > (h.radius ?? 0) || d < 4) continue;
    // 予兆中は弱く、発動中は強く吸引（予兆段階から徐々に引き寄せが強まる）
    const life = Math.max(1, h.endAt - h.startAt);
    const elapsed = Math.max(0, ctx.now - h.startAt);
    const progress = Math.min(1, elapsed / life);
    const baseStrength = isActive ? 220 : 70 + 90 * progress; // 予兆: 70→160, 発動: 220
    const strength = baseStrength * (ctx.deltaMs / 1000);
    const { nx, ny } = normalizedVectorTo(ctx.player.x, ctx.player.y, h.x, h.y);
    dx += nx * strength;
    dy += ny * strength;
  }
  return { dx, dy };
};

// ===== フェーズ遷移 =====
const updatePhase = (state: BossBattleState, now: number): void => {
  const newPhase = computePhase(state.boss.hp, state.boss.maxHp);
  if (newPhase !== state.boss.phase) {
    state.boss.phase = newPhase;
    if (newPhase === 2) {
      if (state.boss.bossType === 'A') state.boss.nextSkillAt.charge = now + 800;
      if (state.boss.bossType === 'B') state.boss.nextSkillAt.acidShot = now + 800;
      if (state.boss.bossType === 'C') state.boss.nextSkillAt.crossBlast = now + 800;
    }
    if (newPhase === 3) {
      if (state.boss.bossType === 'C') state.boss.nextSkillAt.pull = now + 1200;
    }
  }
};

// ===== メインティック =====
export const tickBossBattle = (
  state: BossBattleState,
  deltaMs: number,
  player: PlayerState
): { state: BossBattleState; pulledPlayerDelta: { dx: number; dy: number } } => {
  if (!state.active || state.result !== 'ongoing') {
    return { state, pulledPlayerDelta: { dx: 0, dy: 0 } };
  }
  const now = performance.now();
  const ctx: BossTickContext = { now, deltaMs, player };

  advanceAction(state, ctx);
  pickNextSkill(state, ctx);
  moveBoss(state, ctx);
  updateMinions(state, ctx);
  updateBossProjectiles(state, ctx);
  updateHazards(state, ctx);

  checkContactDamage(state, ctx);
  checkProjectileDamage(state, ctx);
  checkHazardDamage(state, ctx);

  updatePhase(state, now);

  if (state.boss.hp <= 0) {
    state.result = 'win';
    state.active = false;
  } else if (state.player.hp <= 0) {
    state.result = 'lose';
    state.active = false;
  }

  const pulledPlayerDelta = applyPullForce(state, ctx);
  return { state, pulledPlayerDelta };
};

// ===== プレイヤー攻撃の反映 =====
interface AttackResult {
  bossDamage: number;
  minionKills: BossMinion[];
  drops: DroppedItem[];
}

export const applyPlayerProjectileToBoss = (
  state: BossBattleState,
  projX: number,
  projY: number,
  damage: number,
  alreadyHitIds?: ReadonlySet<string>
): { hitBoss: boolean; hitMinionId: string | null; drops: DroppedItem[] } => {
  const result = { hitBoss: false, hitMinionId: null as string | null, drops: [] as DroppedItem[] };
  if (!state.active || state.result !== 'ongoing') return result;

  const boss = state.boss;
  const bossAlreadyHit = alreadyHitIds?.has(boss.id) ?? false;
  if (!bossAlreadyHit) {
    const d = distanceBetween(projX, projY, boss.x, boss.y);
    if (d < BOSS_HITBOX_RADIUS) {
      boss.hp = Math.max(0, boss.hp - damage);
      result.hitBoss = true;
      return result;
    }
  }
  for (const m of state.minions) {
    if (alreadyHitIds?.has(m.id)) continue;
    const dm = distanceBetween(projX, projY, m.x, m.y);
    if (dm < BOSS_MINION_RADIUS) {
      m.hp -= damage;
      result.hitMinionId = m.id;
      if (m.hp <= 0) {
        state.minions = state.minions.filter(x => x.id !== m.id);
        if (Math.random() < HEALING_DROP_RATE) {
          result.drops.push({
            id: nextId('drop'),
            type: 'heart',
            x: m.x,
            y: m.y,
          });
        }
      }
      return result;
    }
  }
  return result;
};

export const applyPlayerMeleeToBossBattle = (
  state: BossBattleState,
  attackX: number,
  attackY: number,
  range: number,
  damage: number,
  playerX: number,
  playerY: number
): AttackResult => {
  const result: AttackResult = { bossDamage: 0, minionKills: [], drops: [] };
  if (!state.active || state.result !== 'ongoing') return result;

  const boss = state.boss;
  const dx = boss.x - attackX;
  const dy = boss.y - attackY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const toBossX = boss.x - playerX;
  const toBossY = boss.y - playerY;
  const dirVecX = attackX - playerX;
  const dirVecY = attackY - playerY;
  const dirLen = Math.sqrt(dirVecX * dirVecX + dirVecY * dirVecY) || 1;
  const dot = (toBossX * dirVecX + toBossY * dirVecY) / dirLen;
  const effectiveRange = dot > 0 ? range : range * 0.6;
  if (dist < effectiveRange + BOSS_HITBOX_RADIUS) {
    boss.hp = Math.max(0, boss.hp - damage);
    result.bossDamage = damage;
  }

  const remainingMinions: BossMinion[] = [];
  for (const m of state.minions) {
    const mdx = m.x - attackX;
    const mdy = m.y - attackY;
    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
    if (mdist < effectiveRange + BOSS_MINION_RADIUS) {
      m.hp -= damage;
      if (m.hp <= 0) {
        result.minionKills.push(m);
        if (Math.random() < HEALING_DROP_RATE) {
          result.drops.push({
            id: nextId('drop'),
            type: 'heart',
            x: m.x,
            y: m.y,
          });
        }
        continue;
      }
    }
    remainingMinions.push(m);
  }
  state.minions = remainingMinions;
  return result;
};

// ===== プレイヤー位置補正（ノックバック・吸引） =====
export const applyBossPlayerMotion = (
  state: BossBattleState,
  playerX: number,
  playerY: number,
  deltaMs: number,
  pulledDelta: { dx: number; dy: number }
): { x: number; y: number } => {
  const now = performance.now();
  let x = playerX + pulledDelta.dx;
  let y = playerY + pulledDelta.dy;
  if (now < state.player.knockbackUntil) {
    const dt = deltaMs / 1000;
    x += state.player.knockbackVx * dt;
    y += state.player.knockbackVy * dt;
    // 減衰
    const remaining = (state.player.knockbackUntil - now) / KNOCKBACK_DURATION_MS;
    state.player.knockbackVx *= clamp(remaining, 0, 1);
    state.player.knockbackVy *= clamp(remaining, 0, 1);
  } else {
    state.player.knockbackVx = 0;
    state.player.knockbackVy = 0;
  }
  x = clamp(x, 0, MAP_CONFIG.width);
  y = clamp(y, 0, MAP_CONFIG.height);
  return { x, y };
};

// ===== 回復アイテム処理 =====
export const healPlayerByAmount = (
  state: BossBattleState,
  amount: number
): void => {
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
};

// ===== pending drops 取得 =====
export const drainPendingDrops = (state: BossBattleState): DroppedItem[] => {
  const drops = state.pendingDrops;
  state.pendingDrops = [];
  return drops;
};

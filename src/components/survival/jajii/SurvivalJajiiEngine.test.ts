import {
  clampOffsetRing,
  consumeDueMiniSpecialIfDue,
  createInitialJajiiState,
  JAJII_MIN_RADIUS,
  JAJII_MAX_RADIUS,
  JAJII_FOLLOW_TRIGGER_RADIUS,
  JAJII_MOVE_SPEED_PX_PER_SEC,
  tryScheduleMiniSpecial,
  shouldEnableJajiiSupport,
  pickRandomRingOffset,
  updateJajiiMovementInPlace,
  getJajiiWorldPosition,
} from '@/components/survival/jajii/SurvivalJajiiEngine';
import { describe, expect, it, vi } from 'vitest';

describe('SurvivalJajiiEngine', () => {
  describe('shouldEnableJajiiSupport', () => {
    it('ステージモードかつ lesson でなくシナリオでないとき true', () => {
      expect(
        shouldEnableJajiiSupport({
          isStageMode: true,
          scenarioMode: false,
          survivalTutorialLayout: false,
          mapCategory: 'basic',
        }),
      ).toBe(true);
    });

    it('lesson では false', () => {
      expect(
        shouldEnableJajiiSupport({
          isStageMode: true,
          scenarioMode: false,
          survivalTutorialLayout: false,
          mapCategory: 'lesson',
        }),
      ).toBe(false);
    });

    it('scenarioMode のとき false', () => {
      expect(
        shouldEnableJajiiSupport({
          isStageMode: true,
          scenarioMode: true,
          survivalTutorialLayout: false,
          mapCategory: 'basic',
        }),
      ).toBe(false);
    });

    it('scenarioMode と lesson でも tutorialDialogueJajii が true なら有効', () => {
      expect(
        shouldEnableJajiiSupport({
          isStageMode: true,
          scenarioMode: true,
          survivalTutorialLayout: true,
          mapCategory: 'lesson',
          tutorialDialogueJajii: true,
        }),
      ).toBe(true);
    });
  });

  describe('tryScheduleMiniSpecial', () => {
    it('最大1件まで（予約中は無視）', () => {
      const st = createInitialJajiiState(100, 100);
      expect(tryScheduleMiniSpecial(st, 10)).toBe(true);
      expect(st.pendingMiniFireAtSec).toBe(10 + 2);
      expect(tryScheduleMiniSpecial(st, 10)).toBe(false);
    });
  });

  describe('consumeDueMiniSpecialIfDue', () => {
    it('時刻到来で pending が解除される', () => {
      const st = createInitialJajiiState(100, 100);
      tryScheduleMiniSpecial(st, 10);
      expect(consumeDueMiniSpecialIfDue(st, 11.9)).toBe(false);
      expect(st.pendingMiniFireAtSec).not.toBe(null);
      expect(consumeDueMiniSpecialIfDue(st, 12)).toBe(true);
      expect(st.pendingMiniFireAtSec).toBe(null);
    });
  });

  describe('updateJajiiMovementInPlace', () => {
    it('移動中はターゲットを変えない', () => {
      const st = createInitialJajiiState(100, 100);
      const target0 = { x: st.targetWorldX, y: st.targetWorldY };
      const before = getJajiiWorldPosition(st);
      updateJajiiMovementInPlace(st, 500, 500, 0, 0.05);
      expect(st.targetWorldX).toBe(target0.x);
      expect(st.targetWorldY).toBe(target0.y);
      const after = getJajiiWorldPosition(st);
      const moved = Math.hypot(after.x - before.x, after.y - before.y);
      expect(moved).toBeLessThanOrEqual(JAJII_MOVE_SPEED_PX_PER_SEC * 0.05 + 1);
    });

    it('追いついたあとプレイヤーが近くにいれば静止する', () => {
      const st = createInitialJajiiState(100, 100);
      st.worldX = 150;
      st.worldY = 100;
      st.targetWorldX = 150;
      st.targetWorldY = 100;
      const before = getJajiiWorldPosition(st);
      updateJajiiMovementInPlace(st, 160, 100, 0, 0.05);
      expect(getJajiiWorldPosition(st)).toEqual(before);
    });

    it('追いついたあとプレイヤーが離れたら次 leg へ向かう', () => {
      const st = createInitialJajiiState(100, 100);
      st.worldX = 150;
      st.worldY = 100;
      st.targetWorldX = 150;
      st.targetWorldY = 100;
      const before = getJajiiWorldPosition(st);
      updateJajiiMovementInPlace(st, 500, 500, 0, 0.05);
      expect(st.targetWorldX).not.toBe(150);
      expect(st.targetWorldY).not.toBe(100);
      const after = getJajiiWorldPosition(st);
      const moved = Math.hypot(after.x - before.x, after.y - before.y);
      expect(moved).toBeGreaterThan(0);
      const distToNewTarget = Math.hypot(st.targetWorldX - 500, st.targetWorldY - 500);
      expect(distToNewTarget).toBeGreaterThanOrEqual(JAJII_MIN_RADIUS - 1);
      expect(distToNewTarget).toBeLessThanOrEqual(JAJII_MAX_RADIUS + 1);
      expect(JAJII_FOLLOW_TRIGGER_RADIUS).toBe(JAJII_MAX_RADIUS);
    });
  });

  describe('clampOffsetRing', () => {
    it('長さが最大を超えるとクランプされる', () => {
      const r = clampOffsetRing(1000, 0, JAJII_MIN_RADIUS, JAJII_MAX_RADIUS);
      const len = Math.hypot(r.x, r.y);
      expect(len).toBeLessThanOrEqual(JAJII_MAX_RADIUS + 1e-6);
      expect(len).toBeGreaterThanOrEqual(JAJII_MIN_RADIUS - 1e-6);
    });

    it('極短ベクトルはリング上のランダムへ置換される', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.25);
      const r = clampOffsetRing(0, 0, JAJII_MIN_RADIUS, JAJII_MAX_RADIUS);
      const len = Math.hypot(r.x, r.y);
      expect(len).toBeGreaterThanOrEqual(JAJII_MIN_RADIUS - 1e-6);
      expect(len).toBeLessThanOrEqual(JAJII_MAX_RADIUS + 1e-6);
      vi.restoreAllMocks();
    });
  });

  describe('pickRandomRingOffset', () => {
    it('半径が min〜max の間にある', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const r = pickRandomRingOffset(60, 180);
      const len = Math.hypot(r.x, r.y);
      expect(len).toBe(60);
      vi.spyOn(Math, 'random').mockReturnValue(0.999999);
      const r2 = pickRandomRingOffset(60, 180);
      const len2 = Math.hypot(r2.x, r2.y);
      expect(len2).toBeLessThanOrEqual(180 + 1e-6);
      vi.restoreAllMocks();
    });
  });
});

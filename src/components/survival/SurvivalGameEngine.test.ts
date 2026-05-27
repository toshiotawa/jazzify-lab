import { describe, expect, it, vi } from 'vitest';
import type { ChordDefinition } from '../fantasy/FantasyGameEngine';
import type { CodeSlot } from './SurvivalTypes';
import { createChordNameText, initializeCodeSlots, resetIncompleteOtherSlotCorrectNotes, resolveSurvivalHintSlotIndex, selectProgressionChord, spawnScenarioTutorialEnemyAt, updateComboOnABHit, expireComboIfTimedOut } from './SurvivalGameEngine';
import { getSurvivalStageBattleKind } from './SurvivalStageDefinitions';

vi.mock('@/platform/supabaseClient', () => ({
  getSupabaseClient: () => ({}),
}));

const buildChord = (id: string): ChordDefinition => ({
  id,
  displayName: id,
  notes: [60, 64, 67],
  noteNames: ['C', 'E', 'G'],
  quality: 'progression',
  root: 'C',
});

describe('survival progression code slots', () => {
  const progressionChords = [buildChord('Cmaj7'), buildChord('Dm7'), buildChord('G7')];

  it('enables only the Punch slot and seeds current/next in order', () => {
    const slots = initializeCodeSlots([], true, true, progressionChords);

    expect(slots.current.map(slot => slot.isEnabled)).toEqual([false, true, false, false]);
    expect(slots.next.map(slot => slot.isEnabled)).toEqual([false, true, false, false]);
    expect(slots.current[1].chord?.displayName).toBe('Cmaj7');
    expect(slots.next[1].chord?.displayName).toBe('Dm7');
    expect(slots.current[0].chord).toBeNull();
    expect(slots.current[2].chord).toBeNull();
    expect(slots.current[3].chord).toBeNull();
  });

  it('keeps only Punch enabled even when progression data is empty', () => {
    const slots = initializeCodeSlots([], true, true, []);

    expect(slots.current.map(slot => slot.isEnabled)).toEqual([false, true, false, false]);
    expect(slots.next.map(slot => slot.isEnabled)).toEqual([false, true, false, false]);
    expect(slots.current[1].chord).toBeNull();
    expect(slots.next[1].chord).toBeNull();
  });

  it('uses progression chords on block-final boss stages too (Punch only)', () => {
    // ボス戦相当でも progression データがある限り Punch スロットに進行を流す。
    // SurvivalGameScreen 側では isProgressionStage を stageType ベースで判定するため、
    // ここでは progressionChords を渡したケースが期待どおり動くことを担保する。
    const slots = initializeCodeSlots([], false, true, progressionChords);

    expect(slots.current[1].isEnabled).toBe(true);
    expect(slots.current[1].chord?.displayName).toBe('Cmaj7');
    expect(slots.next[1].chord?.displayName).toBe('Dm7');
    expect(slots.current[0].isEnabled).toBe(false);
    expect(slots.current[2].isEnabled).toBe(false);
    expect(slots.current[3].isEnabled).toBe(false);
    expect(resolveSurvivalHintSlotIndex(slots.current)).toBe(1);
  });

  it('random + Shot 無効化（HINT / basic / lesson）は Web と同様 Punch のみコードを載せる', () => {
    const slots = initializeCodeSlots(['CM7', 'Dm7'], false, true, null, true);

    expect(slots.current.map(s => s.isEnabled)).toEqual([false, true, false, false]);
    expect(slots.next.map(s => s.isEnabled)).toEqual([false, true, false, false]);
    expect(slots.current[0].chord).toBeNull();
    expect(slots.next[0].chord).toBeNull();
    expect(slots.current[1].chord).not.toBeNull();
    expect(slots.next[1].chord).not.toBeNull();
    expect(resolveSurvivalHintSlotIndex(slots.current)).toBe(1);
  });

  it('random + HINT 時は Punch の current と next が同一 ID にならない（複数コードがある限り）', () => {
    const allowed = ['CM7', 'Dm7', 'Gm7'];
    for (let i = 0; i < 100; i += 1) {
      const slots = initializeCodeSlots(allowed, false, true, null, true);
      const cur = slots.current[1].chord?.id;
      const nex = slots.next[1].chord?.id;
      expect(cur, `trial ${i}`).toBeDefined();
      expect(nex, `trial ${i}`).toBeDefined();
      expect(cur, `trial ${i}`).not.toBe(nex);
    }
  });

  it('selects progression chords sequentially with wraparound', () => {
    expect(selectProgressionChord(progressionChords, 0)?.displayName).toBe('Cmaj7');
    expect(selectProgressionChord(progressionChords, 1)?.displayName).toBe('Dm7');
    expect(selectProgressionChord(progressionChords, 2)?.displayName).toBe('G7');
    expect(selectProgressionChord(progressionChords, 3)?.displayName).toBe('Cmaj7');
  });
});

describe('survival stage battle kind', () => {
  it('prioritizes boss battles on block-final progression stages', () => {
    expect(getSurvivalStageBattleKind('progression', true)).toBe('boss');
  });

  it('keeps non-final progression stages in progression gameplay', () => {
    expect(getSurvivalStageBattleKind('progression', false)).toBe('progression');
  });

  it('keeps non-final random stages in random gameplay', () => {
    expect(getSurvivalStageBattleKind('random', false)).toBe('random');
  });
});

const baseSlot = (overrides: Partial<CodeSlot> & Pick<CodeSlot, 'type'>): CodeSlot => ({
  chord: null,
  correctNotes: [],
  timer: 10,
  isCompleted: false,
  isEnabled: true,
  ...overrides,
});

describe('resetIncompleteOtherSlotCorrectNotes', () => {
  it('clears partial progress on incomplete enabled slots when others complete this input', () => {
    const row: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
      baseSlot({ type: 'A', correctNotes: [0], isCompleted: true, completedTime: 1 }),
      baseSlot({ type: 'B', correctNotes: [1, 5] }),
      baseSlot({ type: 'C', isEnabled: false, correctNotes: [2] }),
      baseSlot({ type: 'D', correctNotes: [] }),
    ];

    const next = resetIncompleteOtherSlotCorrectNotes(row, [0]);

    expect(next[0]).toBe(row[0]);
    expect(next[1].correctNotes).toEqual([]);
    expect(next[2].correctNotes).toEqual([2]);
    expect(next[3]).toBe(row[3]);
  });

  it('does nothing when no completions and leaves array reference stable', () => {
    const row: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
      baseSlot({ type: 'A' }),
      baseSlot({ type: 'B', correctNotes: [1] }),
      baseSlot({ type: 'C', isEnabled: false }),
      baseSlot({ type: 'D' }),
    ];

    const next = resetIncompleteOtherSlotCorrectNotes(row, []);
    expect(next).toBe(row);
    expect(next[1].correctNotes).toEqual([1]);
  });

  it('preserves another slot that is already completed and awaiting rollover', () => {
    const row: [CodeSlot, CodeSlot, CodeSlot, CodeSlot] = [
      baseSlot({ type: 'A', correctNotes: [], isCompleted: true, completedTime: 99 }),
      baseSlot({ type: 'B', correctNotes: [0, 4, 7], isCompleted: true, completedTime: 100 }),
      baseSlot({ type: 'C', correctNotes: [9] }),
      baseSlot({ type: 'D' }),
    ];

    const next = resetIncompleteOtherSlotCorrectNotes(row, [1]);

    expect(next[0].correctNotes).toEqual([]);
    expect(next[2].correctNotes).toEqual([]);
    expect(next[1].isCompleted).toBe(true);
  });
});

describe('survival combo / special (iOS parity)', () => {
  it('accumulates combo and gauge for four successive A/B hits; not ready yet', () => {
    let combo = { comboCount: 0, comboGauge: 0, comboReady: false, lastComboHitAt: 0 };
    for (let t = 1; t <= 4; t += 1) {
      const r = updateComboOnABHit(combo, t);
      expect(r.triggeredSpecial).toBe(false);
      combo = {
        comboCount: r.comboCount,
        comboGauge: r.comboGauge,
        comboReady: r.comboReady,
        lastComboHitAt: r.lastComboHitAt,
      };
    }
    expect(combo.comboCount).toBe(4);
    expect(combo.comboGauge).toBe(4);
    expect(combo.comboReady).toBe(false);
  });

  it('fifth hit fills gauge and sets ready without triggering special', () => {
    let combo = { comboCount: 0, comboGauge: 0, comboReady: false, lastComboHitAt: 0 };
    for (let t = 1; t <= 5; t += 1) {
      const r = updateComboOnABHit(combo, t);
      expect(r.triggeredSpecial).toBe(false);
      combo = {
        comboCount: r.comboCount,
        comboGauge: r.comboGauge,
        comboReady: r.comboReady,
        lastComboHitAt: r.lastComboHitAt,
      };
    }
    expect(combo.comboCount).toBe(5);
    expect(combo.comboGauge).toBe(5);
    expect(combo.comboReady).toBe(true);
  });

  it('next hit when ready triggers special and resets gauge', () => {
    const r = updateComboOnABHit(
      { comboCount: 5, comboGauge: 5, comboReady: true, lastComboHitAt: 5 },
      6,
    );
    expect(r.triggeredSpecial).toBe(true);
    expect(r.comboGauge).toBe(0);
    expect(r.comboReady).toBe(false);
    expect(r.comboCount).toBe(6);
  });

  it('expireComboIfTimedOut clears after COMBO_RESET_INTERVAL_SEC', () => {
    const cleared = expireComboIfTimedOut(
      { comboCount: 3, comboGauge: 2, comboReady: false, lastComboHitAt: 10 },
      16,
    );
    expect(cleared.comboCount).toBe(0);
    expect(cleared.comboGauge).toBe(0);
    expect(cleared.comboReady).toBe(false);
  });

  it('expireComboIfTimedOut keeps state within interval', () => {
    const kept = expireComboIfTimedOut(
      { comboCount: 3, comboGauge: 2, comboReady: false, lastComboHitAt: 10 },
      14,
    );
    expect(kept.comboCount).toBe(3);
    expect(kept.comboGauge).toBe(2);
    expect(kept.comboReady).toBe(false);
  });
});

describe('scenario tutorial spawn (slime HP=1)', () => {
  it('spawnScenarioTutorialEnemyAt uses slime type, atk 0 and HP 1', () => {
    const e = spawnScenarioTutorialEnemyAt(100, 200);
    expect(e.type).toBe('slime');
    expect(e.x).toBe(100);
    expect(e.y).toBe(200);
    expect(e.stats.hp).toBe(1);
    expect(e.stats.maxHp).toBe(1);
    expect(e.stats.atk).toBe(0);
    expect(e.stats.speed).toBe(0);
    expect(e.isBoss).toBe(false);
    expect(typeof e.id).toBe('string');
    expect(e.id.startsWith('scenario_')).toBe(true);
  });

  it('createChordNameText emits iOS-style chord floating text', () => {
    const text = createChordNameText(120, 180, 'Dm7');

    expect(text.text).toBe('Dm7');
    expect(text.textKind).toBe('chord-name');
    expect(text.damage).toBe(0);
    expect(text.x).toBe(120);
    expect(text.y).toBe(136);
    expect(text.color).toBe('#d9f2ff');
    expect(text.duration).toBe(1000);
    expect(text.id.startsWith('chord_')).toBe(true);
  });
});

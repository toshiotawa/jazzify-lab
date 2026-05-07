import { describe, expect, it, vi } from 'vitest';
import type { ChordDefinition } from '../fantasy/FantasyGameEngine';
import { initializeCodeSlots, selectProgressionChord } from './SurvivalGameEngine';

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

  it('selects progression chords sequentially with wraparound', () => {
    expect(selectProgressionChord(progressionChords, 0)?.displayName).toBe('Cmaj7');
    expect(selectProgressionChord(progressionChords, 1)?.displayName).toBe('Dm7');
    expect(selectProgressionChord(progressionChords, 2)?.displayName).toBe('G7');
    expect(selectProgressionChord(progressionChords, 3)?.displayName).toBe('Cmaj7');
  });
});

import type { PrecisionNote } from '@/utils/earTrainingPrecisionNotes';
import {
  createPrecisionRuntimeStates,
  type PrecisionNoteRuntimeState,
} from '@/utils/earTrainingPrecisionJudge';
import { PrecisionAutoPlayScheduler } from '@/utils/earTrainingPrecisionAutoPlay';

const makeNote = (
  id: string,
  midi: number,
  startSec: number,
  durationSec: number,
  isShortNote: boolean,
): PrecisionNote => ({
  id,
  midi,
  startSec,
  durationSec,
  isBlackKey: false,
  measureNumber: 1,
  isShortNote,
});

describe('PrecisionAutoPlayScheduler', () => {
  it('note on / off をタイムラインに従って発火する', () => {
    const notes = [
      makeNote('a', 60, 1, 0.5, false),
      makeNote('b', 64, 1.5, 0.25, true),
    ];
    const states = createPrecisionRuntimeStates(notes);
    const scheduler = new PrecisionAutoPlayScheduler();
    scheduler.setNotes(notes);
    scheduler.reset();

    const events: string[] = [];
    const callbacks = {
      onNoteOn: (midi: number, noteId: string) => {
        events.push(`on:${noteId}:${midi}`);
      },
      onNoteOff: (midi: number, noteId: string) => {
        events.push(`off:${noteId}:${midi}`);
      },
    };

    expect(scheduler.tick(0.5, states, callbacks)).toBe(false);
    expect(scheduler.tick(1, states, callbacks)).toBe(true);
    expect(states.get('a')?.judgment).toBe('good');
    expect(events).toEqual(['on:a:60']);

    expect(scheduler.tick(1.5, states, callbacks)).toBe(true);
    expect(states.get('b')?.judgment).toBe('good');
    expect(states.get('b')?.hiddenFromLane).toBe(true);
    expect(states.get('a')?.hiddenFromLane).toBe(true);
    expect(events).toEqual(['on:a:60', 'on:b:64', 'off:a:60']);

    expect(scheduler.tick(2, states, callbacks)).toBe(false);
  });

  it('既に good のノーツは二重 note on しない', () => {
    const notes = [makeNote('a', 60, 1, 0.5, false)];
    const states = createPrecisionRuntimeStates(notes);
    const state = states.get('a');
    if (state) {
      state.judgment = 'good';
    }
    const scheduler = new PrecisionAutoPlayScheduler();
    scheduler.setNotes(notes);
    scheduler.reset();

    const events: string[] = [];
    expect(scheduler.tick(2, states, {
      onNoteOn: () => { events.push('on'); },
      onNoteOff: () => { events.push('off'); },
    })).toBe(false);
    expect(events).toEqual([]);
  });

  it('シーク後に pending ノーツを再処理できる', () => {
    const notes = [makeNote('a', 60, 1, 0.5, false)];
    const states = createPrecisionRuntimeStates(notes);
    const scheduler = new PrecisionAutoPlayScheduler();
    scheduler.setNotes(notes);
    scheduler.reset();

    scheduler.tick(2, states, {
      onNoteOn: () => undefined,
      onNoteOff: () => undefined,
    });
    expect(states.get('a')?.judgment).toBe('good');

    const resetStates = createPrecisionRuntimeStates(notes);
    scheduler.syncAfterSeek(0.5, resetStates);
    expect(scheduler.tick(1, resetStates, {
      onNoteOn: () => undefined,
      onNoteOff: () => undefined,
    })).toBe(true);
    expect(resetStates.get('a')?.judgment).toBe('good');
  });
});

import {
  acceptPhraseNoteOn,
  releasePhraseNote,
  resetPhraseNoteGate,
  syncPhraseInputGateAfterEvaluation,
} from './survivalPhraseInputGate';

describe('survivalPhraseInputGate', () => {
  it('accepts first note-on per pitch class and rejects held repeats', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    expect(acceptPhraseNoteOn(held, 67)).toBe(true);
    expect(acceptPhraseNoteOn(held, 64)).toBe(false);
    expect(acceptPhraseNoteOn(held, 67)).toBe(false);
  });

  it('allows the same pitch class again after note-off', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    expect(acceptPhraseNoteOn(held, 64)).toBe(false);
    releasePhraseNote(held, 64);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('reset clears all held pitch classes', () => {
    const held = new Set<number>();
    acceptPhraseNoteOn(held, 64);
    acceptPhraseNoteOn(held, 67);
    resetPhraseNoteGate(held);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('measure-complete resets gate so same pitch class accepts again', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    syncPhraseInputGateAfterEvaluation(held, 'measure-complete');
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('phrase-complete resets gate same as measure-complete', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    syncPhraseInputGateAfterEvaluation(held, 'phrase-complete');
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('miss resets gate', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    syncPhraseInputGateAfterEvaluation(held, 'miss');
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('progress does not reset gate; duplicate pitch class stays rejected', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    expect(acceptPhraseNoteOn(held, 64)).toBe(false);
    syncPhraseInputGateAfterEvaluation(held, 'progress');
    expect(acceptPhraseNoteOn(held, 64)).toBe(false);
    releasePhraseNote(held, 64);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });
});

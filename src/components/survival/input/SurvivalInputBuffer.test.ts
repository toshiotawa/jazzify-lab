import {
  SurvivalInputBuffer,
  dedupeFrameNoteOnsByPitchClass,
} from './SurvivalInputBuffer';

describe('SurvivalInputBuffer', () => {
  it('drains note-ons and clears queue', () => {
    const buf = new SurvivalInputBuffer();
    buf.enqueueNoteOn(62, 90);
    buf.enqueueNoteOn(64, 100);
    const frame = buf.drain();
    expect(frame.noteOns).toEqual([{ midi: 62, velocity: 90 }, { midi: 64, velocity: 100 }]);
    expect(buf.drain().noteOns).toEqual([]);
  });

  it('dedupes same pitch class within one frame', () => {
    const deduped = dedupeFrameNoteOnsByPitchClass([
      { midi: 62, velocity: 100 },
      { midi: 74, velocity: 100 },
    ]);
    expect(deduped).toEqual([{ midi: 62, velocity: 100 }]);
  });

  it('keeps distinct pitch classes in order', () => {
    const deduped = dedupeFrameNoteOnsByPitchClass([
      { midi: 62, velocity: 100 },
      { midi: 64, velocity: 100 },
    ]);
    expect(deduped.map((n) => n.midi)).toEqual([62, 64]);
  });
});

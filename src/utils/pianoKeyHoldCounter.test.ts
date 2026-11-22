import { PianoKeyHoldCounter } from './pianoKeyHoldCounter';

describe('PianoKeyHoldCounter', () => {
  it('fires note on only on first press and off on last release', () => {
    const counter = new PianoKeyHoldCounter();
    expect(counter.press(60)).toBe(true);
    expect(counter.press(60)).toBe(false);
    expect(counter.release(60)).toBe(false);
    expect(counter.release(60)).toBe(true);
  });

  it('tracks independent midis for chord playing', () => {
    const counter = new PianoKeyHoldCounter();
    expect(counter.press(60)).toBe(true);
    expect(counter.press(64)).toBe(true);
    expect(counter.release(60)).toBe(true);
    expect(counter.release(64)).toBe(true);
  });
});
import { describe, expect, it } from 'vitest';

import {
  createConstantTempoMap,
  midiTickToSeconds,
  parseSurvivalTutorialV4MidiTempoMap,
  quarterBeatsToTick,
} from '../parseSurvivalTutorialV4Midi';

/** 最小 SMF(format 0, division 480) を組み立てる。 */
const buildSampleMidi = (): Uint8Array => {
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // header length 6
    0x00, 0x00, // format 0
    0x00, 0x01, // ntrks 1
    0x01, 0xe0, // division 480
  ];
  const trackEvents = [
    0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, // tick 0: tempo 500000us (120bpm)
    0x87, 0x40, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40, // +960 ticks: tempo 1000000us (60bpm)
    0x00, 0xff, 0x2f, 0x00, // end of track
  ];
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    0x00, 0x00, 0x00, trackEvents.length,
  ];
  return new Uint8Array([...header, ...trackHeader, ...trackEvents]);
};

describe('parseSurvivalTutorialV4MidiTempoMap', () => {
  it('ヘッダの division と全テンポイベントを読む', () => {
    const map = parseSurvivalTutorialV4MidiTempoMap(buildSampleMidi());
    expect(map.ticksPerQuarter).toBe(480);
    expect(map.tempos).toEqual([
      { tick: 0, usPerQuarter: 500000 },
      { tick: 960, usPerQuarter: 1000000 },
    ]);
  });

  it('テンポ変化をまたいで tick→秒を区間積分する', () => {
    const map = parseSurvivalTutorialV4MidiTempoMap(buildSampleMidi());
    expect(midiTickToSeconds(map, 480)).toBeCloseTo(0.5, 6);
    expect(midiTickToSeconds(map, 960)).toBeCloseTo(1.0, 6);
    expect(midiTickToSeconds(map, 1440)).toBeCloseTo(2.0, 6);
  });

  it('quarterBeatsToTick は division を掛ける', () => {
    const map = parseSurvivalTutorialV4MidiTempoMap(buildSampleMidi());
    expect(quarterBeatsToTick(map, 2)).toBe(960);
  });

  it('MThd が無い場合はエラー', () => {
    expect(() => parseSurvivalTutorialV4MidiTempoMap(new Uint8Array([0, 1, 2, 3]))).toThrow();
  });
});

describe('createConstantTempoMap', () => {
  it('一定 BPM のテンポマップを返す', () => {
    const map = createConstantTempoMap(120);
    expect(map.ticksPerQuarter).toBe(480);
    expect(map.tempos).toEqual([{ tick: 0, usPerQuarter: 500000 }]);
    expect(midiTickToSeconds(map, 960)).toBeCloseTo(1.0, 6);
  });
});

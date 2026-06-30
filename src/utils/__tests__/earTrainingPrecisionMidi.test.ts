import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildPrecisionNotesFromMusicXml,
  calibratePrecisionNotes,
  isPrecisionShortNoteDuration,
  isPrecisionShortNoteQuarterLength,
  precisionShortNoteMaxDurationSec,
  withPrecisionShortNoteFlags,
} from '@/utils/earTrainingPrecisionNotes';
import { buildPrecisionNotesFromMidi } from '@/utils/earTrainingPrecisionMidi';

const MINIMAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part>
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <key><fifths>0</fifths></key>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note>
    </measure>
  </part>
</score-partwise>`;

const encodeVlq = (value: number): number[] => {
  let v = value >>> 0;
  const bytes = [v & 0x7f];
  while (v > 0x7f) {
    v >>>= 7;
    bytes.unshift((v & 0x7f) | 0x80);
  }
  return bytes;
};

const writeUint32 = (value: number): number[] => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];

const writeUint16 = (value: number): number[] => [(value >> 8) & 0xff, value & 0xff];

const buildMinimalSmf = (events: Array<{ tick: number; kind: 'on' | 'off'; midi: number }>): Uint8Array => {
  const ticksPerQuarter = 480;
  const trackBytes: number[] = [];
  let previousTick = 0;
  const pushDelta = (tick: number): void => {
    trackBytes.push(...encodeVlq(Math.max(0, tick - previousTick)));
    previousTick = tick;
  };
  pushDelta(0);
  trackBytes.push(0xff, 0x51, 0x03, 0x07, 0xa1, 0x20);
  for (const event of events) {
    pushDelta(event.tick);
    if (event.kind === 'on') {
      trackBytes.push(0x90, event.midi & 0x7f, 0x50);
    } else {
      trackBytes.push(0x80, event.midi & 0x7f, 0x40);
    }
  }
  pushDelta(previousTick);
  trackBytes.push(0xff, 0x2f, 0x00);
  const header = [
    0x4d, 0x54, 0x68, 0x64,
    ...writeUint32(6),
    ...writeUint16(0),
    ...writeUint16(1),
    ...writeUint16(ticksPerQuarter),
  ];
  const trackChunk = [
    0x4d, 0x54, 0x72, 0x6b,
    ...writeUint32(trackBytes.length),
    ...trackBytes,
  ];
  return new Uint8Array([...header, ...trackChunk]);
};

describe('precision short note helpers', () => {
  it('ショート上限は四分音符の 2/3 秒換算', () => {
    expect(precisionShortNoteMaxDurationSec(120)).toBeCloseTo(1 / 3, 5);
  });

  it('直8分・スイング長8分(2/3拍)以下をショート、4分は非ショート', () => {
    expect(isPrecisionShortNoteQuarterLength(0.5)).toBe(true);
    expect(isPrecisionShortNoteQuarterLength(2 / 3)).toBe(true);
    expect(isPrecisionShortNoteQuarterLength(3 / 4)).toBe(false);
    expect(isPrecisionShortNoteDuration(0.25, 120)).toBe(true);
    expect(isPrecisionShortNoteDuration(1 / 3, 120)).toBe(true);
    expect(isPrecisionShortNoteDuration(0.5, 120)).toBe(false);
  });

  it('MusicXML ビルドで isShortNote を付与する', () => {
    const { notes } = buildPrecisionNotesFromMusicXml(MINIMAL_XML, 120, 4);
    expect(notes).toHaveLength(2);
    expect(notes[0]?.isShortNote).toBe(false);
    expect(notes[1]?.isShortNote).toBe(true);
  });

  it('calibratePrecisionNotes は練習速度後に isShortNote を再計算する', () => {
    const { notes } = buildPrecisionNotesFromMusicXml(MINIMAL_XML, 120, 4);
    const calibrated = calibratePrecisionNotes(notes, {
      resolveCalibratedStartSec: sec => sec,
      practiceMode: true,
      practiceSpeedPercent: 80,
      classificationBpm: 96,
    });
    expect(calibrated[1]?.durationSec).toBeCloseTo(0.3125, 4);
    expect(calibrated[1]?.isShortNote).toBe(true);
  });
});

describe('buildPrecisionNotesFromMidi', () => {
  it('四分と8分ノーツを tick から生成する', () => {
    const quarterTick = 480;
    const eighthTick = 240;
    const data = buildMinimalSmf([
      { tick: 0, kind: 'on', midi: 60 },
      { tick: quarterTick, kind: 'off', midi: 60 },
      { tick: quarterTick, kind: 'on', midi: 64 },
      { tick: quarterTick + eighthTick, kind: 'off', midi: 64 },
    ]);
    const { notes } = buildPrecisionNotesFromMidi(data, 120);
    expect(notes).toHaveLength(2);
    expect(notes[0]?.midi).toBe(60);
    expect(notes[0]?.durationSec).toBeCloseTo(0.5, 3);
    expect(notes[0]?.isShortNote).toBe(false);
    expect(notes[1]?.midi).toBe(64);
    expect(notes[1]?.durationSec).toBeCloseTo(0.25, 3);
    expect(notes[1]?.isShortNote).toBe(true);
  });

  it('移調 offset を midi 番号に反映する', () => {
    const data = buildMinimalSmf([
      { tick: 0, kind: 'on', midi: 60 },
      { tick: 480, kind: 'off', midi: 60 },
    ]);
    const { notes } = buildPrecisionNotesFromMidi(data, 120, 2);
    expect(notes[0]?.midi).toBe(62);
  });

  it('Bluesy precision MIDI は MusicXML と同数のノーツを持つ', () => {
    const xmlPath = resolve(
      process.cwd(),
      'public/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision_lyrics.musicxml',
    );
    const midPath = resolve(
      process.cwd(),
      'public/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision.mid',
    );
    const xmlText = readFileSync(xmlPath, 'utf8');
    const midiData = new Uint8Array(readFileSync(midPath));
    const fromXml = buildPrecisionNotesFromMusicXml(xmlText, 120, 4);
    const fromMidi = buildPrecisionNotesFromMidi(midiData, 120);
    expect(fromMidi.notes).toHaveLength(fromXml.notes.length);
    expect(fromMidi.notes[0]?.startSec).toBeCloseTo(fromXml.notes[0]?.startSec ?? 0, 2);
  });
});

describe('withPrecisionShortNoteFlags', () => {
  it('分類 BPM でフラグを上書きする', () => {
    const notes = [{
      id: 'a',
      midi: 60,
      startSec: 0,
      durationSec: 0.25,
      isBlackKey: false,
      measureNumber: 1,
      isShortNote: false,
    }];
    const flagged = withPrecisionShortNoteFlags(notes, 120);
    expect(flagged[0]?.isShortNote).toBe(true);
  });
});

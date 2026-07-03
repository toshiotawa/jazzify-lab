import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  collectOsmdMeasureLayoutFromMeasureList,
  resolveOsmdGraphicMeasureNumber,
  type OsmdGraphicMeasureLike,
} from '@/utils/earTrainingOsmdMeasureLayout';

const twoStaffMeasureList: readonly (readonly OsmdGraphicMeasureLike[])[] = [
  [
    {
      MeasureNumber: 1,
      PositionAndShape: { AbsolutePosition: { x: 0 }, BorderRight: 10 },
      staffEntries: [{
        graphicalVoiceEntries: [{
          notes: [{
            PositionAndShape: { AbsolutePosition: { x: 2 } },
            sourceNote: { Pitch: {} },
          }],
        }],
      }],
    },
    {
      MeasureNumber: 1,
      PositionAndShape: { AbsolutePosition: { x: 0 }, BorderRight: 10 },
      staffEntries: [{
        graphicalVoiceEntries: [{
          notes: [{
            PositionAndShape: { AbsolutePosition: { x: 3 } },
            sourceNote: { Pitch: {} },
          }],
        }],
      }],
    },
  ],
  [
    {
      MeasureNumber: 2,
      PositionAndShape: { AbsolutePosition: { x: 20 }, BorderRight: 10 },
      staffEntries: [{
        graphicalVoiceEntries: [{
          notes: [{
            PositionAndShape: { AbsolutePosition: { x: 22 } },
            sourceNote: { Pitch: {} },
          }],
        }],
      }],
    },
    {
      MeasureNumber: 2,
      PositionAndShape: { AbsolutePosition: { x: 20 }, BorderRight: 10 },
      staffEntries: [],
    },
  ],
];

describe('resolveOsmdGraphicMeasureNumber', () => {
  it('MeasureNumber を優先する', () => {
    expect(resolveOsmdGraphicMeasureNumber({ MeasureNumber: 17 }, 1)).toBe(17);
  });

  it('parentSourceMeasure.MeasureNumber をフォールバックに使う', () => {
    expect(resolveOsmdGraphicMeasureNumber(
      { parentSourceMeasure: { MeasureNumber: 9 } },
      1,
    )).toBe(9);
  });

  it('番号が無いとき ordinal を使う', () => {
    expect(resolveOsmdGraphicMeasureNumber({}, 5)).toBe(5);
  });
});

describe('collectOsmdMeasureLayoutFromMeasureList', () => {
  it('2段譜行を 1 小節にマージし MeasureNumber をキーにする', () => {
    const layout = collectOsmdMeasureLayoutFromMeasureList(
      twoStaffMeasureList,
      1,
      400,
      400,
    );
    expect(Object.keys(layout.measureBoundsByNumber)).toEqual(['1', '2']);
    expect(layout.measureBoundsByNumber[1]?.noteLeft).toBe(2);
    expect(layout.measureBoundsByNumber[2]?.left).toBe(20);
  });

  it('旧バグ（譜表ごと ordinal）なら 4 キーになるが、行マージなら 2 キー', () => {
    let oldOrdinal = 0;
    const oldKeys: number[] = [];
    for (const row of twoStaffMeasureList) {
      for (const measure of row) {
        oldOrdinal += 1;
        oldKeys.push(oldOrdinal);
      }
    }
    expect(oldKeys).toEqual([1, 2, 3, 4]);

    const layout = collectOsmdMeasureLayoutFromMeasureList(
      twoStaffMeasureList,
      1,
      400,
      400,
    );
    expect(Object.keys(layout.measureBoundsByNumber).length).toBe(2);
  });
});

describe('Donna Lee measure layout regression', () => {
  const donnaLeeLikeTwoStaffList: (readonly OsmdGraphicMeasureLike[])[] = Array.from(
    { length: 33 },
    (_, index) => {
      const measureNumber = index + 1;
      const x = measureNumber * 100;
      const makeStaffMeasure = (noteX: number): OsmdGraphicMeasureLike => ({
        MeasureNumber: measureNumber,
        PositionAndShape: { AbsolutePosition: { x }, BorderRight: 80 },
        staffEntries: [{
          graphicalVoiceEntries: [{
            notes: [{
              PositionAndShape: { AbsolutePosition: { x: noteX } },
              sourceNote: { Pitch: {} },
            }],
          }],
        }],
      });
      return [
        makeStaffMeasure(x + 10),
        makeStaffMeasure(x + 12),
      ];
    },
  );

  it('33 行 × 2 段譜を 33 キーにマージし、小節 17 の X が小節 9 より右', () => {
    const layout = collectOsmdMeasureLayoutFromMeasureList(
      donnaLeeLikeTwoStaffList,
      1,
      4000,
      4000,
    );
    const measureKeys = Object.keys(layout.measureBoundsByNumber)
      .map(Number)
      .sort((a, b) => a - b);

    expect(measureKeys.length).toBe(33);
    expect(measureKeys[0]).toBe(1);
    expect(measureKeys[32]).toBe(33);

    const left9 = layout.measureBoundsByNumber[9]?.left ?? 0;
    const left17 = layout.measureBoundsByNumber[17]?.left ?? 0;
    expect(left17).toBeGreaterThan(left9);

    for (let i = 1; i < measureKeys.length; i += 1) {
      const prev = layout.measureBoundsByNumber[measureKeys[i - 1]]?.left ?? 0;
      const curr = layout.measureBoundsByNumber[measureKeys[i]]?.left ?? 0;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('Donna Lee MusicXML は 33 小節を含む', () => {
    const xmlPath = 'public/sozai/Comping/Donna Lee Comping precision_lyrics.musicxml';
    const rawXml = readFileSync(xmlPath, 'utf8');
    const matches = rawXml.match(/<measure number="/g);
    expect(matches?.length).toBe(33);
  });
});

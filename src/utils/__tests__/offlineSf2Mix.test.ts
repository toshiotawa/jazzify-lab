import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadOfflineSf2FromMidiNotes,
  loadOfflineSurvivalBassSf2FromFile,
  measureFloat32Peak,
  mixFloat32Buffers,
  normalizeFloat32Peak,
  limitFloat32Peak,
  renderOfflineSf2BassEvents,
  renderOfflineSimpleSynthEvents,
  renderOfflineSynthBassEvents,
  type OfflineNoteEvent,
} from '@/utils/offlineSf2Mix';
import {
  buildBlock3MinusOneEventsForLoop,
  bassRootMidiForSymbol,
  resolveBlock3MinusOneSpec,
} from '@/utils/twoHandVoicingMinusOneSchedule';

describe('offlineSf2Mix', () => {
  it('normalizeFloat32Peak はクリッピング前にピークを下げる', () => {
    const buffer = new Float32Array([0, 1.8, -2.2, 0.5]);
    normalizeFloat32Peak(buffer, 0.9);
    expect(measureFloat32Peak(buffer)).toBeLessThanOrEqual(0.9 + 1e-6);
    expect(buffer[2]).toBeCloseTo(-0.9, 5);
  });

  it('4 声部ヴォイシング + ベースの同時鳴りでも正規化後は 0.9 以下', () => {
    const chord: OfflineNoteEvent[] = [
      { startSec: 0, durationSec: 1.2, midi: 59, gain: 0.24 },
      { startSec: 0, durationSec: 1.2, midi: 64, gain: 0.24 },
      { startSec: 0, durationSec: 1.2, midi: 67, gain: 0.24 },
      { startSec: 0, durationSec: 1.2, midi: 74, gain: 0.24 },
    ];
    const bass: OfflineNoteEvent[] = [
      { startSec: 0, durationSec: 1.2, midi: 36, gain: 1 },
    ];
    const voicing = renderOfflineSimpleSynthEvents(chord, 1.5, 'triangle');
    const bassLayer = renderOfflineSynthBassEvents(bass, 1.5, 'triangle');
    const mixed = mixFloat32Buffers([voicing, bassLayer]);
    limitFloat32Peak(mixed, 0.9);
    expect(measureFloat32Peak(mixed)).toBeLessThanOrEqual(0.9 + 1e-6);
  });

  it('M7 p1 のベース ルートは FingerBass SF2 でレンダリングできる', () => {
    const sf2Path = join(process.cwd(), 'public', 'FingerBassYR 20190930.sf2');
    if (!existsSync(sf2Path)) {
      return;
    }
    const { category, progression } = resolveBlock3MinusOneSpec('b3-m7', 'p1');
    const loop = buildBlock3MinusOneEventsForLoop(progression, category);
    const bassMidis = loop.bass.map(event => event.midi);
    expect(bassRootMidiForSymbol('CM7')).toBe(36);
    const zones = loadOfflineSurvivalBassSf2FromFile(readFileSync(sf2Path).buffer);
    expect(zones.length).toBeGreaterThan(0);
    const rendered = renderOfflineSf2BassEvents(zones, loop.bass, 12);
    expect(measureFloat32Peak(rendered)).toBeGreaterThan(0.01);
  });
});

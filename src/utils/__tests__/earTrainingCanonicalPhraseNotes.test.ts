import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildCanonicalPhraseNotes,
  buildChordOsmdRhythmTargetsWithMeta,
  canonicalNotesToOsmdRhythmTargets,
  canonicalNotesToPrecisionNotes,
} from '@/utils/earTrainingCanonicalPhraseNotes';
import type { EarTrainingPhrase } from '@/types';

const phrase = (chords: EarTrainingPhrase['chords'] = []): EarTrainingPhrase => ({
  id: 'phrase-1',
  stage_id: 'stage-1',
  order_index: 0,
  audio_url: 'https://example.com/a.mp3',
  loop_duration_sec: 60,
  audio_duration_sec: 60,
  note_count: 0,
  chords,
});

const miniXml = (body: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part>
    <measure number="1">
      ${body}
    </measure>
  </part>
</score-partwise>`;

describe('earTrainingCanonicalPhraseNotes', () => {
  it('MIDI 欠落音は MusicXML から残しマッチ済み時刻は MIDI を正本にする', () => {
    const xml = miniXml(`<attributes><divisions>1</divisions><staves>2</staves></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>
<backup><duration>1</duration></backup>
<note><pitch><step>E</step><octave>3</octave></pitch><duration>1</duration><staff>2</staff></note>`);
    const built = buildCanonicalPhraseNotes({
      musicXmlText: xml,
      midiNotes: [{ midi: 52, startSec: 0.05 }],
      bpm: 120,
      beatsPerMeasure: 4,
    });
    expect(built.timingSource).toBe('midi_merged_xml');
    expect(built.notes.map(note => note.midi).sort((a, b) => a - b)).toEqual([52, 60]);
    const lh = built.notes.find(note => note.midi === 52);
    const rh = built.notes.find(note => note.midi === 60);
    expect(lh?.startSec).toBeCloseTo(0.05, 3);
    expect(rh?.startSec).toBeCloseTo(0, 3);
  });

  it('OSMD と精密の中心時刻が 1ms 以内で一致する', () => {
    const xml = miniXml(`<attributes><divisions>1</divisions><staves>2</staves></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>
<backup><duration>1</duration></backup>
<note><pitch><step>E</step><octave>3</octave></pitch><duration>1</duration><staff>2</staff></note>`);
    const canonical = buildCanonicalPhraseNotes({
      musicXmlText: xml,
      midiNotes: [{ midi: 52, startSec: 0.05 }],
      bpm: 120,
      beatsPerMeasure: 4,
    });
    const osmd = buildChordOsmdRhythmTargetsWithMeta(
      phrase([]),
      120,
      4,
      canonical.attacks,
      true,
      0,
      [{ midi: 52, startSec: 0.05 }],
      false,
      xml,
    ).targets;
    const precision = canonicalNotesToPrecisionNotes(canonical.notes, 120);
    for (const pNote of precision) {
      const target = osmd.find(t => t.midiCounts.some(c => c.midi === pNote.midi));
      expect(target).toBeDefined();
      expect(Math.abs((target?.targetTimeSec ?? 0) - pNote.startSec)).toBeLessThan(0.001);
    }
  });

  it('audio_anchor_ms を startSec に加算する', () => {
    const xml = miniXml(`<attributes><divisions>1</divisions></attributes>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>`);
    const built = buildCanonicalPhraseNotes({
      musicXmlText: xml,
      bpm: 120,
      beatsPerMeasure: 4,
      audioAnchorMs: 25,
    });
    expect(built.notes[0]?.startSec).toBeCloseTo(0.025, 4);
  });

  it('Bluesy 実ファイルで OSMD と精密のノート数が一致する', () => {
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
    const canonical = buildCanonicalPhraseNotes({
      musicXmlText: xmlText,
      midiData,
      bpm: 120,
      beatsPerMeasure: 4,
    });
    const osmd = canonicalNotesToOsmdRhythmTargets(
      canonical.notes,
      phrase([]),
      120,
      4,
      canonical.attacks,
    );
    const precision = canonicalNotesToPrecisionNotes(canonical.notes, 120);
    expect(precision.length).toBeGreaterThan(0);
    expect(osmd.length).toBeGreaterThan(0);
    for (const pNote of precision) {
      const target = osmd.find(t => (
        t.midiCounts.some(c => c.midi === pNote.midi)
        && Math.abs(t.targetTimeSec - pNote.startSec) < 0.001
      ));
      expect(target).toBeDefined();
    }
  });
});

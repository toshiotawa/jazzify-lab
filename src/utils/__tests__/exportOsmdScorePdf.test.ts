import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase } from '@/types';
import {
  collectOsmdPhraseMusicXmlUrls,
  isOsmdScoreDownloadMode,
  buildOsmdScorePdfFileName,
  hideOsmdPdfAlternateVoiceRests,
} from '@/utils/osmdScorePdfExport';

describe('isOsmdScoreDownloadMode', () => {
  it('returns true for OSMD battle and precision modes', () => {
    expect(isOsmdScoreDownloadMode('chord_osmd')).toBe(true);
    expect(isOsmdScoreDownloadMode('chord_precision')).toBe(true);
  });

  it('returns false for other ear-training modes', () => {
    expect(isOsmdScoreDownloadMode('phrase')).toBe(false);
    expect(isOsmdScoreDownloadMode('chord_quiz')).toBe(false);
    expect(isOsmdScoreDownloadMode(undefined)).toBe(false);
  });
});

describe('buildOsmdScorePdfFileName', () => {
  it('builds Chapter-Quest-task filename', () => {
    expect(buildOsmdScorePdfFileName(6, 7, 2)).toBe('Chapter6-Quest7-2.pdf');
  });
});

describe('hideOsmdPdfAlternateVoiceRests', () => {
  it('hides voice 1 rests when voice 4 has notes, and voice 4 rests when voice 1 has notes', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part id="P1">
<measure number="1">
<note><rest/><duration>4</duration><voice>1</voice></note>
<backup><duration>4</duration></backup>
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>4</voice></note>
</measure>
<measure number="2">
<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice></note>
<note><rest/><duration>3</duration><voice>1</voice></note>
<backup><duration>4</duration></backup>
<note><rest/><duration>4</duration><voice>4</voice></note>
</measure>
</part></score-partwise>`;
    const next = hideOsmdPdfAlternateVoiceRests(xml);
    const doc = new DOMParser().parseFromString(next, 'application/xml');
    const measures = Array.from(doc.getElementsByTagName('measure'));
    const measureNotes = (measure: Element): Element[] =>
      Array.from(measure.children).filter((el) => el.localName === 'note');

    const listenNotes = measureNotes(measures[0]);
    expect(listenNotes[0].getAttribute('print-object')).toBe('no');
    expect(listenNotes[1].getAttribute('print-object')).toBeNull();

    const playNotes = measureNotes(measures[1]);
    expect(playNotes[0].getAttribute('print-object')).toBeNull();
    expect(playNotes[1].getAttribute('print-object')).toBeNull();
    expect(playNotes[2].getAttribute('print-object')).toBe('no');
  });
});

describe('collectOsmdPhraseMusicXmlUrls', () => {
  it('returns music xml urls sorted by order_index', () => {
    const phrases: EarTrainingPhrase[] = [
      {
        id: 'b',
        stage_id: 'stage',
        order_index: 1,
        music_xml_url: 'https://example.com/b.musicxml',
        audio_url: 'https://example.com/b.mp3',
        loop_duration_sec: 10,
        audio_duration_sec: 10,
        note_count: 1,
      },
      {
        id: 'a',
        stage_id: 'stage',
        order_index: 0,
        music_xml_url: 'https://example.com/a.musicxml',
        audio_url: 'https://example.com/a.mp3',
        loop_duration_sec: 10,
        audio_duration_sec: 10,
        note_count: 1,
      },
    ];

    expect(collectOsmdPhraseMusicXmlUrls(phrases)).toEqual([
      'https://example.com/a.musicxml',
      'https://example.com/b.musicxml',
    ]);
  });

  it('skips phrases without music xml url', () => {
    const phrases: EarTrainingPhrase[] = [
      {
        id: 'a',
        stage_id: 'stage',
        order_index: 0,
        music_xml_url: '  ',
        audio_url: 'https://example.com/a.mp3',
        loop_duration_sec: 10,
        audio_duration_sec: 10,
        note_count: 1,
      },
    ];

    expect(collectOsmdPhraseMusicXmlUrls(phrases)).toEqual([]);
  });
});

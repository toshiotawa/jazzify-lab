import { describe, expect, it } from 'vitest';
import type { EarTrainingPhrase } from '@/types';
import {
  collectOsmdPhraseMusicXmlUrls,
  isOsmdScoreDownloadMode,
  sanitizeOsmdScorePdfFileName,
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

describe('sanitizeOsmdScorePdfFileName', () => {
  it('sanitizes unsafe characters and adds pdf extension', () => {
    expect(sanitizeOsmdScorePdfFileName('F Blues / Intro')).toBe('F-Blues-Intro.pdf');
  });

  it('falls back when title is empty', () => {
    expect(sanitizeOsmdScorePdfFileName('   ')).toBe('score.pdf');
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

import {
  resolveDialogueLineSpeaker,
  resolveTutorialOsmdDrumLoopUrl,
} from './earTrainingTutorialScriptTypes';
import type { EarTrainingTutorialContentRef } from './earTrainingTutorialScriptTypes';

const CBLUES_CI = 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3';
const CBLUES_DRUM = 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3';

describe('resolveDialogueLineSpeaker', () => {
  it('defaults to player when speaker omitted', () => {
    expect(resolveDialogueLineSpeaker({ ja: 'あ', en: 'a' })).toBe('player');
  });

  it('returns partner when set', () => {
    expect(resolveDialogueLineSpeaker({
      ja: 'あ',
      en: 'a',
      speaker: 'partner',
    })).toBe('partner');
  });

  it('returns player when explicitly set', () => {
    expect(resolveDialogueLineSpeaker({
      ja: 'あ',
      en: 'a',
      speaker: 'player',
    })).toBe('player');
  });
});

describe('resolveTutorialOsmdDrumLoopUrl', () => {
  const content: Record<string, EarTrainingTutorialContentRef> = {
    'mq-b1-q1-osmd': {
      stage: {
        slug: 'mq-b1-q1-osmd',
        title: 't',
        bpm: 100,
        beats_per_measure: 4,
        beat_type: 4,
        loop_measures: 24,
        max_loops_per_phrase: 1,
        count_in_beats: 0,
        time_limit_sec: 600,
        player_hp: 100,
        enemy_hp: 100,
        mode: 'chord_osmd',
      },
      phrases: [{
        order_index: 0,
        audio_url: CBLUES_CI,
      }],
    },
  };

  it('content のフレーズ audio_url（count-in）を返す', () => {
    expect(resolveTutorialOsmdDrumLoopUrl(content, 'mq-b1-q1-osmd')).toBe(CBLUES_CI);
  });

  it('会話用 drum_loop URL にはフォールバックしない', () => {
    expect(resolveTutorialOsmdDrumLoopUrl(content, 'mq-b1-q1-osmd')).not.toBe(CBLUES_DRUM);
  });

  it('未知の contentRef では空文字', () => {
    expect(resolveTutorialOsmdDrumLoopUrl(content, 'missing')).toBe('');
  });
});

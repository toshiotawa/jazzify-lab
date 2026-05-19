import { CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL } from '@/utils/earTrainingChordVoicingDrumLoop';

import type { TutorialAudioTracksMap } from './TutorialAudioController';

/** サバイバルチュートリアル（オンボーディング / レッスン課題）の BGM。iOS `DrumLoop.mp3` と同系の CDN ループ。 */
export const TUTORIAL_DRUM_LOOP_BGM_URL = CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL;

export const TUTORIAL_DRUM_LOOP_AUDIO_TRACKS: TutorialAudioTracksMap = {
  main_bgm: {
    url: TUTORIAL_DRUM_LOOP_BGM_URL,
    defaultLoop: true,
    defaultVolume: 0.45,
  },
  drum_loop: {
    url: TUTORIAL_DRUM_LOOP_BGM_URL,
    defaultLoop: true,
    defaultVolume: 0.35,
  },
};

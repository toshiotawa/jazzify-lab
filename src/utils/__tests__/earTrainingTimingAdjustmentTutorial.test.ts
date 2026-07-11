import {
  buildOsmdTimingAdjustmentV1Script,
  OSMD_TIMING_ADJUSTMENT_SCRIPT_ID,
} from '@/components/earTraining/tutorial/buildOsmdTimingAdjustmentV1Script';
import { isEarTrainingTutorialScriptPayload } from '@/components/earTraining/tutorial/earTrainingTutorialScriptTypes';
import {
  buildEarTrainingTimingAdjustmentHash,
  parseEarTrainingTimingAdjustmentReturnHash,
} from '@/utils/earTrainingTimingAdjustmentLaunch';

describe('buildOsmdTimingAdjustmentV1Script', () => {
  it('builds a valid timing adjustment tutorial script', () => {
    const script = buildOsmdTimingAdjustmentV1Script();
    expect(isEarTrainingTutorialScriptPayload(script)).toBe(true);
    expect(script.ui.showExitButton).toBe(false);
    expect(script.ui.hideSettingsButton).toBe(true);
    expect(script.scenes).toHaveLength(2);
    expect(script.scenes[0]?.type).toBe('chord_osmd');
    if (script.scenes[0]?.type === 'chord_osmd') {
      expect(script.scenes[0].requiredLoops).toBe(1);
    }
    const content = script.content['osmd-timing-adjustment'];
    expect(content?.stage.bpm).toBe(100);
    expect(content?.stage.loop_measures).toBe(25);
    expect(content?.phrases?.[0]?.music_xml_url).toContain('1-1_count-in.musicxml');
    expect(content?.phrases?.[0]?.audio_url).toContain('Cblues_24bars_100BPM_count-in.mp3');
  });

  it('uses the expected script id constant', () => {
    expect(OSMD_TIMING_ADJUSTMENT_SCRIPT_ID).toBe('osmd-timing-adjustment-v1');
  });
});

describe('earTrainingTimingAdjustmentLaunch', () => {
  it('builds quest launch hash with script id', () => {
    const hash = buildEarTrainingTimingAdjustmentHash({
      entry: 'quest',
      lessonId: 'lesson-1',
      lessonSongId: 'song-1',
    });
    expect(hash).toContain('#ear-training-timing-adjustment?');
    expect(hash).toContain('scriptId=osmd-timing-adjustment-v1');
    expect(hash).toContain('entry=quest');
    expect(hash).toContain('lessonId=lesson-1');
  });

  it('builds settings launch hash with return context', () => {
    const hash = buildEarTrainingTimingAdjustmentHash({
      entry: 'settings',
      returnContext: {
        stageId: 'stage-abc',
        lessonId: 'lesson-1',
        lessonSongId: 'song-1',
        practiceMode: true,
      },
    });
    expect(hash).toContain('returnStageId=stage-abc');
    expect(hash).toContain('returnPractice=1');
  });

  it('parses return hash for ear training lesson restart', () => {
    const params = new URLSearchParams({
      returnStageId: 'stage-abc',
      returnLessonId: 'lesson-1',
      returnLessonSongId: 'song-1',
      returnPractice: '1',
    });
    const hash = parseEarTrainingTimingAdjustmentReturnHash(params);
    expect(hash).toBe('#ear-training-lesson?stageId=stage-abc&lessonId=lesson-1&lessonSongId=song-1&practice=1&restart=1');
  });
});

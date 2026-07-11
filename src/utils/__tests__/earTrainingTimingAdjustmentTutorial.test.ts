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
    expect(script.finish?.showCta).toBe(false);
    expect(script.scenes).toHaveLength(3);
    expect(script.scenes[0]?.type).toBe('chord_osmd');
    expect(script.scenes[1]?.type).toBe('dialogue_only');
    expect(script.scenes[2]?.type).toBe('finish');
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

  it('builds settings launch hash with tutorial return context', () => {
    const hash = buildEarTrainingTimingAdjustmentHash({
      entry: 'settings',
      returnContext: {
        tutorialScriptId: 'developer-full-v1',
        tutorialSceneIndex: 3,
        lessonId: 'lesson-1',
        lessonSongId: 'song-1',
        clearConditions: '{"count":1,"rank":"S"}',
      },
    });
    expect(hash).toContain('returnTutorialScriptId=developer-full-v1');
    expect(hash).toContain('returnTutorialSceneIndex=3');
    expect(hash).toContain('returnLessonId=lesson-1');
    expect(hash).toContain('returnLessonSongId=song-1');
    expect(hash).toContain('returnClearConditions=');
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

  it('parses return hash for ear training tutorial lesson restart', () => {
    const params = new URLSearchParams({
      returnTutorialScriptId: 'developer-full-v1',
      returnLessonId: 'lesson-1',
      returnLessonSongId: 'song-1',
      returnClearConditions: '{"count":1,"rank":"S"}',
      returnTutorialSceneIndex: '2',
    });
    const hash = parseEarTrainingTimingAdjustmentReturnHash(params);
    expect(hash).toBe(
      '#ear-training-tutorial-lesson?scriptId=developer-full-v1&lessonId=lesson-1&lessonSongId=song-1&clearConditions=%7B%22count%22%3A1%2C%22rank%22%3A%22S%22%7D&sceneIndex=2',
    );
  });
});

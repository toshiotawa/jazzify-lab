import { buildLessonRequirementLaunchHash } from '@/utils/lessonRequirementLaunch';
import type { LessonRequirementLaunchInput } from '@/utils/lessonRequirementLaunch';

const baseReq = (overrides: Partial<LessonRequirementLaunchInput> = {}): LessonRequirementLaunchInput => ({
  lesson_id: 'lesson-1',
  song_id: 'song-1',
  lesson_song_id: 'ls-1',
  clear_conditions: {
    key: 0,
    speed: 1,
    rank: 'S',
    count: 1,
    notation_setting: 'both',
  },
  ...overrides,
});

describe('buildLessonRequirementLaunchHash', () => {
  it('returns survival tutorial hash', () => {
    const hash = buildLessonRequirementLaunchHash(baseReq({
      is_survival_tutorial: true,
      survival_tutorial_script_id: 'onboarding-v1',
    }));
    expect(hash).toContain('#survival-tutorial-lesson?');
    expect(hash).toContain('lessonId=lesson-1');
    expect(hash).toContain('scriptId=onboarding-v1');
  });

  it('returns survival lesson hash with stage number', () => {
    const hash = buildLessonRequirementLaunchHash(baseReq({
      is_survival: true,
      survival_stage_number: 3,
      survival_map_category: 'basic',
    }));
    expect(hash).toContain('#survival-lesson?');
    expect(hash).toContain('stageNumber=3');
    expect(hash).toContain('mapCategory=basic');
  });

  it('returns null for balloon rush without stage id', () => {
    const hash = buildLessonRequirementLaunchHash(baseReq({
      is_balloon_rush: true,
    }));
    expect(hash).toBeNull();
  });

  it('returns ear training lesson hash', () => {
    const hash = buildLessonRequirementLaunchHash(baseReq({
      is_ear_training: true,
      ear_training_stage_id: 'et-stage-1',
    }));
    expect(hash).toContain('#ear-training-lesson?');
    expect(hash).toContain('stageId=et-stage-1');
  });
});

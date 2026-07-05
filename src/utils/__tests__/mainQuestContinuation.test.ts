import {
  findFirstIncompleteRequirement,
  type LessonSongProgressMatch,
  type RequirementWithLessonSongId,
} from '@/utils/lessonRequirementProgress';
import {
  MAIN_QUEST_RESUME_THRESHOLD_MS,
  shouldShowMainQuestResumePrompt,
} from '@/utils/mainQuestResume';

describe('findFirstIncompleteRequirement', () => {
  const requirements: RequirementWithLessonSongId[] = [
    {
      lesson_song_id: 'ls-1',
      song_id: null,
      is_survival_tutorial: true,
    },
    {
      lesson_song_id: 'ls-2',
      song_id: null,
      is_survival: true,
    },
  ];

  it('returns the first requirement without completed progress', () => {
    const progress: LessonSongProgressMatch[] = [
      {
        is_completed: true,
        song_id: 'ls-1',
        lesson_song_id: 'ls-1',
      },
    ];

    const result = findFirstIncompleteRequirement(requirements, progress);
    expect(result?.lesson_song_id).toBe('ls-2');
  });

  it('returns undefined when all requirements are completed', () => {
    const progress: LessonSongProgressMatch[] = [
      { is_completed: true, song_id: 'ls-1', lesson_song_id: 'ls-1' },
      { is_completed: true, song_id: 'ls-2', lesson_song_id: 'ls-2' },
    ];

    expect(findFirstIncompleteRequirement(requirements, progress)).toBeUndefined();
  });
});

describe('shouldShowMainQuestResumePrompt', () => {
  const now = Date.parse('2026-07-05T12:00:00.000Z');

  it('returns true when chapter 1 resume is eligible after threshold', () => {
    expect(
      shouldShowMainQuestResumePrompt({
        lastPlayedAt: new Date(now - MAIN_QUEST_RESUME_THRESHOLD_MS - 1).toISOString(),
        nextLessonBlockNumber: 1,
        nowMs: now,
      }),
    ).toBe(true);
  });

  it('returns false for chapter 2', () => {
    expect(
      shouldShowMainQuestResumePrompt({
        lastPlayedAt: new Date(now - MAIN_QUEST_RESUME_THRESHOLD_MS - 1).toISOString(),
        nextLessonBlockNumber: 2,
        nowMs: now,
      }),
    ).toBe(false);
  });

  it('returns false when session already shown', () => {
    expect(
      shouldShowMainQuestResumePrompt({
        lastPlayedAt: new Date(now - MAIN_QUEST_RESUME_THRESHOLD_MS - 1).toISOString(),
        nextLessonBlockNumber: 1,
        nowMs: now,
        sessionAlreadyShown: true,
      }),
    ).toBe(false);
  });
});

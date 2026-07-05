import {
  findFirstIncompleteRequirement,
  type LessonSongProgressMatch,
  type RequirementWithLessonSongId,
} from '@/utils/lessonRequirementProgress';
import {
  MAIN_QUEST_RESUME_THRESHOLD_MS,
  shouldShowMainQuestResumePrompt,
} from '@/utils/mainQuestResume';
import { resolveJustClearedLessonSongId } from '@/utils/mainQuestJustCleared';
import { shouldShowMainQuestTaskEntryPrompt } from '@/utils/mainQuestContinuation';

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

describe('resolveJustClearedLessonSongId', () => {
  it('reads justCleared from search params on path routes', () => {
    expect(
      resolveJustClearedLessonSongId({
        routeLessonId: 'lesson-1',
        routeJustCleared: 'ls-1',
        hashJustCleared: null,
      }),
    ).toBe('ls-1');
  });

  it('reads justCleared from hash on legacy hash routes', () => {
    expect(
      resolveJustClearedLessonSongId({
        routeLessonId: undefined,
        routeJustCleared: null,
        hashJustCleared: 'ls-2',
      }),
    ).toBe('ls-2');
  });

  it('returns null when neither route nor hash provides justCleared', () => {
    expect(
      resolveJustClearedLessonSongId({
        routeLessonId: 'lesson-1',
        routeJustCleared: null,
        hashJustCleared: 'ls-ignored',
      }),
    ).toBeNull();
    expect(
      resolveJustClearedLessonSongId({
        routeLessonId: undefined,
        routeJustCleared: null,
        hashJustCleared: null,
      }),
    ).toBeNull();
  });
});

describe('shouldShowMainQuestTaskEntryPrompt', () => {
  it('returns true for chapter 1 main quest with autoStart and no justCleared', () => {
    expect(
      shouldShowMainQuestTaskEntryPrompt({
        isMainQuest: true,
        blockNumber: 1,
        hasAutoStart: true,
        hasJustCleared: false,
      }),
    ).toBe(true);
  });

  it('returns false when justCleared is present', () => {
    expect(
      shouldShowMainQuestTaskEntryPrompt({
        isMainQuest: true,
        blockNumber: 1,
        hasAutoStart: true,
        hasJustCleared: true,
      }),
    ).toBe(false);
  });

  it('returns false without autoStart', () => {
    expect(
      shouldShowMainQuestTaskEntryPrompt({
        isMainQuest: true,
        blockNumber: 1,
        hasAutoStart: false,
        hasJustCleared: false,
      }),
    ).toBe(false);
  });

  it('returns false for chapter 2', () => {
    expect(
      shouldShowMainQuestTaskEntryPrompt({
        isMainQuest: true,
        blockNumber: 2,
        hasAutoStart: true,
        hasJustCleared: false,
      }),
    ).toBe(false);
  });

  it('returns false for non-main quest', () => {
    expect(
      shouldShowMainQuestTaskEntryPrompt({
        isMainQuest: false,
        blockNumber: 1,
        hasAutoStart: true,
        hasJustCleared: false,
      }),
    ).toBe(false);
  });
});

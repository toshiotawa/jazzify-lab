import {
  areAllClearRequiredLessonSongsCompleted,
  findNextIncompleteRequirements,
  isLessonSongRequirementCompleted,
  lessonSongUsesLessonSongIdForProgress,
  shouldShowQuestReadyToCompletePrompt,
  type LessonSongProgressMatch,
} from '@/utils/lessonRequirementProgress';

const baseProgress = (
  overrides: Partial<LessonSongProgressMatch>,
): LessonSongProgressMatch => ({
  song_id: null,
  is_completed: true,
  ...overrides,
});

describe('lessonSongUsesLessonSongIdForProgress', () => {
  it('耳コピバトルチュートリアル課題は lesson_songs.id で進捗を照合する', () => {
    expect(
      lessonSongUsesLessonSongIdForProgress({
        id: 'ls1',
        song_id: null,
        is_ear_training_tutorial: true,
      }),
    ).toBe(true);
  });

  it('動画視聴課題は lesson_songs.id で進捗を照合する', () => {
    expect(
      lessonSongUsesLessonSongIdForProgress({
        id: 'ls-video',
        song_id: null,
        is_video_lesson: true,
      }),
    ).toBe(true);
  });
});

describe('isLessonSongRequirementCompleted', () => {
  it('耳コピチュートリアルは lesson_song_id または song_id が lesson_songs.id と一致すれば完了', () => {
    const req = { id: 'ls-tutorial', song_id: null, is_ear_training_tutorial: true };
    expect(
      isLessonSongRequirementCompleted(
        req,
        baseProgress({ lesson_song_id: 'ls-tutorial', song_id: null }),
      ),
    ).toBe(true);
    expect(
      isLessonSongRequirementCompleted(
        req,
        baseProgress({ lesson_song_id: null, song_id: 'ls-tutorial' }),
      ),
    ).toBe(true);
  });
});

describe('areAllClearRequiredLessonSongsCompleted', () => {
  it('任意課題（is_clear_required=false）は allCompleted 判定から除外する', () => {
    const requirements = [
      { id: 'main', song_id: null, is_ear_training_tutorial: true, is_clear_required: true },
      { id: 'opt', song_id: null, is_ear_training_tutorial: true, is_clear_required: false },
    ];
    const progress = [
      baseProgress({ lesson_song_id: 'main', song_id: 'main' }),
    ];
    expect(areAllClearRequiredLessonSongsCompleted(requirements, progress)).toBe(true);
  });

  it('クリア必須課題が未完了なら false', () => {
    const requirements = [
      { id: 'main', song_id: null, is_ear_training_tutorial: true, is_clear_required: true },
      { id: 'opt', song_id: null, is_ear_training_tutorial: true, is_clear_required: false },
    ];
    expect(areAllClearRequiredLessonSongsCompleted(requirements, [])).toBe(false);
  });
});

describe('findNextIncompleteRequirements', () => {
  it('必修が残っていれば nextRequired を返し任意はスキップしない', () => {
    const requirements = [
      { lesson_song_id: 'req-1', song_id: null, is_ear_training_tutorial: true, is_clear_required: true },
      { lesson_song_id: 'opt-1', song_id: null, is_ear_training_tutorial: true, is_clear_required: false },
      { lesson_song_id: 'req-2', song_id: null, is_ear_training_tutorial: true, is_clear_required: true },
    ];
    const progress = [
      baseProgress({ lesson_song_id: 'req-1', song_id: 'req-1' }),
    ];
    const result = findNextIncompleteRequirements(requirements, progress);
    expect(result.nextRequired?.lesson_song_id).toBe('req-2');
    expect(result.nextOptional?.lesson_song_id).toBe('opt-1');
  });

  it('必修が全て完了なら nextRequired は undefined で nextOptional を返す', () => {
    const requirements = [
      { lesson_song_id: 'req-1', song_id: null, is_ear_training_tutorial: true, is_clear_required: true },
      { lesson_song_id: 'opt-1', song_id: null, is_ear_training_tutorial: true, is_clear_required: false },
    ];
    const progress = [
      baseProgress({ lesson_song_id: 'req-1', song_id: 'req-1' }),
    ];
    const result = findNextIncompleteRequirements(requirements, progress);
    expect(result.nextRequired).toBeUndefined();
    expect(result.nextOptional?.lesson_song_id).toBe('opt-1');
  });

  it('レジェンド専用課題は nextRequired / nextOptional ともに除外する', () => {
    const requirements = [
      {
        lesson_song_id: 'legend-1',
        song_id: 'song-legend',
        is_fantasy: false,
        is_clear_required: true,
      },
      { lesson_song_id: 'req-1', song_id: null, is_ear_training_tutorial: true, is_clear_required: true },
    ];
    const result = findNextIncompleteRequirements(requirements, []);
    expect(result.nextRequired?.lesson_song_id).toBe('req-1');
    expect(result.nextOptional).toBeUndefined();
  });
});

describe('shouldShowQuestReadyToCompletePrompt', () => {
  it('課題があり全完了かつ未完了なら true', () => {
    expect(
      shouldShowQuestReadyToCompletePrompt({
        hasRequirements: true,
        allRequirementsCompleted: true,
        isLessonCompleted: false,
      }),
    ).toBe(true);
  });

  it('課題が無いクエストでは false', () => {
    expect(
      shouldShowQuestReadyToCompletePrompt({
        hasRequirements: false,
        allRequirementsCompleted: true,
        isLessonCompleted: false,
      }),
    ).toBe(false);
  });

  it('課題が未完了なら false', () => {
    expect(
      shouldShowQuestReadyToCompletePrompt({
        hasRequirements: true,
        allRequirementsCompleted: false,
        isLessonCompleted: false,
      }),
    ).toBe(false);
  });

  it('すでにクエスト完了済みなら false', () => {
    expect(
      shouldShowQuestReadyToCompletePrompt({
        hasRequirements: true,
        allRequirementsCompleted: true,
        isLessonCompleted: true,
      }),
    ).toBe(false);
  });
});

import {
  areAllClearRequiredLessonSongsCompleted,
  isLessonSongRequirementCompleted,
  lessonSongUsesLessonSongIdForProgress,
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

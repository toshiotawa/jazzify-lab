import {
  pickEarTrainingPrefetchEntries,
} from '@/utils/prefetchEarTrainingScreenChunks';
import type { LessonRequirementProgress } from '@/platform/supabaseLessonRequirements';

const progressRow = (
  lessonSongId: string,
  isCompleted: boolean,
): LessonRequirementProgress => ({
  id: `progress-${lessonSongId}`,
  user_id: 'user-1',
  lesson_id: 'lesson-1',
  song_id: null,
  lesson_song_id: lessonSongId,
  clear_count: isCompleted ? 1 : 0,
  clear_dates: [],
  is_completed: isCompleted,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

describe('pickEarTrainingPrefetchEntries', () => {
  it('prefetches only the first incomplete ear training task', () => {
    const entries = [
      { lessonSongId: 'song-a', stageId: 'stage-normal', mode: 'chord_osmd' as const },
      { lessonSongId: 'song-b', stageId: 'stage-slow', mode: 'chord_osmd' as const },
    ];

    const selected = pickEarTrainingPrefetchEntries(entries, [
      progressRow('song-a', true),
    ]);

    expect(selected).toEqual([entries[1]]);
  });

  it('falls back to the first entry when all tasks are complete', () => {
    const entries = [
      { lessonSongId: 'song-a', stageId: 'stage-normal', mode: 'chord_osmd' as const },
      { lessonSongId: 'song-b', stageId: 'stage-slow', mode: 'chord_osmd' as const },
    ];

    const selected = pickEarTrainingPrefetchEntries(entries, [
      progressRow('song-a', true),
      progressRow('song-b', true),
    ]);

    expect(selected).toEqual([entries[0]]);
  });
});

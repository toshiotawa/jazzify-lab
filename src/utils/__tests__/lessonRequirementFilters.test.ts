import { isLegendOnlyLessonRequirement } from '@/utils/lessonRequirementFilters';

describe('isLegendOnlyLessonRequirement', () => {
  it('song_id のみの課題はレジェンド専用', () => {
    expect(isLegendOnlyLessonRequirement({
      song_id: 'song-1',
      is_fantasy: false,
    })).toBe(true);
  });

  it('動画視聴課題はレジェンド専用ではない', () => {
    expect(isLegendOnlyLessonRequirement({
      song_id: 'song-1',
      is_fantasy: false,
      is_video_lesson: true,
    })).toBe(false);
  });

  it('風船ラッシュはレジェンド専用ではない', () => {
    expect(isLegendOnlyLessonRequirement({
      song_id: 'song-1',
      is_fantasy: false,
      is_balloon_rush: true,
    })).toBe(false);
  });
});

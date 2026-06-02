/** lesson_songs 行のうち、進捗の song_id / lesson_song_id が lesson_songs.id を指すタイプ */
export interface LessonSongProgressKeySource {
  id: string;
  song_id: string | null;
  is_fantasy?: boolean;
  is_survival?: boolean;
  is_survival_tutorial?: boolean;
  is_balloon_rush?: boolean;
  is_ear_training?: boolean;
  is_ear_training_tutorial?: boolean;
  is_clear_required?: boolean;
}

export interface LessonSongProgressMatch {
  is_completed: boolean;
  song_id: string | null;
  lesson_song_id?: string | null;
}

export const lessonSongUsesLessonSongIdForProgress = (
  req: LessonSongProgressKeySource,
): boolean =>
  req.is_fantasy === true
  || req.is_survival === true
  || req.is_survival_tutorial === true
  || req.is_balloon_rush === true
  || req.is_ear_training === true
  || req.is_ear_training_tutorial === true;

export const isClearRequiredLessonSong = (req: { is_clear_required?: boolean }): boolean =>
  req.is_clear_required !== false;

export const isLessonSongRequirementCompleted = (
  req: LessonSongProgressKeySource,
  progress: LessonSongProgressMatch,
): boolean => {
  if (!progress.is_completed) {
    return false;
  }
  if (lessonSongUsesLessonSongIdForProgress(req)) {
    return progress.lesson_song_id === req.id || progress.song_id === req.id;
  }
  return progress.song_id === req.song_id;
};

export const areAllClearRequiredLessonSongsCompleted = (
  requirements: LessonSongProgressKeySource[],
  progress: LessonSongProgressMatch[],
): boolean => {
  const required = requirements.filter(isClearRequiredLessonSong);
  if (required.length === 0) {
    return true;
  }
  return required.every(req =>
    progress.some(p => isLessonSongRequirementCompleted(req, p)),
  );
};

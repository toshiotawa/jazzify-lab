/** レジェンドモード（song_id のみ）のレッスン課題かどうか */
export const isLegendOnlyLessonRequirement = (req: {
  song_id?: string | null;
  is_fantasy?: boolean | null;
  is_survival?: boolean | null;
  is_survival_tutorial?: boolean | null;
  is_ear_training?: boolean | null;
  is_ear_training_tutorial?: boolean | null;
  is_balloon_rush?: boolean | null;
}): boolean =>
  Boolean(req.song_id)
  && !req.is_fantasy
  && !req.is_survival
  && !req.is_survival_tutorial
  && !req.is_ear_training
  && !req.is_ear_training_tutorial
  && req.is_balloon_rush !== true;

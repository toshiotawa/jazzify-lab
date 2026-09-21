/**
 * Play-map nodes may override the shared defense_stages.difficulty_level.
 */
export const resolvePlayMapDefenseDifficultyLevel = (
  nodeDifficultyLevel: number | null,
  stageDifficultyLevel: number,
): number => {
  if (
    nodeDifficultyLevel != null
    && Number.isInteger(nodeDifficultyLevel)
    && nodeDifficultyLevel >= 1
    && nodeDifficultyLevel <= 15
  ) {
    return nodeDifficultyLevel;
  }
  return stageDifficultyLevel;
};

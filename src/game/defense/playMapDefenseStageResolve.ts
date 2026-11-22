/**
 * Play-map nodes may expose a legacy defense_stage_id and an optional call-response override.
 */
export const resolvePlayMapDefenseStageId = (
  legacyStageId: string | null,
  callResponseStageId: string | null,
  useCallResponse: boolean,
): string | null => {
  if (!useCallResponse) {
    return legacyStageId;
  }
  const trimmed = callResponseStageId?.trim();
  if (trimmed) {
    return trimmed;
  }
  return legacyStageId;
};

export const resolvePlayMapDefenseDifficultyLevelFromCallResponse = (
  legacyNodeLevel: number | null,
  callResponseNodeLevel: number | null,
  useCallResponse: boolean,
): number | null => {
  if (
    useCallResponse
    && callResponseNodeLevel != null
    && Number.isInteger(callResponseNodeLevel)
    && callResponseNodeLevel >= 1
    && callResponseNodeLevel <= 15
  ) {
    return callResponseNodeLevel;
  }
  return legacyNodeLevel;
};

/** Web ディフェンスはコール＆レスポンス対応クライアントとして常に override を優先する。 */
export const webUsesCallResponsePlayMapDefense = true;
import type { EarTrainingPhrasePairAdlibBootstrap } from '@/types';
import type { AdlibPattern } from '@/utils/earTrainingPhrasePairEngine';
import type {
  EarTrainingTutorialContentPhrasePairAdlib,
  EarTrainingTutorialContentPhrasePairAdlibPattern,
} from '@/components/earTraining/tutorial/earTrainingTutorialScriptTypes';
import { localizedText } from '@/components/earTraining/tutorial/earTrainingTutorialScriptTypes';

const tutorialPatternId = (groupKey: string, index: number): string => (
  `tutorial-ppat-${groupKey}-${index}`
);

const tutorialStepId = (index: number): string => `tutorial-pstep-${index}`;

const mapPatterns = (
  patterns: readonly EarTrainingTutorialContentPhrasePairAdlibPattern[],
): Record<string, AdlibPattern[]> => {
  const byGroup: Record<string, AdlibPattern[]> = {};
  patterns.forEach((row, index) => {
    const key = row.group_key.trim();
    if (!key) {
      return;
    }
    const list = byGroup[key] ?? [];
    list.push({
      id: tutorialPatternId(key, index),
      label: row.label,
      pcs: row.pcs.map((pc) => ((Number(pc) % 12) + 12) % 12),
      familyId: row.family_id,
      carryTailLength: row.carry_tail_length ?? 0,
      priority: row.priority ?? 0,
      voicing: row.voicing?.length ? row.voicing : undefined,
      voicingStaves: row.voicing_staves?.length ? row.voicing_staves : undefined,
    });
    byGroup[key] = list;
  });
  return byGroup;
};

export const buildTutorialPhrasePairAdlibBootstrap = (
  payload: EarTrainingTutorialContentPhrasePairAdlib,
  isEnglishCopy: boolean,
): EarTrainingPhrasePairAdlibBootstrap | null => {
  const bgmUrl = payload.bgm_url.trim();
  if (!bgmUrl || payload.steps.length === 0) {
    return null;
  }

  const patternsByGroupId = mapPatterns(payload.patterns ?? []);
  const groupKeys = Object.keys(patternsByGroupId);
  if (groupKeys.length === 0) {
    return null;
  }

  const steps = payload.steps
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((row, index) => {
      const groupKey = row.pattern_group_key.trim();
      const quoteText = row.quote ? localizedText(row.quote, isEnglishCopy).trim() : '';
      return {
        id: tutorialStepId(index),
        orderIndex: row.order_index,
        chordName: row.chord_name,
        patternGroupId: groupKey,
        measureNumber: row.measure_number ?? null,
        startTimeSec: Number(row.start_time_sec),
        endTimeSec: Number(row.end_time_sec),
        quote: quoteText.length > 0 ? quoteText : null,
        inputDisabled: row.input_disabled === true,
      };
    });

  const missingGroup = steps.some((s) => !patternsByGroupId[s.patternGroupId]?.length);
  if (missingGroup) {
    return null;
  }

  return {
    bgmUrl,
    keyFifths: payload.key_fifths ?? 0,
    loopDurationSec: Number(payload.loop_duration_sec),
    steps,
    patternsByGroupId,
  };
};

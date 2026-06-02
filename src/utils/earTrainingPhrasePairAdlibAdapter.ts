import type { AdlibPattern } from '@/utils/earTrainingPhrasePairEngine';

export interface EarTrainingPhrasePairAdlibStep {
  readonly id: string;
  readonly orderIndex: number;
  readonly chordName: string;
  readonly patternGroupId: string;
  readonly measureNumber: number | null;
  readonly startTimeSec: number;
  readonly endTimeSec: number;
  readonly quote: string | null;
  readonly inputDisabled: boolean;
}

export interface EarTrainingPhrasePairAdlibBootstrap {
  readonly bgmUrl: string;
  readonly keyFifths: number;
  readonly loopDurationSec: number;
  readonly steps: readonly EarTrainingPhrasePairAdlibStep[];
  readonly patternsByGroupId: Readonly<Record<string, readonly AdlibPattern[]>>;
}

export interface EarTrainingPhrasePairAdlibConfigRow {
  readonly id: string;
  readonly bgm_url: string;
  readonly key_fifths: number;
  readonly loop_duration_sec: number;
}

export interface EarTrainingPhrasePairAdlibStepRow {
  readonly id: string;
  readonly order_index: number;
  readonly chord_name: string;
  readonly pattern_group_id: string;
  readonly measure_number: number | null;
  readonly start_time_sec: number;
  readonly end_time_sec: number;
  readonly quote?: string | null;
  readonly input_disabled?: boolean;
}

export interface EarTrainingAdlibPatternRow {
  readonly id: string;
  readonly group_id: string;
  readonly label: string;
  readonly pcs: readonly number[];
  readonly family_id: string;
  readonly carry_tail_length: number;
  readonly priority: number;
  readonly sort_order: number;
  readonly voicing?: readonly string[] | null;
  readonly voicing_staves?: readonly number[] | null;
}

export function rowsToAdlibPatterns(rows: readonly EarTrainingAdlibPatternRow[]): readonly AdlibPattern[] {
  return rows
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      id: row.id,
      label: row.label,
      pcs: row.pcs.map((pc) => ((Number(pc) % 12) + 12) % 12),
      familyId: row.family_id,
      carryTailLength: row.carry_tail_length,
      priority: row.priority,
      voicing: row.voicing?.length ? row.voicing : undefined,
      voicingStaves: row.voicing_staves?.length ? row.voicing_staves : undefined,
    }));
}

export function buildPhrasePairAdlibBootstrap(
  config: EarTrainingPhrasePairAdlibConfigRow,
  stepRows: readonly EarTrainingPhrasePairAdlibStepRow[],
  patternRows: readonly EarTrainingAdlibPatternRow[],
): EarTrainingPhrasePairAdlibBootstrap | null {
  if (stepRows.length === 0) return null;

  const patternsByGroupId: Record<string, AdlibPattern[]> = {};
  for (const groupId of [...new Set(patternRows.map((r) => r.group_id))]) {
    const groupRows = patternRows.filter((r) => r.group_id === groupId);
    patternsByGroupId[groupId] = [...rowsToAdlibPatterns(groupRows)];
  }

  const steps = stepRows
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((row) => {
      const quoteRaw = row.quote;
      const quoteTrimmed = typeof quoteRaw === 'string' ? quoteRaw.trim() : '';
      return {
        id: row.id,
        orderIndex: row.order_index,
        chordName: row.chord_name,
        patternGroupId: row.pattern_group_id,
        measureNumber: row.measure_number,
        startTimeSec: Number(row.start_time_sec),
        endTimeSec: Number(row.end_time_sec),
        quote: quoteTrimmed.length > 0 ? quoteTrimmed : null,
        inputDisabled: row.input_disabled === true,
      };
    });

  return {
    bgmUrl: config.bgm_url,
    keyFifths: config.key_fifths,
    loopDurationSec: Number(config.loop_duration_sec),
    steps,
    patternsByGroupId,
  };
}

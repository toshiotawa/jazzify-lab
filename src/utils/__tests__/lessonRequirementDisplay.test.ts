import { describe, expect, it } from 'vitest';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import {
  buildBalloonRushLessonRequirementDisplay,
  buildEarTrainingLessonRequirementDisplay,
  buildSurvivalLessonRequirementDisplay,
} from '@/utils/lessonRequirementDisplay';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';
import type { EarTrainingStage } from '@/types';

const baseEarTrainingStagePartial = (): Pick<
  EarTrainingStage,
  'mode' | 'quiz_duration_seconds' | 'quiz_required_correct_count'
> => ({
  mode: 'phrase',
});

describe('getEarTrainingLessonClearConditionText (quiz dynamic)', () => {
  it('JA uses DB quiz fields with defaults', () => {
    expect(
      getEarTrainingLessonClearConditionText({ mode: 'chord_quiz' }, false),
    ).toBe('90秒間生存かつ80問以上正解');
    expect(
      getEarTrainingLessonClearConditionText(
        { mode: 'chord_quiz', quiz_duration_seconds: 60, quiz_required_correct_count: 5 },
        false,
      ),
    ).toBe('60秒間生存かつ5問以上正解');
  });

  it('EN uses DB quiz fields with defaults', () => {
    expect(
      getEarTrainingLessonClearConditionText(
        { mode: 'chord_quiz', quiz_duration_seconds: 120, quiz_required_correct_count: 15 },
        true,
      ),
    ).toBe('Survive 120s and answer at least 15 questions correctly.');
  });
});

describe('buildSurvivalLessonRequirementDisplay', () => {
  it('combines mode/encounter and clear (boss JA)', () => {
    const stage = {
      mapCategory: 'basic',
      stageType: 'random',
      stageNumber: 1,
    } as unknown as StageDefinition;
    const { modeEncounterLine, clearLine } = buildSurvivalLessonRequirementDisplay(
      stage,
      true,
      60,
      3,
      false,
    );
    expect(modeEncounterLine).toContain('出題');
    expect(modeEncounterLine).toContain('戦闘: ボス');
    expect(clearLine).toBe('クリア条件: ボス撃破');
  });

  it('non-boss EN', () => {
    const stage = {
      mapCategory: 'basic',
      stageType: 'random',
      stageNumber: 1,
    } as unknown as StageDefinition;
    const { modeEncounterLine, clearLine } = buildSurvivalLessonRequirementDisplay(
      stage,
      false,
      120,
      7,
      true,
    );
    expect(modeEncounterLine).toContain('Mode: Random');
    expect(modeEncounterLine).toContain('Encounter: Regular');
    expect(clearLine).toBe('Clear: survive 120s and defeat 7 enemies');
  });
});

describe('buildEarTrainingLessonRequirementDisplay', () => {
  it('task type + clear lines (JA), mode labels via build output', () => {
    const lines = buildEarTrainingLessonRequirementDisplay(
      {
        ...baseEarTrainingStagePartial(),
        mode: 'chord_quiz',
        quiz_duration_seconds: 90,
        quiz_required_correct_count: 10,
      },
      false,
    );
    expect(lines.taskTypeLine).toBe('課題タイプ: コードクイズ');
    expect(lines.clearLine).toBe('クリア条件: 90秒間生存かつ10問以上正解');
  });

  it('phrase mode label (EN)', () => {
    const lines = buildEarTrainingLessonRequirementDisplay(
      { ...baseEarTrainingStagePartial(), mode: 'phrase' },
      true,
    );
    expect(lines.taskTypeLine).toBe('Task type: Ear copy');
  });
});

describe('buildBalloonRushLessonRequirementDisplay', () => {
  it('null when TL/pq missing', () => {
    expect(buildBalloonRushLessonRequirementDisplay({ stage_type: 'random' }, false)).toBeNull();
  });

  it('snake_case row (JA), random vs progression', () => {
    const prog = buildBalloonRushLessonRequirementDisplay(
      { stage_type: 'progression', time_limit_sec: 90, pop_quota: 12 },
      false,
    );
    expect(prog?.taskTypeLine).toBe('課題タイプ: プログレッションコード');

    const rnd = buildBalloonRushLessonRequirementDisplay(
      { stage_type: 'random', time_limit_sec: 60, pop_quota: 5 },
      true,
    );
    expect(rnd?.taskTypeLine).toBe('Task type: Random chords');
    expect(rnd?.clearLine).toBe('Clear: pop 5 balloons within 60s');
  });
});

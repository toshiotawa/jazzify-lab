import React, { useEffect, useState } from 'react';
import type { SurvivalLessonCompositeConfig, SurvivalLessonOverrides } from '@/types';
import type { SurvivalMapCategory } from '@/components/survival/SurvivalTypes';

interface SurvivalRequirementDetailLinesProps {
  readonly survivalMapCategory: SurvivalMapCategory | string | null | undefined;
  readonly survivalCompositeConfig: SurvivalLessonCompositeConfig | null | undefined;
  readonly survivalStageNumber: number | null | undefined;
  readonly survivalLessonOverrides: SurvivalLessonOverrides | null | undefined;
  readonly title: string | null | undefined;
  readonly titleEn: string | null | undefined;
  readonly isEnglishCopy: boolean;
}

export const SurvivalRequirementDetailLines: React.FC<SurvivalRequirementDetailLinesProps> = ({
  survivalMapCategory,
  survivalCompositeConfig,
  survivalStageNumber,
  survivalLessonOverrides,
  title,
  titleEn,
  isEnglishCopy,
}) => {
  const [content, setContent] = useState<
    | { kind: 'lines'; modeEncounterLine: string; clearLine: string }
    | { kind: 'missing' }
    | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [
        { buildSurvivalLessonRequirementDisplay },
        survivalDefs,
        survivalDisplay,
        firstBlock,
      ] = await Promise.all([
        import('@/utils/lessonRequirementDisplay'),
        import('@/components/survival/SurvivalStageDefinitions'),
        import('@/utils/survivalLessonDisplay'),
        import('@/components/survival/survivalFirstBlockStage'),
      ]);

      if (cancelled) {
        return;
      }

      const mapCat = survivalDisplay.resolveLessonSurvivalMapCategory(survivalMapCategory ?? undefined);
      const stageDef = survivalDisplay.lessonSongHasInlineComposite(survivalCompositeConfig)
        && survivalCompositeConfig
        ? survivalDisplay.buildLessonCompositeStageDefinition(
          title ?? '複合フレーズ課題',
          titleEn ?? 'Composite phrase lesson',
          survivalCompositeConfig,
        )
        : (survivalStageNumber
          ? survivalDefs.getStageByNumber(survivalStageNumber, mapCat)
          : null);

      if (!stageDef) {
        setContent({ kind: 'missing' });
        return;
      }

      const isBossEncounter = survivalDefs.survivalStageUsesCompositePhrasePattern(stageDef)
        || stageDef.blockKey === 'lesson_composite'
        || survivalDefs.formatSurvivalEncounterLabel(stageDef, isEnglishCopy) === (isEnglishCopy ? 'Boss' : 'ボス');
      const timeLimitSec = survivalLessonOverrides?.timeLimitSec ?? survivalDefs.STAGE_TIME_LIMIT_SECONDS;
      const killQuota = survivalLessonOverrides?.killQuota
        ?? firstBlock.getStageKillQuotaForStage(stageDef);

      const survivalLines = buildSurvivalLessonRequirementDisplay(
        stageDef,
        isBossEncounter,
        timeLimitSec,
        killQuota,
        isEnglishCopy,
      );

      setContent({
        kind: 'lines',
        modeEncounterLine: survivalLines.modeEncounterLine,
        clearLine: survivalLines.clearLine,
      });
    })().catch(() => {
      if (!cancelled) {
        setContent({ kind: 'missing' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    survivalCompositeConfig,
    survivalLessonOverrides,
    survivalMapCategory,
    survivalStageNumber,
    title,
    titleEn,
    isEnglishCopy,
  ]);

  if (content === null) {
    return null;
  }

  if (content.kind === 'missing') {
    return (
      <div className="mb-3 text-sm">
        <div className="text-gray-500 text-xs mt-1">
          {isEnglishCopy
            ? 'Stage not configured (check map/stage number or composite config).'
            : 'ステージ未設定（マップと番号、または複合フレーズ設定を確認してください）'}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 text-sm">
      <div className="text-gray-400 text-xs mt-1">{content.modeEncounterLine}</div>
      <div className="text-gray-400 text-xs mt-1">{content.clearLine}</div>
    </div>
  );
};

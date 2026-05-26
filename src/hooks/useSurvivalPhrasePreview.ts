import { useCallback, useEffect, useRef, useState } from 'react';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import { survivalStageUsesCompositePhrasePattern } from '@/components/survival/SurvivalStageDefinitions';
import type { SurvivalMapCategory } from '@/components/survival/SurvivalTypes';
import { resolveSurvivalBgmUrl } from '@/platform/supabaseSurvival';
import { fetchSurvivalPhraseBgmUrlByStage } from '@/utils/survivalPhraseDefinitions';
import { SurvivalPhraseMapPreviewPlayer } from '@/utils/survivalPhraseMapPreviewPlayer';
import { resolveSurvivalPhrasePreviewUrl } from '@/utils/survivalPhrasePreviewUrl';

export type SurvivalPhrasePreviewStatus = 'idle' | 'loading' | 'playing';

interface UseSurvivalPhrasePreviewParams {
  readonly phrasesStageBgm: string;
  readonly mapCategory: SurvivalMapCategory;
  readonly isEnglishCopy: boolean;
}

interface StopPhrasePreviewOptions {
  readonly restoreMapBgm?: boolean;
}

interface UseSurvivalPhrasePreviewResult {
  readonly status: SurvivalPhrasePreviewStatus;
  readonly phrasePreviewError: string | null;
  readonly playPhrasePreview: (stage: StageDefinition) => Promise<void>;
  readonly stopPhrasePreview: (options?: StopPhrasePreviewOptions) => void;
}

export const useSurvivalPhrasePreview = ({
  phrasesStageBgm,
  mapCategory,
  isEnglishCopy,
}: UseSurvivalPhrasePreviewParams): UseSurvivalPhrasePreviewResult => {
  const [status, setStatus] = useState<SurvivalPhrasePreviewStatus>('idle');
  const [phrasePreviewError, setPhrasePreviewError] = useState<string | null>(null);
  const playerRef = useRef(new SurvivalPhraseMapPreviewPlayer());

  useEffect(() => () => {
    playerRef.current.dispose();
  }, []);

  const stopPhrasePreview = useCallback((options?: StopPhrasePreviewOptions) => {
    playerRef.current.stop(options);
    setStatus('idle');
    setPhrasePreviewError(null);
  }, []);

  const playPhrasePreview = useCallback(
    async (stage: StageDefinition) => {
      if (stage.mapCategory !== 'phrases') {
        return;
      }
      setPhrasePreviewError(null);
      setStatus('loading');
      try {
        const url = survivalStageUsesCompositePhrasePattern(stage)
          ? (stage.compositePhraseBgmUrl?.trim()
            || resolveSurvivalBgmUrl('phrases', { phrases: phrasesStageBgm }))
          : resolveSurvivalPhrasePreviewUrl(
            await fetchSurvivalPhraseBgmUrlByStage(mapCategory, stage.stageNumber),
            phrasesStageBgm,
          );
        setStatus('playing');
        await playerRef.current.play(url);
        setStatus('idle');
      } catch {
        setStatus('idle');
        setPhrasePreviewError(
          isEnglishCopy ? 'Could not play the demo track.' : '模範演奏を再生できませんでした。',
        );
      }
    },
    [isEnglishCopy, mapCategory, phrasesStageBgm],
  );

  return {
    status,
    phrasePreviewError,
    playPhrasePreview,
    stopPhrasePreview,
  };
};

import React, {
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
} from 'react';
import EarTrainingChordOSMDScore, {
  type EarTrainingChordOSMDScoreHandle,
  type OsmdPlayheadSyncParams,
} from '@/components/earTraining/EarTrainingChordOSMDScore';
import type { OsmdScrollLayout } from '@/utils/earTrainingChordOsmdScoreScroll';

export interface EarTrainingPrecisionLoopOsmdScoreHandle {
  syncPlayhead: (params: OsmdPlayheadSyncParams) => void;
}

interface EarTrainingPrecisionLoopOsmdScoreProps {
  scoreXmlBySemitone: ReadonlyMap<number, string>;
  activeSemitone: number;
  scoreErrorText: string | null;
  activeMeasureNumber: number;
  measureDurationSec: number;
  countInDurationSec?: number;
  scrollActive: boolean;
  renderKeyValue: number;
  isEnglishCopy: boolean;
  hidden?: boolean;
  scoreZClassName?: string;
  fillParent?: boolean;
  manualScrollEnabled?: boolean;
  showScoreLyrics?: boolean;
  drawMeasureNumbers?: boolean;
  scrollLayout?: OsmdScrollLayout;
  onContentHeightFit?: (heightPx: number) => void;
}

const EarTrainingPrecisionLoopOsmdScore = memo(forwardRef<
  EarTrainingPrecisionLoopOsmdScoreHandle,
  EarTrainingPrecisionLoopOsmdScoreProps
>(function EarTrainingPrecisionLoopOsmdScore({
  scoreXmlBySemitone,
  activeSemitone,
  scoreErrorText,
  activeMeasureNumber,
  measureDurationSec,
  countInDurationSec = 0,
  scrollActive,
  renderKeyValue,
  isEnglishCopy,
  hidden = false,
  scoreZClassName = 'z-10',
  fillParent = false,
  manualScrollEnabled = false,
  showScoreLyrics = false,
  drawMeasureNumbers = false,
  scrollLayout,
  onContentHeightFit,
}, ref) {
  const scoreHandlesRef = useRef<Map<number, EarTrainingChordOSMDScoreHandle>>(new Map());

  useImperativeHandle(ref, () => ({
    syncPlayhead: (params: OsmdPlayheadSyncParams): void => {
      scoreHandlesRef.current.get(activeSemitone)?.syncPlayhead(params);
    },
  }), [activeSemitone]);

  const entries = [...scoreXmlBySemitone.entries()].sort((left, right) => left[0] - right[0]);

  return (
    <div className="relative h-full w-full">
      {entries.map(([semitone, xmlText]) => {
        const isActive = semitone === activeSemitone;
        return (
          <div
            key={semitone}
            className={isActive ? 'absolute inset-0' : 'pointer-events-none absolute inset-0 opacity-0'}
            aria-hidden={!isActive}
          >
            <EarTrainingChordOSMDScore
              ref={(handle) => {
                if (handle) {
                  scoreHandlesRef.current.set(semitone, handle);
                } else {
                  scoreHandlesRef.current.delete(semitone);
                }
              }}
              musicXmlText={xmlText}
              scoreErrorText={scoreErrorText}
              activeMeasureNumber={activeMeasureNumber}
              measureDurationSec={measureDurationSec}
              countInDurationSec={countInDurationSec}
              scrollActive={scrollActive}
              renderKeyValue={renderKeyValue + semitone}
              isEnglishCopy={isEnglishCopy}
              hidden={hidden}
              scoreZClassName={scoreZClassName}
              useImperativePlayhead
              fillParent={fillParent}
              manualScrollEnabled={manualScrollEnabled && isActive}
              showScoreLyrics={showScoreLyrics}
              drawMeasureNumbers={drawMeasureNumbers}
              scrollLayout={scrollLayout}
              onContentHeightFit={isActive ? onContentHeightFit : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}));

export default EarTrainingPrecisionLoopOsmdScore;

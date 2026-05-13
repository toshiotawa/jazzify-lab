/**
 * Progression + HINT 用の単一和弦スタッフ。バトル用 `ChordVoicingStaff` をラップして常にヘ（bass clef）。
 */
import React from 'react';

import ChordVoicingStaff, {
  CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD,
} from '@/components/earTraining/ChordVoicingStaff';

export interface SurvivalProgressionStaffProps {
  readonly voicingNames: readonly string[];
  readonly keyFifths: number;
  readonly correctPitchClasses: readonly number[];
  readonly className?: string;
}

export const SurvivalProgressionStaff = React.memo<SurvivalProgressionStaffProps>(
  ({ voicingNames, keyFifths, correctPitchClasses, className }) => {
    const bassStaves = voicingNames.map(() => 2 as const);

    return (
      <div
        className={className ?? 'w-[210px] max-w-[42vw] shrink-0 [&_svg]:max-h-[6.75rem]'}
        aria-hidden
      >
        <ChordVoicingStaff
          chordName=""
          completionPulse={null}
          denseCurrentMeasureLayout={
            voicingNames.length >= CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD
          }
          keyFifths={keyFifths}
          showTargetHints={false}
          activeGroupId="single"
          correctPitchClasses={correctPitchClasses}
          voicing={voicingNames}
          voicingStaves={bassStaves}
        />
      </div>
    );
  },
);

SurvivalProgressionStaff.displayName = 'SurvivalProgressionStaff';

/**
 * Progression + HINT 用の単一和弦スタッフ。バトル用 `ChordVoicingStaff` をラップして常にヘ（bass clef）。
 *
 * - 1 小節のみ表示（`singleMeasureLayout`）。
 * - コード名ラベル帯は不要（`hideChordLabels`）。
 * - 親の Punch スロットの右側で十分な大きさで読みやすくする。
 */
import React from 'react';

import ChordVoicingStaff from '@/components/earTraining/ChordVoicingStaff';

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
        className={
          className
          ?? 'min-w-0 flex-1 [&_svg]:h-auto [&_svg]:w-full'
        }
        aria-hidden
      >
        <ChordVoicingStaff
          chordName=""
          completionPulse={null}
          hideChordLabels
          singleMeasureLayout
          compactSingleMeasure
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

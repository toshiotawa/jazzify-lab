/**
 * Progression + HINT 用の単一和弦スタッフ。バトル用 `ChordVoicingStaff` をラップして常にヘ（bass clef）。
 *
 * - ヴォイシングバトルと同様に `voicingGroups` 経由でグループ単位入力（レイアウト・ラベル帯経路を揃える）。
 * - `singleMeasureLayout` はサバイバル Progression が 1 小節のためのみ指定。
 */
import React, { useMemo } from 'react';

import ChordVoicingStaff, { type ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';

export interface SurvivalProgressionStaffProps {
  readonly chordDisplayName: string;
  readonly voicingNames: readonly string[];
  readonly keyFifths: number;
  readonly correctPitchClasses: readonly number[];
  readonly className?: string;
}

export const SurvivalProgressionStaff = React.memo<SurvivalProgressionStaffProps>(
  ({ chordDisplayName, voicingNames, keyFifths, correctPitchClasses, className }) => {
    const bassStaves = useMemo(() => voicingNames.map(() => 2 as const), [voicingNames]);

    const voicingGroups = useMemo(
      (): readonly ChordVoicingStaffGroup[] => [
        {
          id: 'single',
          chordName: chordDisplayName,
          voicing: voicingNames,
          voicingStaves: bassStaves,
          correctPitchClasses,
          measureOffset: 0,
        },
      ],
      [bassStaves, chordDisplayName, correctPitchClasses, voicingNames],
    );

    return (
      <div
        className={
          className
          ?? 'min-w-0 flex-1 max-w-[min(720px,82vw)] [&_svg]:h-auto [&_svg]:w-full'
        }
        aria-hidden
      >
        <ChordVoicingStaff
          completionPulse={null}
          singleMeasureLayout
          keyFifths={keyFifths}
          showTargetHints={false}
          activeGroupId="single"
          voicingGroups={voicingGroups}
        />
      </div>
    );
  },
);

SurvivalProgressionStaff.displayName = 'SurvivalProgressionStaff';

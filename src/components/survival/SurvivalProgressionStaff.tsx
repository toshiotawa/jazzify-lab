/**
 * Progression + HINT 用の単一和弦スタッフ。バトル用 `ChordVoicingStaff` をラップして常にヘ（bass clef）。
 *
 * - ヴォイシングバトルと同様に `voicingGroups` 経由でグループ単位入力（レイアウト・ラベル帯経路を揃える）。
 * - `compactSingleMeasure` で単位譜幅を詰めつつ、バトル譜面と同じ SVG `<text>` + Bravura で音部・調号を描画する。
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
          ?? 'min-w-0 flex-1 max-w-[min(360px,72vw)] overflow-visible [&_svg]:origin-top [&_svg]:scale-[1.4] [&_svg]:transform-gpu [&_svg]:transform [&_svg]:h-auto [&_svg]:w-full md:[&_svg]:scale-[1.28]'
        }
        aria-hidden
      >
        <ChordVoicingStaff
          compactSingleMeasure
          completionPulse={null}
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

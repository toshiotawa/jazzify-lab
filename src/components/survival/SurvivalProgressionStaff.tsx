/**
 * Progression + HINT 用の単一和弦スタッフ。バトル用 `ChordVoicingStaff` をラップして常にヘ（bass clef）。
 *
 * - ヴォイシングバトルと同様に `voicingGroups` 経由でグループ単位入力（レイアウト・ラベル帯経路を揃える）。
 * - `compactSingleMeasure` で単位譜幅を詰める。Safari の PUA 問題回避のため `smuflUseForeignObject` で
 *   音部・調号・臨時記号を Bravura 非依存の SVG ベクター（iOS Canvas と同系のパス）で描画する。
 */
import React, { useMemo } from 'react';

import ChordVoicingStaff, { type ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import { cn } from '@/utils/cn';

export type SurvivalStaffClef = 'bass' | 'treble';

export interface SurvivalProgressionStaffProps {
  readonly chordDisplayName: string;
  readonly voicingNames: readonly string[];
  readonly keyFifths: number;
  readonly correctPitchClasses: readonly number[];
  /** 既定はヘ音（Progression）。ランダム HINT はト音。 */
  readonly staffClef?: SurvivalStaffClef;
  readonly className?: string;
}

export const SurvivalProgressionStaff = React.memo<SurvivalProgressionStaffProps>(
  ({ chordDisplayName, voicingNames, keyFifths, correctPitchClasses, staffClef = 'bass', className }) => {
    const staffNumber = staffClef === 'treble' ? (1 as const) : (2 as const);
    const voicingStaves = useMemo(() => voicingNames.map(() => staffNumber), [voicingNames, staffNumber]);

    const voicingGroups = useMemo(
      (): readonly ChordVoicingStaffGroup[] => [
        {
          id: 'single',
          chordName: chordDisplayName,
          voicing: voicingNames,
          voicingStaves,
          correctPitchClasses,
          measureOffset: 0,
        },
      ],
      [voicingStaves, chordDisplayName, correctPitchClasses, voicingNames],
    );

    return (
      <div
        className={cn(
          'min-w-0 flex-1 max-w-[min(360px,72vw)] overflow-visible [&_svg]:origin-top [&_svg]:scale-[1.4] [&_svg]:transform-gpu [&_svg]:transform [&_svg]:h-auto [&_svg]:w-full md:[&_svg]:scale-[1.28]',
          className,
          'pointer-events-none',
        )}
        aria-hidden
      >
        <ChordVoicingStaff
          compactSingleMeasure
          completionPulse={null}
          keyFifths={keyFifths}
          showTargetHints={false}
          activeGroupId="single"
          smuflUseForeignObject
          voicingGroups={voicingGroups}
        />
      </div>
    );
  },
);

SurvivalProgressionStaff.displayName = 'SurvivalProgressionStaff';

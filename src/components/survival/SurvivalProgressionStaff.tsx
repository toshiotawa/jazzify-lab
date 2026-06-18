/**
 * Progression + HINT 用の単一和弦スタッフ。バトル用 `ChordVoicingStaff` をラップして常にヘ（bass clef）。
 *
 * - ヴォイシングバトルと同様に `voicingGroups` 経由でグループ単位入力（レイアウト・ラベル帯経路を揃える）。
 * - `compactSingleMeasure` で単位譜幅を詰める。Safari の PUA 問題回避のため `smuflUseForeignObject` で
 *   音部・調号・臨時記号を Bravura 非依存の SVG ベクター（iOS Canvas と同系のパス）で描画する。
 */
import React, { useMemo } from 'react';

import ChordVoicingStaff, {
  type ChordVoicingStaffGroup,
  type ChordVoicingStaffNoteCollisionLayout,
} from '@/components/earTraining/ChordVoicingStaff';
import { cn } from '@/utils/cn';

export type SurvivalStaffClef = 'bass' | 'treble';

/** ゲーム画面が Punch 現ターゲットから構築する中央スタッフ用データ */
export interface SurvivalProgressionStaffSnapshot {
  readonly voicingNames: readonly string[];
  readonly keyFifths: number;
  readonly correctPitchClasses: readonly number[];
  readonly chordDisplayName: string;
  /** 度数・テンション出題時のルート音名（例: C, Db） */
  readonly rootDisplayName?: string;
  readonly staffClef?: SurvivalStaffClef;
  /** 音符単位で 1=treble, 2=bass。指定時は `staffClef` 単一割当より優先（大譜表）。 */
  readonly voicingStaves?: readonly (1 | 2)[];
}

export interface SurvivalProgressionStaffProps {
  readonly chordDisplayName: string;
  readonly rootDisplayName?: string;
  readonly voicingNames: readonly string[];
  readonly keyFifths: number;
  readonly correctPitchClasses: readonly number[];
  /** 既定はヘ音（Progression）。ランダム HINT はト音。 */
  readonly staffClef?: SurvivalStaffClef;
  /** `voicingNames` と同長。無指定時は `staffClef` で全員同じ譜表。 */
  readonly voicingStaves?: readonly (1 | 2)[];
  /** 隣接符頭の横ずらし。未指定時は低音基準（`anchor-low`） */
  readonly noteCollisionLayout?: ChordVoicingStaffNoteCollisionLayout;
  /** 未正解符頭 opacity（0〜1）。本番 HINT OFF フェード用。 */
  readonly unpressedNoteOpacity?: number;
  /** コード名ラベルを表示しない。 */
  readonly hideChordLabel?: boolean;
  /** 大譜表（ト音＋ヘ音）向け demo レイアウト。`grandStaffMode` ステージ限定。 */
  readonly grandStaffLayout?: boolean;
  readonly className?: string;
}

export const SurvivalProgressionStaff = React.memo<SurvivalProgressionStaffProps>(
  ({
    chordDisplayName,
    rootDisplayName,
    voicingNames,
    keyFifths,
    correctPitchClasses,
    staffClef = 'bass',
    voicingStaves: explicitStaves,
    noteCollisionLayout = 'anchor-low',
    unpressedNoteOpacity = 1,
    hideChordLabel = false,
    grandStaffLayout = false,
    className,
  }) => {
    const useGrandStaffLayout = grandStaffLayout === true;
    const staffNumber = staffClef === 'treble' ? (1 as const) : (2 as const);
    const voicingStaves = useMemo(() => {
      if (explicitStaves && explicitStaves.length === voicingNames.length) {
        return explicitStaves;
      }
      return voicingNames.map(() => staffNumber);
    }, [explicitStaves, staffNumber, voicingNames]);

    const staffChordLabel = useMemo(() => {
      if (rootDisplayName && rootDisplayName.length > 0) {
        return `${rootDisplayName}\n${chordDisplayName}`;
      }
      return chordDisplayName;
    }, [chordDisplayName, rootDisplayName]);

    const voicingGroups = useMemo(
      (): readonly ChordVoicingStaffGroup[] => [
        {
          id: 'single',
          chordName: staffChordLabel,
          voicing: voicingNames,
          voicingStaves,
          correctPitchClasses,
          measureOffset: 0,
        },
      ],
      [voicingStaves, staffChordLabel, correctPitchClasses, voicingNames],
    );

    return (
      <div
        className={cn(
          useGrandStaffLayout
            ? 'min-w-0 flex-1 max-w-[min(420px,78vw)] overflow-visible [&_svg]:origin-top [&_svg]:scale-[1.35] [&_svg]:transform-gpu [&_svg]:transform [&_svg]:h-auto [&_svg]:w-full md:[&_svg]:scale-[1.22]'
            : 'min-w-0 flex-1 max-w-[min(280px,60vw)] overflow-visible [&_svg]:origin-top [&_svg]:scale-[0.92] [&_svg]:transform-gpu [&_svg]:transform [&_svg]:h-auto [&_svg]:w-full md:[&_svg]:scale-[0.88]',
          className,
          'pointer-events-none',
        )}
        aria-hidden
      >
        <ChordVoicingStaff
          {...(useGrandStaffLayout
            ? { singleMeasureLayout: true as const }
            : { compactSingleMeasure: true as const })}
          completionPulse={null}
          unpressedNoteOpacity={unpressedNoteOpacity}
          keyFifths={keyFifths}
          noteCollisionLayout={noteCollisionLayout}
          showTargetHints={false}
          activeGroupId="single"
          hideChordLabels={hideChordLabel}
          smuflUseForeignObject
          voicingGroups={voicingGroups}
        />
      </div>
    );
  },
);

SurvivalProgressionStaff.displayName = 'SurvivalProgressionStaff';

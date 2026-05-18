import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SurvivalProgressionStaff,
  type SurvivalProgressionStaffSnapshot,
} from './SurvivalProgressionStaff';

describe('SurvivalProgressionStaff (survival overlay)', () => {
  it('ヘ音コード進行: 調号などを SVG ベクターで描画し svg text に載せない', async () => {
    const progressionStaffSnapshot: SurvivalProgressionStaffSnapshot = {
      voicingNames: ['C3', 'E3', 'G3', 'B3'],
      keyFifths: 1,
      correctPitchClasses: [],
      chordDisplayName: 'Cmaj7',
      staffClef: 'bass',
    };

    const { container } = render(
      <SurvivalProgressionStaff
        chordDisplayName={progressionStaffSnapshot.chordDisplayName}
        voicingNames={progressionStaffSnapshot.voicingNames}
        keyFifths={progressionStaffSnapshot.keyFifths}
        correctPitchClasses={progressionStaffSnapshot.correctPitchClasses}
        staffClef={progressionStaffSnapshot.staffClef}
      />,
    );

    await waitFor(() => {
      expect(
        container.querySelector(
          '[data-key-signature-staff="2"][data-key-signature-index="0"] [data-smufl-vector-glyph="sharp"]',
        ),
      ).not.toBeNull();
    });

    expect(container.querySelector('text[data-key-signature-index="0"]')).toBeNull();
  });

  it('ランダムヒント用: ト音記号のスタッフ（staff=1）を描画する', async () => {
    const progressionStaffSnapshot: SurvivalProgressionStaffSnapshot = {
      voicingNames: ['C4', 'E4', 'G4', 'B4'],
      keyFifths: 0,
      correctPitchClasses: [],
      chordDisplayName: 'Cmaj7',
      staffClef: 'treble',
    };

    const { container } = render(
      <SurvivalProgressionStaff
        chordDisplayName={progressionStaffSnapshot.chordDisplayName}
        voicingNames={progressionStaffSnapshot.voicingNames}
        keyFifths={progressionStaffSnapshot.keyFifths}
        correctPitchClasses={progressionStaffSnapshot.correctPitchClasses}
        staffClef={progressionStaffSnapshot.staffClef ?? 'treble'}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('g[data-staff-clef="1"]')).not.toBeNull();
    });

    expect(container.querySelector('g[data-staff-clef="2"]')).toBeNull();
    expect(screen.queryByText(/Shot/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Punch/)).not.toBeInTheDocument();
  });
});

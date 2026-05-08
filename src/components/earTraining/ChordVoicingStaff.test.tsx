import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChordVoicingStaff from './ChordVoicingStaff';

describe('ChordVoicingStaff', () => {
  it('sp基準で2段譜の五線間に7spの余白を確保する', () => {
    const { container } = render(
      <ChordVoicingStaff
        voicing={['D3', 'F3', 'A3', 'C4']}
        voicingStaves={[2, 2, 2, 1]}
        chordName="Dm7"
      />,
    );

    const trebleBottomLine = container.querySelector('line[data-staff-number="1"][data-staff-line="4"]');
    const bassTopLine = container.querySelector('line[data-staff-number="2"][data-staff-line="0"]');

    expect(trebleBottomLine).not.toBeNull();
    expect(bassTopLine).not.toBeNull();
    expect(Number(bassTopLine?.getAttribute('y1')) - Number(trebleBottomLine?.getAttribute('y1'))).toBe(84);
  });

  it('voicing_staves が無い場合はDBの音域から譜表を推定する', () => {
    const { container } = render(
      <ChordVoicingStaff
        voicing={['D3', 'C4']}
        chordName="Dm7"
      />,
    );

    expect(container.querySelector('line[data-staff-number="1"][data-staff-line="0"]')).not.toBeNull();
    expect(container.querySelector('line[data-staff-number="2"][data-staff-line="0"]')).not.toBeNull();
  });

  it('正解済み構成音と臨時記号を赤く表示する', () => {
    const { container } = render(
      <ChordVoicingStaff
        voicing={['F#4', 'A4']}
        voicingStaves={[1, 1]}
        chordName="D7"
        correctPitchClasses={[6]}
      />,
    );

    const correctNotehead = container.querySelector('ellipse[data-voicing-index="0"]');
    const defaultNotehead = container.querySelector('ellipse[data-voicing-index="1"]');
    const correctAccidental = container.querySelector('text[data-accidental-voicing-index="0"]');

    expect(correctNotehead?.getAttribute('stroke')).toBe('#ef4444');
    expect(defaultNotehead?.getAttribute('stroke')).toBe('#ffffff');
    expect(correctAccidental?.getAttribute('fill')).toBe('#ef4444');
  });
});

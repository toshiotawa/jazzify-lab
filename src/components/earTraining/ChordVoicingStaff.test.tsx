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

  it('正解済み構成音と臨時記号を緑で表示する', () => {
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

    expect(correctNotehead?.getAttribute('stroke')).toBe('#22c55e');
    expect(defaultNotehead?.getAttribute('stroke')).toBe('#ffffff');
    expect(correctAccidental?.getAttribute('fill')).toBe('#22c55e');
  });

  it('非アクティブなコードでも正解済み構成音の色を保持し、現在コード名を黄色にする', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="CM7"
        voicingGroups={[
          {
            id: 'completed',
            chordName: 'D7',
            voicing: ['F#4', 'A4'],
            voicingStaves: [1, 1],
            correctPitchClasses: [6],
            measureOffset: 0,
          },
          {
            id: 'active',
            chordName: 'G7',
            voicing: ['G4', 'B4'],
            voicingStaves: [1, 1],
            measureOffset: 0,
            isActive: true,
          },
        ]}
      />,
    );

    const completedNotehead = container.querySelector('ellipse[data-voicing-pitch-class="6"]');
    const activeLabel = container.querySelector('text[data-voicing-group-id="active"]');
    const inactiveLabel = container.querySelector('text[data-voicing-group-id="completed"]');

    expect(completedNotehead?.getAttribute('stroke')).toBe('#22c55e');
    expect(activeLabel?.getAttribute('fill')).toBe('#facc15');
    expect(inactiveLabel?.getAttribute('fill')).toBe('#ffffff');
  });

  it('同じ小節の複数ヴォイシングを横に均等配置する', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="CM7"
        voicingGroups={[
          {
            id: 'v1',
            chordName: 'CM7',
            voicing: ['C4', 'E4'],
            voicingStaves: [1, 1],
            measureOffset: 0,
          },
          {
            id: 'v2',
            chordName: 'CM7',
            voicing: ['C4', 'E4', 'G4'],
            voicingStaves: [1, 1, 1],
            measureOffset: 0,
          },
          {
            id: 'v3',
            chordName: 'CM7',
            voicing: ['E4', 'G4', 'B4', 'D5'],
            voicingStaves: [1, 1, 1, 1],
            measureOffset: 0,
          },
        ]}
      />,
    );

    const labels = Array.from(container.querySelectorAll('text')).filter(label => label.textContent === 'CM7');
    const labelXs = labels.map(label => Number(label.getAttribute('x')));

    expect(labelXs).toHaveLength(3);
    expect(labelXs[1] - labelXs[0]).toBeCloseTo(labelXs[2] - labelXs[1]);
  });
});

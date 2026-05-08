import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChordVoicingStaff from './ChordVoicingStaff';

const SMUFL_ACCIDENTAL_NATURAL = '\uE261';
const SMUFL_ACCIDENTAL_SHARP = '\uE262';

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

  it('丸め込み後の表示小節内では F# の後の F natural にナチュラルを表示する', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="F line"
        voicingGroups={[
          {
            id: 'sharp',
            chordName: 'F#',
            voicing: ['F#4'],
            voicingStaves: [1],
            measureOffset: 0,
          },
          {
            id: 'natural',
            chordName: '',
            voicing: ['F4'],
            voicingStaves: [1],
            measureOffset: 0,
          },
        ]}
      />,
    );

    expect(container.querySelector('text[data-accidental-group-id="sharp"]')?.textContent).toBe(SMUFL_ACCIDENTAL_SHARP);
    expect(container.querySelector('text[data-accidental-group-id="natural"]')?.textContent).toBe(SMUFL_ACCIDENTAL_NATURAL);
  });

  it('表示小節が変わると臨時記号状態を調号基準に戻す', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="F line"
        voicingGroups={[
          {
            id: 'measure-1-sharp',
            chordName: 'F#',
            voicing: ['F#4'],
            voicingStaves: [1],
            measureOffset: 0,
          },
          {
            id: 'measure-2-natural',
            chordName: 'F',
            voicing: ['F4'],
            voicingStaves: [1],
            measureOffset: 1,
          },
        ]}
      />,
    );

    expect(container.querySelector('text[data-accidental-group-id="measure-1-sharp"]')?.textContent).toBe(SMUFL_ACCIDENTAL_SHARP);
    expect(container.querySelector('text[data-accidental-group-id="measure-2-natural"]')).toBeNull();
  });

  it('調号の状態から臨時記号を判定し、同じ表示小節で調号音に戻る時は記号を出す', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="G major"
        keyFifths={1}
        voicingGroups={[
          {
            id: 'key-f-sharp',
            chordName: 'F#',
            voicing: ['F#4'],
            voicingStaves: [1],
            measureOffset: 0,
          },
          {
            id: 'f-natural',
            chordName: '',
            voicing: ['F4'],
            voicingStaves: [1],
            measureOffset: 0,
          },
          {
            id: 'f-sharp-again',
            chordName: '',
            voicing: ['F#4'],
            voicingStaves: [1],
            measureOffset: 0,
          },
        ]}
      />,
    );

    expect(container.querySelectorAll('text[data-key-signature-index]')).toHaveLength(1);
    expect(container.querySelector('text[data-accidental-group-id="key-f-sharp"]')).toBeNull();
    expect(container.querySelector('text[data-accidental-group-id="f-natural"]')?.textContent).toBe(SMUFL_ACCIDENTAL_NATURAL);
    expect(container.querySelector('text[data-accidental-group-id="f-sharp-again"]')?.textContent).toBe(SMUFL_ACCIDENTAL_SHARP);
  });

  it('タイ継続音は臨時記号表示を抑制しつつ状態更新には使う', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="Tie"
        voicingGroups={[
          {
            id: 'tied-sharp',
            chordName: 'F#',
            voicing: ['F#4'],
            voicingStaves: [1],
            tiedFromPreviousVoicingIndices: [0],
            measureOffset: 0,
          },
          {
            id: 'after-tie-natural',
            chordName: '',
            voicing: ['F4'],
            voicingStaves: [1],
            measureOffset: 0,
          },
        ]}
      />,
    );

    expect(container.querySelector('text[data-accidental-group-id="tied-sharp"]')).toBeNull();
    expect(container.querySelector('text[data-accidental-group-id="after-tie-natural"]')?.textContent).toBe(SMUFL_ACCIDENTAL_NATURAL);
  });

  it('voicing が空のグループは全休符として両譜表へ表示する', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="CM7"
        voicingGroups={[
          {
            id: 'rest',
            chordName: 'CM7',
            voicing: [],
            voicingStaves: [],
            measureOffset: 0,
            isRest: true,
          },
        ]}
      />,
    );

    expect(container.querySelectorAll('rect[data-whole-rest-group-id="rest"]')).toHaveLength(2);
    expect(container.querySelector('ellipse[data-voicing-group-id="rest"]')).toBeNull();
  });

  it('現在小節に5音以上のヴォイシングがある場合は小節線を右へ寄せる', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="CM9"
        voicingGroups={[
          {
            id: 'dense',
            chordName: 'CM9',
            voicing: ['C4', 'E4', 'G4', 'B4', 'D5'],
            voicingStaves: [1, 1, 1, 1, 1],
            measureOffset: 0,
          },
          {
            id: 'next',
            chordName: 'F7',
            voicing: ['F4', 'A4', 'C5', 'Eb5'],
            voicingStaves: [1, 1, 1, 1],
            measureOffset: 1,
          },
        ]}
      />,
    );

    const firstBarline = container.querySelector('line[data-staff-barline]');
    expect(Number(firstBarline?.getAttribute('x1'))).toBeGreaterThan(600);
  });

  it('現在小節で複数グループの合計が5音以上なら小節線を右へ寄せる（推論）', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="CM7"
        voicingGroups={[
          {
            id: 'a',
            chordName: 'CM7',
            voicing: ['C4', 'E4', 'G4'],
            voicingStaves: [1, 1, 1],
            measureOffset: 0,
          },
          {
            id: 'b',
            chordName: '',
            voicing: ['B3', 'D4'],
            voicingStaves: [2, 2],
            measureOffset: 0,
          },
          {
            id: 'next',
            chordName: 'F7',
            voicing: ['F4', 'A4'],
            voicingStaves: [1, 1],
            measureOffset: 1,
          },
        ]}
      />,
    );

    const firstBarline = container.querySelector('line[data-staff-barline]');
    expect(Number(firstBarline?.getAttribute('x1'))).toBeGreaterThan(600);
  });

  it('denseCurrentMeasureLayout が false のときは合計が5音以上でも小節線を中央のままにする', () => {
    const { container } = render(
      <ChordVoicingStaff
        chordName="CM7"
        denseCurrentMeasureLayout={false}
        voicingGroups={[
          {
            id: 'a',
            chordName: 'CM7',
            voicing: ['C4', 'E4', 'G4'],
            voicingStaves: [1, 1, 1],
            measureOffset: 0,
          },
          {
            id: 'b',
            chordName: '',
            voicing: ['B3', 'D4'],
            voicingStaves: [2, 2],
            measureOffset: 0,
          },
          {
            id: 'next',
            chordName: 'F7',
            voicing: ['F4', 'A4'],
            voicingStaves: [1, 1],
            measureOffset: 1,
          },
        ]}
      />,
    );

    const firstBarline = container.querySelector('line[data-staff-barline]');
    expect(Number(firstBarline?.getAttribute('x1'))).toBe(360);
  });
});

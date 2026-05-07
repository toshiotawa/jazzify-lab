import { describe, expect, it } from 'vitest';
import { applyVoicingNoteheadColors } from '@/utils/voicingStaffColoring';

const createSvgContainer = (): HTMLElement => {
  const container = document.createElement('div');
  container.innerHTML = `
    <svg>
      <g class="vf-stavenote">
        <g class="vf-notehead"><path data-note="d" /></g>
        <g class="vf-notehead"><path data-note="f" /></g>
        <g class="vf-notehead"><path data-note="a" /></g>
      </g>
      <g class="vf-stavenote">
        <g class="vf-notehead"><path data-note="rest" /></g>
      </g>
    </svg>
  `;
  return container;
};

describe('voicingStaffColoring', () => {
  it('和音グループ全体ではなく、正解ピッチクラスの notehead だけを色付けする', () => {
    const container = createSvgContainer();

    applyVoicingNoteheadColors({
      container,
      noteheadOrder: [0, 1, 2, null],
      voicingPitchClasses: [2, 5, 9],
      correctPitchClasses: [2],
      correctFillColor: '#22d3ee',
      defaultFillColor: '#0f172a',
    });

    const paths = Array.from(container.querySelectorAll<SVGPathElement>('path'));
    expect(paths[0].getAttribute('fill')).toBe('#22d3ee');
    expect(paths[1].getAttribute('fill')).toBe('#0f172a');
    expect(paths[2].getAttribute('fill')).toBe('#0f172a');
    expect(paths[3].getAttribute('fill')).toBeNull();
  });

  it('別の正解音が入ったときも対応する notehead だけを更新する', () => {
    const container = createSvgContainer();

    applyVoicingNoteheadColors({
      container,
      noteheadOrder: [0, 1, 2, null],
      voicingPitchClasses: [2, 5, 9],
      correctPitchClasses: [2, 9],
      correctFillColor: '#22d3ee',
      defaultFillColor: '#0f172a',
    });

    const paths = Array.from(container.querySelectorAll<SVGPathElement>('path'));
    expect(paths[0].getAttribute('fill')).toBe('#22d3ee');
    expect(paths[1].getAttribute('fill')).toBe('#0f172a');
    expect(paths[2].getAttribute('fill')).toBe('#22d3ee');
    expect(paths[3].getAttribute('fill')).toBeNull();
  });
});

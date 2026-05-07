interface ApplyVoicingNoteheadColorsOptions {
  container: HTMLElement;
  noteheadOrder: readonly (number | null)[];
  voicingPitchClasses: readonly (number | null)[];
  correctPitchClasses: readonly number[];
  correctFillColor: string;
  defaultFillColor: string;
}

const COLORABLE_NOTEHEAD_SELECTOR = 'path, ellipse, circle, polygon, rect';

export const applyVoicingNoteheadColors = ({
  container,
  noteheadOrder,
  voicingPitchClasses,
  correctPitchClasses,
  correctFillColor,
  defaultFillColor,
}: ApplyVoicingNoteheadColorsOptions): void => {
  const correctPitchClassSet = new Set(correctPitchClasses);
  const noteheadElements = Array.from(container.querySelectorAll<SVGGElement>('g.vf-notehead'));

  noteheadElements.forEach((noteheadEl, index) => {
    const voicingIndex = noteheadOrder[index];
    if (voicingIndex === null || voicingIndex === undefined) {
      return;
    }

    const pitchClass = voicingPitchClasses[voicingIndex];
    const isCorrect = pitchClass !== null
      && pitchClass !== undefined
      && correctPitchClassSet.has(pitchClass);
    const fill = isCorrect ? correctFillColor : defaultFillColor;

    noteheadEl.querySelectorAll<SVGElement>(COLORABLE_NOTEHEAD_SELECTOR).forEach(shapeEl => {
      shapeEl.setAttribute('fill', fill);
    });
  });
};

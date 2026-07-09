import { resolveOsuCircleNoteLabels } from '../earTrainingBattleOsuCircleNoteLabels';

describe('resolveOsuCircleNoteLabels', () => {
  it('低い MIDI から音名を並べ、重複を除く', () => {
    expect(resolveOsuCircleNoteLabels([64, 60, 67, 60])).toEqual(['C', 'E', 'G']);
  });

  it('空配列は空を返す', () => {
    expect(resolveOsuCircleNoteLabels([])).toEqual([]);
  });
});

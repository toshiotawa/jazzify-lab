import { resolveOsuCircleNoteLabels } from '../earTrainingBattleOsuCircleNoteLabels';

describe('resolveOsuCircleNoteLabels', () => {
  it('低い MIDI から音名を並べ、重複を除く', () => {
    expect(resolveOsuCircleNoteLabels([64, 60, 67, 60])).toEqual(['C', 'E', 'G']);
  });

  it('空配列は空を返す', () => {
    expect(resolveOsuCircleNoteLabels([])).toEqual([]);
  });

  it('MusicXML 由来の spellings があれば MIDI シャープ固定より優先する', () => {
    expect(resolveOsuCircleNoteLabels([70], ['Bb'])).toEqual(['Bb']);
    expect(resolveOsuCircleNoteLabels([70, 73], ['Bb', 'Db'])).toEqual(['Bb', 'Db']);
  });

  it('spellings が空や未指定なら MIDI フォールバック', () => {
    expect(resolveOsuCircleNoteLabels([70], [])).toEqual(['A#']);
    expect(resolveOsuCircleNoteLabels([70], null)).toEqual(['A#']);
    expect(resolveOsuCircleNoteLabels([70])).toEqual(['A#']);
  });
});

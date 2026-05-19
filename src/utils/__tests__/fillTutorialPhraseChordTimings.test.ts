import { fillTutorialPhraseChordTimings } from '@/components/earTraining/tutorial/fillTutorialPhraseChordTimings';
import type { EarTrainingTutorialContentChord } from '@/components/earTraining/tutorial/earTrainingTutorialScriptTypes';

describe('fillTutorialPhraseChordTimings', () => {
  it('measure/beat から start/end を補完する', () => {
    const chords: EarTrainingTutorialContentChord[] = [
      {
        order_index: 0,
        chord_name: 'Dm7',
        measure_number: 1,
        beat_offset: 1,
        voicing: ['D3'],
      },
      {
        order_index: 1,
        chord_name: 'G7',
        measure_number: 2,
        beat_offset: 1,
        voicing: ['G3'],
      },
      {
        order_index: 2,
        chord_name: 'CM7',
        measure_number: 3,
        beat_offset: 1,
        voicing: ['C3'],
      },
    ];
    const filled = fillTutorialPhraseChordTimings(chords, 120, 4, 8);
    expect(filled[0].start_time_sec).toBe(0);
    expect(filled[0].end_time_sec).toBe(2);
    expect(filled[1].start_time_sec).toBe(2);
    expect(filled[1].end_time_sec).toBe(4);
    expect(filled[2].start_time_sec).toBe(4);
    expect(filled[2].end_time_sec).toBe(8);
  });
});

import {
  defenseCallResponseAtBeat,
  makeDefenseCallResponseConfig,
} from '@/game/defense/defenseCallResponse';

describe('defense call/response', () => {
  const config = makeDefenseCallResponseConfig(8, 1, 4);
  if (!config) throw new Error('invalid test configuration');

  it('divides an eight-bar loop into four call/response pairs', () => {
    for (let pair = 0; pair < 4; pair += 1) {
      const call = defenseCallResponseAtBeat(pair * 8, 120, 1, config);
      const response = defenseCallResponseAtBeat(pair * 8 + 4, 120, 1, config);
      expect(call).toEqual({ phase: 'call', pairIndex: pair, judgmentOpen: false });
      expect(response).toEqual({ phase: 'response', pairIndex: pair, judgmentOpen: true });
    }
    expect(defenseCallResponseAtBeat(32, 120, 1, config).pairIndex).toBe(0);
    expect(defenseCallResponseAtBeat(32, 120, 1, config).phase).toBe('call');
  });

  it('opens judgment 30ms before response without moving the visual boundary', () => {
    const before31Ms = 4 - 0.031 * 120 / 60;
    const before29Ms = 4 - 0.029 * 120 / 60;
    expect(defenseCallResponseAtBeat(before31Ms, 120, 1, config).judgmentOpen).toBe(false);
    const lead = defenseCallResponseAtBeat(before29Ms, 120, 1, config);
    expect(lead).toEqual({ phase: 'call', pairIndex: 0, judgmentOpen: true });
    expect(defenseCallResponseAtBeat(8, 120, 1, config).judgmentOpen).toBe(false);
  });

  it('uses playback speed when computing the lead', () => {
    expect(defenseCallResponseAtBeat(4 - 0.04, 120, 0.5, config).judgmentOpen).toBe(false);
    expect(defenseCallResponseAtBeat(4 - 0.04, 120, 2, config).judgmentOpen).toBe(true);
  });

  it('supports other evenly divisible pairs and rejects invalid stages', () => {
    const twoBars = makeDefenseCallResponseConfig(8, 2, 4);
    expect(twoBars).not.toBeNull();
    if (!twoBars) return;
    expect(defenseCallResponseAtBeat(8, 100, 1, twoBars).phase).toBe('response');
    expect(defenseCallResponseAtBeat(16, 100, 1, twoBars).pairIndex).toBe(1);
    expect(makeDefenseCallResponseConfig(8, 3, 4)).toBeNull();
    expect(makeDefenseCallResponseConfig(7, 1, 4)).toBeNull();
    expect(makeDefenseCallResponseConfig(8, 0, 4)).toBeNull();
  });
});

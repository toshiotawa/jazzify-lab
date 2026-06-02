import { buildTutorialPhrasePairAdlibBootstrap } from '@/utils/buildTutorialPhrasePairAdlibBootstrap';
import type { EarTrainingTutorialContentPhrasePairAdlib } from '@/components/earTraining/tutorial/earTrainingTutorialScriptTypes';

const basePayload = (): EarTrainingTutorialContentPhrasePairAdlib => ({
  bgm_url: 'https://example.com/bgm.mp3',
  loop_duration_sec: 8,
  steps: [
    {
      order_index: 0,
      chord_name: 'C',
      pattern_group_key: 'g1',
      start_time_sec: 0,
      end_time_sec: 4,
      input_disabled: true,
    },
    {
      order_index: 1,
      chord_name: 'G',
      pattern_group_key: 'g1',
      start_time_sec: 4,
      end_time_sec: 8,
      quote: { ja: '聴く', en: 'Listen' },
    },
  ],
  patterns: [
    {
      group_key: 'g1',
      label: 'maj',
      pcs: [0, 4, 7],
      family_id: 'triad',
    },
  ],
});

describe('buildTutorialPhrasePairAdlibBootstrap', () => {
  it('maps quote and input_disabled on steps', () => {
    const boot = buildTutorialPhrasePairAdlibBootstrap(basePayload(), false);
    expect(boot).not.toBeNull();
    expect(boot?.steps[0]?.inputDisabled).toBe(true);
    expect(boot?.steps[0]?.quote).toBeNull();
    expect(boot?.steps[1]?.quote).toBe('聴く');
    expect(boot?.steps[1]?.inputDisabled).toBe(false);
  });

  it('returns null when bgm or patterns are missing', () => {
    expect(buildTutorialPhrasePairAdlibBootstrap({ ...basePayload(), bgm_url: '' }, false)).toBeNull();
    expect(
      buildTutorialPhrasePairAdlibBootstrap({ ...basePayload(), patterns: [] }, false),
    ).toBeNull();
  });
});

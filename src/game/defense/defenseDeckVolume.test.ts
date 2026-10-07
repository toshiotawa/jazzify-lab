import { vi } from 'vitest';
import type { DefenseStage } from '@/game/defense/defenseTypes';
import { VOICE_INPUT_BGM_DUCK } from '@/utils/voiceInputBgmDuck';

vi.mock('@soundtouchjs/audio-worklet', () => ({ processOffline: vi.fn() }));
vi.mock('@/utils/audioFetchCache', () => ({ fetchCachedFullAudioBuffer: vi.fn() }));

describe('Defense backing volume', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(['single_source', 'shared_progression'])(
    '%s applies settings before graph creation and updates the live output',
    async (mode) => {
      vi.resetModules();
      const gain = { gain: { value: 1 }, connect: vi.fn() };
      vi.stubGlobal('AudioContext', class {
        state = 'running';
        createGain() { return gain; }
      });
      const deck = mode === 'single_source'
        ? (await import('./defenseBackingDeck')).defenseBackingDeck
        : (await import('./defenseSharedProgressionDeck')).defenseSharedProgressionDeck;
      deck.setUserVolume(0.25);
      deck.setVoiceInputDucking(true);
      if ('preload' in deck) {
        await deck.preload([]);
      } else {
        const stage: DefenseStage = {
          id: 'test', slug: 'test', stageNumber: 1, title: 'test', titleEn: null,
          bpm: 120, beatsPerBar: 4, audioRegistrationMode: 'shared_progression',
          audioUrl: null, melodyAudioUrl: null, progressionBars: 12, phraseBars: 1,
          staffLayout: 'treble', attackTrigger: 'note', keyFifths: 0,
          requiredCompletionCount: 1, difficultyLevel: 1, surviveSeconds: 60, playerHp: 5,
          productionStaffHintMode: 'fade_15s', productionKeyboardHintMode: 'fade_15s',
          playStyle: 'phrase', voicingKeyMode: null, voicingLowestKey: null,
          voicingStartKey: null, voicingMinLowestNote: null, playRootOnChordChange: false,
          phrases: [], progressionChords: [],
        };
        await deck.prepare(stage, 1);
      }
      expect(gain.gain.value).toBeCloseTo(0.25 * VOICE_INPUT_BGM_DUCK);
      deck.setUserVolume(0);
      expect(gain.gain.value).toBe(0);
      deck.setVoiceInputDucking(false);
      deck.setUserVolume(0.6);
      expect(gain.gain.value).toBe(0.6);
    },
  );
});

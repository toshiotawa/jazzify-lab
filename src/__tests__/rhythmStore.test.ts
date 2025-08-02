import { describe, it, expect } from 'vitest';
import { useRhythmStore } from '@/stores/rhythmStore';

const dummyStage = {
  id: 's',
  stageNumber: '0-0',
  name: 't',
  description: '',
  maxHp: 1,
  enemyGaugeSeconds: 4,
  enemyCount: 1,
  enemyHp: 1,
  minDamage: 1,
  maxDamage: 1,
  mode: 'rhythm',
  allowedChords: ['C'],
  showSheetMusic: false,
  showGuide: true,
  measureCount: 4,
  bpm: 120,
  countInMeasures: 0,
  timeSignature: 4
} as any;

describe('rhythmStore', () => {
  it('generates 4 random questions', () => {
    const { generate, questions } = useRhythmStore.getState();
    generate(dummyStage);
    expect(useRhythmStore.getState().questions).toHaveLength(4);
  });
});
import { describe, expect, it } from 'vitest';
import { parsePolyPitchWorkerMessage } from '@/utils/pitchInput/polyPitchWorkerMessages';

describe('parsePolyPitchWorkerMessage', () => {
  it('noteOn メッセージを解釈する', () => {
    const parsed = parsePolyPitchWorkerMessage({
      type: 'noteOn',
      note: 64,
      audioContextTime: 1.25,
      level: 90,
    });
    expect(parsed).toMatchObject({
      type: 'noteOn',
      note: 64,
      audioContextTime: 1.25,
      level: 90,
    });
  });
});
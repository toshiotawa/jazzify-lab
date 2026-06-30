import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { runWhenIdle } from '@/utils/idlePrefetch';

import EarTrainingPianoOverlay from './EarTrainingPianoOverlay';

vi.mock('@/components/piano/PIXINotesRenderer', () => ({
  PIXINotesRenderer: vi.fn(() => <div data-testid="pixi-piano" />),
}));

describe('EarTrainingPianoOverlay', () => {
  it('prefetch 後でも mount 時に Pixi 鍵盤を表示する', async () => {
    runWhenIdle(`chunk:ear-training-piano-pixi-prefetch-${Date.now()}`, () => {
      void import('@/components/piano/PIXINotesRenderer').catch(() => undefined);
    });

    render(
      <EarTrainingPianoOverlay
        onPianoKeyDown={() => undefined}
        onPianoKeyUp={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="pixi-piano"]')).not.toBeNull();
    });
  });
});

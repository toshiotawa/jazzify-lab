import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import EarTrainingPianoOverlay from './EarTrainingPianoOverlay';

vi.mock('@/components/piano/PIXINotesRenderer', () => ({
  PIXINotesRenderer: vi.fn(() => <div data-testid="pixi-piano" />),
}));

describe('EarTrainingPianoOverlay', () => {
  it('mount 時に Pixi 鍵盤を表示する', async () => {
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

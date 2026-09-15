import { vi } from 'vitest';

import { downloadTrainingResultImage } from '@/components/training/trainingResultImage';

describe('trainingResultImage', () => {
  it('draws rank position when provided', () => {
    const fillText = vi.fn();
    const measureText = vi.fn((text: string) => ({ width: text.length * 10 }));
    const protoCreateElement = Document.prototype.createElement;
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = protoCreateElement.call(document, 'canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
          throw new Error('Expected HTMLCanvasElement');
        }
        Object.defineProperty(canvas, 'getContext', {
          value: () => ({
            createLinearGradient: () => ({ addColorStop: vi.fn() }),
            fillRect: vi.fn(),
            fillText,
            measureText,
          }),
        });
        Object.defineProperty(canvas, 'toDataURL', {
          value: () => 'data:image/png;base64,test',
        });
        return canvas;
      }
      if (tagName === 'a') {
        const link = protoCreateElement.call(document, 'a');
        if (!(link instanceof HTMLAnchorElement)) {
          throw new Error('Expected HTMLAnchorElement');
        }
        link.click = vi.fn();
        return link;
      }
      return protoCreateElement.call(document, tagName);
    });

    downloadTrainingResultImage({
      trainingTitle: 'm7b5 UST bVII',
      userName: 'Test',
      rank: 'F',
      score: 1,
      rankPosition: 1,
    });

    expect(fillText).toHaveBeenCalledWith('あなたの順位 … 1位', 540, 910);
    expect(fillText).not.toHaveBeenCalledWith('High Score!!', 540, 480);
    createElementSpy.mockRestore();
  });

  it('draws High Score when isHighScore is true', () => {
    const fillText = vi.fn();
    const measureText = vi.fn((text: string) => ({ width: text.length * 10 }));
    const protoCreateElement = Document.prototype.createElement;
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = protoCreateElement.call(document, 'canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
          throw new Error('Expected HTMLCanvasElement');
        }
        Object.defineProperty(canvas, 'getContext', {
          value: () => ({
            createLinearGradient: () => ({ addColorStop: vi.fn() }),
            fillRect: vi.fn(),
            fillText,
            measureText,
          }),
        });
        Object.defineProperty(canvas, 'toDataURL', {
          value: () => 'data:image/png;base64,test',
        });
        return canvas;
      }
      if (tagName === 'a') {
        const link = protoCreateElement.call(document, 'a');
        if (!(link instanceof HTMLAnchorElement)) {
          throw new Error('Expected HTMLAnchorElement');
        }
        link.click = vi.fn();
        return link;
      }
      return protoCreateElement.call(document, tagName);
    });

    downloadTrainingResultImage({
      trainingTitle: 'Test',
      userName: 'Player',
      rank: 'A',
      score: 50,
      rankPosition: null,
      isHighScore: true,
    });

    expect(fillText).toHaveBeenCalledWith('High Score!!', 540, 480);
    createElementSpy.mockRestore();
  });
});

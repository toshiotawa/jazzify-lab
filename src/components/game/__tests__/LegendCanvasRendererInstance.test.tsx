import { LegendCanvasRendererInstance } from '../LegendCanvasRenderer';
import type { ActiveNote } from '@/types';

const createContextStub = () => {
  const noop = jest.fn();
  return {
    canvas: document.createElement('canvas'),
    clearRect: noop,
    fillRect: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    setLineDash: noop,
    scale: noop,
    setTransform: noop,
    fillText: noop,
    measureText: jest.fn(() => ({ width: 10 } as TextMetrics)),
    strokeStyle: '#000',
    fillStyle: '#000',
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'center' as CanvasTextAlign,
    globalAlpha: 1
  } as unknown as CanvasRenderingContext2D;
};

describe('LegendCanvasRendererInstance', () => {
  let getContextSpy: jest.SpyInstance;
  let rafSpy: jest.SpyInstance;
  let cafSpy: jest.SpyInstance;

  beforeEach(() => {
    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => createContextStub());

    if (!window.requestAnimationFrame) {
      Object.defineProperty(window, 'requestAnimationFrame', {
        writable: true,
        value: (cb: FrameRequestCallback) => cb(performance.now())
      });
    }
    if (!window.cancelAnimationFrame) {
      Object.defineProperty(window, 'cancelAnimationFrame', {
        writable: true,
        value: () => {}
      });
    }

    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1;
    });
    cafSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes canvas and resizes correctly', () => {
    const instance = new LegendCanvasRendererInstance(800, 400);
    expect(instance.view).toBeInstanceOf(HTMLCanvasElement);
    expect(instance.view.style.width).toBe('800px');
    instance.resize(640, 320);
    expect(instance.view.style.width).toBe('640px');
    instance.destroy();
    expect(cafSpy).toHaveBeenCalled();
  });

  it('accepts note and settings updates', () => {
    const instance = new LegendCanvasRendererInstance(600, 300);
    const notes: ActiveNote[] = [
      {
        id: 'n1',
        time: 1.2,
        pitch: 60,
        state: 'visible'
      }
    ];
    instance.updateNotes(notes, 0.5);
    instance.updateSettings({
      pianoHeight: 90,
      noteNameStyle: 'abc',
      simpleDisplayMode: true,
      practiceGuide: 'key',
      notesSpeed: 1.5
    });
    instance.highlightKey(60, true);
    instance.highlightKey(60, false);
    const onPress = jest.fn();
    const onRelease = jest.fn();
    instance.setKeyCallbacks(onPress, onRelease);
    instance.destroy();
    expect(getContextSpy).toHaveBeenCalled();
    expect(rafSpy).toHaveBeenCalled();
  });
});

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// AudioContextのモック
global.AudioContext = class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  destination = { channelCount: 2 };
  
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }
  
  decodeAudioData() {
    return Promise.resolve({
      duration: 10,
      length: 441000,
      numberOfChannels: 2,
      sampleRate: 44100,
    });
  }
} as any;

// requestAnimationFrameのモック
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// performance.nowのモック
if (!global.performance) {
  global.performance = {} as any;
}
global.performance.now = () => Date.now();

// fetchのモック（必要に応じて）
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as Response)
);
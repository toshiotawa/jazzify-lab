import * as PIXI from 'pixi.js';
import { unifiedFrameController } from './performanceOptimizer';

type FrameSubscriber = (deltaMs: number, frameStartTime: number) => void;

const subscribers = new Set<FrameSubscriber>();
let tickerAttached = false;

const handleTick = () => {
  const ticker = PIXI.Ticker.shared;
  const deltaMs = ticker.deltaMS;
  const frameStartTime = performance.now();

  if (unifiedFrameController.shouldSkipFrame(frameStartTime)) {
    return;
  }

  subscribers.forEach((callback) => {
    callback(deltaMs, frameStartTime);
  });
};

const ensureTicker = () => {
  if (tickerAttached) {
    return;
  }
  PIXI.Ticker.shared.add(handleTick);
  tickerAttached = true;
};

const detachTicker = () => {
  if (!tickerAttached) {
    return;
  }
  PIXI.Ticker.shared.remove(handleTick);
  tickerAttached = false;
};

export const subscribeFrameLoop = (callback: FrameSubscriber): (() => void) => {
  subscribers.add(callback);
  ensureTicker();

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      detachTicker();
    }
  };
};

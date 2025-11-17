import type { ActiveNote } from '@/types';

interface FramePayload {
  activeNotes: ActiveNote[];
  currentTime: number;
}

type FrameListener = (payload: FramePayload) => void;

const frameListeners = new Set<FrameListener>();

export const subscribeGameFrame = (listener: FrameListener): (() => void) => {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
};

export const emitGameFrame = (payload: FramePayload): void => {
  frameListeners.forEach((listener) => {
    listener(payload);
  });
};

import React, { Suspense } from 'react';
import type { EarTrainingPianoOverlayHandle } from './EarTrainingPianoOverlay';

const LazyEarTrainingPianoOverlay = React.lazy(
  () => import('./EarTrainingPianoOverlay'),
);

export type { EarTrainingPianoOverlayHandle };

interface DeferredEarTrainingPianoOverlayProps {
  minMidi: number;
  maxMidi: number;
  onPianoKeyDown: (note: number) => void;
  onPianoKeyUp: (note: number) => void;
}

const PIANO_OVERLAY_FALLBACK = (
  <div
    className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 h-[88px] bg-slate-900/85"
    aria-hidden="true"
  />
);

const DeferredEarTrainingPianoOverlay = React.forwardRef<
  EarTrainingPianoOverlayHandle,
  DeferredEarTrainingPianoOverlayProps
>((props, ref) => (
  <Suspense fallback={PIANO_OVERLAY_FALLBACK}>
    <LazyEarTrainingPianoOverlay ref={ref} {...props} />
  </Suspense>
));

DeferredEarTrainingPianoOverlay.displayName = 'DeferredEarTrainingPianoOverlay';

export default DeferredEarTrainingPianoOverlay;

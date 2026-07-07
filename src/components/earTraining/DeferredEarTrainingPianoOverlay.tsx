import React, { Suspense } from 'react';
import type { EarTrainingPianoOverlayHandle } from './EarTrainingPianoOverlay';

const LazyEarTrainingPianoOverlay = React.lazy(
  () => import('./EarTrainingPianoOverlay'),
);

export type { EarTrainingPianoOverlayHandle };

interface DeferredEarTrainingPianoOverlayProps {
  onPianoKeyDown: (note: number) => void;
  onPianoKeyUp: (note: number) => void;
}

const DeferredEarTrainingPianoOverlay = React.forwardRef<
  EarTrainingPianoOverlayHandle,
  DeferredEarTrainingPianoOverlayProps
>((props, ref) => (
  <Suspense fallback={null}>
    <LazyEarTrainingPianoOverlay ref={ref} {...props} />
  </Suspense>
));

DeferredEarTrainingPianoOverlay.displayName = 'DeferredEarTrainingPianoOverlay';

export default DeferredEarTrainingPianoOverlay;

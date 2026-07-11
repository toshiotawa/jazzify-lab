import React from 'react';
import {
  clampEarTrainingOsmdTimingAdjustmentMs,
  formatEarTrainingOsmdTimingAdjustmentLabel,
  OSMD_TIMING_ADJUSTMENT_MS_MAX,
  OSMD_TIMING_ADJUSTMENT_MS_MIN,
  OSMD_TIMING_ADJUSTMENT_MS_STEP,
} from '@/utils/earTrainingOsmdTimingAdjustment';
import type { EarTrainingTimingAdjustmentCopy } from '@/utils/earTrainingUiCopy';

interface EarTrainingTimingAdjustmentSliderProps {
  copy: EarTrainingTimingAdjustmentCopy;
  appliedOffsetMs: number;
  onChange: (offsetMs: number) => void;
}

const EarTrainingTimingAdjustmentSlider: React.FC<EarTrainingTimingAdjustmentSliderProps> = ({
  copy,
  appliedOffsetMs,
  onChange,
}) => (
  <section
    className="pointer-events-auto absolute inset-x-0 bottom-0 z-[35] bg-transparent px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
    aria-label={copy.sliderHeading}
  >
    <h3 className="mb-1 text-sm font-semibold text-amber-100">{copy.sliderHeading}</h3>
    <p className="mb-1 text-xs text-slate-300">{copy.sliderHammerEarlyHint}</p>
    <p className="mb-3 text-xs text-slate-300">{copy.sliderAudioEarlyHint}</p>
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
        <span>{copy.sliderOffsetLabel}</span>
        <span className="text-base font-semibold text-amber-200">
          {formatEarTrainingOsmdTimingAdjustmentLabel(appliedOffsetMs)}
        </span>
      </div>
      <input
        type="range"
        min={OSMD_TIMING_ADJUSTMENT_MS_MIN}
        max={OSMD_TIMING_ADJUSTMENT_MS_MAX}
        step={OSMD_TIMING_ADJUSTMENT_MS_STEP}
        value={appliedOffsetMs}
        onChange={event => {
          const next = clampEarTrainingOsmdTimingAdjustmentMs(Number(event.target.value));
          onChange(next);
        }}
        className="range range-lg range-warning w-full"
      />
    </label>
    <div className="mt-1 flex justify-between text-xs text-slate-500">
      <span>{OSMD_TIMING_ADJUSTMENT_MS_MIN}ms</span>
      <span>0ms</span>
      <span>{OSMD_TIMING_ADJUSTMENT_MS_MAX}ms</span>
    </div>
  </section>
);

export default EarTrainingTimingAdjustmentSlider;

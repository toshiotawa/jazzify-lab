import React from 'react';
import type { VoiceInputDebugSnapshot } from '@/utils/voiceInputDebugSnapshot';

interface VoiceInputDebugOverlayProps {
  readonly snapshot: VoiceInputDebugSnapshot | null;
  readonly enabled: boolean;
}

/** DEV のみ表示。voice 入力の直近判定を画面左上に出す。 */
export const VoiceInputDebugOverlay: React.FC<VoiceInputDebugOverlayProps> = ({
  snapshot,
  enabled,
}) => {
  if (!import.meta.env.DEV || !enabled || !snapshot) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-2 top-14 z-[200] max-w-[min(360px,90vw)] rounded border border-amber-400/40 bg-black/80 px-2 py-1.5 font-mono text-[10px] leading-snug text-amber-100">
      <div>
        MIDI
        {' '}
        {snapshot.midi}
        {' '}
        (
        {snapshot.matched ? 'matched' : 'unmatched'}
        )
      </div>
      <div className="text-amber-200/90">{snapshot.detail}</div>
    </div>
  );
};

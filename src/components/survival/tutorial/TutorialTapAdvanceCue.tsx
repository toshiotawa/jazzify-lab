import React from 'react';

/** dialogue_only など: 右下 ▶ を点滅（pointer-events は上位で透明タップ処理）。 */

export interface TutorialTapAdvanceCueProps {
  readonly visible: boolean;
}

export const TutorialTapAdvanceCue: React.FC<TutorialTapAdvanceCueProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <button
      type="button"
      tabIndex={-1}
      className="pointer-events-none absolute bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))] z-[80] flex h-12 w-12 animate-pulse items-center justify-center rounded-full border border-white/30 bg-black/55 text-xl font-bold text-white shadow-lg"
      aria-hidden
    >
      ▶︎
    </button>
  );
};

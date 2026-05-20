import React from 'react';

/** dialogue_only など: 右下 ▶ を点滅（pointer-events は上位で透明タップ処理）。 */

export interface TutorialTapAdvanceCueProps {
  readonly visible: boolean;
}

export const TutorialTapAdvanceCue: React.FC<TutorialTapAdvanceCueProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))] z-[80] animate-pulse text-2xl font-bold text-white drop-shadow-lg"
      aria-hidden
    >
      ▶︎
    </div>
  );
};

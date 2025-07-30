import React from 'react';

interface Props {
  count: number; // 3→2→1→0
}

export const ReadyOverlay: React.FC<Props> = ({ count }) => {
  const txt = count > 0 ? count.toString() : 'GO!';
  const textSize = count > 0 ? 'text-9xl' : 'text-8xl';
  const textColor = count === 1 ? 'text-yellow-400' : 
                   count === 0 ? 'text-green-400' : 'text-white';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none">
      <span className={`font-bold ${textSize} ${textColor} animate-ping`}>
        {txt}
      </span>
    </div>
  );
};
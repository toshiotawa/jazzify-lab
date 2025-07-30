import React from 'react';
import { useGaugePercent } from '@/rhythm/gaugeUtils';
import { MonsterState } from '@/components/fantasy/FantasyGameEngine';
import { RhythmQuestion } from '@/rhythm/generator';

const barCls =
  'h-2 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-100';

// フックを安全に使うため 1 モンスター=1 コンポーネントに分割
const GaugeBar: React.FC<{ monster: MonsterState & { rhythmQuestion?: RhythmQuestion } }> = ({ monster }) => {
  if (!monster.rhythmQuestion) return null;
  
  const gauge = useGaugePercent(monster.rhythmQuestion.absSec);
  const isActive = gauge > 0 && gauge < 80;
  
  return (
    <div className="flex-1 max-w-32">
      <div className="text-center text-xs text-gray-300 mb-1">
        {monster.rhythmQuestion.chord}
      </div>
      <div className="relative">
        <div className="w-full bg-gray-700 rounded-full overflow-hidden h-2">
          <div 
            className={barCls} 
            style={{ 
              width: `${gauge}%`,
              opacity: isActive ? 1 : 0.3
            }} 
          />
        </div>
        {/* 80% marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
          style={{ left: '80%' }}
        />
      </div>
    </div>
  );
};

export const MonsterGaugeUI: React.FC<{ monsters: (MonsterState & { rhythmQuestion?: RhythmQuestion })[] }> = ({ monsters }) => {
  // Re-render on rhythm store updates
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex justify-center gap-3 mt-2 px-4">
      {monsters.map((m) => (
        <GaugeBar key={m.id} monster={m} />
      ))}
    </div>
  );
};
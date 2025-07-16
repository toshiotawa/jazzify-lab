import React, { useEffect } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import ChallengeCard from './ChallengeCard';

const ChallengeBoard: React.FC = () => {
  const { monthly, progress, loading, fetchAll } = useMissionStore();
  
  // 既にデータがある場合は再取得しない
  useEffect(() => {
    if (monthly.length === 0 && !loading) {
      void fetchAll();
    }
  }, [monthly.length, loading, fetchAll]);

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-bold mb-2 text-lg">Monthly Mission</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {monthly.map(m => <ChallengeCard key={m.id} mission={m} progress={progress[m.id]} />)}
        </div>
      </section>
    </div>
  );
};
export default ChallengeBoard;

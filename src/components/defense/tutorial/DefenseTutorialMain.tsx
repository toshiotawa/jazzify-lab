import React from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '@/components/ui/GameHeader';
import { DefenseTutorial } from '@/components/defense/tutorial/DefenseTutorial';
import { APP_BASE_PATH } from '@/utils/appPaths';

const DefenseTutorialMain: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-white">
      <GameHeader />
      <DefenseTutorial onExit={() => navigate(`${APP_BASE_PATH}/play`)} />
    </div>
  );
};

export default DefenseTutorialMain;

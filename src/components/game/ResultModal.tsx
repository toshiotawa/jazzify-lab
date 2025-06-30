import React from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';

const ResultModal: React.FC = () => {
  const { currentSong, score, settings, resultModalOpen } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    score: s.score,
    settings: s.settings,
    resultModalOpen: s.resultModalOpen
  }));
  const { closeResultModal, resetScore, seek, play, setCurrentTab } = useGameActions();

  if (!resultModalOpen || !currentSong) return null;

  const handleRetry = () => {
    resetScore();
    seek(0);
    closeResultModal();
    play();
  };

  const handleChooseSong = () => {
    resetScore();
    seek(0);
    closeResultModal();
    setCurrentTab('songs');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content p-6 space-y-4 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-white mb-2">結果</h2>
        <div className="text-center text-gray-300">
          <div className="text-lg font-semibold mb-1">{currentSong.title}</div>
          <div className="text-sm mb-4">{currentSong.artist}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-white text-sm">
          <span className="text-right">ランク:</span><span className="font-bold">{score.rank}</span>
          <span className="text-right">スコア:</span><span>{score.score}</span>
          <span className="text-right">GOOD:</span><span>{score.goodCount}</span>
          <span className="text-right">MISS:</span><span>{score.missCount}</span>
          <span className="text-right">再生速度:</span><span>{settings.playbackSpeed}x</span>
          <span className="text-right">移調:</span><span>{settings.transpose > 0 ? `+${settings.transpose}` : settings.transpose}</span>
        </div>

        <div className="flex justify-center space-x-4 pt-4">
          <button onClick={handleRetry} className="btn btn-primary">もう一度</button>
          <button onClick={handleChooseSong} className="btn btn-secondary">曲選択</button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal; 
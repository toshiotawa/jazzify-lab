/** hideLobby / autoStartBattle 時に OSMD チュートリアルバトルを自動開始してよいか */
export const shouldAutoStartTutorialOsmdBattle = (params: {
  hideLobby: boolean;
  autoStartBattle: boolean;
  alreadyStarted: boolean;
  gameState: string;
  hasMusicXml: boolean;
  scoreErrorText: string | null;
  audioPrepared: boolean;
  targetCount: number;
}): boolean => {
  if (!params.hideLobby && !params.autoStartBattle) {
    return false;
  }
  if (params.alreadyStarted) {
    return false;
  }
  if (params.gameState !== 'idle') {
    return false;
  }
  if (!params.hasMusicXml || params.scoreErrorText) {
    return false;
  }
  if (!params.audioPrepared) {
    return false;
  }
  if (params.targetCount <= 0) {
    return false;
  }
  return true;
};

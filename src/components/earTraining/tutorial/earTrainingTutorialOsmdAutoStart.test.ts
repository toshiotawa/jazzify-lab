import { shouldAutoStartTutorialOsmdBattle } from './earTrainingTutorialOsmdAutoStart';

const readyParams = {
  hideLobby: true,
  autoStartBattle: false,
  alreadyStarted: false,
  gameState: 'idle',
  hasMusicXml: true,
  scoreErrorText: null,
  audioPrepared: true,
  targetCount: 80,
};

describe('shouldAutoStartTutorialOsmdBattle', () => {
  it('starts when lobby assets are ready', () => {
    expect(shouldAutoStartTutorialOsmdBattle(readyParams)).toBe(true);
  });

  it('waits for MusicXML and audio prepare', () => {
    expect(shouldAutoStartTutorialOsmdBattle({ ...readyParams, hasMusicXml: false })).toBe(false);
    expect(shouldAutoStartTutorialOsmdBattle({ ...readyParams, audioPrepared: false })).toBe(false);
    expect(shouldAutoStartTutorialOsmdBattle({ ...readyParams, targetCount: 0 })).toBe(false);
  });

  it('runs once and only from idle', () => {
    expect(shouldAutoStartTutorialOsmdBattle({ ...readyParams, alreadyStarted: true })).toBe(false);
    expect(shouldAutoStartTutorialOsmdBattle({ ...readyParams, gameState: 'playingPhrase' })).toBe(false);
  });

  it('supports autoStartBattle without hideLobby', () => {
    expect(shouldAutoStartTutorialOsmdBattle({
      ...readyParams,
      hideLobby: false,
      autoStartBattle: true,
    })).toBe(true);
  });
});

/** 耳コピバトル画面で鍵盤オーバーレイと Pixi レンダラを先読みする */
export const preloadEarTrainingPianoOverlay = (): void => {
  void import('@/components/earTraining/EarTrainingPianoOverlay').catch(() => undefined);
  void import('@/components/piano/PIXINotesRenderer').catch(() => undefined);
};

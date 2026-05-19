/**
 * dialogue_only 中にバトル用の重い chunk と SE を先読みして、次シーンで Suspense が出にくくする。
 */
export const preloadEarTrainingTutorialBattleChunks = async (): Promise<void> => {
  const [{ preloadFireMagicSe }, voicing, quiz, osmd] = await Promise.all([
    import('@/utils/earTrainingFireMagicSe'),
    import('@/components/earTraining/EarTrainingChordVoicingScreen'),
    import('@/components/earTraining/EarTrainingChordQuizScreen'),
    import('@/components/earTraining/EarTrainingChordOSMDScreen'),
  ]);
  preloadFireMagicSe();
  void voicing;
  void quiz;
  void osmd;
};

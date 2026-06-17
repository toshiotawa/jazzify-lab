/**
 * dialogue_only 中にバトル用の重い chunk と SE を先読みして、次シーンで Suspense が出にくくする。
 */
export const preloadEarTrainingTutorialBattleChunks = async (): Promise<void> => {
  const [voicing, quiz, osmd, adlib, pairAdlib] = await Promise.all([
    import('@/components/earTraining/EarTrainingChordVoicingScreen'),
    import('@/components/earTraining/EarTrainingChordQuizScreen'),
    import('@/components/earTraining/EarTrainingChordOSMDScreen'),
    import('@/components/earTraining/EarTrainingAdlibScreen'),
    import('@/components/earTraining/EarTrainingPhrasePairAdlibScreen'),
  ]);
  void voicing;
  void quiz;
  void osmd;
  void adlib;
  void pairAdlib;
};

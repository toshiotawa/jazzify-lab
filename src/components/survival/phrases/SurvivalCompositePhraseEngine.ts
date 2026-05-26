/**
 * Survival composite phrase re-exports + type aliases (engine is `@/utils/compositePhraseEngine`).
 */
export type {
  CompositePhraseCandidateState as SurvivalCompositePhraseCandidateState,
  CompositePhraseNoteEvaluation as SurvivalCompositePhraseNoteEvaluation,
  CompositePhraseNoteResult as SurvivalCompositePhraseNoteResult,
  CompositePhraseRuntimeState as SurvivalCompositePhraseRuntimeState,
  CompositePhraseStaffChordView as SurvivalCompositePhraseStaffChordView,
} from '@/utils/compositePhraseEngine';

export {
  compositeSelectionGreenPrefixLength,
  createInitialCompositePhraseRuntimeState,
  evaluateCompositePhraseNoteOn,
  getCompositePhraseStaffChordView,
} from '@/utils/compositePhraseEngine';

export { createCompositePhraseRuntimeFromSurvivalPhrases } from '@/utils/compositePhraseSurvivalAdapter';

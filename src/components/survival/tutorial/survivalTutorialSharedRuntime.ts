import type React from 'react';

import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import type { SurvivalTutorialDemoStaffSnapshot } from '@/components/survival/tutorial/SurvivalTutorialDemoStaff';

/** V4 の連続シーンが共有する、常駐 SurvivalGameScreen の低頻度制御参照。 */
export interface SurvivalTutorialSharedRuntime {
  readonly scenarioHandle: SurvivalScenarioHandle | null;
  readonly tutorialJajiiSpeechTextRef: React.MutableRefObject<string>;
  readonly tutorialFaiSpeechTextRef: React.MutableRefObject<string>;
  readonly demoStaffSnapshotRef: React.MutableRefObject<SurvivalTutorialDemoStaffSnapshot | null>;
  readonly phraseFullLoopPulseRef: React.MutableRefObject<number>;
  readonly phraseChordCompletePulseRef: React.MutableRefObject<number>;
  readonly userInputPulseRef: React.MutableRefObject<number>;
  readonly slotBCompletionPulseRef: React.MutableRefObject<number>;
  readonly midiNoteReceivedRef: React.MutableRefObject<boolean>;
}

import {
  runTutorialIiViScript,
  type RunTutorialIiViScriptParams,
} from './tutorialIiViScript';

export type SurvivalBuiltinTutorialRunner = (
  params: RunTutorialIiViScriptParams,
) => Promise<void>;

export const SURVIVAL_BUILTIN_TUTORIAL_RUNNERS: Readonly<
  Partial<Record<string, SurvivalBuiltinTutorialRunner>>
> = {
  'onboarding-v1': runTutorialIiViScript,
};

export const resolveSurvivalBuiltinTutorialRunner = (
  builtinRunnerKey: string,
): SurvivalBuiltinTutorialRunner | undefined =>
  SURVIVAL_BUILTIN_TUTORIAL_RUNNERS[builtinRunnerKey];

import { buildOnboardingV1Script } from './buildOnboardingV1Script';
import {
  runInterpretedTutorialScript,
  type RunInterpretedTutorialScriptParams,
} from './interpretTutorialScript';
import {
  runTutorialIiViScript,
  type RunTutorialIiViScriptParams,
} from './tutorialIiViScript';

export type SurvivalBuiltinTutorialRunner = (
  params: RunTutorialIiViScriptParams,
) => Promise<void>;

async function runInterpretedFromBundledOnboarding(
  params: RunTutorialIiViScriptParams,
): Promise<void> {
  const interpretedParams: RunInterpretedTutorialScriptParams = {
    ...params,
    script: buildOnboardingV1Script(),
  };
  await runInterpretedTutorialScript(interpretedParams);
}

export const SURVIVAL_BUILTIN_TUTORIAL_RUNNERS: Readonly<
  Partial<Record<string, SurvivalBuiltinTutorialRunner>>
> = {
  'onboarding-v1': runInterpretedFromBundledOnboarding,
  'interpreted-v1': runInterpretedFromBundledOnboarding,
};

export const resolveSurvivalBuiltinTutorialRunner = (
  builtinRunnerKey: string,
): SurvivalBuiltinTutorialRunner | undefined =>
  SURVIVAL_BUILTIN_TUTORIAL_RUNNERS[builtinRunnerKey];

/** v2 台本（steps あり）を直接実行 */
export async function runSurvivalTutorialFromScriptPayload(
  params: RunInterpretedTutorialScriptParams,
): Promise<void> {
  await runInterpretedTutorialScript(params);
}

/** レガシー v1 台本の runner キーを解決 */
export function resolveLegacyTutorialRunnerKey(
  script: { version: number; builtinRunner?: string },
  scriptId: string,
): string {
  if (typeof script.builtinRunner === 'string') {
    return script.builtinRunner;
  }
  return scriptId;
}

export { runTutorialIiViScript };

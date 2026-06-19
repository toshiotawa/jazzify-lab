import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';

export function showSurvivalTutorialFinishCta(
  script: SurvivalTutorialScriptPayloadV3,
  scene: SurvivalTutorialScriptPayloadV3['scenes'][number],
): boolean {
  return scene.type === 'finish' && (script.finish?.showCta ?? true);
}

/** 次シーンが `finish` なら true（完了 CTA 直前の自動送り待機スキップ判定用）。 */
export function isSurvivalTutorialNextSceneFinish(
  script: SurvivalTutorialScriptPayloadV3,
  sceneIndex: number,
): boolean {
  return script.scenes[sceneIndex + 1]?.type === 'finish';
}

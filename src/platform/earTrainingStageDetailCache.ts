import {
  fetchEarTrainingStageById,
} from '@/platform/supabaseEarTraining';
import type { EarTrainingStage } from '@/types';

const cachedDetails = new Map<string, EarTrainingStage>();
const inFlightTasks = new Map<string, Promise<EarTrainingStage>>();

const resolveTask = async (
  task: Promise<EarTrainingStage>,
  stageId: string,
): Promise<EarTrainingStage> => {
  try {
    const detail = await task;
    cachedDetails.set(stageId, detail);
    inFlightTasks.delete(stageId);
    return detail;
  } catch (error) {
    inFlightTasks.delete(stageId);
    throw error;
  }
};

/** レッスン詳細で先読みした耳コピステージ詳細を、バトル起動時に再利用する（iOS EarTrainingStageDetailCache 相当） */
export const fetchEarTrainingStageDetailCached = async (
  stageId: string,
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
): Promise<EarTrainingStage> => {
  if (!forceRefresh) {
    const cached = cachedDetails.get(stageId);
    if (cached) {
      return cached;
    }

    const inFlight = inFlightTasks.get(stageId);
    if (inFlight) {
      return resolveTask(inFlight, stageId);
    }
  } else {
    cachedDetails.delete(stageId);
    inFlightTasks.delete(stageId);
  }

  const task = fetchEarTrainingStageById(stageId, { forceRefresh });
  inFlightTasks.set(stageId, task);
  return resolveTask(task, stageId);
};

export const preloadEarTrainingStageDetails = (stageIds: readonly string[]): void => {
  const uniqueIds = [...new Set(stageIds.filter(id => id.length > 0))];
  uniqueIds.forEach((stageId) => {
    if (cachedDetails.has(stageId) || inFlightTasks.has(stageId)) {
      return;
    }
    const task = fetchEarTrainingStageById(stageId);
    inFlightTasks.set(stageId, task);
    void resolveTask(task, stageId).catch(() => undefined);
  });
};

export const clearEarTrainingStageDetailCache = (): void => {
  cachedDetails.clear();
  inFlightTasks.clear();
};

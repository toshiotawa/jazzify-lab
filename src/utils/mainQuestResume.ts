/** 再開プロンプト表示までの最短経過時間（3時間） */
export const MAIN_QUEST_RESUME_THRESHOLD_MS = 3 * 60 * 60 * 1000;

export const MAIN_QUEST_RESUME_PROMPT_SESSION_KEY = 'mq_resume_prompt_shown';

export function shouldShowMainQuestResumePrompt(input: {
  lastPlayedAt: string | null;
  nextLessonBlockNumber: number | null | undefined;
  nowMs?: number;
  sessionAlreadyShown?: boolean;
}): boolean {
  if (input.sessionAlreadyShown === true) {
    return false;
  }
  if (!input.lastPlayedAt) {
    return false;
  }
  if ((input.nextLessonBlockNumber ?? 1) !== 1) {
    return false;
  }
  const lastPlayedMs = Date.parse(input.lastPlayedAt);
  if (Number.isNaN(lastPlayedMs)) {
    return false;
  }
  const nowMs = input.nowMs ?? Date.now();
  return nowMs - lastPlayedMs >= MAIN_QUEST_RESUME_THRESHOLD_MS;
}

export function readMainQuestResumeSessionShown(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(MAIN_QUEST_RESUME_PROMPT_SESSION_KEY) === '1';
}

export function markMainQuestResumeSessionShown(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(MAIN_QUEST_RESUME_PROMPT_SESSION_KEY, '1');
}

type CancelIdleTask = () => void;

const executedKeys = new Set<string>();

const noopCancel: CancelIdleTask = () => {};

/**
 * ブラウザのアイドル時に一度だけタスクを実行する。
 * 同じ key のタスクはアプリ生存期間中1回しか実行されない。
 * 戻り値のキャンセル関数で未実行のスケジュールを破棄できる。
 */
export const runWhenIdle = (key: string, task: () => void): CancelIdleTask => {
  if (executedKeys.has(key)) {
    return noopCancel;
  }

  let cancelled = false;
  let idleCallbackId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const execute = (): void => {
    if (cancelled || executedKeys.has(key)) {
      return;
    }
    executedKeys.add(key);
    task();
  };

  if (typeof window.requestIdleCallback === 'function') {
    idleCallbackId = window.requestIdleCallback(execute, { timeout: 3000 });
  } else {
    timeoutId = setTimeout(execute, 2000);
  }

  return (): void => {
    cancelled = true;
    if (idleCallbackId !== undefined && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleCallbackId);
    }
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };
};

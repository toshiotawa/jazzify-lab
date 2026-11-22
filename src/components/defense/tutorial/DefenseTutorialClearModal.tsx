import React from 'react';
import { FaCheck } from 'react-icons/fa';

export type DefenseTutorialSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DefenseTutorialClearModalProps {
  readonly isEnglishCopy: boolean;
  readonly fromLesson: boolean;
  readonly fromPlayMap: boolean;
  readonly saveStatus: DefenseTutorialSaveStatus;
  readonly onDone: () => void;
  readonly onKeepAdjusting: () => void;
}

export const DefenseTutorialClearModal: React.FC<DefenseTutorialClearModalProps> = ({
  isEnglishCopy,
  fromLesson,
  fromPlayMap,
  saveStatus,
  onDone,
  onKeepAdjusting,
}) => {
  const doneLabel = (() => {
    if (isEnglishCopy) {
      if (fromLesson) return 'Done and return to quest';
      if (fromPlayMap) return 'Done and return to map';
      return 'Done';
    }
    if (fromLesson) return '完了してクエストへ';
    if (fromPlayMap) return '完了してマップへ';
    return '完了';
  })();

  const saveStatusLine = (() => {
    if (saveStatus === 'saving') {
      return isEnglishCopy ? 'Saving progress…' : '進捗を保存しています…';
    }
    if (saveStatus === 'saved') {
      return isEnglishCopy ? 'Progress saved' : '進捗を保存しました';
    }
    if (saveStatus === 'error') {
      return isEnglishCopy
        ? 'Could not save. You can try again when you finish.'
        : '保存できませんでした。完了時にもう一度試せます。';
    }
    return null;
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-slate-950 px-4 py-8">
      <div
        className="w-full max-w-sm rounded-xl border border-emerald-500/30 bg-slate-900 p-6 text-center shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="defense-tutorial-clear-title"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
          <FaCheck className="text-2xl text-emerald-400" aria-hidden />
        </div>
        <h2 id="defense-tutorial-clear-title" className="mt-4 text-2xl font-bold text-emerald-400">
          {isEnglishCopy ? 'Clear!' : 'クリア！'}
        </h2>
        <p className="mt-3 text-sm text-slate-200">
          {isEnglishCopy
            ? 'All 3 notes were recognized. Your input setup is complete.'
            : '3音の判定に成功しました。入力設定は完了です。'}
        </p>
        {saveStatusLine ? (
          <p className="mt-2 text-xs text-slate-400">{saveStatusLine}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            onClick={onDone}
            disabled={saveStatus === 'saving'}
          >
            {doneLabel}
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
            onClick={onKeepAdjusting}
          >
            {isEnglishCopy ? 'Keep adjusting' : '調整を続ける'}
          </button>
        </div>
      </div>
    </div>
  );
};
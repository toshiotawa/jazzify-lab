import React from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { taskClearNextStepPromptCopy } from '@/utils/lessonCompletionCopy';

export interface TaskClearNextStepModalProps {
  nextTaskTitle: string;
  isEnglishCopy: boolean;
  onNext: () => void;
  onQuestList: () => void;
  onStopForToday: () => void;
}

export const TaskClearNextStepModal: React.FC<TaskClearNextStepModalProps> = ({
  nextTaskTitle,
  isEnglishCopy,
  onNext,
  onQuestList,
  onStopForToday,
}) => {
  const copy = taskClearNextStepPromptCopy(isEnglishCopy);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={isEnglishCopy ? 'Close dialog' : 'ダイアログを閉じる'}
        onClick={onStopForToday}
      />
      <div
        className="relative mx-4 max-w-sm rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-clear-next-step-modal-title"
      >
        <div className="mb-4 text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🎉
          </div>
          <h3 id="task-clear-next-step-modal-title" className="text-xl font-bold text-white">
            {copy.heading}
          </h3>
          <p className="mt-2 text-sm text-gray-300">{copy.body}</p>
          <p className="mt-1 text-sm font-medium text-blue-300">{nextTaskTitle}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onNext}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-4 text-base font-bold text-white shadow-lg ring-2 ring-emerald-400/50 transition-colors hover:from-emerald-500 hover:to-green-500"
          >
            {copy.nextTask}
            <FaChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onQuestList}
            className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-slate-600 hover:text-white"
          >
            {copy.questList}
          </button>
          <button
            type="button"
            onClick={onStopForToday}
            className="w-full rounded-lg bg-slate-700/60 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-slate-600 hover:text-gray-200"
          >
            {copy.stopForToday}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskClearNextStepModal;

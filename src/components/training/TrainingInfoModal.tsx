import React from 'react';

interface TrainingInfoModalProps {
  readonly title: string;
  readonly description: string;
  readonly closeLabel?: string;
  readonly onClose: () => void;
}

export const TrainingInfoModal: React.FC<TrainingInfoModalProps> = ({
  title,
  description,
  closeLabel = 'OK',
  onClose,
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
    <button
      type="button"
      className="absolute inset-0 cursor-default"
      aria-label="Close"
      onClick={onClose}
    />
    <div
      className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="training-info-title"
    >
      <h3 id="training-info-title" className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{description}</p>
      <button
        type="button"
        className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
        onClick={onClose}
      >
        {closeLabel}
      </button>
    </div>
  </div>
);

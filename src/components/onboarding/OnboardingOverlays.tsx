import React from 'react';
import { cn } from '@/utils/cn';

interface OnboardingOverlaysProps {
  characterText: string;
  narrationText: string;
  connectedDeviceLine: string | null;
  showPillarCard: boolean;
  pillarCaption: string | null;
  pillarSystemImage: string | null;
  showCta: boolean;
  showSkip: boolean;
  isEnglishCopy: boolean;
  onCta: () => void;
  onSkip: () => void;
  ctaLabel?: string;
}

function pillarEmoji(systemImage: string | null): string {
  if (systemImage === 'music.note.list') return '🎵';
  if (systemImage === 'metronome') return '⏱️';
  return '〰️';
}

const DEFAULT_PORTRAIT_SRC = '/default_avater/muki/shita.png';

/**
 * LP オンボーディング用: iOS でのプレイヤー付近よりの吹き出し位置 + キャラ縮約表示。
 */
export const OnboardingOverlays: React.FC<OnboardingOverlaysProps> = ({
  characterText,
  narrationText,
  connectedDeviceLine,
  showPillarCard,
  pillarCaption,
  pillarSystemImage,
  showCta,
  showSkip,
  isEnglishCopy,
  onCta,
  onSkip,
  ctaLabel,
}) => (
  <>
    {characterText ? (
      <div
        className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4"
        style={{
          top: `max(calc(env(safe-area-inset-top) + 48px), min(42vh, calc(50vh - 120px)))`,
        }}
      >
        <div className="flex max-w-[min(380px,calc(100vw-32px))] flex-col items-center gap-1">
          <img
            src={DEFAULT_PORTRAIT_SRC}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] select-none object-contain drop-shadow-md"
          />
          <div
            className={cn(
              'rounded-xl border border-white/25 bg-black/80 px-4 py-3 text-center',
              'text-sm font-bold text-white shadow-lg',
            )}
          >
            {characterText.split('\n').map((line, i) => (
              <span key={`${i}-${line}`}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
            <div
              className="mx-auto mt-1 h-0 w-0 border-x-[12px] border-t-[12px] border-x-transparent border-t-black/80"
              aria-hidden
            />
          </div>
        </div>
      </div>
    ) : null}

    {connectedDeviceLine ? (
      <div className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center">
        <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white">
          {connectedDeviceLine}
        </span>
      </div>
    ) : null}

    {narrationText ? (
      <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex justify-center px-4 md:bottom-32">
        <p className="max-w-lg whitespace-pre-line rounded-lg bg-black/75 px-4 py-2 text-center text-sm text-white">
          {narrationText}
        </p>
      </div>
    ) : null}

    {showPillarCard && pillarCaption ? (
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-6">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-purple-400/40 bg-slate-900/95 p-6 text-center">
          <span className="text-4xl" aria-hidden>
            {pillarEmoji(pillarSystemImage)}
          </span>
          <p className="text-base font-semibold text-white">{pillarCaption}</p>
        </div>
      </div>
    ) : null}

    {showCta ? (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
        <button
          type="button"
          onClick={onCta}
          className="rounded-xl bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-purple-500"
        >
          {ctaLabel ?? (isEnglishCopy ? 'Continue' : '続ける')}
        </button>
      </div>
    ) : null}

    {showSkip ? (
      <button
        type="button"
        onClick={onSkip}
        className="absolute right-3 top-[max(8px,env(safe-area-inset-top))] z-50 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white/90 hover:bg-black/70"
      >
        {isEnglishCopy ? 'Skip' : 'スキップ'}
      </button>
    ) : null}
  </>
);

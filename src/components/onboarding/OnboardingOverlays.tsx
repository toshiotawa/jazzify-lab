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

/**
 * LP オンボーディング用: iOS と同じくセリフ吹き出しのみをプレイヤー上付近に出す。
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
        className="pointer-events-none absolute inset-x-0 z-30 px-4"
        style={{
          top: 'max(70px, min(max(86px, calc(50% - 92px)), calc(100% - 240px)))',
        }}
      >
        <div className="mx-auto flex w-[min(380px,calc(100vw-32px))] -translate-y-1/2 flex-col items-center">
          <div
            className={cn(
              'w-full rounded-[14px] border border-white/25 bg-black/80 px-3.5 py-3 text-center',
              'text-sm font-bold leading-snug text-white shadow-lg',
            )}
          >
            {characterText.split('\n').map((line, i) => (
              <span key={`${i}-${line}`}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </div>
          <div
            className="h-0 w-0 border-x-[12px] border-t-[12px] border-x-transparent border-t-black/80"
            aria-hidden
          />
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
      <div className="pointer-events-none absolute inset-x-0 bottom-[200px] z-30 flex justify-center px-5">
        <p className="max-w-lg whitespace-pre-line rounded-xl bg-black/55 px-4 py-4 text-center text-sm text-slate-200">
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

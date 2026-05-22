/** Supabase `survival_stage_intro_scripts.script` JSON（Web / iOS 共通スキーマ） */

export type SurvivalStageIntroMapCategory = 'basic' | 'songs' | 'phrases';

export interface SurvivalStageIntroLocalizedText {
  readonly ja: string;
  readonly en: string;
}

/** 省略時はファイ（画面上部中央）。`jajii` はワールド上のジャ爺頭上。 */
export type SurvivalStageIntroSpeaker = 'fai' | 'jajii';

export interface SurvivalStageIntroLine {
  readonly atSeconds: number;
  readonly text: SurvivalStageIntroLocalizedText;
  readonly speaker?: SurvivalStageIntroSpeaker;
}

export interface SurvivalStageIntroScript {
  readonly lineDurationSeconds: number;
  readonly lines: readonly SurvivalStageIntroLine[];
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isLocalizedText(v: unknown): v is SurvivalStageIntroLocalizedText {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return isNonEmptyString(o.ja) && isNonEmptyString(o.en);
}

function isIntroSpeaker(v: unknown): v is SurvivalStageIntroSpeaker {
  return v === 'fai' || v === 'jajii';
}

function isIntroLine(v: unknown): v is SurvivalStageIntroLine {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const speakerOk = o.speaker === undefined || isIntroSpeaker(o.speaker);
  return (
    typeof o.atSeconds === 'number'
    && Number.isFinite(o.atSeconds)
    && isLocalizedText(o.text)
    && speakerOk
  );
}

export const resolveSurvivalStageIntroSpeaker = (
  line: SurvivalStageIntroLine,
): SurvivalStageIntroSpeaker => line.speaker ?? 'fai';

export function parseSurvivalStageIntroScript(raw: unknown): SurvivalStageIntroScript | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.lineDurationSeconds !== 'number' || !Number.isFinite(o.lineDurationSeconds) || o.lineDurationSeconds <= 0) {
    return null;
  }
  if (!Array.isArray(o.lines) || o.lines.length === 0) return null;
  const lines: SurvivalStageIntroLine[] = [];
  for (const item of o.lines) {
    if (!isIntroLine(item)) return null;
    lines.push(item);
  }
  return { lineDurationSeconds: o.lineDurationSeconds, lines };
}

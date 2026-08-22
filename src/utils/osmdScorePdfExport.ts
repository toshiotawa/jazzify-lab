import type { EarTrainingMode, EarTrainingPhrase } from '@/types';

export const OSMD_SCORE_DOWNLOAD_MODES: readonly EarTrainingMode[] = [
  'chord_osmd',
  'chord_precision',
] as const;

export const isOsmdScoreDownloadMode = (
  mode: EarTrainingMode | null | undefined,
): boolean => mode != null && OSMD_SCORE_DOWNLOAD_MODES.includes(mode);

const INVALID_PDF_FILE_NAME_CHARS = /[<>:"/\\|?*]/g;

export const sanitizeOsmdScorePdfFileName = (title: string): string => {
  const trimmed = title.trim();
  const withoutInvalid = trimmed.replace(INVALID_PDF_FILE_NAME_CHARS, '');
  const withoutControls = Array.from(withoutInvalid)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32;
    })
    .join('');
  const sanitized = withoutControls
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${sanitized || 'score'}.pdf`;
};

export const collectOsmdPhraseMusicXmlUrls = (
  phrases: readonly EarTrainingPhrase[] | undefined,
): readonly string[] => (
  (phrases ?? [])
    .slice()
    .sort((left, right) => left.order_index - right.order_index)
    .map((phrase) => phrase.music_xml_url?.trim() ?? '')
    .filter((url): url is string => url.length > 0)
);

export interface OsmdScorePdfSection {
  readonly title?: string;
  readonly musicXmlText: string;
}

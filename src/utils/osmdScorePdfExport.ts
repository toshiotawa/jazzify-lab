import type { EarTrainingMode, EarTrainingPhrase } from '@/types';

export const OSMD_SCORE_DOWNLOAD_MODES: readonly EarTrainingMode[] = [
  'chord_osmd',
  'chord_precision',
] as const;

export const isOsmdScoreDownloadMode = (
  mode: EarTrainingMode | null | undefined,
): boolean => mode != null && OSMD_SCORE_DOWNLOAD_MODES.includes(mode);

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
  readonly musicXmlText: string;
}

export const buildOsmdScorePdfFileName = (
  chapterNumber: number,
  questNumber: number,
  taskNumber: number,
): string => `Chapter${chapterNumber}-Quest${questNumber}-${taskNumber}.pdf`;

const PDF_GUIDE_VOICE = 4;

const parsePdfNoteVoiceNumber = (noteEl: Element): number | null => {
  const voiceEl = Array.from(noteEl.children).find((child) => child.localName === 'voice');
  const voiceText = voiceEl?.textContent?.trim() ?? '';
  if (!voiceText) {
    return null;
  }
  const parsed = Number.parseInt(voiceText, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const noteHasDirectChild = (noteEl: Element, localName: string): boolean => (
  Array.from(noteEl.children).some((child) => child.localName === localName)
);

/**
 * PDF 専用: 同じ小節で相手ボイスに音符があるとき、こちらの休符を非表示にする。
 * ゲーム表示の `applyChordOsmdGuideNoteColors` は触らない。
 */
export const hideOsmdPdfAlternateVoiceRests = (xmlText: string): string => {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return xmlText;
  }

  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return xmlText;
  }

  let changed = false;
  for (const measure of Array.from(doc.getElementsByTagName('measure'))) {
    const notes = Array.from(measure.children).filter((el) => el.localName === 'note');
    let hasGuidePitch = false;
    let hasPlayPitch = false;
    for (const note of notes) {
      if (!noteHasDirectChild(note, 'pitch')) {
        continue;
      }
      const voice = parsePdfNoteVoiceNumber(note);
      if (voice === PDF_GUIDE_VOICE) {
        hasGuidePitch = true;
      }
      if (voice === 1 || voice === null) {
        hasPlayPitch = true;
      }
    }
    for (const note of notes) {
      if (!noteHasDirectChild(note, 'rest')) {
        continue;
      }
      const voice = parsePdfNoteVoiceNumber(note);
      const hideRest = (hasGuidePitch && (voice === 1 || voice === null))
        || (hasPlayPitch && voice === PDF_GUIDE_VOICE);
      if (hideRest && note.getAttribute('print-object') !== 'no') {
        note.setAttribute('print-object', 'no');
        changed = true;
      }
    }
  }

  if (!changed) {
    return xmlText;
  }
  return new XMLSerializer().serializeToString(doc);
};

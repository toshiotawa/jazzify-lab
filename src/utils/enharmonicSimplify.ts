import { musicXmlKeySignatureAlter } from '@/utils/voicingMusicXml';

interface SimplifiedSpelledPitch {
  step: string;
  alter: number;
  octave: number;
}

const ACCIDENTAL_SIMPLIFY_MAP: Record<string, { step: string; alter: number; octaveAdjust: number }> = {
  // 理論的異名同音（シングルシャープ・フラット）
  B1: { step: 'C', alter: 0, octaveAdjust: 1 },
  E1: { step: 'F', alter: 0, octaveAdjust: 0 },
  'C-1': { step: 'B', alter: 0, octaveAdjust: -1 },
  'F-1': { step: 'E', alter: 0, octaveAdjust: 0 },
  // ダブルシャープ
  A2: { step: 'B', alter: 0, octaveAdjust: 0 },
  B2: { step: 'C', alter: 1, octaveAdjust: 1 },
  C2: { step: 'D', alter: 0, octaveAdjust: 0 },
  D2: { step: 'E', alter: 0, octaveAdjust: 0 },
  E2: { step: 'F', alter: 1, octaveAdjust: 0 },
  F2: { step: 'G', alter: 0, octaveAdjust: 0 },
  G2: { step: 'A', alter: 0, octaveAdjust: 0 },
  // ダブルフラット
  'A-2': { step: 'G', alter: 0, octaveAdjust: 0 },
  'B-2': { step: 'A', alter: 0, octaveAdjust: 0 },
  'C-2': { step: 'B', alter: -1, octaveAdjust: -1 },
  'D-2': { step: 'C', alter: 0, octaveAdjust: 0 },
  'E-2': { step: 'D', alter: 0, octaveAdjust: 0 },
  'F-2': { step: 'E', alter: -1, octaveAdjust: 0 },
  'G-2': { step: 'F', alter: 0, octaveAdjust: 0 },
};

export const simplifySpelledPitch = (
  step: string,
  alter: number,
  octave: number,
): SimplifiedSpelledPitch | null => {
  if (alter === 0) {
    return null;
  }
  const simplified = ACCIDENTAL_SIMPLIFY_MAP[`${step}${alter}`];
  if (!simplified) {
    return null;
  }
  return {
    step: simplified.step,
    alter: simplified.alter,
    octave: octave + simplified.octaveAdjust,
  };
};

const readFirstKeyFifths = (doc: Document): number => {
  const fifthsEl = doc.querySelector('key fifths');
  if (!fifthsEl) {
    return 0;
  }
  const value = parseInt(fifthsEl.textContent ?? '0', 10);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(-7, Math.min(7, value));
};

const writePitchAlter = (doc: Document, pitchEl: Element, alter: number): void => {
  const alterEl = pitchEl.querySelector('alter');
  if (alter === 0) {
    alterEl?.remove();
    return;
  }
  if (alterEl) {
    alterEl.textContent = String(alter);
    return;
  }
  const newAlter = doc.createElement('alter');
  newAlter.textContent = String(alter);
  pitchEl.appendChild(newAlter);
};

const removeAccidental = (noteEl: Element): void => {
  noteEl.querySelector('accidental')?.remove();
};

const insertNaturalAccidental = (doc: Document, noteEl: Element): void => {
  removeAccidental(noteEl);
  const accidentalEl = doc.createElement('accidental');
  accidentalEl.textContent = 'natural';
  const children = Array.from(noteEl.children);
  const durationIndex = children.findIndex((child) => child.tagName === 'duration');
  const typeIndex = children.findIndex((child) => child.tagName === 'type');
  const anchorIndex = durationIndex >= 0 ? durationIndex : typeIndex;
  if (anchorIndex >= 0 && anchorIndex < children.length - 1) {
    noteEl.insertBefore(accidentalEl, children[anchorIndex + 1] ?? null);
  } else {
    noteEl.appendChild(accidentalEl);
  }
};

const simplifyHarmonyPitch = (
  doc: Document,
  parentEl: Element,
  stepLocalName: string,
  alterLocalName: string,
): boolean => {
  const stepEl = parentEl.querySelector(stepLocalName);
  if (!stepEl) {
    return false;
  }
  const step = stepEl.textContent ?? '';
  const alterEl = parentEl.querySelector(alterLocalName);
  const alter = alterEl ? parseInt(alterEl.textContent ?? '0', 10) : 0;
  if (alter === 0) {
    return false;
  }

  const simplified = simplifySpelledPitch(step, alter, 4);
  if (!simplified) {
    return false;
  }

  stepEl.textContent = simplified.step;
  alterEl?.remove();
  if (simplified.alter !== 0) {
    const newAlter = doc.createElement(alterLocalName);
    newAlter.textContent = String(simplified.alter);
    parentEl.appendChild(newAlter);
  }
  return true;
};

/**
 * MusicXML の note / harmony を異名同音の簡略表記へ再綴りする。
 * 変更が無い場合は元の文字列を返す。
 */
export const simplifyMusicXmlEnharmonics = (xmlString: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const keyFifths = readFirstKeyFifths(doc);
    let changed = false;

    doc.querySelectorAll('note').forEach((noteEl) => {
      if (noteEl.querySelector('rest')) {
        return;
      }
      const pitchEl = noteEl.querySelector('pitch');
      if (!pitchEl) {
        return;
      }
      const stepEl = pitchEl.querySelector('step');
      const alterEl = pitchEl.querySelector('alter');
      const octaveEl = pitchEl.querySelector('octave');
      if (!stepEl || !octaveEl) {
        return;
      }

      const step = stepEl.textContent ?? '';
      const alter = alterEl ? parseInt(alterEl.textContent ?? '0', 10) : 0;
      if (alter === 0) {
        return;
      }

      const octave = parseInt(octaveEl.textContent ?? '4', 10);
      const simplified = simplifySpelledPitch(step, alter, octave);
      if (!simplified) {
        return;
      }

      const keyAlterForStep = musicXmlKeySignatureAlter(simplified.step, keyFifths);
      const needsExplicitNatural = simplified.alter === 0 && keyAlterForStep !== 0;

      stepEl.textContent = simplified.step;
      if (needsExplicitNatural) {
        pitchEl.querySelector('alter')?.remove();
        const naturalAlter = doc.createElement('alter');
        naturalAlter.textContent = '0';
        pitchEl.appendChild(naturalAlter);
      } else {
        writePitchAlter(doc, pitchEl, simplified.alter);
      }
      octaveEl.textContent = String(simplified.octave);
      removeAccidental(noteEl);
      if (needsExplicitNatural) {
        insertNaturalAccidental(doc, noteEl);
      }
      changed = true;
    });

    doc.querySelectorAll('harmony').forEach((harmonyEl) => {
      const rootEl = harmonyEl.querySelector('root');
      if (rootEl && simplifyHarmonyPitch(doc, rootEl, 'root-step', 'root-alter')) {
        changed = true;
      }
      const bassEl = harmonyEl.querySelector('bass');
      if (bassEl && simplifyHarmonyPitch(doc, bassEl, 'bass-step', 'bass-alter')) {
        changed = true;
      }
    });

    if (!changed) {
      return xmlString;
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch {
    return xmlString;
  }
};

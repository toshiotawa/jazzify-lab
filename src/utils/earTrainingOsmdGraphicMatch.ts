import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { ChordOsmdMusicXmlAttack } from '@/utils/earTrainingChordOsmd';

export const CHORD_OSMD_ATTACK_KEY_DECIMALS = 6;

export const chordOsmdAttackLookupKey = (measureNumber: number, beatStartInMeasure: number): string => (
  `${measureNumber}|${beatStartInMeasure.toFixed(CHORD_OSMD_ATTACK_KEY_DECIMALS)}`
);

const multisetEqualSorted = (a: readonly number[], b: readonly number[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  for (let i = 0; i < sa.length; i += 1) {
    if (sa[i] !== sb[i]) {
      return false;
    }
  }
  return true;
};

type OsmdNoteLike = {
  sourceNote?: {
    isRest?: () => boolean;
    NoteTie?: { StartNote: boolean };
    halfTone?: number;
    Pitch?: unknown;
    TransposedPitch?: unknown;
  };
};

const hasPitchHead = (gn: OsmdNoteLike): boolean => {
  const sn = gn.sourceNote;
  if (!sn) {
    return false;
  }
  if (typeof sn.isRest === 'function' && sn.isRest()) {
    return false;
  }
  if (sn.NoteTie && sn.NoteTie.StartNote === false) {
    return false;
  }
  return Boolean(sn.Pitch ?? sn.TransposedPitch);
};

/** `Note.halfTone` は転調後の半音（実質 MIDI 番号に一致する想定）。 */
export const osmdGraphicalNoteToMidi = (gn: OsmdNoteLike): number | null => {
  const h = gn.sourceNote?.halfTone;
  if (typeof h !== 'number' || !Number.isFinite(h)) {
    return null;
  }
  const rounded = Math.round(h);
  if (rounded < 0 || rounded > 127) {
    return null;
  }
  return rounded;
};

interface GraphicCluster {
  measureNumber: number;
  minX: number;
  midis: number[];
  /** `midis` と同じ長さ・順序 */
  notes: OsmdNoteLike[];
}

const readMeasureList = (osmd: OpenSheetMusicDisplay): readonly unknown[][] => {
  const sheet = osmd.GraphicSheet as { MeasureList?: unknown; measureList?: unknown } | undefined;
  const raw = sheet?.MeasureList ?? sheet?.measureList;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as unknown[][];
};

const getFiniteNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

export const collectOsmdGraphicClusters = (osmd: OpenSheetMusicDisplay): GraphicCluster[] => {
  const out: GraphicCluster[] = [];
  const measureList = readMeasureList(osmd);
  for (let measureIndex = 0; measureIndex < measureList.length; measureIndex += 1) {
    const row = measureList[measureIndex] ?? [];
    const measureNumber = measureIndex + 1;
    for (const gm of row) {
      if (!gm || typeof gm !== 'object') {
        continue;
      }
      const gMeasure = gm as {
        staffEntries?: Array<{
          graphicalVoiceEntries?: Array<{ notes?: OsmdNoteLike[] }>;
          PositionAndShape?: { AbsolutePosition?: { x?: number } };
        }>;
      };
      for (const se of gMeasure.staffEntries ?? []) {
        const chordNotes: OsmdNoteLike[] = [];
        for (const gve of se.graphicalVoiceEntries ?? []) {
          for (const gn of gve.notes ?? []) {
            if (hasPitchHead(gn)) {
              chordNotes.push(gn);
            }
          }
        }
        if (chordNotes.length === 0) {
          continue;
        }
        const midis: number[] = [];
        const notes: OsmdNoteLike[] = [];
        for (const gn of chordNotes) {
          const m = osmdGraphicalNoteToMidi(gn);
          if (m !== null) {
            midis.push(m);
            notes.push(gn);
          }
        }
        if (midis.length === 0) {
          continue;
        }
        const seX = getFiniteNumber(se.PositionAndShape?.AbsolutePosition?.x) ?? Number.POSITIVE_INFINITY;
        out.push({
          measureNumber,
          minX: seX,
          midis,
          notes,
        });
      }
    }
  }
  return out;
};

const groupAttacksByMeasure = (
  attacks: readonly ChordOsmdMusicXmlAttack[],
): Map<number, ChordOsmdMusicXmlAttack[]> => {
  const by = new Map<number, ChordOsmdMusicXmlAttack[]>();
  for (const a of attacks) {
    const m = a.measureNumber;
    const list = by.get(m);
    if (list) {
      list.push(a);
    } else {
      by.set(m, [a]);
    }
  }
  for (const list of by.values()) {
    list.sort((x, y) => x.beatStartInMeasure - y.beatStartInMeasure);
  }
  return by;
};

/**
 * XML attacks と OSMD 上の staffEntry クラスタを、小節内の順序と和音構成で対応付ける。
 * 戻り値: attack lookup key → midi → その MIDI の GraphicalNote（低音→高音など列順）
 */
export const matchOsmdClustersToXmlAttacks = (
  osmd: OpenSheetMusicDisplay,
  xmlAttacks: readonly ChordOsmdMusicXmlAttack[],
): Map<string, Map<number, OsmdNoteLike[]>> => {
  const result = new Map<string, Map<number, OsmdNoteLike[]>>();
  if (xmlAttacks.length === 0) {
    return result;
  }
  const clusters = collectOsmdGraphicClusters(osmd);
  const byMeasureClusters = new Map<number, GraphicCluster[]>();
  for (const c of clusters) {
    const list = byMeasureClusters.get(c.measureNumber);
    if (list) {
      list.push(c);
    } else {
      byMeasureClusters.set(c.measureNumber, [c]);
    }
  }
  for (const list of byMeasureClusters.values()) {
    list.sort((a, b) => a.minX - b.minX);
  }
  const attacksByMeasure = groupAttacksByMeasure(xmlAttacks);

  for (const [measure, attackList] of attacksByMeasure) {
    const clusterList = byMeasureClusters.get(measure) ?? [];
    const usedCluster = new Set<number>();
    for (const attack of attackList) {
      const targetMidis = [...attack.midis];
      let foundIdx = -1;
      for (let ci = 0; ci < clusterList.length; ci += 1) {
        if (usedCluster.has(ci)) {
          continue;
        }
        if (multisetEqualSorted(clusterList[ci].midis, targetMidis)) {
          foundIdx = ci;
          break;
        }
      }
      if (foundIdx < 0) {
        continue;
      }
      usedCluster.add(foundIdx);
      const { notes, midis } = clusterList[foundIdx];
      const key = chordOsmdAttackLookupKey(attack.measureNumber, attack.beatStartInMeasure);
      const byMidi = new Map<number, OsmdNoteLike[]>();
      for (let i = 0; i < notes.length; i += 1) {
        const gn = notes[i];
        const mm = midis[i];
        const arr = byMidi.get(mm);
        if (arr) {
          arr.push(gn);
        } else {
          byMidi.set(mm, [gn]);
        }
      }
      result.set(key, byMidi);
    }
  }
  return result;
};

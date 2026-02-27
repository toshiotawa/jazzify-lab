/**
 * MusicXML 装飾音符展開ユーティリティ
 *
 * トリル (trill-mark)、モルデント (mordent)、逆モルデント (inverted-mordent)、
 * ターン (turn)、遅延ターン (delayed-turn)、シェイク (shake)、波線 (wavy-line)、
 * および装飾音符 (grace notes) を実際のノート列に展開する。
 */

// ========== 型定義 ==========

export type OrnamentType =
  | 'mordent'
  | 'inverted-mordent'
  | 'trill-mark'
  | 'turn'
  | 'delayed-turn'
  | 'shake'
  | 'wavy-line';

export interface OrnamentInfo {
  type: OrnamentType;
  long?: boolean;
  /** 補助音の変化記号 (accidental-mark) */
  accidentalMark?: number;
}

/** 展開後の個別ノート */
export interface ExpandedNote {
  pitch: number;           // MIDI番号
  durationDivisions: number; // divisions単位の長さ
  isOrnament: boolean;     // 装飾ノートかどうか
  noteName: string;        // 表示用音名 (例: "C4", "D#5")
}

/** 装飾音符 (grace note) 情報 */
export interface GraceNoteInfo {
  pitch: number;
  noteName: string;
  /** grace要素の slash 属性 */
  isSlash: boolean;
}

// ========== 定数 ==========

const STEP_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const SHARPS_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLATS_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

// MIDI→音名 (シャープ表記優先)
const PITCH_CLASS_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PITCH_CLASS_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// ========== 公開関数 ==========

/** step / alter / octave → MIDIノート番号 */
export function stepAlterOctaveToMidi(step: string, alter: number, octave: number): number {
  const base = STEP_SEMITONES[step.toUpperCase()] ?? 0;
  return (octave + 1) * 12 + base + alter;
}

/** MIDIノート番号 → 表示用音名 (例: "C4", "Eb3") */
export function midiToNoteName(midi: number, useFlatNames = false): string {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const names = useFlatNames ? PITCH_CLASS_NAMES_FLAT : PITCH_CLASS_NAMES_SHARP;
  return `${names[pitchClass]}${octave}`;
}

/** step + alter → 表示用音名 (オクターブ付き) */
export function stepAlterToDisplayName(step: string, alter: number, octave: number): string {
  let acc = '';
  if (alter > 0) acc = '#'.repeat(alter);
  else if (alter < 0) acc = 'b'.repeat(-alter);
  return `${step}${acc}${octave}`;
}

/** MusicXMLドキュメントから最初のキー情報 (fifths) を取得 */
export function getKeyFifths(doc: Document): number {
  const fifthsEl = doc.querySelector('key fifths');
  if (fifthsEl?.textContent) {
    const v = parseInt(fifthsEl.textContent, 10);
    if (!isNaN(v)) return v;
  }
  return 0;
}

/**
 * 調号に基づくスケール音のピッチクラスセットを生成
 * @param fifths fifths値 (0=C major, 1=G major, -1=F major, ...)
 */
export function buildScalePitchClasses(fifths: number): Set<number> {
  const scale = new Set([0, 2, 4, 5, 7, 9, 11]); // C major
  if (fifths > 0) {
    for (let i = 0; i < Math.min(fifths, 7); i++) {
      const natural = STEP_SEMITONES[SHARPS_ORDER[i]];
      scale.delete(natural);
      scale.add((natural + 1) % 12);
    }
  } else if (fifths < 0) {
    for (let i = 0; i < Math.min(-fifths, 7); i++) {
      const natural = STEP_SEMITONES[FLATS_ORDER[i]];
      scale.delete(natural);
      scale.add((natural + 11) % 12); // -1 mod 12
    }
  }
  return scale;
}

/** スケール内での上隣接音を取得 */
export function getUpperNeighbor(midiPitch: number, fifths: number): number {
  const scale = buildScalePitchClasses(fifths);
  for (let i = 1; i <= 3; i++) {
    if (scale.has((midiPitch + i) % 12)) return midiPitch + i;
  }
  return midiPitch + 2; // フォールバック: 全音
}

/** スケール内での下隣接音を取得 */
export function getLowerNeighbor(midiPitch: number, fifths: number): number {
  const scale = buildScalePitchClasses(fifths);
  for (let i = 1; i <= 3; i++) {
    if (scale.has(((midiPitch - i) % 12 + 12) % 12)) return midiPitch - i;
  }
  return midiPitch - 2; // フォールバック: 全音
}

// ========== 装飾記号検出 ==========

/**
 * MusicXMLの <note> 要素から装飾記号を検出
 *
 * querySelector ではなく tagName 直接比較で要素を検索する。
 * CSS セレクタの解釈で 'mordent' が 'inverted-mordent' にマッチする
 * 曖昧さを排除するため。
 */
export function detectOrnaments(noteEl: Element): OrnamentInfo | null {
  const ornaments = noteEl.querySelector('ornaments');
  if (!ornaments) return null;

  // accidental-mark の取得
  let accidentalMark: number | undefined;
  for (const child of ornaments.children) {
    if (child.tagName === 'accidental-mark' && child.textContent) {
      switch (child.textContent.trim()) {
        case 'sharp': accidentalMark = 1; break;
        case 'flat': accidentalMark = -1; break;
        case 'natural': accidentalMark = 0; break;
        case 'double-sharp': accidentalMark = 2; break;
        case 'double-flat': accidentalMark = -2; break;
      }
    }
  }

  // tagName の完全一致で装飾タイプを検出
  // inverted-mordent / delayed-turn を先に判定し、
  // mordent / turn の部分一致を防ぐ
  for (const child of ornaments.children) {
    const tag = child.tagName;

    if (tag === 'inverted-mordent') {
      const long = child.getAttribute('long') === 'yes';
      return { type: 'inverted-mordent', long, accidentalMark };
    }
    if (tag === 'mordent') {
      const long = child.getAttribute('long') === 'yes';
      return { type: 'mordent', long, accidentalMark };
    }
    if (tag === 'trill-mark') {
      return { type: 'trill-mark', accidentalMark };
    }
    if (tag === 'delayed-turn') {
      return { type: 'delayed-turn', accidentalMark };
    }
    if (tag === 'turn') {
      return { type: 'turn', accidentalMark };
    }
    if (tag === 'shake') {
      return { type: 'shake', accidentalMark };
    }
    if (tag === 'wavy-line' && child.getAttribute('type') === 'start') {
      return { type: 'wavy-line', accidentalMark };
    }
  }

  return null;
}

/**
 * MusicXMLの <note> 要素が装飾音符 (grace note) かどうか判定
 */
export function isGraceNote(noteEl: Element): boolean {
  return noteEl.querySelector('grace') !== null;
}

/**
 * 連続する grace note 群を収集 (指定インデックスの前方)
 * @param elements 小節内の全要素配列
 * @param mainNoteIndex 主音のインデックス
 */
export function collectGraceNotesBefore(
  elements: Element[],
  mainNoteIndex: number
): GraceNoteInfo[] {
  const graceNotes: GraceNoteInfo[] = [];

  for (let i = mainNoteIndex - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.tagName !== 'note') break;
    if (!isGraceNote(el)) break;
    if (el.querySelector('rest')) continue;

    const pitchEl = el.querySelector('pitch');
    if (!pitchEl) continue;

    const step = pitchEl.querySelector('step')?.textContent ?? 'C';
    const alter = parseInt(pitchEl.querySelector('alter')?.textContent ?? '0', 10);
    const octave = parseInt(pitchEl.querySelector('octave')?.textContent ?? '4', 10);
    const midi = stepAlterOctaveToMidi(step, alter, octave);
    const isSlash = el.querySelector('grace')?.getAttribute('slash') === 'yes';

    graceNotes.unshift({
      pitch: midi,
      noteName: stepAlterToDisplayName(step, alter, octave),
      isSlash,
    });
  }

  return graceNotes;
}

// ========== 装飾音符展開 ==========

/**
 * 装飾記号を実際のノート列に展開
 *
 * @param ornament 検出された装飾記号情報
 * @param mainPitch 主音の MIDI番号
 * @param mainNoteName 主音の表示名
 * @param durationDivisions 主音の duration (divisions 単位)
 * @param keyFifths 調号 (fifths 値)
 * @param useFlatNames フラット表記を使うか
 */
export function expandOrnament(
  ornament: OrnamentInfo,
  mainPitch: number,
  mainNoteName: string,
  durationDivisions: number,
  keyFifths: number,
  useFlatNames = false,
  divisionsPerQuarter = 1,
): ExpandedNote[] {
  // 補助音のピッチ計算
  let upper: number;
  let lower: number;

  if (ornament.accidentalMark !== undefined) {
    // accidental-mark が指定されている場合
    upper = mainPitch + (ornament.accidentalMark >= 0 ? Math.max(1, ornament.accidentalMark + 1) : 2);
    lower = mainPitch - (ornament.accidentalMark <= 0 ? Math.max(1, -ornament.accidentalMark + 1) : 2);
  } else {
    upper = getUpperNeighbor(mainPitch, keyFifths);
    lower = getLowerNeighbor(mainPitch, keyFifths);
  }

  const upperName = midiToNoteName(upper, useFlatNames);
  const lowerName = midiToNoteName(lower, useFlatNames);

  // 32分音符 = 1拍(quarter)の1/8 — 全装飾音の基準単位
  const thirtySecond = divisionsPerQuarter / 8;

  switch (ornament.type) {
    case 'mordent': {
      // 主音(32分) → 下隣接音(32分) → 主音(残り)
      const ornDur = Math.min(thirtySecond, durationDivisions / 3);
      const mRemaining = durationDivisions - 2 * ornDur;
      return [
        { pitch: mainPitch, durationDivisions: ornDur, isOrnament: true, noteName: mainNoteName },
        { pitch: lower, durationDivisions: ornDur, isOrnament: true, noteName: lowerName },
        { pitch: mainPitch, durationDivisions: mRemaining, isOrnament: false, noteName: mainNoteName },
      ];
    }

    case 'inverted-mordent': {
      // 主音(32分) → 上隣接音(32分) → 主音(残り)
      const imOrnDur = Math.min(thirtySecond, durationDivisions / 3);
      const imRemaining = durationDivisions - 2 * imOrnDur;
      return [
        { pitch: mainPitch, durationDivisions: imOrnDur, isOrnament: true, noteName: mainNoteName },
        { pitch: upper, durationDivisions: imOrnDur, isOrnament: true, noteName: upperName },
        { pitch: mainPitch, durationDivisions: imRemaining, isOrnament: false, noteName: mainNoteName },
      ];
    }

    case 'trill-mark':
    case 'wavy-line':
    case 'shake': {
      // 主音と上隣接音の交互 — 32分音符ベースで奇数個生成
      let noteCount = Math.max(5, Math.round(durationDivisions / thirtySecond));
      if (noteCount % 2 === 0) noteCount--;
      const tUnit = durationDivisions / noteCount;
      const notes: ExpandedNote[] = [];
      for (let i = 0; i < noteCount; i++) {
        const isUp = i % 2 === 1;
        notes.push({
          pitch: isUp ? upper : mainPitch,
          durationDivisions: tUnit,
          isOrnament: true,
          noteName: isUp ? upperName : mainNoteName,
        });
      }
      return notes;
    }

    case 'turn': {
      // 上(32分) → 主(32分) → 下(32分) → 主(残り)
      const tUnit = Math.min(thirtySecond, durationDivisions / 4);
      const turnRemaining = durationDivisions - 3 * tUnit;
      return [
        { pitch: upper, durationDivisions: tUnit, isOrnament: true, noteName: upperName },
        { pitch: mainPitch, durationDivisions: tUnit, isOrnament: true, noteName: mainNoteName },
        { pitch: lower, durationDivisions: tUnit, isOrnament: true, noteName: lowerName },
        { pitch: mainPitch, durationDivisions: turnRemaining, isOrnament: false, noteName: mainNoteName },
      ];
    }

    case 'delayed-turn': {
      // 主音(持続) → 上(32分) → 主(32分) → 下(32分) → 主(32分)
      const dtUnit = Math.min(thirtySecond, durationDivisions / 5);
      const sustained = durationDivisions - 4 * dtUnit;
      return [
        { pitch: mainPitch, durationDivisions: sustained, isOrnament: false, noteName: mainNoteName },
        { pitch: upper, durationDivisions: dtUnit, isOrnament: true, noteName: upperName },
        { pitch: mainPitch, durationDivisions: dtUnit, isOrnament: true, noteName: mainNoteName },
        { pitch: lower, durationDivisions: dtUnit, isOrnament: true, noteName: lowerName },
        { pitch: mainPitch, durationDivisions: dtUnit, isOrnament: false, noteName: mainNoteName },
      ];
    }

    default:
      return [{
        pitch: mainPitch,
        durationDivisions,
        isOrnament: false,
        noteName: mainNoteName,
      }];
  }
}

/**
 * grace notes を ExpandedNote[] に変換
 *
 * バロック長前打音ルール (slash="no"):
 *   - 付点なし主音 → 前打音が主音 duration の 1/2 を取る
 *   - 付点あり主音 → 前打音が主音 duration の 2/3 を取る
 *   - 拍の上 (on-beat) に配置し、主音をその分後ろにずらす
 *
 * 短前打音 (slash="yes" / acciaccatura):
 *   - 主音 duration の 1/4 を上限として短く配置
 *   - 拍の前 (before-beat) に配置（従来動作）
 *
 * @param graceNotes 装飾音符情報配列
 * @param mainNoteDuration 主音の duration (divisions)
 * @param isDotted 主音が付点かどうか
 * @returns [graceExpandedNotes, 主音から差し引く divisions, 長前打音か]
 */
export function expandGraceNotes(
  graceNotes: GraceNoteInfo[],
  mainNoteDuration: number,
  isDotted = false,
): [ExpandedNote[], number, boolean] {
  if (graceNotes.length === 0) return [[], 0, false];

  const isLong = graceNotes.some(g => !g.isSlash);

  if (isLong) {
    const ratio = isDotted ? 2 / 3 : 1 / 2;
    const graceTotal = Math.max(1, Math.round(mainNoteDuration * ratio));
    const eachDur = Math.max(1, Math.floor(graceTotal / graceNotes.length));
    const actualTotal = eachDur * graceNotes.length;

    const expanded: ExpandedNote[] = graceNotes.map((g) => ({
      pitch: g.pitch,
      durationDivisions: eachDur,
      isOrnament: true,
      noteName: g.noteName,
    }));

    return [expanded, actualTotal, true];
  }

  // 短前打音: 主音の 1/4 を上限として均等割り
  const graceTotal = Math.min(
    Math.floor(mainNoteDuration / 4),
    Math.max(graceNotes.length, 1),
  );
  const eachDur = Math.max(1, Math.floor(graceTotal / graceNotes.length));
  const actualTotal = eachDur * graceNotes.length;

  const expanded: ExpandedNote[] = graceNotes.map((g) => ({
    pitch: g.pitch,
    durationDivisions: eachDur,
    isOrnament: true,
    noteName: g.noteName,
  }));

  return [expanded, actualTotal, false];
}

/**
 * <tie> と <notations><tied> の両方からタイ情報を取得する。
 * 一部の MusicXML は <tie> を省略し <tied> のみ記述するため、両方をチェックする。
 */
export function getTieTypes(noteEl: Element): { hasStart: boolean; hasStop: boolean } {
  let hasStart = false;
  let hasStop = false;
  for (const t of noteEl.querySelectorAll('tie')) {
    const type = t.getAttribute('type');
    if (type === 'start') hasStart = true;
    if (type === 'stop') hasStop = true;
  }
  for (const t of noteEl.querySelectorAll('notations > tied')) {
    const type = t.getAttribute('type');
    if (type === 'start') hasStart = true;
    if (type === 'stop') hasStop = true;
  }
  return { hasStart, hasStop };
}

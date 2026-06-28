import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Note } from 'tonal';
import { describe, expect, it } from 'vitest';
import { transposeMusicXml } from '@/utils/musicXmlTransposer';

const parseXml = (xml: string): Document => {
  return new DOMParser().parseFromString(xml, 'application/xml');
};

const TIE_SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
        <voice>1</voice>
        <type>half</type>
        <tie type="start"/>
      </note>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>2</duration>
        <voice>1</voice>
        <type>half</type>
        <tie type="stop"/>
      </note>
    </measure>
  </part>
</score-partwise>`;

const SINGLE_NOTE_XML = (step: string, alter: number | null, octave: number): string => {
  const alterXml = alter === null || alter === 0
    ? ''
    : `<alter>${alter}</alter>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part>
    <measure>
      <attributes><key><fifths>0</fifths></key></attributes>
      <note><pitch><step>${step}</step>${alterXml}<octave>${octave}</octave></pitch></note>
    </measure>
  </part>
</score-partwise>`;
};

const readNoteMidi = (xml: string): number | null => {
  const doc = parseXml(xml);
  const step = doc.querySelector('note pitch step')?.textContent ?? 'C';
  const alterText = doc.querySelector('note pitch alter')?.textContent;
  const alter = alterText ? Number.parseInt(alterText, 10) : 0;
  const octave = Number.parseInt(doc.querySelector('note pitch octave')?.textContent ?? '4', 10);
  let accidental = '';
  if (alter > 0) {
    accidental = '#'.repeat(alter);
  } else if (alter < 0) {
    accidental = 'b'.repeat(-alter);
  }
  return Note.midi(`${step}${accidental}${octave}`);
};

describe('transposeMusicXml', () => {
  it('C4 を符号付き半音で正しく移調する', () => {
    const base = SINGLE_NOTE_XML('C', null, 4);
    const baseMidi = Note.midi('C4');
    expect(baseMidi).not.toBeNull();

    const downOne = transposeMusicXml(base, -1);
    const downTwo = transposeMusicXml(base, -2);
    const upThree = transposeMusicXml(base, 3);

    expect(readNoteMidi(downOne)).toBe(Note.midi('B3'));
    expect(readNoteMidi(downTwo)).toBe(Note.midi('A#3'));
    expect(readNoteMidi(upThree)).toBe(Note.midi('D#4'));
  });

  it('tieの後ろ側ノートも移調される', () => {
    const transposed = transposeMusicXml(TIE_SAMPLE_XML, 1);
    const doc = parseXml(transposed);
    const noteEls = Array.from(doc.querySelectorAll('note'));

    expect(noteEls).toHaveLength(2);

    const pitchSignatures = noteEls.map((noteEl) => {
      const step = noteEl.querySelector('pitch > step')?.textContent ?? '';
      const alter = noteEl.querySelector('pitch > alter')?.textContent ?? '0';
      const octave = noteEl.querySelector('pitch > octave')?.textContent ?? '';
      return `${step}:${alter}:${octave}`;
    });

    expect(new Set(pitchSignatures).size).toBe(1);
    expect(pitchSignatures[0]).toBe('D:-1:4');
  });

  it(
    'invention 1 を +-1, +-2 移調しても note 要素の順序が壊れない',
    () => {
      const xmlPath = resolve(process.cwd(), 'public', 'invention 1.musicxml');
      const sourceXml = readFileSync(xmlPath, 'utf-8');
      const offsets = [-2, -1, 1, 2];

      offsets.forEach((offset) => {
        const transposed = transposeMusicXml(sourceXml, offset);
        const doc = parseXml(transposed);
        expect(doc.querySelector('parsererror')).toBeNull();

        const hasAccidentalBeforeDuration = Array.from(doc.querySelectorAll('note')).some((noteEl) => {
          const childTags = Array.from(noteEl.children).map((child) => child.tagName);
          const accidentalIndex = childTags.indexOf('accidental');
          const durationIndex = childTags.indexOf('duration');
          return accidentalIndex !== -1 && durationIndex !== -1 && accidentalIndex < durationIndex;
        });

        expect(hasAccidentalBeforeDuration).toBe(false);
      });
    },
    60_000
  );

  const slashHarmonyXml = (rootStep: string, rootAlter: number | null, bassStep: string, bassAlter: number | null): string => {
    const rootAlterXml = rootAlter === null || rootAlter === 0
      ? ''
      : `<root-alter>${rootAlter}</root-alter>`;
    const bassAlterXml = bassAlter === null || bassAlter === 0
      ? ''
      : `<bass-alter>${bassAlter}</bass-alter>`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part>
    <measure>
      <attributes><key><fifths>0</fifths></key></attributes>
      <harmony>
        <root><root-step>${rootStep}</root-step>${rootAlterXml}</root>
        <kind>major</kind>
        <bass><bass-step>${bassStep}</bass-step>${bassAlterXml}</bass>
      </harmony>
      <note><pitch><step>C</step><octave>4</octave></pitch></note>
    </measure>
  </part>
</score-partwise>`;
  };

  it('harmony の bass も移調する', () => {
    const base = slashHarmonyXml('C', null, 'E', null);
    const transposed = transposeMusicXml(base, 2);
    const doc = parseXml(transposed);
    expect(doc.querySelector('root root-step')?.textContent).toBe('D');
    expect(doc.querySelector('bass bass-step')?.textContent).toBe('F');
    expect(doc.querySelector('bass bass-alter')?.textContent).toBe('1');
  });

  it('Bb/D の harmony bass も +2 で C/E 相当になる', () => {
    const base = slashHarmonyXml('B', -1, 'D', null);
    const transposed = transposeMusicXml(base, 2);
    const doc = parseXml(transposed);
    expect(doc.querySelector('root root-step')?.textContent).toBe('C');
    expect(doc.querySelector('bass bass-step')?.textContent).toBe('E');
  });
});

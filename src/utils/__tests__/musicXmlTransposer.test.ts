import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

describe('transposeMusicXml', () => {
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

  it('invention 1 を +-1, +-2 移調しても note 要素の順序が壊れない', () => {
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
  });
});

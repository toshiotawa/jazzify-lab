/**
 * Ch6 Fブルース: コール&レスポンス用 MusicXML 前処理。
 *
 * Usage:
 *   node scripts/build-mq-b5-call-response-musicxml.mjs --shift --source in.xml --output out.xml
 *   node scripts/build-mq-b5-call-response-musicxml.mjs --voice2-to-voice4 --source in.xml --output out.xml
 *   node scripts/build-mq-b5-call-response-musicxml.mjs --fix-tempo 80 --source in.xml --output out.xml
 *   node scripts/build-mq-b5-call-response-musicxml.mjs --shift --part 1 --source in.xml --output out.xml
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const readArg = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }
  return process.argv[index + 1];
};

const SOURCE = resolve(readArg('--source') ?? '');
const OUTPUT = resolve(readArg('--output') ?? '');
const doShift = process.argv.includes('--shift');
const doVoice2To4 = process.argv.includes('--voice2-to-voice4');
const tempoFix = readArg('--fix-tempo');
const partFilter = readArg('--part');

if (!SOURCE || !OUTPUT) {
  console.error('Usage: --source <in> --output <out> plus --shift | --voice2-to-voice4 | --fix-tempo <bpm>');
  process.exit(1);
}

const isElement = (node) => node.nodeType === 1;

const getDirectChild = (parent, localName) => {
  for (let child = parent.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === localName) {
      return child;
    }
  }
  return null;
};

const getDirectChildText = (parent, localName) => {
  const child = getDirectChild(parent, localName);
  const text = child?.textContent?.trim();
  return text ? text : null;
};

const setDirectChildText = (doc, parent, localName, text) => {
  const existing = getDirectChild(parent, localName);
  if (existing) {
    existing.textContent = text;
    return;
  }
  const child = doc.createElement(localName);
  child.textContent = text;
  parent.appendChild(child);
};

const collectVoiceOneTimelineNotes = (measure) => {
  const notes = [];
  for (const child of measure.children) {
    if (!isElement(child) || child.localName !== 'note') {
      continue;
    }
    if (getDirectChild(child, 'grace')) {
      continue;
    }
    const voice = getDirectChildText(child, 'voice');
    if (voice !== null && voice !== '1') {
      continue;
    }
    const hasPitch = getDirectChild(child, 'pitch') !== null;
    const hasRest = getDirectChild(child, 'rest') !== null;
    if (!hasPitch && !hasRest) {
      continue;
    }
    notes.push(child);
  }
  return notes;
};

const measureHasVoiceOnePitch = (measure) => (
  collectVoiceOneTimelineNotes(measure).some((n) => getDirectChild(n, 'pitch') !== null)
);

const createWholeRest = (doc, divisions) => {
  const note = doc.createElement('note');
  const rest = doc.createElement('rest');
  note.appendChild(rest);
  const duration = doc.createElement('duration');
  duration.textContent = String(divisions * 4);
  note.appendChild(duration);
  const type = doc.createElement('type');
  type.textContent = 'whole';
  note.appendChild(type);
  setDirectChildText(doc, note, 'voice', '1');
  return note;
};

const cloneNoteForVoice = (doc, sourceNote, voice, asCue) => {
  const note = sourceNote.cloneNode(true);
  setDirectChildText(doc, note, 'voice', voice);
  if (asCue) {
    const type = getDirectChild(note, 'type');
    if (type && !getDirectChild(note, 'rest')) {
      type.setAttribute('size', 'cue');
    }
  }
  return note;
};

const getMeasureDivisions = (measure) => {
  const div = getDirectChildText(measure, 'divisions');
  if (div) {
    return Number.parseInt(div, 10);
  }
  return null;
};

const findDivisionsInMeasure = (measure) => {
  const direct = getMeasureDivisions(measure);
  if (direct) {
    return direct;
  }
  const attrs = getDirectChild(measure, 'attributes');
  const divEl = attrs ? getDirectChild(attrs, 'divisions') : null;
  return divEl ? Number.parseInt(divEl.textContent ?? '1', 10) : 1;
};

const shiftEvenMeasuresToNext = (part) => {
  const measures = [...part.children].filter(
    (child) => isElement(child) && child.localName === 'measure',
  );
  const doc = part.ownerDocument;
  let divisions = 1;

  for (let i = 0; i < measures.length; i += 1) {
    const mnum = Number.parseInt(measures[i].getAttribute('number') ?? String(i + 1), 10);
    divisions = findDivisionsInMeasure(measures[i]) || divisions;
    if (mnum % 2 !== 0) {
      continue;
    }
    const sourceNotes = collectVoiceOneTimelineNotes(measures[i]).filter(
      (n) => getDirectChild(n, 'pitch') !== null,
    );
    if (sourceNotes.length === 0 || i + 1 >= measures.length) {
      continue;
    }
    const targetMeasure = measures[i + 1];
    for (const child of [...targetMeasure.children]) {
      if (isElement(child) && child.localName === 'note') {
        const voice = getDirectChildText(child, 'voice');
        if (voice === '1') {
          targetMeasure.removeChild(child);
        }
      }
    }
    for (const sourceNote of sourceNotes) {
      targetMeasure.appendChild(cloneNoteForVoice(doc, sourceNote, '1', false));
    }
    for (const child of [...measures[i].children]) {
      if (isElement(child) && child.localName === 'note') {
        measures[i].removeChild(child);
      }
    }
    measures[i].appendChild(createWholeRest(doc, divisions));
  }
};

const voice2ToVoice4Cue = (part) => {
  const doc = part.ownerDocument;
  for (const measure of part.children) {
    if (!isElement(measure) || measure.localName !== 'measure') {
      continue;
    }
    for (const child of measure.children) {
      if (!isElement(child) || child.localName !== 'note') {
        continue;
      }
      const voice = getDirectChildText(child, 'voice');
      if (voice === '2') {
        setDirectChildText(doc, child, 'voice', '4');
        const type = getDirectChild(child, 'type');
        if (type && !getDirectChild(child, 'rest')) {
          type.setAttribute('size', 'cue');
        }
      }
    }
  }
};

const fixTempo = (doc, bpm) => {
  for (const sound of doc.querySelectorAll('sound[tempo]')) {
    sound.setAttribute('tempo', bpm);
  }
  for (const metronome of doc.querySelectorAll('metronome')) {
    const perMinute = getDirectChild(metronome, 'per-minute');
    if (perMinute) {
      perMinute.textContent = bpm;
    }
  }
};

const xmlText = readFileSync(SOURCE, 'utf8');
const dom = new JSDOM(xmlText, { contentType: 'text/xml' });
const doc = dom.window.document;

if (doc.getElementsByTagName('parsererror').length > 0) {
  console.error('Failed to parse source MusicXML');
  process.exit(1);
}

const parts = [...doc.querySelectorAll('part')];
for (const part of parts) {
  const pid = part.getAttribute('id') ?? '';
  if (partFilter && pid !== `P${partFilter}` && pid !== partFilter) {
    continue;
  }
  if (doShift) {
    shiftEvenMeasuresToNext(part);
  }
  if (doVoice2To4) {
    voice2ToVoice4Cue(part);
  }
}

if (tempoFix) {
  fixTempo(doc, tempoFix);
}

writeFileSync(OUTPUT, dom.serialize(), 'utf8');
const flags = [
  doShift ? 'shift' : null,
  doVoice2To4 ? 'voice2→4' : null,
  tempoFix ? `tempo=${tempoFix}` : null,
  partFilter ? `part=${partFilter}` : null,
].filter(Boolean).join(', ');
console.log(`Wrote ${OUTPUT} (${flags})`);

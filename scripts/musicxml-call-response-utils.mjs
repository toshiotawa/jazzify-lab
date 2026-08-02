/**
 * Call/Response MusicXML 変換ユーティリティ。
 * Call 小節（奇数）の音符を Response 小節（偶数）へコピーし、
 * OSMD では Call を Voice4 cue、精密では Call を休符化する。
 */
import { JSDOM } from 'jsdom';

const GUIDE_VOICE = '4';
const TARGET_VOICE = '1';

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

const appendDirectChildrenByName = (doc, sourceNote, targetNote, localName) => {
  for (let child = sourceNote.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === localName) {
      targetNote.appendChild(child.cloneNode(true));
    }
  }
};

/** @param {Element} measure */
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

/** @param {Element} measure */
const removeNotes = (measure) => {
  for (const child of [...measure.children]) {
    if (isElement(child) && child.localName === 'note') {
      measure.removeChild(child);
    }
  }
};

/** @param {Element} measure */
const removeBackups = (measure) => {
  for (const child of [...measure.children]) {
    if (isElement(child) && child.localName === 'backup') {
      measure.removeChild(child);
    }
  }
};

/**
 * @param {Document} doc
 * @param {Element} sourceNote
 * @param {boolean} asCue
 * @param {string} voice
 */
const cloneNoteAsVoice = (doc, sourceNote, asCue, voice) => {
  const note = doc.createElement('note');
  const isRest = getDirectChild(sourceNote, 'rest') !== null;

  if (isRest) {
    const rest = getDirectChild(sourceNote, 'rest');
    if (rest) {
      note.appendChild(rest.cloneNode(true));
    }
  } else {
    const pitch = getDirectChild(sourceNote, 'pitch');
    if (pitch) {
      note.appendChild(pitch.cloneNode(true));
    }
  }

  appendDirectChildrenByName(doc, sourceNote, note, 'duration');

  const type = getDirectChild(sourceNote, 'type');
  if (type) {
    const typeClone = type.cloneNode(true);
    if (asCue && !isRest) {
      typeClone.setAttribute('size', 'cue');
    }
    note.appendChild(typeClone);
  }

  appendDirectChildrenByName(doc, sourceNote, note, 'dot');
  appendDirectChildrenByName(doc, sourceNote, note, 'accidental');
  appendDirectChildrenByName(doc, sourceNote, note, 'beam');
  setDirectChildText(doc, note, 'voice', voice);

  if (!isRest) {
    appendDirectChildrenByName(doc, sourceNote, note, 'stem');
  }

  return note;
};

/**
 * @param {Document} doc
 * @param {number} duration
 * @param {string} voice
 * @param {boolean} printObject
 */
const createMeasureRestNote = (doc, duration, voice, printObject) => {
  const note = doc.createElement('note');
  if (!printObject) {
    note.setAttribute('print-object', 'no');
  }
  const rest = doc.createElement('rest');
  rest.setAttribute('measure', 'yes');
  note.appendChild(rest);
  const durationEl = doc.createElement('duration');
  durationEl.textContent = String(duration);
  note.appendChild(durationEl);
  const voiceEl = doc.createElement('voice');
  voiceEl.textContent = voice;
  note.appendChild(voiceEl);
  return note;
};

/**
 * @param {Document} doc
 * @param {number} duration
 */
const createBackup = (doc, duration) => {
  const backup = doc.createElement('backup');
  const durationEl = doc.createElement('duration');
  durationEl.textContent = String(duration);
  backup.appendChild(durationEl);
  return backup;
};

/** @param {string} xml */
export const getDivisions = (xml) => {
  const m = xml.match(/<divisions>(\d+)<\/divisions>/);
  return m ? Number(m[1]) : 24;
};

/**
 * @param {string} xml
 * @returns {Map<number, string>}
 */
export function parsePartMeasures(xml) {
  const partMarker = '<part id="P1">';
  const partStart = xml.indexOf(partMarker);
  if (partStart === -1) {
    throw new Error('part P1 not found');
  }
  const partEnd = xml.indexOf('</part>', partStart);
  const part = xml.slice(partStart, partEnd);
  const blocks = [...part.matchAll(/<measure number="(\d+)"[^>]*>([\s\S]*?)<\/measure>/g)];
  const map = new Map();
  for (const [, num, body] of blocks) {
    map.set(Number(num), body);
  }
  return map;
}

/** @param {string} body */
function stripMeasurePrint(body) {
  return body
    .replace(/<print[^>]*\/>/g, '')
    .replace(/<print[\s\S]*?<\/print>\s*/g, '');
}

/** @param {string} body */
function stripSoundTempo(body) {
  return body.replace(/<sound[^>]*\/>/g, '').replace(/<sound[^>]*>[\s\S]*?<\/sound>/g, '');
}

/** @param {string} body */
function stripAttributes(body) {
  return body.replace(/<attributes>[\s\S]*?<\/attributes>\s*/g, '');
}

/** @param {string} body */
function extractFirstAttributes(body) {
  const m = body.match(/<attributes>[\s\S]*?<\/attributes>/);
  return m ? m[0] : null;
}

/** @param {string} body @param {string | null} attributesBlock */
function ensureAttributes(body, attributesBlock) {
  if (!attributesBlock) {
    return body;
  }
  if (body.includes('<attributes>')) {
    return body.replace(/<attributes>[\s\S]*?<\/attributes>/, attributesBlock);
  }
  return `${attributesBlock}\n${body}`;
}

/**
 * @param {string} xml
 * @param {number} from
 * @param {number} to
 * @param {number} [tempo]
 */
export function extractPhraseBodyXml(xml, from, to, tempo) {
  const headerEnd = xml.indexOf('<part id="P1">');
  const header = xml.slice(0, headerEnd);
  const footer = '\n  </part>\n</score-partwise>\n';
  const measureMap = parsePartMeasures(xml);

  /** @type {string[]} */
  const bodies = [];
  for (let n = from; n <= to; n += 1) {
    const body = measureMap.get(n);
    if (!body) {
      throw new Error(`measure ${n} not found (${from}-${to})`);
    }
    bodies.push(stripMeasurePrint(body));
  }

  const firstAttributes = extractFirstAttributes(bodies[0]);
  const measureXml = bodies.map((body, i) => {
    const num = i + 1;
    let content = body;
    if (num === 1) {
      content = ensureAttributes(content, firstAttributes);
      if (tempo !== undefined) {
        content = stripSoundTempo(content);
        content = `      <sound tempo="${tempo}"/>\n${content}`;
      } else {
        content = stripSoundTempo(content);
      }
    } else {
      content = stripAttributes(content);
      content = stripSoundTempo(content);
    }
    return `    <measure number="${num}" width="200">\n${content}\n    </measure>`;
  }).join('\n    <!--=======================================================-->\n');

  return `${header}<part id="P1">\n${measureXml}\n${footer}`;
}

/** @param {string} xml @param {string} tagName */
function extractBlock(xml, tagName) {
  const selfClosing = new RegExp(`<${tagName}[^>]*/>`);
  const selfMatch = selfClosing.exec(xml);
  if (selfMatch) {
    const block = selfMatch[0];
    const start = selfMatch.index;
    const remainder = xml.slice(0, start) + xml.slice(start + block.length);
    return { block, remainder };
  }
  const open = `<${tagName}`;
  const close = `</${tagName}>`;
  const start = xml.indexOf(open);
  if (start === -1) {
    return { block: null, remainder: xml };
  }
  const end = xml.indexOf(close, start);
  if (end === -1) {
    throw new Error(`Unclosed <${tagName}>`);
  }
  const block = xml.slice(start, end + close.length);
  const remainder = xml.slice(0, start) + xml.slice(end + close.length);
  return { block, remainder };
}

/** @param {string} block */
function indentBlock(block) {
  return block
    .split('\n')
    .map((line) => (line.trim() ? `      ${line.trim()}` : ''))
    .filter(Boolean)
    .join('\n');
}

/**
 * 先頭に空白1小節を挿入する（音符は2小節目から）。
 * @param {string} inputXml
 * @param {number} [beatsPerMeasure=4]
 * @param {boolean} [withCountInWords=false]
 */
export function prependBlankMeasure(inputXml, beatsPerMeasure = 4, withCountInWords = false) {
  const divisions = getDivisions(inputXml);
  const restDuration = divisions * beatsPerMeasure;
  const restNote = `      <note>
        <rest measure="yes"/>
        <duration>${restDuration}</duration>
        <voice>1</voice>
      </note>`;
  const direction = withCountInWords
    ? `      <direction placement="above">
        <direction-type>
          <words default-y="20" font-family="Arial" font-size="12">1  2  3  4</words>
        </direction-type>
      </direction>`
    : '';

  let xml = inputXml;
  const measureCount = (xml.match(/<measure number="\d+"/g) ?? []).length;
  for (let n = measureCount; n >= 1; n -= 1) {
    xml = xml.replace(new RegExp(`<measure number="${n}"`, 'g'), `<measure number="${n + 1}"`);
  }

  const partMarker = '<part id="P1">';
  const partStart = xml.indexOf(partMarker);
  const secondStart = xml.indexOf('<measure number="2"', partStart);
  const secondEnd = xml.indexOf('</measure>', secondStart);
  const measureOpenEnd = xml.indexOf('>', secondStart) + 1;
  let measureBody = xml.slice(measureOpenEnd, secondEnd);

  const printBlock = extractBlock(measureBody, 'print');
  measureBody = printBlock.remainder;
  const attributesBlock = extractBlock(measureBody, 'attributes');
  measureBody = attributesBlock.remainder;
  const soundBlock = extractBlock(measureBody, 'sound');
  measureBody = soundBlock.remainder;

  const widthMatch = xml.slice(secondStart, measureOpenEnd).match(/width="(\d+)"/);
  const bodyWidth = widthMatch ? widthMatch[1] : '200';
  const trimmedBody = measureBody.trim();

  const blankMeasure = [
    '    <measure number="1" width="200">',
    printBlock.block ? indentBlock(printBlock.block) : '',
    attributesBlock.block ? indentBlock(attributesBlock.block) : '',
    soundBlock.block ? indentBlock(soundBlock.block) : '',
    direction,
    restNote,
    '    </measure>',
  ].filter(Boolean).join('\n');

  const updatedSecondMeasure = `    <measure number="2" width="${bodyWidth}">\n${trimmedBody}\n    </measure>`;
  const before = xml.slice(0, secondStart);
  const after = xml.slice(secondEnd + '</measure>'.length);
  return `${before}${blankMeasure}\n    <!--=======================================================-->\n${updatedSecondMeasure}${after}`;
}

/**
 * Call 小節のノートを Response 小節へ移す（OSMD=Call を Voice4 cue / 精密=Call 休符）。
 * @param {Document} doc
 * @param {Element} callMeasure
 * @param {Element} responseMeasure
 * @param {'osmd' | 'precision'} mode
 * @param {number} measureDuration
 */
function applyCallResponsePair(doc, callMeasure, responseMeasure, mode, measureDuration) {
  // pitch + rest のタイムライン全体を保持（休符を落とすと小節の拍が欠ける）
  const callNotes = collectVoiceOneTimelineNotes(callMeasure);
  const hasPitch = callNotes.some((n) => getDirectChild(n, 'pitch') !== null);

  if (mode === 'osmd') {
    removeNotes(callMeasure);
    removeBackups(callMeasure);
    callMeasure.appendChild(createMeasureRestNote(doc, measureDuration, TARGET_VOICE, false));
    if (hasPitch) {
      callMeasure.appendChild(createBackup(doc, measureDuration));
      for (const sourceNote of callNotes) {
        callMeasure.appendChild(cloneNoteAsVoice(doc, sourceNote, true, GUIDE_VOICE));
      }
    }
  } else {
    removeNotes(callMeasure);
    removeBackups(callMeasure);
    callMeasure.appendChild(createMeasureRestNote(doc, measureDuration, TARGET_VOICE, true));
  }

  removeNotes(responseMeasure);
  removeBackups(responseMeasure);
  if (hasPitch) {
    for (const sourceNote of callNotes) {
      responseMeasure.appendChild(cloneNoteAsVoice(doc, sourceNote, false, TARGET_VOICE));
    }
  } else {
    responseMeasure.appendChild(createMeasureRestNote(doc, measureDuration, TARGET_VOICE, true));
  }
}

/**
 * Call/Response 変換。
 *
 * - `responseOffset: 1`（既定）: 奇数=Call / 偶数=Response（Short 1Bar）
 * - `responseOffset: 2`: 1-2 Call → 3-4 Response, 5-6 Call → 7-8 Response（Short II-V 2 Bars）
 *
 * @param {string} xmlString
 * @param {'osmd' | 'precision'} mode
 * @param {number} [beatsPerMeasure=4]
 * @param {{ responseOffset?: 1 | 2 }} [options]
 * @returns {string}
 */
export function convertCallResponseMusicXml(xmlString, mode, beatsPerMeasure = 4, options = {}) {
  const responseOffset = options.responseOffset === 2 ? 2 : 1;
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' });
  const doc = dom.window.document;
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Failed to parse MusicXML for call/response conversion');
  }

  const part = doc.querySelector('part');
  if (!part) {
    throw new Error('No <part> found');
  }

  const divisions = getDivisions(xmlString);
  const measureDuration = divisions * beatsPerMeasure;

  const measures = [...part.children].filter(
    (child) => isElement(child) && child.localName === 'measure',
  );

  if (responseOffset === 1) {
    for (let i = 0; i + 1 < measures.length; i += 2) {
      applyCallResponsePair(doc, measures[i], measures[i + 1], mode, measureDuration);
    }
  } else {
    // 4 小節周期: index 0,1 が Call → +2 が Response
    for (let i = 0; i < measures.length; i += 1) {
      const mod = i % 4;
      if (mod !== 0 && mod !== 1) {
        continue;
      }
      const responseMeasure = measures[i + 2];
      if (!responseMeasure) {
        continue;
      }
      applyCallResponsePair(doc, measures[i], responseMeasure, mode, measureDuration);
    }
  }

  let body = new dom.window.XMLSerializer().serializeToString(doc);
  body = body.replace(/^<\?xml[^?]*\?>\s*/i, '');
  body = body.replace(/^<!DOCTYPE[^>]+>\s*/i, '');

  const xmlDeclMatch = xmlString.match(/^<\?xml[^?]*\?>\r?\n?/i);
  const doctypeMatch = xmlString.match(/<!DOCTYPE[^>]+>\r?\n?/i);
  const eol = xmlString.includes('\r\n') ? '\r\n' : '\n';
  const xmlDecl = xmlDeclMatch?.[0] ?? `<?xml version="1.0" encoding="UTF-8" standalone="no"?>${eol}`;
  const doctype = doctypeMatch?.[0] ?? `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">${eol}`;

  return `${xmlDecl}${doctype}${body}`;
}

/**
 * Voice1 pitch ノート数を数える（Voice4 除外）。
 * @param {string} xmlString
 */
export function countVoice1PitchNotes(xmlString) {
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' });
  const doc = dom.window.document;
  let count = 0;
  for (const note of doc.querySelectorAll('note')) {
    if (!note.querySelector('pitch')) continue;
    const voice = note.querySelector('voice')?.textContent?.trim() ?? '1';
    if (voice === GUIDE_VOICE) continue;
    count += 1;
  }
  return count;
}

/**
 * Voice4 pitch ノート数を数える。
 * @param {string} xmlString
 */
export function countVoice4PitchNotes(xmlString) {
  const dom = new JSDOM(xmlString, { contentType: 'text/xml' });
  const doc = dom.window.document;
  let count = 0;
  for (const note of doc.querySelectorAll('note')) {
    if (!note.querySelector('pitch')) continue;
    const voice = note.querySelector('voice')?.textContent?.trim() ?? '1';
    if (voice === GUIDE_VOICE) count += 1;
  }
  return count;
}

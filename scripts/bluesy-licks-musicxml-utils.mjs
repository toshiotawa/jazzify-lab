/**
 * Bluesy Licks MusicXML: 抽出・カウントイン・4 ループ展開。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KEY_FIFTHS, BEATS_PER_MEASURE, LOOP_COUNT, SOURCE_DIR } from './bluesy-licks-config.mjs';

const COUNT_IN_DIRECTION = `      <direction placement="above">
        <direction-type>
          <words default-y="20" font-family="Arial" font-size="12">1  2  3  4</words>
        </direction-type>
      </direction>`;

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

/**
 * @param {string} xml
 * @param {number} from
 * @param {number} to
 * @param {number} [padToBodyMeasures]
 */
export function extractPhraseBodyXml(xml, from, to, padToBodyMeasures) {
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

  const targetLen = padToBodyMeasures ?? bodies.length;
  while (bodies.length < targetLen) {
    bodies.push(bodies[bodies.length - 1]);
  }
  if (bodies.length !== targetLen) {
    throw new Error(`phrase ${from}-${to}: expected ${targetLen} bars, got ${bodies.length}`);
  }

  const firstAttributes = extractFirstAttributes(bodies[0]);
  const measureXml = bodies.map((body, i) => {
    const num = i + 1;
    let content = body;
    if (num === 1) {
      content = ensureAttributes(content, firstAttributes);
      content = stripSoundTempo(content);
    } else {
      content = stripAttributes(content);
      content = stripSoundTempo(content);
    }
    return `    <measure number="${num}" width="200">\n${content}\n    </measure>`;
  }).join('\n    <!--=======================================================-->\n');

  return `${header}<part id="P1">\n${measureXml}\n${footer}`;
}

/** @param {string} body */
function stripMeasurePrint(body) {
  return body.replace(/<print[\s\S]*?<\/print>\s*/g, '');
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

/** @param {string} xml */
export function getDivisions(xml) {
  const m = xml.match(/<divisions>(\d+)<\/divisions>/);
  return m ? Number(m[1]) : 12;
}

/**
 * @param {string} inputXml
 * @returns {string}
 */
export function prependCountInMeasure(inputXml) {
  const divisions = getDivisions(inputXml);
  const restDuration = divisions * BEATS_PER_MEASURE;
  const countInRest = `      <note>
        <rest measure="yes"/>
        <duration>${restDuration}</duration>
        <voice>1</voice>
      </note>`;

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

  const attrs = attributesBlock.block ?? buildDefaultAttributes(divisions);
  const widthMatch = xml.slice(secondStart, measureOpenEnd).match(/width="(\d+)"/);
  const bodyWidth = widthMatch ? widthMatch[1] : '200';
  const trimmedBody = measureBody.trim();

  const countInMeasure = [
    '    <measure number="1" width="200">',
    printBlock.block ? indentBlock(printBlock.block) : '',
    indentBlock(attrs),
    soundBlock.block ? indentBlock(soundBlock.block) : '',
    COUNT_IN_DIRECTION,
    countInRest,
    '    </measure>',
  ].filter(Boolean).join('\n');

  const updatedSecondMeasure = `    <measure number="2" width="${bodyWidth}">\n${trimmedBody}\n    </measure>`;
  const before = xml.slice(0, secondStart);
  const after = xml.slice(secondEnd + '</measure>'.length);
  return `${before}${countInMeasure}\n    <!--=======================================================-->\n${updatedSecondMeasure}${after}`;
}

/** @param {number} divisions */
function buildDefaultAttributes(divisions) {
  return `<attributes>
        <divisions>${divisions}</divisions>
        <key>
          <fifths>${KEY_FIFTHS}</fifths>
          <mode>major</mode>
        </key>
        <time symbol="common">
          <beats>${BEATS_PER_MEASURE}</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>`;
}

/** @param {string} xml @param {string} tagName */
function extractBlock(xml, tagName) {
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
  return {
    block,
    remainder: xml.slice(0, start) + xml.slice(end + close.length),
  };
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
 * @param {string} xmlWithCountIn count-in = M1, one body loop = M2..end
 * @param {number} [loopCount]
 */
export function expandBodyLoops(xmlWithCountIn, loopCount = LOOP_COUNT) {
  const partMarker = '<part id="P1">';
  const partStart = xmlWithCountIn.indexOf(partMarker);
  const partEnd = xmlWithCountIn.indexOf('</part>', partStart);
  const part = xmlWithCountIn.slice(partStart, partEnd);
  const header = xmlWithCountIn.slice(0, partStart);
  const footer = xmlWithCountIn.slice(partEnd);

  const blocks = [...part.matchAll(/<measure number="(\d+)"[^>]*>([\s\S]*?)<\/measure>/g)];
  if (blocks.length < 2) {
    throw new Error('expected count-in + body measures');
  }

  const countInBlock = blocks[0];
  /** @type {string[]} */
  const bodyBodies = [];
  for (let i = 1; i < blocks.length; i += 1) {
    bodyBodies.push(blocks[i][2]);
  }

  /** @type {string[]} */
  const expandedBodies = [];
  for (let loop = 0; loop < loopCount; loop += 1) {
    for (const body of bodyBodies) {
      expandedBodies.push(stripMeasurePrint(stripAttributes(body)));
    }
  }

  let measureNum = 1;
  const countInXml = `    <measure number="${measureNum}" width="200">\n${countInBlock[2]}\n    </measure>`;
  measureNum += 1;

  const bodyXml = expandedBodies.map((body) => {
    const xml = `    <measure number="${measureNum}" width="200">\n${body}\n    </measure>`;
    measureNum += 1;
    return xml;
  }).join('\n    <!--=======================================================-->\n');

  return `${header}${partMarker}\n${countInXml}\n    <!--=======================================================-->\n${bodyXml}\n${footer}`;
}

/**
 * @param {string} combinedPath
 * @param {import('./bluesy-licks-config.mjs').BluesyLicksPhraseSpec} spec
 */
export function buildPhraseMusicXml(combinedPath, spec) {
  const sourcePath = spec.standaloneMusicXml
    ? join(SOURCE_DIR, spec.standaloneMusicXml)
    : combinedPath;
  const sourceXml = readFileSync(sourcePath, 'utf8');
  const body = extractPhraseBodyXml(
    sourceXml,
    spec.sourceFrom,
    spec.sourceTo,
    spec.padToBodyMeasures,
  );
  const withCountIn = prependCountInMeasure(body);
  return expandBodyLoops(withCountIn, LOOP_COUNT);
}

/** @param {string} path @param {string} xml */
export function writeMusicXml(path, xml) {
  writeFileSync(path, xml, 'utf8');
}

/**
 * 展開済み XML の先頭ループ（M2..1+bodyMeasures）の OSMD ターゲット数を概算。
 * @param {string} expandedXml
 * @param {number} bodyMeasures
 */
export function countOneLoopAttackTargets(expandedXml, bodyMeasures) {
  const partMarker = '<part id="P1">';
  const partStart = expandedXml.indexOf(partMarker);
  const partEnd = expandedXml.indexOf('</part>', partStart);
  const part = expandedXml.slice(partStart, partEnd);
  const blocks = [...part.matchAll(/<measure number="(\d+)"[^>]*>([\s\S]*?)<\/measure>/g)];
  let count = 0;
  for (const [, numStr, body] of blocks) {
    const num = Number(numStr);
    if (num < 2 || num > 1 + bodyMeasures) {
      continue;
    }
    for (const noteMatch of body.matchAll(/<note[\s>][\s\S]*?<\/note>/g)) {
      const noteInner = noteMatch[0];
      if (!noteInner.includes('<pitch>')) {
        continue;
      }
      if (noteInner.includes('<chord/>') || noteInner.includes('<chord />')) {
        continue;
      }
      if (/<tie type="stop"/.test(noteInner) || /<tied type="stop"/.test(noteInner)) {
        continue;
      }
      count += 1;
    }
  }
  return Math.max(1, count);
}

/**
 * @param {number} targetCount
 */
export function computeCombatStats(targetCount) {
  const playerHp = 100;
  const perfectCompletion = Math.max(8, Math.round(100 * 0.35));
  const perCorrect = Math.max(1, Math.round((100 * 0.55) / targetCount));
  const enemyHp = targetCount * perCorrect + perfectCompletion;
  return {
    player_hp: playerHp,
    enemy_hp: enemyHp,
    per_correct_note_damage: perCorrect,
    good_completion_damage: Math.max(1, Math.round(perfectCompletion * 0.35)),
    great_completion_damage: Math.max(1, Math.round(perfectCompletion * 0.6)),
    perfect_completion_damage: perfectCompletion,
    miss_damage: 3,
    fail_damage: 10,
    perfect_max_misses: 0,
    great_max_misses: 2,
  };
}

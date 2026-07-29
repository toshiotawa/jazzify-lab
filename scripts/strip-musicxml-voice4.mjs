/**
 * MusicXML から voice 4（ガイド）ノートを削除する。
 * backup は残す（他声部のタイミング整合のため）。voice 4 のみの backup 直後が空でも OSMD は許容。
 *
 * Usage:
 *   node scripts/strip-musicxml-voice4.mjs --source in.musicxml --output out.musicxml
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

const sourceArg = readArg('--source');
const outputArg = readArg('--output');
if (!sourceArg || !outputArg) {
  console.error('Usage: node scripts/strip-musicxml-voice4.mjs --source <in> --output <out>');
  process.exit(1);
}

const SOURCE = resolve(sourceArg);
const OUTPUT = resolve(outputArg);

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

const xmlText = readFileSync(SOURCE, 'utf8');
const dom = new JSDOM(xmlText, { contentType: 'text/xml' });
const doc = dom.window.document;

if (doc.getElementsByTagName('parsererror').length > 0) {
  console.error('Failed to parse source MusicXML');
  process.exit(1);
}

let removed = 0;
for (const measure of Array.from(doc.getElementsByTagName('measure'))) {
  for (const child of [...measure.children]) {
    if (!isElement(child) || child.localName !== 'note') {
      continue;
    }
    const voice = getDirectChildText(child, 'voice');
    if (voice === '4') {
      measure.removeChild(child);
      removed += 1;
    }
  }
}

writeFileSync(OUTPUT, `<?xml version="1.0" encoding="UTF-8"?>\n${doc.documentElement.outerHTML}\n`, 'utf8');
console.log(`Wrote ${OUTPUT} (removed ${removed} voice-4 notes)`);

#!/usr/bin/env node
/**
 * MusicXML の先頭に1小節のカウントイン小節を挿入する。
 * 既存小節を先に +1 してから、元 measure 1 の print / attributes / sound をカウントイン小節へ移す。
 *
 * Usage:
 *   node scripts/prepend-count-in-to-musicxml.mjs public/sozai/1-1.musicxml public/sozai/1-1_count-in.musicxml
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/prepend-count-in-to-musicxml.mjs <input.musicxml> <output.musicxml>');
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);

const COUNT_IN_DIRECTION = `      <direction placement="above">
        <direction-type>
          <words default-y="20" font-family="Arial" font-size="12">1  2  3  4</words>
        </direction-type>
      </direction>`;

const COUNT_IN_REST = `      <note>
        <rest measure="yes"/>
        <duration>8</duration>
        <voice>1</voice>
      </note>`;

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
    throw new Error(`Unclosed <${tagName}> in measure`);
  }
  const block = xml.slice(start, end + close.length);
  const remainder = xml.slice(0, start) + xml.slice(end + close.length);
  return { block, remainder };
}

function renumberMeasures(xml, maxMeasure) {
  let result = xml;
  for (let n = maxMeasure; n >= 1; n -= 1) {
    const re = new RegExp(`<measure number="${n}"`, 'g');
    result = result.replace(re, `<measure number="${n + 1}"`);
  }
  return result;
}

function countMeasures(xml) {
  const matches = xml.match(/<measure number="\d+"/g);
  return matches ? matches.length : 0;
}

function indentBlock(block) {
  return block
    .split('\n')
    .map((line) => (line.trim() ? `      ${line.trim()}` : ''))
    .filter(Boolean)
    .join('\n');
}

function buildCountInMeasure(printBlock, attributesBlock, soundBlock) {
  return [
    '    <measure number="1" width="200">',
    printBlock ? indentBlock(printBlock) : '',
    attributesBlock ? indentBlock(attributesBlock) : '',
    soundBlock ? indentBlock(soundBlock) : '',
    COUNT_IN_DIRECTION,
    COUNT_IN_REST,
    '    </measure>',
  ].filter(Boolean).join('\n');
}

function main() {
  let xml = readFileSync(inputPath, 'utf8');
  const measureCount = countMeasures(xml);
  if (measureCount === 0) {
    throw new Error('no measures found');
  }

  xml = renumberMeasures(xml, measureCount);

  const partMarker = '<part id="P1">';
  const partStart = xml.indexOf(partMarker);
  if (partStart === -1) {
    throw new Error('part P1 not found');
  }

  const secondMeasureStart = xml.indexOf('<measure number="2"', partStart);
  if (secondMeasureStart === -1) {
    throw new Error('measure 2 not found after renumber');
  }
  const secondMeasureEnd = xml.indexOf('</measure>', secondMeasureStart);
  if (secondMeasureEnd === -1) {
    throw new Error('measure 2 end not found');
  }

  const measureOpenEnd = xml.indexOf('>', secondMeasureStart) + 1;
  let measureBody = xml.slice(measureOpenEnd, secondMeasureEnd);

  const printResult = extractBlock(measureBody, 'print');
  const printBlock = printResult.block;
  measureBody = printResult.remainder;

  const attrResult = extractBlock(measureBody, 'attributes');
  const attributesBlock = attrResult.block;
  measureBody = attrResult.remainder;

  const soundResult = extractBlock(measureBody, 'sound');
  const soundBlock = soundResult.block;
  measureBody = soundResult.remainder;

  const widthMatch = xml.slice(secondMeasureStart, measureOpenEnd).match(/width="(\d+)"/);
  const bodyWidth = widthMatch ? widthMatch[1] : '250';
  const trimmedBody = measureBody.trim();

  const countInMeasure = buildCountInMeasure(printBlock, attributesBlock, soundBlock);
  const updatedSecondMeasure = `    <measure number="2" width="${bodyWidth}">\n${trimmedBody}\n    </measure>`;

  const before = xml.slice(0, secondMeasureStart);
  const after = xml.slice(secondMeasureEnd + '</measure>'.length);
  const merged = `${before}${countInMeasure}\n    <!--=======================================================-->\n${updatedSecondMeasure}${after}`;

  writeFileSync(outputPath, merged, 'utf8');
  console.log(`Wrote ${outputPath} (${measureCount + 1} measures)`);
}

main();

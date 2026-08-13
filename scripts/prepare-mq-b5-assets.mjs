/**
 * MQ Ch6 (b5) Fブルース: MusicXML 配置 + Voice4 cue / precision 生成 + Q9 ループ MP3。
 *
 * Usage:
 *   node scripts/prepare-mq-b5-assets.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = '/Users/apple/Downloads/Fブルース素材/sozai';
const SOZAI = join(ROOT, 'public', 'sozai');
const BUILD = join(ROOT, 'scripts', 'build-mq-b5-call-response-musicxml.mjs');
const GUIDE = join(ROOT, 'scripts', 'build-mq-b1-q1-guide-voice4-musicxml.mjs');
const STRIP = join(ROOT, 'scripts', 'strip-musicxml-voice4.mjs');

mkdirSync(SOZAI, { recursive: true });

/** @param {string[]} args */
const run = (args) => {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

/** F7 小節の 3 拍目に誤って入った Eb/A/D 半音符コード → 2 拍休符 */
const F7_BEAT3_HALF_CHORD_RE = /<note[^>]*>\s*<pitch>\s*<step>E<\/step>\s*<alter>-1<\/alter>\s*<octave>3<\/octave>\s*<\/pitch>\s*<duration>4<\/duration>\s*<voice>1<\/voice>\s*<type>half<\/type>[\s\S]*?<\/note>\s*<note[^>]*>\s*<chord\/>\s*<pitch>\s*<step>A<\/step>[\s\S]*?<duration>4<\/duration>[\s\S]*?<\/note>\s*<note[^>]*>\s*<chord\/>\s*<pitch>\s*<step>D<\/step>[\s\S]*?<duration>4<\/duration>[\s\S]*?<\/note>/;

/** @param {string} filePath */
const replaceF7Beat3HalfChordWithRest = (filePath) => {
  const xml = readFileSync(filePath, 'utf8');
  const match = xml.match(F7_BEAT3_HALF_CHORD_RE);
  if (!match) {
    return false;
  }
  const nl = match[0].includes('\r\n') ? '\r\n' : '\n';
  const rest = [
    '      <note>',
    '        <rest/>',
    '        <duration>4</duration>',
    '        <voice>1</voice>',
    '        <type>half</type>',
    '      </note>',
  ].join(nl);
  writeFileSync(filePath, xml.replace(F7_BEAT3_HALF_CHORD_RE, rest));
  return true;
};

/** クエスト9 フレーズ I: 末尾 F4 の全音下 Eb4 を追加（再生成で消えないようにする） */
const appendEbToQ9PhraseI = (filePath) => {
  const xml = readFileSync(filePath, 'utf8');
  const dom = new JSDOM(xml, { contentType: 'application/xml' });
  const doc = dom.window.document;
  const measure = doc.querySelector('part measure');
  if (!measure) {
    return false;
  }
  const notes = [...measure.querySelectorAll('note')];
  const pitched = notes.filter((note) => note.querySelector('pitch') && !note.querySelector('rest'));
  const lastPitch = pitched[pitched.length - 1];
  if (!lastPitch) {
    return false;
  }
  const lastStep = lastPitch.querySelector('step')?.textContent;
  const lastAlter = lastPitch.querySelector('alter')?.textContent ?? '';
  const lastOctave = lastPitch.querySelector('octave')?.textContent;
  if (lastStep === 'E' && lastAlter === '-1' && lastOctave === '4') {
    return false;
  }
  const trailingRest = [...notes].reverse().find((note) => note.querySelector('rest'));
  const restDuration = trailingRest?.querySelector('duration')?.textContent?.trim() || '12';
  const voice = trailingRest?.querySelector('voice')?.textContent?.trim() || '1';
  const eb = doc.createElement('note');
  const pitch = doc.createElement('pitch');
  const step = doc.createElement('step');
  step.textContent = 'E';
  const alter = doc.createElement('alter');
  alter.textContent = '-1';
  const octave = doc.createElement('octave');
  octave.textContent = '4';
  pitch.appendChild(step);
  pitch.appendChild(alter);
  pitch.appendChild(octave);
  const duration = doc.createElement('duration');
  duration.textContent = restDuration;
  const voiceEl = doc.createElement('voice');
  voiceEl.textContent = voice;
  const type = doc.createElement('type');
  type.textContent = 'quarter';
  eb.appendChild(pitch);
  eb.appendChild(duration);
  eb.appendChild(voiceEl);
  eb.appendChild(type);
  if (trailingRest) {
    measure.replaceChild(eb, trailingRest);
  } else {
    measure.appendChild(eb);
  }
  writeFileSync(filePath, new dom.window.XMLSerializer().serializeToString(doc));
  return true;
};

/** @param {string} srcName @param {string} base */
const copyXml = (srcName, base) => {
  copyFileSync(join(SRC, srcName), join(SOZAI, `${base}.musicxml`));
};

/** @param {string} base @param {readonly string[]} buildArgs */
const buildThenCue = (base, buildArgs = []) => {
  const raw = join(SOZAI, `${base}.musicxml`);
  const built = join(SOZAI, `${base}-built.musicxml`);
  if (buildArgs.length > 0) {
    run([BUILD, ...buildArgs, '--source', raw, '--output', built]);
    rmSync(raw);
    copyFileSync(built, raw);
    rmSync(built);
  }
  const cue = join(SOZAI, `${base}-guide-voice4-cue.musicxml`);
  const precision = join(SOZAI, `${base}-precision.musicxml`);
  run([GUIDE, '--cue', '--source', raw, '--output', cue]);
  run([STRIP, '--source', cue, '--output', precision]);
};

/** @param {string} base */
const precisionOnly = (base) => {
  const raw = join(SOZAI, `${base}.musicxml`);
  const precision = join(SOZAI, `${base}-precision.musicxml`);
  run([STRIP, '--source', raw, '--output', precision]);
};

// --- MusicXML 配置 ---

copyXml('6-1-2.musicxml.xml', 'mq-b5-6-1-2');
buildThenCue('mq-b5-6-1-2', ['--shift']);

copyXml('6-2-2.3.4.5.6.musicxml.xml', 'mq-b5-6-2-6');
precisionOnly('mq-b5-6-2-6');

copyXml('6-3-2.3.4.5.6.musicxml.xml', 'mq-b5-6-3-6');
precisionOnly('mq-b5-6-3-6');

copyXml('6-4-3.musicxml.xml', 'mq-b5-6-4-3');
replaceF7Beat3HalfChordWithRest(join(SOZAI, 'mq-b5-6-4-3.musicxml'));
precisionOnly('mq-b5-6-4-3');

copyXml('6-4-4.musicxml.xml', 'mq-b5-6-4-4');
precisionOnly('mq-b5-6-4-4');

copyXml('6-4-5.musicxml.xml', 'mq-b5-6-4-5');
precisionOnly('mq-b5-6-4-5');

copyXml('6-4-6.musicxml.xml', 'mq-b5-6-4-6');
run([BUILD, '--shift', '--part', '1', '--source', join(SOZAI, 'mq-b5-6-4-6.musicxml'), '--output', join(SOZAI, 'mq-b5-6-4-6.musicxml')]);
replaceF7Beat3HalfChordWithRest(join(SOZAI, 'mq-b5-6-4-6.musicxml'));
buildThenCue('mq-b5-6-4-6', []);

copyXml('6-5-2.musicxml.xml', 'mq-b5-6-5-2');
buildThenCue('mq-b5-6-5-2', ['--shift']);

copyXml('6-5-3.musicxml.xml', 'mq-b5-6-5-3');
buildThenCue('mq-b5-6-5-3', ['--shift']);

copyXml('6-5-4.musicxml.xml', 'mq-b5-6-5-4');
buildThenCue('mq-b5-6-5-4', ['--voice2-to-voice4']);

copyXml('6-6-1.musicxml.xml', 'mq-b5-6-6-1');
buildThenCue('mq-b5-6-6-1', ['--voice2-to-voice4']);

copyXml('6-6-2.musicxml.xml', 'mq-b5-6-6-2');
buildThenCue('mq-b5-6-6-2', ['--shift', '--fix-tempo', '80']);

copyXml('7-7-2.musicxml.xml', 'mq-b5-6-7-2');
buildThenCue('mq-b5-6-7-2', ['--shift']);

copyXml('7-8-2.musicxml.xml', 'mq-b5-6-8-2');
precisionOnly('mq-b5-6-8-2');

copyXml('7-8-3.musicxml.xml', 'mq-b5-6-8-3');
precisionOnly('mq-b5-6-8-3');

copyXml('7-8-4.musicxml.xml', 'mq-b5-6-8-4');
precisionOnly('mq-b5-6-8-4');

copyXml('7-10-2.musicxml.xml', 'mq-b5-6-10-2');
precisionOnly('mq-b5-6-10-2');

copyXml('クエスト9.musicxml.xml', 'mq-b5-6-9');
run([BUILD, '--fix-tempo', '80', '--source', join(SOZAI, 'mq-b5-6-9.musicxml'), '--output', join(SOZAI, 'mq-b5-6-9.musicxml')]);
appendEbToQ9PhraseI(join(SOZAI, 'mq-b5-6-9.musicxml'));
{
  const q9Raw = readFileSync(join(SOZAI, 'mq-b5-6-9.musicxml'), 'utf8');
  writeFileSync(join(SOZAI, 'mq-b5-6-9-osmd.musicxml'), q9Raw.replace('tempo="80"', 'tempo="100"'));
}

// --- クエスト9: 1小節×4連結ループ MP3 ---
const q9Src = join(SOZAI, 'mq-b5-6-9.mp3');
const measureSec = 3.0096;
for (let i = 1; i <= 5; i += 1) {
  const start = ((i - 1) * measureSec).toFixed(4);
  const clip = join(SOZAI, `mq-b5-6-9-m${i}-clip.mp3`);
  spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', q9Src, '-ss', start, '-t', String(measureSec), '-c', 'copy', clip], { stdio: 'inherit' });
  const loop = join(SOZAI, `mq-b5-6-9-${i}-loop.mp3`);
  const listFile = join(SOZAI, `mq-b5-6-9-${i}-concat.txt`);
  writeFileSync(listFile, [1, 2, 3, 4].map(() => `file '${clip}'`).join('\n'));
  spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', loop], { stdio: 'inherit' });
  rmSync(listFile);
  rmSync(clip);
}

// --- 検証 ---
const cueFiles = [
  'mq-b5-6-1-2', 'mq-b5-6-4-6', 'mq-b5-6-5-2', 'mq-b5-6-5-3', 'mq-b5-6-5-4',
  'mq-b5-6-6-1', 'mq-b5-6-6-2', 'mq-b5-6-7-2',
];
/** --shift したコール＆レスポンス。聞き小節の voice 1 休符が残っていること。 */
const shiftCallResponseBases = new Set([
  'mq-b5-6-1-2', 'mq-b5-6-4-6', 'mq-b5-6-5-2', 'mq-b5-6-5-3', 'mq-b5-6-6-2', 'mq-b5-6-7-2',
]);

/** @param {string} xml */
const countVoiceOneRestsAndEmptyMeasures = (xml) => {
  const doc = new JSDOM(xml, { contentType: 'text/xml' }).window.document;
  const part = doc.querySelector('part');
  let voiceOneRests = 0;
  let emptyMeasures = 0;
  if (!part) {
    return { voiceOneRests, emptyMeasures };
  }
  for (const measure of part.children) {
    if (measure.localName !== 'measure') {
      continue;
    }
    let noteCount = 0;
    for (const child of measure.children) {
      if (child.localName !== 'note') {
        continue;
      }
      noteCount += 1;
      const rest = [...child.children].some((el) => el.localName === 'rest');
      const voice = [...child.children].find((el) => el.localName === 'voice')?.textContent;
      if (rest && voice === '1') {
        voiceOneRests += 1;
      }
    }
    if (noteCount === 0) {
      emptyMeasures += 1;
    }
  }
  return { voiceOneRests, emptyMeasures };
};

for (const base of cueFiles) {
  const cue = readFileSync(join(SOZAI, `${base}-guide-voice4-cue.musicxml`), 'utf8');
  const prec = readFileSync(join(SOZAI, `${base}-precision.musicxml`), 'utf8');
  const cueHasV4 = /<voice>4<\/voice>/.test(cue) && /size="cue"/.test(cue);
  const precV4 = (prec.match(/<voice>4<\/voice>/g) ?? []).length;
  const cueRests = countVoiceOneRestsAndEmptyMeasures(cue);
  const precStats = countVoiceOneRestsAndEmptyMeasures(prec);
  console.log(
    `${base}: cue v4=${cueHasV4} v1rest=${cueRests.voiceOneRests} precision v4=${precV4} empty=${precStats.emptyMeasures}`,
  );
  if (!cueHasV4 || precV4 !== 0) {
    console.error(`Validation failed for ${base}`);
    process.exit(1);
  }
  if (shiftCallResponseBases.has(base) && (cueRests.voiceOneRests === 0 || precStats.emptyMeasures > 0)) {
    console.error(`Call-response rest validation failed for ${base}`);
    process.exit(1);
  }
}

console.log('Prepared Ch6 (b5) assets.');

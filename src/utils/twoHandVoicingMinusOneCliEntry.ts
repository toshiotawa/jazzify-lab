import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  float32ToInt16Pcm,
  loadOfflineSurvivalBassSf2FromFile,
  mixFloat32Buffers,
  normalizeFloat32Peak,
  OFFLINE_MIX_SAMPLE_RATE,
  renderOfflineSf2BassEvents,
  renderOfflineSimpleSynthEvents,
  scaleFloat32Buffer,
  limitFloat32Peak,
  writeWavFile,
  type MinusOneSynthVariant,
} from '@/utils/offlineSf2Mix';
import type { OfflineSf2Zone } from '@/utils/sf2RootNotePlayer';
import {
  buildMinusOneEventsForTarget,
  filterMinusOneTargets,
  listTwoHandVoicingMinusOneTargets,
  MINUS_ONE_BASS_LAYER_SCALE,
  MINUS_ONE_TOTAL_SEC,
  type MinusOneCourseKind,
  type TwoHandVoicingMinusOneTarget,
} from '@/utils/twoHandVoicingMinusOneSchedule';

const ROOT = process.env.THVI_REPO_ROOT ?? process.cwd();
const DEFAULT_DRUM = join(ROOT, 'public', 'sozai', 'Cblues_24bars_100BPM_Drum.mp3');
const DEFAULT_OUT_DIR = join(ROOT, 'public', 'sozai');
/** サバイバルモード正解ルート音（FantasySoundManager codeRunRootPlayer） */
const DEFAULT_BASS_SF2 = join(ROOT, 'public', 'FingerBassYR 20190930.sf2');

const SYNTH_VARIANTS: readonly MinusOneSynthVariant[] = ['triangle', 'sine'];

const argValue = (flag: string): string | null => {
  const index = process.argv.indexOf(flag);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return null;
};

const hasFlag = (flag: string): boolean => process.argv.includes(flag);

const run = (cmd: string, args: readonly string[]): void => {
  const result = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
};

const resolveSynthVariant = (): MinusOneSynthVariant => {
  const raw = argValue('--synth-variant');
  if (raw === 'sine') {
    return 'sine';
  }
  return 'triangle';
};

const resolveOutputName = (
  target: TwoHandVoicingMinusOneTarget,
  synthVariant: MinusOneSynthVariant,
): string => {
  const explicit = argValue('--out-name');
  if (explicit) {
    return explicit;
  }
  const base = target.outputFileName.replace(/\.mp3$/i, '');
  if (synthVariant === 'triangle') {
    return `${base}.mp3`;
  }
  return `${base}-${synthVariant}.mp3`;
};

const buildMinusOneMp3 = (params: {
  readonly target: TwoHandVoicingMinusOneTarget;
  readonly outDir: string;
  readonly drumPath: string;
  readonly synthVariant: MinusOneSynthVariant;
  readonly outName: string;
  readonly bassSf2Zones: readonly OfflineSf2Zone[];
}): string => {
  const { target, outDir, drumPath, synthVariant, outName, bassSf2Zones } = params;
  const outPath = join(outDir, outName);
  const events = buildMinusOneEventsForTarget(target);

  const workDir = join(outDir, '.minus-one-work');
  mkdirSync(workDir, { recursive: true });

  const voicingLayer = renderOfflineSimpleSynthEvents(events.voicingGuide, MINUS_ONE_TOTAL_SEC, synthVariant);
  normalizeFloat32Peak(voicingLayer, 0.94);
  const bassLayer = renderOfflineSf2BassEvents(bassSf2Zones, events.bass, MINUS_ONE_TOTAL_SEC);
  scaleFloat32Buffer(bassLayer, MINUS_ONE_BASS_LAYER_SCALE);
  const mixedPcm = mixFloat32Buffers([voicingLayer, bassLayer]);
  limitFloat32Peak(mixedPcm, 0.95);
  const mixedWavPath = join(workDir, `mixed-${target.outputFileName}-${synthVariant}.wav`);
  writeFileSync(mixedWavPath, writeWavFile(float32ToInt16Pcm(mixedPcm), OFFLINE_MIX_SAMPLE_RATE));

  run('ffmpeg', [
    '-y',
    '-i', drumPath,
    '-i', mixedWavPath,
    '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0[aout]',
    '-map', '[aout]',
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ]);

  return outPath;
};

const resolveCourseFilter = (): MinusOneCourseKind | null => {
  const raw = argValue('--course');
  if (!raw) {
    return null;
  }
  if (raw === 'intermediate' || raw === 'block3' || raw === 'advanced') {
    return raw;
  }
  throw new Error(`Unknown --course value: ${raw} (expected intermediate|block3|advanced)`);
};

const resolveTargets = (): readonly TwoHandVoicingMinusOneTarget[] => {
  const allTargets = listTwoHandVoicingMinusOneTargets();
  const courseFilter = resolveCourseFilter();

  if (hasFlag('--all')) {
    return filterMinusOneTargets(allTargets, courseFilter);
  }

  const lessonKey = argValue('--lesson') ?? 'b3-m7';
  const progressionKey = argValue('--progression');
  const phraseRaw = argValue('--phrase');
  const phraseIndex = phraseRaw == null ? null : Number.parseInt(phraseRaw, 10);

  const matched = allTargets.filter((target) => {
    if (target.lessonKey !== lessonKey) {
      return false;
    }
    if (progressionKey != null && target.progressionKey !== progressionKey) {
      return false;
    }
    if (phraseIndex != null && target.phraseIndex !== phraseIndex) {
      return false;
    }
    if (courseFilter && !filterMinusOneTargets([target], courseFilter).length) {
      return false;
    }
    return true;
  });

  if (matched.length === 0) {
    throw new Error(`No minus-one target matched lesson=${lessonKey} progression=${progressionKey ?? '*'} phrase=${phraseRaw ?? '*'}`);
  }

  return matched;
};

const main = (): void => {
  const outDir = resolve(argValue('--out-dir') ?? DEFAULT_OUT_DIR);
  const drumPath = resolve(argValue('--drum') ?? DEFAULT_DRUM);
  const targets = resolveTargets();

  mkdirSync(outDir, { recursive: true });

  const bassSf2Path = resolve(argValue('--bass-sf2') ?? DEFAULT_BASS_SF2);
  const bassSf2Zones = loadOfflineSurvivalBassSf2FromFile(readFileSync(bassSf2Path).buffer);
  if (bassSf2Zones.length === 0) {
    throw new Error(`No SF2 zones for survival code-run roots in ${bassSf2Path}`);
  }

  const variants = hasFlag('--also-sine')
    ? SYNTH_VARIANTS
    : [resolveSynthVariant()];

  const builtPaths: string[] = [];
  for (const target of targets) {
    for (const synthVariant of variants) {
      const outName = resolveOutputName(target, synthVariant);
      builtPaths.push(buildMinusOneMp3({
        target,
        outDir,
        drumPath,
        synthVariant,
        outName,
        bassSf2Zones,
      }));
    }
  }

  for (const outPath of builtPaths) {
    process.stdout.write(`Built minus-one: ${outPath}\n`);
  }
  process.stdout.write(`Built ${builtPaths.length} file(s) from ${targets.length} target(s).\n`);
};

main();

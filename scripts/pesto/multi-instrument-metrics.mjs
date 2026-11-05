// Offline evaluation only. No game tracker, expected-note assistance, or pitch correction.
export const rangeFor = (midi) => midi < 48 ? 'low(<48)' : midi < 72 ? 'mid(48-71)' : 'high(>=72)';
const ratio = (a, b) => b ? a / b : null;
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

export const scoreFrames = (frames) => {
  let voiced = 0, correct = 0, accepted = 0, acceptedCorrect = 0, octave = 0;
  let silent = 0, falseVoiced = 0;
  const errors = [], confidence = [];
  for (const frame of frames) {
    if (![frame.prediction, frame.confidence, frame.time].every(Number.isFinite)) throw Error('Nonfinite inference output');
    const valid = frame.prediction > 0;
    const confident = valid && frame.confidence >= 0.5;
    if (frame.referenceMidi === null) {
      silent += 1;
      if (confident) falseVoiced += 1;
      continue;
    }
    voiced += 1;
    const error = valid ? Math.abs(frame.prediction - frame.referenceMidi) * 100 : Infinity;
    if (Number.isFinite(error)) errors.push(error);
    confidence.push(frame.confidence);
    if (error <= 50) correct += 1;
    if (confident) accepted += 1;
    if (confident && error <= 50) acceptedCorrect += 1;
    const octaves = Math.round(error / 1200);
    if (octaves >= 1 && Math.abs(error - octaves * 1200) <= 50) octave += 1;
  }
  return { voicedFrames: voiced, rawCorrectFrames: correct, acceptedFrames: accepted,
    acceptedCorrectFrames: acceptedCorrect, octaveErrorFrames: octave, silentFrames: silent, falseVoicedFrames: falseVoiced,
    rawRpa50: ratio(correct, voiced), acceptedRecall50: ratio(acceptedCorrect, voiced),
    acceptedPrecision50: ratio(acceptedCorrect, accepted), coverageAtConfidence05: ratio(accepted, voiced),
    octaveErrorRate: ratio(octave, voiced), falseVoicedRate: ratio(falseVoiced, silent),
    medianAbsoluteCents: median(errors), medianConfidence: median(confidence) };
};

export const summarize = (rows) => {
  const output = {};
  for (const dimension of ['family', 'instrument', 'range', 'condition', 'velocity', 'phase']) {
    const groups = new Map();
    for (const row of rows) {
      const key = String(row[dimension]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row.metrics);
    }
    output[dimension] = {};
    for (const [key, metrics] of groups) {
      const sum = (field) => metrics.reduce((total, item) => total + item[field], 0);
      const eligible = metrics.filter((item) => item.rawRpa50 !== null);
      output[dimension][key] = { cases: metrics.length, voicedFrames: sum('voicedFrames'),
        rawRpa50: ratio(sum('rawCorrectFrames'), sum('voicedFrames')),
        macroCaseRpa50: eligible.length ? eligible.reduce((total, item) => total + item.rawRpa50, 0) / eligible.length : null,
        acceptedRecall50: ratio(sum('acceptedCorrectFrames'), sum('voicedFrames')),
        octaveErrorRate: ratio(sum('octaveErrorFrames'), sum('voicedFrames')),
        falseVoicedRate: ratio(sum('falseVoicedFrames'), sum('silentFrames')) };
    }
  }
  return output;
};

// This is a diagnostic regression gate, not evidence of statistical significance.
export const compareReports = (baseline, candidate, trainingGroups) => {
  if (!Array.isArray(trainingGroups) || trainingGroups.some((x) => typeof x !== 'string')) throw Error('Declare candidate training instrument/speaker groups');
  const protectedGroups = new Set(baseline.rows.map((row) => row.instrument));
  if (trainingGroups.some((group) => protectedGroups.has(group))) throw Error('Training/evaluation instrument leakage');
  const identity = (report) => report.rows.map((row) => `${row.id}|${row.pcmSha256}|${row.condition}|${row.phase}`).sort();
  if (JSON.stringify(baseline.protocol) !== JSON.stringify(candidate.protocol)
      || JSON.stringify(identity(baseline)) !== JSON.stringify(identity(candidate))) throw Error('Different evaluation inputs/protocol');
  const regressions = [];
  for (const dimension of Object.keys(baseline.summary)) {
    for (const [group, before] of Object.entries(baseline.summary[dimension])) {
      const after = candidate.summary[dimension]?.[group];
      if (!after) throw Error('Missing candidate coverage');
      for (const field of ['rawRpa50', 'acceptedRecall50', 'octaveErrorRate', 'falseVoicedRate']) {
        if (before[field] === null) continue;
        if (after[field] === null) throw Error('Missing candidate metric');
        const higherIsBetter = field === 'rawRpa50' || field === 'acceptedRecall50';
        const loss = higherIsBetter ? before[field] - after[field] : after[field] - before[field];
        if (loss > 0.01 + 1e-12) regressions.push({ dimension, group, field, before: before[field], after: after[field] });
      }
    }
  }
  const candidateRows = new Map(candidate.rows.map((row) => [`${row.id}|${row.condition}|${row.phase}`, row]));
  for (const before of baseline.rows) {
    const key = `${before.id}|${before.condition}|${before.phase}`;
    const after = candidateRows.get(key);
    if (before.metrics.voicedFrames !== after.metrics.voicedFrames || before.metrics.silentFrames !== after.metrics.silentFrames) throw Error('Different reference coverage');
    for (const field of ['rawRpa50', 'acceptedRecall50', 'octaveErrorRate', 'falseVoicedRate']) {
      if (before.metrics[field] === null) continue;
      if (after.metrics[field] === null) throw Error('Missing candidate metric');
      const higherIsBetter = field === 'rawRpa50' || field === 'acceptedRecall50';
      const loss = higherIsBetter ? before.metrics[field] - after.metrics[field] : after.metrics[field] - before.metrics[field];
      if (loss > 0.01 + 1e-12) regressions.push({ dimension: 'fixtureConditionPhase', group: key, field,
        before: before.metrics[field], after: after.metrics[field] });
    }
  }
  const unmeasuredFamilies = Object.entries(baseline.summary.family).filter(([, value]) => value.rawRpa50 === null).map(([name]) => name);
  return { status: regressions.length ? 'regression' : unmeasuredFamilies.length ? 'inconclusive-no-reference-coverage' : 'no-regression-in-this-subset',
    unmeasuredFamilies, tolerancePercentagePoints: 1,
    regressions, trainingGroups, limitation: 'Declared training groups only; small sample, not a promotion or generalization guarantee.' };
};

export const makeCondition = (pcm, condition) => {
  const duration = condition === 'short100ms' ? 0.1 : condition === 'short200ms' ? 0.2 : 0.6;
  const length = Math.round(duration * 48000);
  const clean = new Float32Array(length + 9600);
  clean.set(pcm.subarray(0, length));
  // Two-ms fade at the artificial cut; retain the original attack.
  for (let i = 0; i < 96; i += 1) clean[length - 96 + i] *= (95 - i) / 95;
  const audio = clean.slice();
  let state = 20261105;
  const noise = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 2 ** 32 * 2 - 1; };
  const rms = Math.sqrt(clean.subarray(0, length).reduce((sum, x) => sum + x * x, 0) / length);
  for (let i = 0; i < audio.length; i += 1) {
    if (condition === 'quiet-24dB') audio[i] *= 10 ** (-24 / 20);
    if (condition === 'noise20dB') audio[i] += noise() * rms * 0.1 * Math.sqrt(3);
    if (condition === 'twoTapEcho') audio[i] += 0.25 * (clean[i - 1680] ?? 0) + 0.1 * (clean[i - 3360] ?? 0);
  }
  return { audio, clean, duration };
};

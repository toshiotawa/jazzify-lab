import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareReports, makeCondition, rangeFor, scoreFrames, summarize } from './multi-instrument-metrics.mjs';
const frame = (prediction, confidence = 1, referenceMidi = 60) => ({ prediction, confidence, referenceMidi, time: 0.1 });
test('confidence filtering cannot hide wrong pitches or missing coverage', () => {
  const score = scoreFrames([frame(60), frame(72), frame(60, 0.1), frame(0, 0)]);
  assert.equal(score.rawRpa50, 0.5);
  assert.equal(score.acceptedRecall50, 0.25);
  assert.equal(score.acceptedPrecision50, 0.5);
  assert.equal(score.octaveErrorRate, 0.25);
});
test('octave error and silence are separate from chroma accuracy', () => {
  const score = scoreFrames([frame(48), frame(84), frame(60, 1, null), frame(60, 0.1, null)]);
  assert.equal(score.rawRpa50, 0);
  assert.equal(score.octaveErrorRate, 1);
  assert.equal(score.falseVoicedRate, 0.5);
  assert.equal(scoreFrames([]).rawRpa50, null);
  assert.throws(() => scoreFrames([frame(NaN)]), /Nonfinite/);
});
test('noise is deterministic and clean reference mask is independent of degradation', () => {
  const pcm = new Float32Array(38400).fill(0.1);
  assert.deepEqual(makeCondition(pcm, 'noise20dB'), makeCondition(pcm, 'noise20dB'));
  assert.deepEqual(makeCondition(pcm, 'quiet-24dB').clean, makeCondition(pcm, 'clean').clean);
  assert.equal(makeCondition(pcm, 'short100ms').duration, 0.1);
  assert.equal(rangeFor(47), 'low(<48)');
  assert.equal(rangeFor(48), 'mid(48-71)');
  assert.equal(rangeFor(72), 'high(>=72)');
});
const report = (predictions) => {
  const rows = predictions.map((prediction, i) => ({ id: String(i), pcmSha256: 'same', family: i ? 'guitar' : 'piano', instrument: 'heldout-' + i,
    range: 'mid', velocity: 100, condition: 'clean', phase: 'sustain', metrics: scoreFrames([frame(prediction)]) }));
  return { protocol: { sampleRate: 48000 }, rows, summary: summarize(rows) };
};
test('a better average does not hide a regression in another family', () => {
  const before = report([72, 60]), after = report([60, 72]);
  const result = compareReports(before, after, ['other-instrument']);
  assert.equal(result.status, 'regression');
  assert.ok(result.regressions.some((x) => x.dimension === 'family' && x.group === 'guitar'));
});
test('candidate gate rejects instrument leakage, missing cases and protocol changes', () => {
  const a = report([60, 60]);
  assert.throws(() => compareReports(a, a, ['heldout-0']), /leakage/);
  assert.throws(() => compareReports(a, a, undefined), /Declare/);
  assert.throws(() => compareReports(a, report([60]), []), /Different/);
  assert.throws(() => compareReports(a, { ...a, protocol: {} }, []), /Different/);
  assert.equal(compareReports(a, a, []).status, 'no-regression-in-this-subset');
});
test('one-note regression is visible even inside otherwise unchanged aggregates', () => {
  const a = report([60, 72]), b = report([72, 60]);
  for (const row of [...a.rows, ...b.rows]) row.family = 'same-family';
  a.summary = summarize(a.rows); b.summary = summarize(b.rows);
  assert.ok(compareReports(a, b, []).regressions.some((x) => x.dimension === 'fixtureConditionPhase'));
});
test('a family without reference coverage cannot certify non-regression', () => {
  const a = report([60]);
  a.rows[0].metrics = scoreFrames([]); a.summary = summarize(a.rows);
  assert.equal(compareReports(a, a, []).status, 'inconclusive-no-reference-coverage');
});

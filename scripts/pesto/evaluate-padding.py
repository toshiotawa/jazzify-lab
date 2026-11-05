#!/usr/bin/env python3
"""Controlled refill/zeros comparison on identical PCM; offline research only."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import subprocess
import sys
import tempfile

import numpy as np
import onnxruntime as ort
import torch

from pitch_reference import AGREEMENT_CENTS, reference_track, spectral_pitch, midi

ROOT = Path(__file__).resolve().parents[2]
UPSTREAM = '62bc0c9702558f19af4593752947fb9db1eadac9'
CHECKPOINT = '16c32e06ddd950e3e4866dfa3c7f8a87c4988f8adf43e57977b189f031f26f3e'
SHIPPED = '9af2ab245abb45edc7df87865f37e7404f99978666f5caade21b4ca9506a0b23'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def score(predictions, confidence, reference):
    predictions, confidence, reference = (np.asarray(values, dtype=np.float64) for values in [predictions, confidence, reference])
    if not np.isfinite(predictions).all() or not np.isfinite(confidence).all():
        raise ValueError('Nonfinite model output')
    eligible = np.isfinite(reference)
    errors = (predictions[eligible] - reference[eligible]) * 100
    correct = (predictions[eligible] > 0) & (np.abs(errors) <= 50)
    accepted = (predictions[eligible] > 0) & (confidence[eligible] >= 0.5)
    octave = (np.abs(errors) >= 1150) & (np.abs(np.abs(errors) - np.round(np.abs(errors) / 1200) * 1200) <= 50)
    return {'frames': int(eligible.sum()), 'correct': int(correct.sum()), 'acceptedCorrect': int((correct & accepted).sum()),
            'accepted': int(accepted.sum()), 'octaveErrors': int(octave.sum()),
            'medianSignedCents': float(np.median(errors)) if len(errors) else None,
            'medianPrediction': float(np.median(predictions[eligible])) if len(errors) else None}


def stable_correct_ms(prediction, confidence, reference, onset, accepted):
    if onset is None:
        return None
    run = 0
    for frame, (pitch, certainty, target) in enumerate(zip(prediction, confidence, reference)):
        correct = np.isfinite(target) and pitch > 0 and abs(pitch - target) <= 0.5
        run = run + 1 if correct and (not accepted or certainty >= 0.5) else 0
        if run == 4:
            return (frame + 1) * 5 - onset
    return None


def reference_opportunity(reference):
    run = 0
    for target in reference:
        run = run + 1 if np.isfinite(target) else 0
        if run == 4:
            return True
    return False


def compare_rows(rows, baseline='refill', candidate='zeros'):
    """Keep per-recording regressions visible, even when the family average improves."""
    by_key = {(row['id'], row['condition'], row['reference'], row['phase'], row['model']): row for row in rows}
    regressions, unresolved = [], []
    for row in rows:
        if row['model'] != baseline:
            continue
        key = (row['id'], row['condition'], row['reference'], row['phase'])
        before = row['metrics']
        after = by_key[(*key, candidate)]['metrics']
        if before['frames'] != after['frames']:
            raise ValueError('Candidate changed evaluation coverage')
        if not before['frames']:
            unresolved.append('|'.join(key))
            continue
        for field in ['correct', 'acceptedCorrect', 'octaveErrors', 'falseVoiced']:
            if field not in before:
                continue
            sign = 1 if field in ['correct', 'acceptedCorrect'] else -1
            loss = sign * (before[field] - after[field]) / before['frames']
            if loss > 0.01 + 1e-12:
                regressions.append({'id': row['id'], 'family': row['family'], 'condition': row['condition'],
                                    'reference': row['reference'], 'phase': row['phase'], 'metric': field,
                                    'before': before[field] / before['frames'], 'after': after[field] / after['frames']})
    return {'status': 'do-not-promote' if regressions or unresolved else 'no-observed-regression-only',
            'regressions': regressions, 'unmeasuredCasePhases': unresolved, 'tolerancePercentagePoints': 1,
            'limitation': 'Diagnostic paired comparison; no automatic production promotion or statistical-significance claim.'}


def compact_references(records):
    """Retain reference diagnostics and a frame-trace checksum without committing huge traces."""
    for record in records:
        reference = record.pop('reference')
        record['referenceTraceSha256'] = digest(json.dumps(reference, separators=(',', ':'), allow_nan=False).encode())
        record['referenceSummary'] = {}
        for phase, frames in [('attack', reference[:20]), ('sustain', reference[20:120])]:
            result = {'windowFrames': len(frames), 'consensusFrames': sum(frame['midi'] is not None for frame in frames)}
            for field in ['midi', 'periodicityMidi', 'spectralMidi']:
                values = [frame[field] for frame in frames if frame[field] is not None]
                result[field + 'Median'] = float(np.median(values)) if values else None
            record['referenceSummary'][phase] = result
    return records


def run(args, work):
    upstream = args.upstream.resolve()
    commit = subprocess.check_output(['git', '-C', str(upstream), 'rev-parse', 'HEAD'], text=True).strip()
    if commit != UPSTREAM:
        raise ValueError('Unexpected upstream source')
    subprocess.run(['git', '-C', str(upstream), 'diff', '--exit-code', 'HEAD', '--', 'pesto', 'realtime'], check=True)
    if digest((upstream / 'pesto/weights/mir-1k_g7.ckpt').read_bytes()) != CHECKPOINT:
        raise ValueError('Unexpected weights')
    shipped = ROOT / 'public/models/pesto/pesto-mir1k-g7-48000-240-refill.onnx'
    if digest(shipped.read_bytes()) != SHIPPED:
        raise ValueError('Different deployed reference model')
    sys.path.insert(0, str(upstream))
    from pesto import load_model
    from pesto.utils.cached_conv import RefillPad1d
    from realtime.onnx_wrapper import StatelessPESTO
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
    model = load_model('mir-1k_g7', step_size=5, sampling_rate=48000, streaming=True, max_batch_size=1, mirror=1.).eval()
    refill_model = load_model('mir-1k_g7', step_size=5, sampling_rate=48000, streaming=True, max_batch_size=1, mirror=1.).eval()
    for kernel in refill_model.preprocessor.hcqt_kernels.cqt_kernels:
        kernel.conv.mirror = RefillPad1d((0, kernel.conv.mirror.padding[1]))
    if any(not torch.equal(value, refill_model.state_dict()[key]) for key, value in model.state_dict().items()):
        raise ValueError('Padding ablation changed weights')
    wrapper = StatelessPESTO(model).eval()
    zero_path = work / 'zeros.onnx'
    with torch.no_grad():
        torch.onnx.export(wrapper, (torch.zeros(1, 240), wrapper.init_cache()), str(zero_path), opset_version=17,
                          input_names=['audio', 'cache'], output_names=['prediction', 'confidence', 'volume', 'activations', 'cache_out'],
                          dynamic_axes={'audio': {0: 'batch_size', 1: 'audio_length'},
                                        **{name: {0: 'batch_size', 1: 'time_steps'} for name in ['prediction', 'confidence', 'volume', 'activations']}})
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    sessions = {name: ort.InferenceSession(str(path), sess_options=options, providers=['CPUExecutionProvider'])
                for name, path in [('refill', shipped), ('zeros', zero_path)]}
    manifest = json.loads(args.manifest.read_text())
    if manifest.get('sampleRate') != 48000 or not manifest.get('cases'):
        raise ValueError('Invalid manifest')
    if len({case['id'] for case in manifest['cases']}) != len(manifest['cases']):
        raise ValueError('Duplicate case IDs')
    if manifest.get('partition', '').startswith('new-source-group'):
        old = json.loads((ROOT / 'scripts/pesto/multi-instrument-sources.json').read_text())
        protected = {case['instrument'] for case in old['cases']} | {'fuchsmoehr-felt-lite'}
        if protected & {case['instrument'] for case in manifest['cases']}:
            raise ValueError('Previously inspected instrument in new-source partition')
    prepared = {}
    for condition in ['clean', 'short100ms', 'short200ms']:
        directory = work / condition
        subprocess.run(['node', str(ROOT / 'scripts/pesto/prepare-parity-inputs.mjs'), str(args.manifest.resolve()), str(directory), condition], check=True)
        prepared[condition] = {item['id']: item for item in json.loads((directory / 'manifest.json').read_text())['cases']}
    records, rows, timing = [], [], []
    parity = {name: {'frames': 0, 'maxPitchCents': 0., 'maxConfidenceAbs': 0., 'maxCacheAbs': 0.,
                     'overOneCentFrames': 0, 'voicedOverOneCentFrames': 0, 'audibleOverOneCentFrames': 0, 'examples': []}
              for name in sessions}
    with torch.no_grad():
        for case in manifest['cases']:
            data = (args.manifest.parent / case['file']).read_bytes()
            if digest(data) != case['pcmSha256']:
                raise ValueError('Raw PCM checksum mismatch')
            pcm = np.frombuffer(data, dtype='<f4').copy()
            reference = reference_track(pcm)
            energy = np.mean(pcm[:28800].astype(np.float64).reshape(-1, 240) ** 2, axis=1)
            audible = energy > 1e-6
            onsets = np.flatnonzero(audible[:-1] & audible[1:])
            onset = int(onsets[0] * 5) if len(onsets) else None
            _, peaks = spectral_pitch(pcm[4800:4800 + 8192])
            records.append({**case, 'onsetProxyMs': onset, 'reference': reference,
                            'sustainSpectralPeaks': [{'hz': frequency, 'midi': midi(frequency), 'relativeAmplitude': amplitude} for frequency, amplitude in peaks]})
            for condition, cases in prepared.items():
                item = cases[case['id']]
                data = (work / condition / item['file']).read_bytes()
                if digest(data) != item['pcmSha256'] or item['sourcePcmSha256'] != case['pcmSha256']:
                    raise ValueError('Condition PCM mismatch')
                audio = np.frombuffer(data, dtype='<f4').copy()
                end = round(item['noteEnd'] * 200)
                caches = {name: np.zeros((1, 3976), dtype=np.float32) for name in sessions}
                for source_model in [model, refill_model]:
                    for kernel in source_model.preprocessor.hcqt_kernels.cqt_kernels:
                        kernel.conv.cache.pad.zero_()
                outputs = {name: ([], []) for name in [*sessions, 'zeros_python', 'refill_python']}
                for offset in range(0, len(audio), 240):
                    chunk = audio[offset:offset + 240].reshape(1, 240)
                    source = {'zeros': model(torch.from_numpy(chunk)), 'refill': refill_model(torch.from_numpy(chunk))}
                    for name, pt in source.items():
                        if not all(torch.isfinite(value).all() for value in pt):
                            raise ValueError('Nonfinite source Python output')
                        outputs[name + '_python'][0].append(float(pt[0].item()))
                        outputs[name + '_python'][1].append(float(pt[1].item()))
                    for name, session in sessions.items():
                        result = session.run(['prediction', 'confidence', 'cache_out', 'activations'], {'audio': chunk, 'cache': caches[name]})
                        if not all(np.isfinite(value).all() for value in result):
                            raise ValueError('Nonfinite ONNX output')
                        caches[name] = result[2]
                        pitch, confidence = float(result[0].item()), float(result[1].item())
                        outputs[name][0].append(pitch)
                        outputs[name][1].append(confidence)
                        pt = source[name]
                        difference = abs(pitch - pt[0].item()) * 100
                        record = parity[name]
                        record['frames'] += 1
                        record['maxPitchCents'] = max(record['maxPitchCents'], difference)
                        record['maxConfidenceAbs'] = max(record['maxConfidenceAbs'], abs(confidence - pt[1].item()))
                        record['overOneCentFrames'] += int(difference > 1)
                        record['voicedOverOneCentFrames'] += int(difference > 1 and pt[1].item() >= 0.5)
                        record['audibleOverOneCentFrames'] += int(difference > 1 and np.mean(chunk.astype(np.float64) ** 2) > 1e-6)
                        source_model = model if name == 'zeros' else refill_model
                        expected_cache = source_model.preprocessor.hcqt_kernels.cqt_kernels[0].conv.cache.pad.numpy().reshape(1, -1)
                        record['maxCacheAbs'] = max(record['maxCacheAbs'], float(np.max(np.abs(result[2] - expected_cache))))
                        if difference > 1 and len(record['examples']) < 16:
                            before, after = pt[3].numpy().reshape(-1), result[3].reshape(-1)
                            record['examples'].append({'id': case['id'], 'condition': condition, 'atMs': offset / 48 + 5,
                                                       'sourcePitch': pt[0].item(), 'onnxPitch': pitch, 'sourceConfidence': pt[1].item(),
                                                       'activationMaxAbs': float(np.max(np.abs(before - after))),
                                                       'sourcePeaks': [(int(index), float(before[index])) for index in np.argsort(before)[-2:]],
                                                       'onnxPeaks': [(int(index), float(after[index])) for index in np.argsort(after)[-2:]]})
                nominal = np.where(audible[:end], float(case['midi']), np.nan)
                acoustic = np.array([value['midi'] if value['midi'] is not None and audible[index] else np.nan for index, value in enumerate(reference[:end])])
                for name, (prediction, confidence) in outputs.items():
                    for reference_name, targets in [('nominal', nominal), ('acoustic-consensus', acoustic)]:
                        for phase, selection in [('attack', slice(0, min(20, end))), ('sustain', slice(20, end))]:
                            if phase == 'sustain' and end <= 20:
                                continue
                            rows.append({'id': case['id'], 'family': case['family'], 'instrument': case['instrument'], 'midi': case['midi'], 'velocity': case['velocity'],
                                         'model': name, 'condition': condition, 'pcmSha256': item['pcmSha256'], 'reference': reference_name, 'phase': phase,
                                         'metrics': score(prediction[selection], confidence[selection], targets[selection])})
                        timing.append({'id': case['id'], 'family': case['family'], 'model': name, 'condition': condition, 'reference': reference_name,
                                       'eligible': bool(onset is not None and reference_opportunity(targets)),
                                       'rawStable20msAtMs': stable_correct_ms(prediction[:end], confidence[:end], targets, onset, False),
                                       'acceptedStable20msAtMs': stable_correct_ms(prediction[:end], confidence[:end], targets, onset, True)})
                    rows.append({'id': case['id'], 'family': case['family'], 'instrument': case['instrument'], 'midi': case['midi'], 'velocity': case['velocity'],
                                 'model': name, 'condition': condition, 'pcmSha256': item['pcmSha256'], 'reference': 'artificial-zero-tail', 'phase': 'silence',
                                 'metrics': {'frames': 10, 'falseVoiced': sum(pitch > 0 and certainty >= 0.5 for pitch, certainty in zip(prediction[-10:], confidence[-10:]))}})
            print('Compared ' + case['id'], flush=True)
    export_passed = all(value['maxPitchCents'] <= 1 and value['maxConfidenceAbs'] < 1e-3 and value['maxCacheAbs'] == 0 for value in parity.values())
    if args.reference_traces:
        args.reference_traces.write_text(json.dumps(records, separators=(',', ':'), allow_nan=False) + '\n')
    records = compact_references(records)
    report = {'version': 1, 'partition': manifest.get('partition', 'previously-inspected-development'),
              'manifestSha256': digest(args.manifest.read_bytes()), 'upstreamCommit': commit, 'checkpointSha256': CHECKPOINT,
              'modelSha256': {'refill': SHIPPED, 'zeros': digest(zero_path.read_bytes())}, 'onnxSourceParity': parity, 'exportPassed': export_passed,
              'packages': {name: importlib.metadata.version(name) for name in ['numpy', 'scipy', 'torch', 'onnxruntime']},
              'protocol': {'sampleRate': 48000, 'chunk': 240, 'cache': 3976, 'conditions': list(prepared), 'confidenceThreshold': 0.5,
                           'referenceAgreementCents': AGREEMENT_CENTS, 'referenceWindow': '8192 samples centered on original chunk end, before artificial cut; offline reference only',
                           'onsetProxy': 'start of first two consecutive original 5ms chunks with RMS > -60dBFS; not annotated physical onset',
                           'stableCorrect': 'notification time of fourth consecutive correct 5ms frame; all four require consensus where used; before cut only',
                           'limitations': ['Independent acoustic estimates are not human-verified F0.', 'Null acoustic reference excluded identically for both models; coverage retained.',
                                           'Future context is used only to estimate the reference, not for either inference.', 'No real microphone, continuous singing, polyphony, or retraining.',
                                           'Short notes and zero tail are artificial cuts, not actual staccato or measured silence.']},
              'records': records, 'rows': rows, 'timing': timing, 'onnxComparison': compare_rows(rows),
              'pythonPaddingAblation': compare_rows(rows, 'refill_python', 'zeros_python'), 'productionChanged': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    if not export_passed:
        raise SystemExit('ONNX differs from source Python; candidate is not eligible for adoption')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--upstream', required=True, type=Path)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--reference-traces', type=Path, help='Optional full 5ms acoustic estimates; not audio or PESTO outputs')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='pesto-padding-') as directory:
        run(args, Path(directory))


if __name__ == '__main__':
    main()

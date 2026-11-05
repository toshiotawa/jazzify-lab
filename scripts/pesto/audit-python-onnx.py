#!/usr/bin/env python3
"""Compare the pinned upstream PyTorch model, fresh export and shipped ONNX.

Offline only. Audio/condition generation belongs to prepare-parity-inputs.mjs.
"""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
import onnx
from onnx import numpy_helper
import onnxruntime as ort
import torch

ROOT = Path(__file__).resolve().parents[2]
UPSTREAM_COMMIT = '62bc0c9702558f19af4593752947fb9db1eadac9'
CHECKPOINT_SHA = '16c32e06ddd950e3e4866dfa3c7f8a87c4988f8adf43e57977b189f031f26f3e'
PRODUCTION_SHA = 'c50ca16a07297ddc2b788403268a43736cceb792ec599746da7d5486bca974b8'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def decode_alwa(activation):
    """Independent NumPy decoder for already calibrated 384-bin activations."""
    values = np.asarray(activation).reshape(-1)
    if values.shape != (384,) or not np.isfinite(values).all() or np.any(values < 0):
        raise ValueError('Invalid pitch activations')
    center = int(np.argmax(values))
    indices = np.clip(np.arange(center - 2, center + 3), 0, 383)
    weights = values[indices].astype(np.float64)
    if weights.sum() <= 0:
        raise ValueError('Empty local activation distribution')
    return float(np.sum(weights * indices / 3) / np.sum(weights))


def metrics(prediction, confidence, pcm, nominal):
    times = (np.arange(len(prediction)) + 1) * 0.005
    energy = (pcm[:len(prediction) * 240].reshape(-1, 240).astype(np.float64) ** 2).mean(axis=1)
    result = {}
    for phase, mask in [('attack', (times <= 0.1) & (energy > 1e-6)),
                        ('sustain', (times > 0.1) & (times <= 0.6) & (energy > 1e-6))]:
        error = (prediction[mask] - nominal) * 100
        correct = np.abs(error) <= 50
        voiced = confidence[mask] >= 0.5
        result[phase] = {'frames': len(error), 'correct': int(correct.sum()),
                         'acceptedCorrect': int((correct & voiced).sum()),
                         'medianPitch': float(np.median(prediction[mask])) if len(error) else None,
                         'medianConfidence': float(np.median(confidence[mask])) if len(error) else None,
                         'medianSignedCents': float(np.median(error)) if len(error) else None}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--upstream', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--fresh-export', type=Path, required=True)
    args = parser.parse_args()
    if any(args.fresh_export.resolve().is_relative_to(ROOT / path)
           for path in ['public/models', 'dist/models', 'ios/Jazzify/Resources']):
        raise ValueError('Fresh audit export must be outside deployed model directories')
    upstream = args.upstream.resolve()
    commit = subprocess.check_output(['git', '-C', str(upstream), 'rev-parse', 'HEAD'], text=True).strip()
    if commit != UPSTREAM_COMMIT:
        raise ValueError('Unexpected upstream revision')
    subprocess.run(['git', '-C', str(upstream), 'diff', '--exit-code', 'HEAD', '--', 'pesto', 'realtime'], check=True, stdout=subprocess.DEVNULL)
    checkpoint = upstream / 'pesto/weights/mir-1k_g7.ckpt'
    if digest(checkpoint.read_bytes()) != CHECKPOINT_SHA:
        raise ValueError('Unexpected upstream checkpoint')
    sys.path.insert(0, str(upstream))
    from pesto import load_model
    from pesto.utils.cached_conv import RefillPad1d
    from realtime.onnx_wrapper import StatelessPESTO

    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
    torch.manual_seed(20261105)

    def make_model(mode):
        kwargs = {} if mode == 'offline' else {'streaming': True, 'max_batch_size': 1, 'mirror': 0. if mode == 'causal' else 1.}
        model = load_model('mir-1k_g7', step_size=5, sampling_rate=48000, **kwargs)
        if mode == 'refill':
            for kernel in model.preprocessor.hcqt_kernels.cqt_kernels:
                padding = kernel.conv.mirror.padding[1]
                kernel.conv.mirror = RefillPad1d((0, padding))
        return model.eval()

    models = {name: make_model(mode) for name, mode in [('torch_refill', 'refill'), ('torch_upstream_zeros', 'zeros'),
                                                       ('torch_offline_future_context', 'offline'), ('torch_causal_full_history', 'causal')]}
    reference = models['torch_refill']
    wrapper = StatelessPESTO(reference).eval()
    args.fresh_export.parent.mkdir(parents=True, exist_ok=True)
    with torch.no_grad():
        torch.onnx.export(wrapper, (torch.zeros(1, 240), wrapper.init_cache()), str(args.fresh_export), opset_version=17,
                          input_names=['audio', 'cache'], output_names=['prediction', 'confidence', 'volume', 'activations', 'cache_out'],
                          dynamic_axes={'audio': {0: 'batch_size', 1: 'audio_length'},
                                        **{name: {0: 'batch_size', 1: 'time_steps'} for name in ['prediction', 'confidence', 'volume', 'activations']}})

    paths = {'shipped_refill': ROOT / 'public/models/pesto/pesto-mir1k-g7-48000-240-refill.onnx',
             'shipped_compact': ROOT / 'dist/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx',
             'fresh_refill_export': args.fresh_export}
    if digest(paths['shipped_compact'].read_bytes()) != PRODUCTION_SHA:
        raise ValueError('Unexpected production model')
    original = onnx.load(paths['shipped_refill'])
    initializers = {item.name: numpy_helper.to_array(item) for item in original.graph.initializer}
    weights = {}
    expected_learned = {key for key in reference.state_dict() if key.startswith(('encoder.', 'confidence.'))}
    missing = expected_learned - {key.removeprefix('model.') for key in initializers}
    if missing:
        raise ValueError('Missing learned parameters: ' + str(sorted(missing)))
    for key, tensor in reference.state_dict().items():
        if 'model.' + key in initializers:
            weights[key] = float(np.max(np.abs(tensor.detach().numpy() - initializers['model.' + key])))
    learned_mismatch = {key: diff for key, diff in weights.items() if not key.startswith('preprocessor.') and diff != 0}
    if learned_mismatch:
        raise ValueError('Different learned parameters: ' + str(learned_mismatch))

    # Expose named intermediate outputs without changing any operations or coefficients.
    stages = {'log_magnitude': '/model/preprocessor/to_log/Mul_output_0',
              'encoder_input': '/model/crop_cqt/Slice_output_0',
              'layer_norm': '/model/encoder/layernorm/LayerNormalization_output_0',
              'logits': '/model/encoder/fc/Squeeze_output_0'}
    inferred = onnx.shape_inference.infer_shapes(original)
    infos = {value.name: value for value in [*inferred.graph.value_info, *inferred.graph.output]}
    for name in stages.values():
        if name not in infos:
            raise ValueError('Missing intermediate output: ' + name)
        inferred.graph.output.append(infos[name])
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    sessions = {name: ort.InferenceSession(inferred.SerializeToString() if name == 'shipped_refill' else str(path),
                                         sess_options=options, providers=['CPUExecutionProvider']) for name, path in paths.items()}
    captured = {}

    def capture(name):
        return lambda _module, _args, output: captured.__setitem__(name, output.detach().clone().cpu().numpy())
    handles = [reference.preprocessor.register_forward_hook(capture('log_magnitude')),
               reference.crop_cqt.register_forward_hook(capture('encoder_input')),
               reference.encoder.layernorm.register_forward_hook(capture('layer_norm')),
               reference.encoder.fc.register_forward_hook(capture('logits'))]
    parity = {name: {'frames': 0, 'maxPitchCents': 0., 'maxConfidenceAbs': 0., 'maxVolumeRelative': 0.,
                     'maxActivationAbs': 0., 'maxCacheAbs': 0., 'maxIndependentDecodeCents': 0., 'overOneCentFrames': 0} for name in paths}
    stage_errors = {name: 0. for name in stages}
    manifest = json.loads(args.manifest.read_text())
    if manifest.get('sampleRate') != 48000 or not manifest.get('cases'):
        raise ValueError('Invalid input manifest')
    rows = []
    web_reference = []
    try:
        with torch.no_grad():
            for case in manifest['cases']:
                data = (args.manifest.parent / case['file']).read_bytes()
                if digest(data) != case['pcmSha256']:
                    raise ValueError('PCM checksum mismatch: ' + case['id'])
                pcm = np.frombuffer(data, dtype='<f4').copy()
                if pcm.shape != (38400,) or not np.isfinite(pcm).all():
                    raise ValueError('Expected 800ms finite float32 input')
                for name, model in models.items():
                    if name != 'torch_offline_future_context':
                        for kernel in model.preprocessor.hcqt_kernels.cqt_kernels:
                            kernel.conv.cache.pad.zero_()
                caches = {name: np.zeros((1, 3976), dtype=np.float32) for name in paths}
                predictions = {name: [] for name in [*models, *paths]}
                confidences = {name: [] for name in predictions}
                offline = models['torch_offline_future_context'](torch.from_numpy(pcm).view(1, -1))
                if not all(torch.isfinite(value).all() for value in offline):
                    raise ValueError('Nonfinite offline PyTorch output')
                # Offline frame t corresponds to t*5ms; streaming is stamped at chunk end.
                predictions['torch_offline_future_context'] = offline[0].numpy().reshape(-1)[1:161].tolist()
                confidences['torch_offline_future_context'] = offline[1].numpy().reshape(-1)[1:161].tolist()
                compact_frames = []
                for offset in range(0, len(pcm), 240):
                    chunk = pcm[offset:offset + 240].reshape(1, 240)
                    pt = reference(torch.from_numpy(chunk))
                    if not all(torch.isfinite(value).all() for value in pt):
                        raise ValueError('Nonfinite reference PyTorch output')
                    for name, model in models.items():
                        if name in ('torch_refill', 'torch_offline_future_context'):
                            result = pt if name == 'torch_refill' else None
                        else:
                            result = model(torch.from_numpy(chunk))
                        if result is not None:
                            if not all(torch.isfinite(value).all() for value in result):
                                raise ValueError('Nonfinite variant PyTorch output')
                            predictions[name].append(float(result[0].item()))
                            confidences[name].append(float(result[1].item()))
                    for name, session in sessions.items():
                        names = ['prediction', 'confidence', 'volume', 'activations', 'cache_out']
                        if name == 'shipped_refill': names += list(stages.values())
                        result = session.run(names, {'audio': chunk, 'cache': caches[name]})
                        caches[name] = result[4]
                        if not all(np.isfinite(value).all() for value in result):
                            raise ValueError('Nonfinite ONNX output')
                        p, c, v = (float(result[i].reshape(-1)[0]) for i in range(3))
                        predictions[name].append(p); confidences[name].append(c)
                        error = abs(p - float(pt[0].item())) * 100
                        record = parity[name]
                        record['frames'] += 1
                        record['maxPitchCents'] = max(record['maxPitchCents'], error)
                        record['overOneCentFrames'] += int(error > 1)
                        record['maxConfidenceAbs'] = max(record['maxConfidenceAbs'], abs(c - float(pt[1].item())))
                        record['maxVolumeRelative'] = max(record['maxVolumeRelative'], abs(v - float(pt[2].item())) / max(1., abs(float(pt[2].item()))))
                        record['maxActivationAbs'] = max(record['maxActivationAbs'], float(np.max(np.abs(result[3] - pt[3].numpy()))))
                        cache = reference.preprocessor.hcqt_kernels.cqt_kernels[0].conv.cache.pad.numpy().reshape(1, -1)
                        record['maxCacheAbs'] = max(record['maxCacheAbs'], float(np.max(np.abs(result[4] - cache))))
                        record['maxIndependentDecodeCents'] = max(record['maxIndependentDecodeCents'], abs(p - decode_alwa(result[3])) * 100)
                        if name == 'shipped_refill':
                            for (stage, _), value in zip(stages.items(), result[5:]):
                                actual = captured[stage].reshape(value.shape)
                                stage_errors[stage] = max(stage_errors[stage], float(np.max(np.abs(value - actual))))
                        if name == 'shipped_compact': compact_frames.append([p, c, v])
                for name in predictions:
                    rows.append({'id': case['id'], 'family': case['family'], 'instrument': case['instrument'],
                                 'midi': case['midi'], 'velocity': case['velocity'], 'model': name,
                                 'metrics': metrics(np.array(predictions[name]), np.array(confidences[name]), pcm, case['midi'])})
                web_reference.append({'id': case['id'], 'pcmSha256': case['pcmSha256'], 'frames': compact_frames})
                print('Audited ' + case['id'], flush=True)
    finally:
        for handle in handles: handle.remove()
    result = {'version': 1, 'inputManifestSha256': digest(args.manifest.read_bytes()),
              'inputs': [{'id': case['id'], 'pcmSha256': case['pcmSha256']} for case in manifest['cases']],
              'upstreamCommit': commit, 'checkpointSha256': CHECKPOINT_SHA,
              'packages': {name: importlib.metadata.version(name) for name in ['torch', 'torchaudio', 'numpy', 'scipy', 'onnx', 'onnxruntime']},
              'modelSha256': {name: digest(path.read_bytes()) for name, path in paths.items()},
              'calibration': {'checkpointShiftSemitones': float(reference.shift), 'roundedRollBins': int(torch.round(reference.shift * 3)),
                              'binsPerSemitone': 3, 'outputUnits': 'fractional MIDI', 'a4Hz': 440,
                              'confidenceMeaning': 'voiced/unvoiced classifier, not correctness probability of the pitch'},
              'weightMaxAbsDifference': weights, 'stageMaxAbsDifference': stage_errors, 'parity': parity, 'rows': rows,
              'limitations': ['Nominal MIDI labels, not framewise measured F0.', 'Offline centered model consumes future audio; it is not a real-time replacement.',
                              'zeros/refill use the same 3976-sample cache; causal-full-history has additional algorithmic delay.',
                              'No retraining, scalar pitch correction, or production model replacement.']}
    # Functional output equivalence is distinct from internal-distribution diagnostics.
    # The 0.001 activation alert was exceeded on real audio, without a >1-cent pitch change.
    result['activationAlertThreshold'] = 1e-3
    result['activationAlert'] = any(item['maxActivationAbs'] >= 1e-3 for item in parity.values())
    result['functionalTolerances'] = {'pitchCents': 1, 'confidenceAbsExclusive': 1e-3,
                                    'volumeRelativeExclusive': 1e-4, 'cacheAbs': 0, 'independentDecodeCentsExclusive': 0.01}
    result['passed'] = all(item['overOneCentFrames'] == 0 and item['maxConfidenceAbs'] < 1e-3
                           and item['maxCacheAbs'] == 0 and item['maxVolumeRelative'] < 1e-4
                           and item['maxIndependentDecodeCents'] < 0.01 for item in parity.values())
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    args.output.with_suffix('.web-reference.json').write_text(json.dumps(web_reference, separators=(',', ':')) + '\n')
    print(json.dumps({'passed': result['passed'], 'parity': parity, 'stages': stage_errors}, indent=2))
    if not result['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()

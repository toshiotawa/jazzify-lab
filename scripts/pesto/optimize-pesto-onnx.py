#!/usr/bin/env python3
"""Remove exact CQT padding zeros and specialize the Web model for 1 x 240 audio.
Requires onnx==1.23.1, onnxruntime==1.30.0, numpy==2.5.3.
Trained coefficients, 5 ms stride, refill padding and cache stay unchanged.
"""
import argparse
from pathlib import Path
import tempfile
import numpy as np
import onnx
from onnx import helper, numpy_helper
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[2]
MODEL = 'pesto-mir1k-g7-48000-240-refill'
CONV_NAME = '/model/preprocessor/hcqt_kernels/cqt_kernels.0/conv/Conv'


def optimize(source: Path, destination: Path) -> None:
    model = onnx.load(source)
    conv = next(node for node in model.graph.node if node.name == CONV_NAME)
    weight = next(item for item in model.graph.initializer if item.name == conv.input[1])
    kernels = numpy_helper.to_array(weight)
    attrs = {attr.name: helper.get_attribute_value(attr) for attr in conv.attribute}
    if kernels.shape != (502, 1, 8192) or len(conv.input) != 2 or attrs != {
            'dilations': [1], 'group': 1, 'kernel_shape': [8192], 'pads': [0, 0], 'strides': [240]}:
        raise ValueError('Unexpected CQT convolution')
    lengths = []
    for channel in kernels[:, 0, :]:
        nonzero = np.flatnonzero(channel)
        if nonzero.size == 0:
            raise ValueError('Unexpected empty CQT channel')
        radius = max(4096 - int(nonzero[0]), int(nonzero[-1]) + 1 - 4096)
        lengths.append(1 << (2 * radius - 1).bit_length())
    # Crop input and kernel equally; keep real/imaginary channel order and times.
    nodes = []
    inputs = {8192: conv.input[0]}
    for length in sorted(set(lengths) - {8192}):
        crop = (8192 - length) // 2
        prefix = f'compact_cqt_{length}'
        for key, value in [('starts', [crop]), ('ends', [-crop]), ('axes', [2])]:
            model.graph.initializer.append(numpy_helper.from_array(
                np.array(value, dtype=np.int64), f'{prefix}_{key}'))
        output = f'{prefix}_input'
        nodes.append(helper.make_node('Slice', [conv.input[0], f'{prefix}_starts',
            f'{prefix}_ends', f'{prefix}_axes'], [output], name=f'{prefix}_slice'))
        inputs[length] = output
    outputs = []
    begin = 0
    for end in range(1, len(lengths) + 1):
        if end < len(lengths) and lengths[end] == lengths[begin]:
            continue
        length = lengths[begin]
        crop = (8192 - length) // 2
        prefix = f'compact_cqt_channels_{begin}_{end}'
        weight_name = f'{prefix}_weight'
        output = f'{prefix}_output'
        model.graph.initializer.append(numpy_helper.from_array(
            kernels[begin:end, :, crop:crop + length].copy(), weight_name))
        nodes.append(helper.make_node('Conv', [inputs[length], weight_name], [output],
            name=prefix, kernel_shape=[length], strides=[240], dilations=[1], pads=[0, 0], group=1))
        outputs.append(output)
        begin = end
    nodes.append(helper.make_node('Concat', outputs, list(conv.output), name='compact_cqt_concat', axis=1))
    original = list(model.graph.node)
    index = original.index(conv)
    del model.graph.node[:]
    model.graph.node.extend(original[:index] + nodes + original[index + 1:])
    model.graph.initializer.remove(weight)
    onnx.checker.check_model(model)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='pesto-optimize-') as temp:
        intermediate = Path(temp) / 'compact.onnx'
        onnx.save(model, intermediate)
        options = ort.SessionOptions()
        # BASIC folds shape/control-flow constants, without CPU-specific fused ops.
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
        options.add_free_dimension_override_by_name('batch_size', 1)
        options.add_free_dimension_override_by_name('audio_length', 240)
        options.optimized_model_filepath = str(destination)
        options.intra_op_num_threads = 1
        ort.InferenceSession(str(intermediate), options, providers=['CPUExecutionProvider'])
    result = onnx.load(destination)
    onnx.checker.check_model(result)
    if any(node.domain for node in result.graph.node):
        raise ValueError('Unexpected nonstandard operators')
    print(f'{source.stat().st_size:,} -> {destination.stat().st_size:,} bytes; '
          f'{len(result.graph.node)} nodes; 48 kHz / 240 samples unchanged')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'public/models/pesto' / f'{MODEL}.onnx')
    parser.add_argument('--output', type=Path, default=Path(tempfile.gettempdir()) / f'{MODEL}-compact-v1.onnx')
    args = parser.parse_args()
    optimize(args.source, args.output)

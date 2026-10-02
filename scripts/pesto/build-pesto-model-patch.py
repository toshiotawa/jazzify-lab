#!/usr/bin/env python3
"""Package the optimized ONNX as small literals + copies from existing weights.
No model conversion runs during gameplay. Browser reconstructs bytes once at init.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import tempfile
import onnx

ROOT = Path(__file__).resolve().parents[2]
MODEL = 'pesto-mir1k-g7-48000-240-refill'


def varint(data, offset):
    value = 0
    shift = 0
    while True:
        byte = data[offset]
        offset += 1
        value |= (byte & 127) << shift
        if byte < 128:
            return value, offset
        shift += 7


def fields(data, begin, end):
    while begin < end:
        tag, begin = varint(data, begin)
        wire = tag & 7
        number = tag >> 3
        if wire == 2:
            size, begin = varint(data, begin)
            yield number, begin, begin + size
            begin += size
        elif wire == 0:
            _, begin = varint(data, begin)
        elif wire == 1:
            begin += 8
        elif wire == 5:
            begin += 4
        else:
            raise ValueError(f'Unsupported protobuf wire type: {wire}')


def raw_initializers(data):
    graph_begin, graph_end = next((a, b) for n, a, b in fields(data, 0, len(data)) if n == 7)
    result = {}
    for number, begin, end in fields(data, graph_begin, graph_end):
        if number != 5:
            continue
        tensor = onnx.TensorProto.FromString(data[begin:end])
        raw = next(((a, b) for n, a, b in fields(data, begin, end) if n == 9), None)
        if raw:
            result[tensor.name] = (tensor, *raw)
    return result


def build(source_path, target_path, output_path):
    source = source_path.read_bytes()
    target = target_path.read_bytes()
    source_items = raw_initializers(source)
    target_items = raw_initializers(target)
    source_cqt = source_items['model.preprocessor.hcqt_kernels.cqt_kernels.0.conv.weight'][1]
    copies = []
    for name, (tensor, target_begin, target_end) in target_items.items():
        group = re.fullmatch(r'compact_cqt_channels_(\d+)_(\d+)_weight', name)
        if group:
            begin, end = map(int, group.groups())
            width = tensor.dims[2]
            crop = (8192 - width) // 2
            for channel in range(begin, end):
                copies.append((target_begin + (channel - begin) * width * 4,
                    source_cqt + (channel * 8192 + crop) * 4, width * 4))
        elif name in source_items:
            _, a, b = source_items[name]
            if source[a:b] == target[target_begin:target_end]:
                copies.append((target_begin, a, b - a))
    copies.sort()
    operations = []
    position = 0
    for target_begin, source_begin, size in copies:
        if target_begin < position:
            raise ValueError('Overlapping target copies')
        if target_begin > position:
            operations.append({'data': base64.b64encode(target[position:target_begin]).decode()})
        if source[source_begin:source_begin + size] != target[target_begin:target_begin + size]:
            raise ValueError('Copy differs from optimized model')
        previous = operations[-1] if operations else None
        if previous and 'sourceStart' in previous and previous['sourceStart'] + previous['length'] == source_begin:
            previous['length'] += size
        else:
            operations.append({'sourceStart': source_begin, 'length': size})
        position = target_begin + size
    if position < len(target):
        operations.append({'data': base64.b64encode(target[position:]).decode()})
    restored = b''.join(source[op['sourceStart']:op['sourceStart'] + op['length']]
        if 'sourceStart' in op else base64.b64decode(op['data']) for op in operations)
    if restored != target:
        raise ValueError('Patch reconstruction differs')
    patch = {'version': 1, 'sourceSize': len(source), 'targetSize': len(target),
        'sourceSha256': hashlib.sha256(source).hexdigest(),
        'targetSha256': hashlib.sha256(target).hexdigest(), 'operations': operations}
    output_path.write_text(json.dumps(patch, separators=(',', ':')) + '\n')
    print(f'{len(target):,} model bytes -> {output_path.stat().st_size:,} patch bytes; '
          f'{len(operations)} operations; reconstruction exact')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'public/models/pesto' / f'{MODEL}.onnx')
    parser.add_argument('--target', type=Path, default=Path(tempfile.gettempdir()) / f'{MODEL}-compact-v1.onnx')
    parser.add_argument('--output', type=Path, default=ROOT / 'public/models/pesto' / f'{MODEL}-compact-v1.patch.json')
    args = parser.parse_args()
    build(args.source, args.target, args.output)

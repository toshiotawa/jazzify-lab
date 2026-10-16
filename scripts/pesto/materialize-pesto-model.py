#!/usr/bin/env python3
"""Build the exact compact-v2 ONNX for the native bundle; no runtime reconstruction."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import tempfile

MODEL_NAME = 'pesto-mir1k-g7-48000-240-refill-compact-v2'
MODEL_SHA256 = 'c50ca16a07297ddc2b788403268a43736cceb792ec599746da7d5486bca974b8'
MODEL_SIZE = 11_150_637
ROOT = Path(__file__).resolve().parents[2]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def positive_integer(value):
    return type(value) is int and value > 0


def materialize(source, patch):
    if (not isinstance(patch, dict) or patch.get('version') != 1
            or patch.get('sourceSize') != len(source)
            or not positive_integer(patch.get('targetSize'))
            or patch['targetSize'] > len(source)
            or not isinstance(patch.get('operations'), list)):
        raise ValueError('Invalid PESTO patch')
    if digest(source) != patch.get('sourceSha256'):
        raise ValueError('PESTO source checksum mismatch')
    output = bytearray(patch['targetSize'])
    position = 0
    for operation in patch['operations']:
        if not isinstance(operation, dict):
            raise ValueError('Invalid PESTO operation')
        if isinstance(operation.get('data'), str):
            data = base64.b64decode(operation['data'], validate=True)
        else:
            start, length = operation.get('sourceStart'), operation.get('length')
            if (type(start) is not int or start < 0 or not positive_integer(length)
                    or start + length > len(source)):
                raise ValueError('Invalid PESTO copy range')
            data = memoryview(source)[start:start + length]
        if position + len(data) > len(output):
            raise ValueError('PESTO patch overflow')
        output[position:position + len(data)] = data
        position += len(data)
    if position != len(output) or digest(output) != patch.get('targetSha256'):
        raise ValueError('PESTO target checksum mismatch')
    return output


def write_model(output, source, patch):
    model = materialize(source.read_bytes(), json.loads(patch.read_text()))
    if len(model) != MODEL_SIZE or digest(model) != MODEL_SHA256:
        raise ValueError('Unexpected production PESTO model')
    # Atomic output, with an unchanged-file fast path for incremental builds.
    if output.exists() and digest(output.read_bytes()) == MODEL_SHA256:
        return
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(model)
        temporary.chmod(0o644)
        temporary.replace(output)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--source', type=Path, default=ROOT / 'ios/Jazzify/Resources/pesto-mir1k-g7-48000-240-refill.onnx')
    parser.add_argument('--patch', type=Path, default=ROOT / f'public/models/pesto/{MODEL_NAME}.patch.json')
    arguments = parser.parse_args()
    write_model(arguments.output, arguments.source, arguments.patch)


if __name__ == '__main__':
    main()

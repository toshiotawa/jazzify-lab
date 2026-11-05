#!/usr/bin/env python3
"""Download the explicit evaluation subset, verify hashes, decode with FFmpeg.

Only --lock-sources can accept previously unlocked sources. Never trains a model.
"""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess
import struct
import array
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources', type=Path, default=ROOT / 'scripts/pesto/multi-instrument-sources.json')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--lock-sources', action='store_true')
    args = parser.parse_args()
    manifest = json.loads(args.sources.read_text())
    args.output.mkdir(parents=True, exist_ok=True)

    def prepare(case):
        source = args.output / (case['id'] + '.mp3')
        target = args.output / (case['id'] + '.f32')
        if not case.get('sourceSha256') and not args.lock_sources:
            raise ValueError('Unpinned source: ' + case['id'])
        if not source.exists():
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(case['sourceUrl'], timeout=60) as response:
                        data = response.read()
                    source.write_bytes(data)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(attempt + 1)
        data = source.read_bytes()
        digest = sha(data)
        if case.get('sourceSha256', digest) != digest:
            raise ValueError('Source checksum mismatch: ' + case['id'])
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-ac', '1',
                        '-ar', '48000', '-t', '0.8', '-f', 'f32le', str(target)], check=True)
        pcm = target.read_bytes()
        if len(pcm) < 48000 * 4 * 0.6:
            raise ValueError('Audio too short: ' + case['id'])
        print('Prepared ' + case['id'], flush=True)
        return {**case, 'sourceSha256': digest, 'pcmSha256': sha(pcm), 'file': target.name}

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        cases = list(pool.map(prepare, manifest['cases']))
    if args.lock_sources:
        manifest['cases'] = [{k: v for k, v in case.items() if k not in ('file', 'pcmSha256')} for case in cases]
        args.sources.write_text(json.dumps(manifest, indent=2) + '\n')
    # Include actual bundled piano recordings, without synthesizing a GM substitute.
    bank_path = ROOT / 'ios/Jazzify/Resources/FuchsMoehrFeltPianoLite.sf2'
    bank = bank_path.read_bytes()
    chunks = {}

    def collect(start, end):
        while start + 8 <= end:
            name, size = struct.unpack_from('<4sI', bank, start)
            offset = start + 8
            if offset + size > end:
                raise ValueError('Malformed SF2 chunk')
            if name == b'LIST':
                collect(offset + 4, offset + size)
            else:
                chunks[name] = (offset, size)
            start = offset + size + size % 2

    collect(12, len(bank))
    offset, size = chunks[b'shdr']
    for position in range(offset, offset + size - 46, 46):
        name, first, last, _, _, rate, pitch, correction, _, sample_type = struct.unpack_from('<20sIIIIIBbHH', bank, position)
        label = name.split(b'\0')[0].decode('ascii')
        if label not in ('f21L', 'f36L', 'f48L', 'f60L', 'f72L', 'f84L', 'f96L'):
            continue
        if rate != 48000 or sample_type != 1 or last - first < 38400:
            raise ValueError('Unexpected bundled piano sample format')
        sample_offset = chunks[b'smpl'][0] + first * 2
        samples = struct.unpack_from('<38400h', bank, sample_offset)
        floats = array.array('f', (sample / 32768 for sample in samples))
        if sys.byteorder != 'little':
            floats.byteswap()
        pcm = floats.tobytes()
        sample_id = 'felt-piano-' + label
        filename = sample_id + '.f32'
        (args.output / filename).write_bytes(pcm)
        cases.append({'id': sample_id, 'family': 'piano', 'instrument': 'fuchsmoehr-felt-lite',
                      'midi': pitch, 'velocity': 'recorded-soft', 'file': filename,
                      'sourceUrl': 'repository:ios/Jazzify/Resources/FuchsMoehrFeltPianoLite.sf2',
                      'sourceSha256': sha(bank), 'pcmSha256': sha(pcm),
                      'sampleName': label, 'sf2PitchCorrectionCents': correction,
                      'reference': 'originalPitch of raw SF2 sample; no tuning/envelope applied'})
    if sum(case['family'] == 'piano' for case in cases) != 7:
        raise ValueError('Bundled piano sample coverage changed')
    result = {**manifest, 'dataset': 'NSynth acoustic subset + bundled Felt piano root recordings',
              'license': 'NSynth: CC BY 4.0; bundled SF2: existing repository asset, not redistributed here',
              'preparationVersion': 1,
              'decoder': subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0],
              'sampleRate': 48000, 'cases': cases}
    (args.output / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n')


if __name__ == '__main__':
    main()

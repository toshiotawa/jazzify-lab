#!/usr/bin/env python3
"""Prepare prospectively selected, previously unevaluated source groups. No inference."""
import argparse
import array
import concurrent.futures
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
LOCK = ROOT / 'scripts/pesto/padding-holdout-sources.json'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def select_sources():
    cases = []
    for family, prefix, numbers, pitches in [
        ('piano-family-keyboard', 'keyboard', [2, 3], [36, 60, 84]),
        ('guitar', 'guitar', [2, 3], [48, 60, 72]),
        ('flute', 'flute', [3, 4], [60, 72, 84]),
        ('brass', 'brass', [2, 3], [48, 60, 72]),
        ('vocal', 'vocal', [3, 4], [48, 60, 72]),
    ]:
        for number in numbers:
            instrument = f'{prefix}_acoustic_{number:03d}'
            available_pitches = [48, 60, 72] if instrument == 'flute_acoustic_003' else [54, 60, 72] if instrument == 'vocal_acoustic_004' else pitches
            velocities = [100] if instrument in ['guitar_acoustic_003', 'vocal_acoustic_003', 'vocal_acoustic_004'] else [25, 100]
            for pitch in available_pitches:
                for velocity in velocities:
                    cases.append({'id': f'{instrument}-{pitch:03d}-{velocity:03d}', 'family': family,
                                  'instrument': instrument, 'midi': pitch, 'velocity': velocity,
                                  'sourceUrl': f'https://huggingface.co/datasets/vvolhejn/nsynth/resolve/main/nsynth-train/audio2/{instrument}/{pitch:03d}-{velocity:03d}.mp3',
                                  'license': 'NSynth CC BY 4.0', 'kind': 'download'})
    for octave in [2, 4, 6]:
        for dynamic in ['pp', 'ff']:
            name = f'Piano.{dynamic}.C{octave}.aiff'
            cases.append({'id': f'iowa-piano-{dynamic}-C{octave}', 'family': 'piano',
                          'instrument': 'iowa-steinway-model-b-2001', 'midi': (octave + 1) * 12,
                          'velocity': dynamic, 'kind': 'download',
                          'sourceUrl': 'https://theremin.music.uiowa.edu/sound%20files/MIS/Piano_Other/piano/' + name,
                          'license': 'University of Iowa MIS: use in any projects without restrictions; see MIS.html'})
    for pitch, sample in [(28, 'E'), (33, 'A'), (38, 'D')]:
        cases.append({'id': f'finger-bass-{pitch}', 'family': 'bass', 'instrument': 'finger-bass-yr-20190930',
                      'midi': pitch, 'velocity': 'recorded', 'kind': 'sf2', 'sampleName': sample,
                      'sourceUrl': 'repository:ios/Jazzify/Resources/FingerBassYR 20190930.sf2',
                      'license': 'Existing bundled asset; audio not redistributed by this evaluation'})
    return {'version': 1, 'selectionRule': 'Fixed unused IDs and 3 pitches; velocity 25/100 where available. Metadata-only availability: guitar003/vocal003/vocal004 have only 100; flute003 uses 48/60/72; vocal004 uses 54/60/72. Iowa C2/C4/C6 pp/ff; bundled bass E/A/D roots. Selection fixed before inference.',
            'partition': 'new-source-group-validation; no tuning or retraining; not a future final test after inspecting results',
            'cases': cases}


def sf2_pcm(case):
    bank = (ROOT / case['sourceUrl'].removeprefix('repository:')).read_bytes()
    chunks = {}

    def collect(start, end):
        while start + 8 <= end:
            name, size = struct.unpack_from('<4sI', bank, start)
            offset = start + 8
            if offset + size > end:
                raise ValueError('Invalid SF2 chunk')
            if name == b'LIST':
                collect(offset + 4, offset + size)
            else:
                chunks[name] = offset, size
            start = offset + size + size % 2
    collect(12, len(bank))
    offset, size = chunks[b'shdr']
    for position in range(offset, offset + size - 46, 46):
        name, first, last, _, _, rate, pitch, correction, _, sample_type = struct.unpack_from('<20sIIIIIBbHH', bank, position)
        if name.split(b'\0')[0].decode('ascii') != case['sampleName']:
            continue
        if pitch != case['midi'] or sample_type != 1 or last - first < rate * 2:
            raise ValueError('Unexpected bass sample')
        start = chunks[b'smpl'][0] + first * 2
        pcm = bank[start:start + round(rate * 2) * 2]
        return bank, pcm, rate, correction
    raise ValueError('Missing bass root')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--lock-sources', action='store_true', help='First acquisition only; review the resulting source SHA lock')
    args = parser.parse_args()
    manifest = select_sources() if args.lock_sources else json.loads(LOCK.read_text())
    previous = json.loads((ROOT / 'scripts/pesto/multi-instrument-sources.json').read_text())
    old_groups = {case['instrument'] for case in previous['cases']} | {'fuchsmoehr-felt-lite'}
    if any(case['instrument'] in old_groups for case in manifest['cases']):
        raise ValueError('Previously inspected source group in holdout')
    args.output.mkdir(parents=True, exist_ok=True)

    def prepare(case):
        source = args.output / (case['id'] + '.source')
        target = args.output / (case['id'] + '.f32')
        correction = 0
        if case['kind'] == 'sf2':
            bank, raw, rate, correction = sf2_pcm(case)
            data = bank
            command = ['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', 'pipe:0']
        else:
            if not source.exists():
                with urllib.request.urlopen(case['sourceUrl'], timeout=90) as response:
                    source.write_bytes(response.read())
            data = source.read_bytes()
            raw = None
            command = ['ffmpeg', '-v', 'error', '-y', '-i', str(source)]
        if not args.lock_sources and digest(data) != case['sourceSha256']:
            raise ValueError('Source checksum mismatch: ' + case['id'])
        # Align the source's audible onset before artificial short-note cuts. Keep 20ms preroll.
        # This is an acoustic proxy, not a manually annotated physical attack time.
        decoded = subprocess.run([*command, '-ac', '1', '-ar', '48000', '-t', '2', '-f', 'f32le', 'pipe:1'], input=raw, stdout=subprocess.PIPE, check=True).stdout
        values = array.array('f'); values.frombytes(decoded)
        if sys.byteorder != 'little':
            values.byteswap()
        energy = [sum(value * value for value in values[start:start + 240]) / 240 for start in range(0, len(values) - 239, 240)]
        threshold = max(1e-6, max(energy) * 1e-4)
        onset = next((index for index in range(len(energy) - 1) if energy[index] > threshold and energy[index + 1] > threshold), None)
        if onset is None:
            raise ValueError('No audible onset: ' + case['id'])
        first = max(0, onset * 240 - 960)
        pcm = decoded[first * 4:(first + 38400) * 4]
        if len(pcm) != 38400 * 4:
            raise ValueError('Need 800ms PCM: ' + case['id'])
        target.write_bytes(pcm)
        print('Prepared ' + case['id'], flush=True)
        return {**case, 'sourceSha256': digest(data), 'pcmSha256': digest(pcm), 'file': target.name,
                'sf2PitchCorrectionCents': correction, 'sourceOnsetProxyMs': onset * 5, 'extractStartMs': first / 48,
                'partition': 'new-source-group-validation'}

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        cases = list(pool.map(prepare, manifest['cases']))
    if args.lock_sources:
        manifest['cases'] = [{k: v for k, v in case.items() if k not in ['pcmSha256', 'file', 'partition', 'sf2PitchCorrectionCents', 'sourceOnsetProxyMs', 'extractStartMs']} for case in cases]
        LOCK.write_text(json.dumps(manifest, indent=2) + '\n')
    result = {**manifest, 'sampleRate': 48000, 'onsetExtraction': 'First 2s decoded, first two 5ms chunks above max(-60dBFS energy, peak chunk energy -40dB); keep 20ms preroll, extract 800ms. No amplitude normalization or tuning.', 'priorGroups': sorted(old_groups),
              'decoder': subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0], 'cases': cases}
    (args.output / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n')


if __name__ == '__main__':
    main()

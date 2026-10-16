import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('materialize_pesto_model', Path(__file__).with_name('materialize-pesto-model.py'))
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)


class MaterializeTests(unittest.TestCase):
    def patch(self):
        return dict(version=1, sourceSize=8, targetSize=6,
                    sourceSha256=hashlib.sha256(bytes(range(8))).hexdigest(),
                    targetSha256=hashlib.sha256(bytes([1, 2, 9, 10, 6, 7])).hexdigest(),
                    operations=[dict(sourceStart=1, length=2), dict(data='CQo='), dict(sourceStart=6, length=2)])

    def test_copy_and_literal(self):
        self.assertEqual(model.materialize(bytes(range(8)), self.patch()), bytes([1, 2, 9, 10, 6, 7]))

    def test_invalid_ranges_and_checksums(self):
        for start in [-1, 7, 1.5, True]:
            patch = self.patch()
            patch['operations'][0]['sourceStart'] = start
            with self.assertRaises(ValueError):
                model.materialize(bytes(range(8)), patch)
        with self.assertRaises(ValueError):
            model.materialize(bytes(8), self.patch())
        patch = self.patch()
        patch['targetSha256'] = 'bad'
        with self.assertRaises(ValueError):
            model.materialize(bytes(range(8)), patch)

    def test_overflow_truncation_and_bad_literal(self):
        for operations in [[], [dict(data='////////////')], [dict(data='@@@')]]:
            patch = self.patch()
            patch['operations'] = operations
            with self.assertRaises(ValueError):
                model.materialize(bytes(range(8)), patch)

    def test_production_and_incremental_output(self):
        source = model.ROOT / 'ios/Jazzify/Resources/pesto-mir1k-g7-48000-240-refill.onnx'
        patch = model.ROOT / f'public/models/pesto/{model.MODEL_NAME}.patch.json'
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / f'{model.MODEL_NAME}.onnx'
            model.write_model(output, source, patch)
            self.assertEqual(output.stat().st_size, model.MODEL_SIZE)
            self.assertEqual(model.digest(output.read_bytes()), model.MODEL_SHA256)
            previous = output.stat().st_mtime_ns
            model.write_model(output, source, patch)
            self.assertEqual(output.stat().st_mtime_ns, previous)
            output.write_bytes(b'corrupt')
            model.write_model(output, source, patch)
            self.assertEqual(model.digest(output.read_bytes()), model.MODEL_SHA256)


if __name__ == '__main__':
    unittest.main()

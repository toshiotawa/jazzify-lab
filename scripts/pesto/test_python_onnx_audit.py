"""Checks that pitch decoding/voicing evaluation cannot mask errors."""
import importlib.util
from pathlib import Path
import unittest

import numpy as np

spec = importlib.util.spec_from_file_location('pesto_audit', Path(__file__).with_name('audit-python-onnx.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class AuditTests(unittest.TestCase):
    def test_midi_units_and_edge_bins(self):
        for index in [0, 63, 108, 180, 207, 216, 383]:
            values = np.zeros(384, dtype=np.float32)
            values[index] = 1
            self.assertAlmostEqual(audit.decode_alwa(values), index / 3, places=6)

    def test_local_average_does_not_average_unrelated_octave(self):
        values = np.zeros(384, dtype=np.float32)
        values[180], values[181], values[216] = 0.6, 0.3, 0.1
        self.assertAlmostEqual(audit.decode_alwa(values), (0.6 * 60 + 0.3 * (181 / 3)) / 0.9, places=6)

    def test_clamped_edge_duplicates_match_upstream_definition(self):
        values = np.zeros(384, dtype=np.float32)
        values[0], values[1] = 0.6, 0.4
        self.assertAlmostEqual(audit.decode_alwa(values), (0.4 / 3) / (3 * 0.6 + 0.4), places=6)

    def test_rejects_empty_or_corrupt_activations(self):
        for values in [np.zeros(384), np.ones(128), np.full(384, np.nan), -np.ones(384)]:
            with self.assertRaises(ValueError):
                audit.decode_alwa(values)

    def test_confidence_rejection_does_not_reduce_reference_denominator(self):
        pcm = np.ones(240 * 4, dtype=np.float32) * 0.1
        result = audit.metrics(np.array([60, 61, 60, 0]), np.array([1, 1, 0.1, 0]), pcm, 60)['attack']
        self.assertEqual(result['frames'], 4)
        self.assertEqual(result['correct'], 2)
        self.assertEqual(result['acceptedCorrect'], 1)


if __name__ == '__main__':
    unittest.main()

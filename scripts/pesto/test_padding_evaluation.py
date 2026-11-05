import importlib.util
from pathlib import Path
import unittest

import numpy as np

spec = importlib.util.spec_from_file_location('padding_eval', Path(__file__).with_name('evaluate-padding.py'))
evaluation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluation)


class EvaluationTests(unittest.TestCase):
    def test_unresolved_reference_is_same_mask_and_confidence_cannot_hide_errors(self):
        result = evaluation.score([60, 72, 60, 88], [1, 1, 0.1, 1], [60, 60, 60, np.nan])
        self.assertEqual(result['frames'], 3)
        self.assertEqual(result['correct'], 2)
        self.assertEqual(result['acceptedCorrect'], 1)
        self.assertEqual(result['octaveErrors'], 1)

    def test_latency_is_notification_of_fourth_frame_and_missing_pitch_is_retained(self):
        self.assertEqual(evaluation.stable_correct_ms([60] * 4, [1] * 4, [60] * 4, 0, True), 20)
        self.assertIsNone(evaluation.stable_correct_ms([60] * 3, [1] * 3, [60] * 3, 0, True))
        self.assertIsNone(evaluation.stable_correct_ms([60] * 5, [1, 1, 0.1, 1, 1], [60] * 5, 0, True))
        self.assertIsNone(evaluation.stable_correct_ms([60] * 5, [1] * 5, [60, 60, np.nan, 60, 60], 0, False))
        self.assertFalse(evaluation.reference_opportunity([60, 60, np.nan, 60, 60]))
        self.assertTrue(evaluation.reference_opportunity([np.nan, 60, 60, 60, 60]))

    def test_case_regression_cannot_be_hidden_by_better_average(self):
        rows = []
        for model, values in [('refill', [10, 9]), ('zeros', [9, 10])]:
            for index, correct in enumerate(values):
                rows.append({'id': str(index), 'family': 'guitar', 'model': model, 'condition': 'clean',
                             'reference': 'acoustic-consensus', 'phase': 'sustain', 'metrics': {'frames': 10, 'correct': correct}})
        self.assertEqual(evaluation.compare_rows(rows)['status'], 'do-not-promote')

    def test_no_reference_cannot_certify_promotion(self):
        rows = [{'id': 'a', 'family': 'bass', 'model': model, 'condition': 'clean', 'reference': 'acoustic-consensus',
                 'phase': 'attack', 'metrics': {'frames': 0, 'correct': 0}} for model in ['refill', 'zeros']]
        self.assertTrue(evaluation.compare_rows(rows)['unmeasuredCasePhases'])


if __name__ == '__main__':
    unittest.main()

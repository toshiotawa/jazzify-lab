import unittest
import numpy as np

from pitch_reference import WINDOW, SAMPLE_RATE, reference_frame, reference_track


class ReferenceTests(unittest.TestCase):
    def signal(self, frequency, harmonics=(1,)):
        time = np.arange(WINDOW) / SAMPLE_RATE
        return sum(amplitude * np.sin(2 * np.pi * frequency * (index + 1) * time)
                   for index, amplitude in enumerate(harmonics)) * 0.1

    def test_known_frequencies_and_detuning_without_a_note_label(self):
        for frequency in [27.5, 41.2034, 130.8128, 261.6256, 440, 1046.502, 2093.005, 440 * 2 ** (35 / 1200)]:
            result = reference_frame(self.signal(frequency))
            expected = 69 + 12 * np.log2(frequency / 440)
            self.assertIsNotNone(result['midi'], (frequency, result))
            self.assertLess(abs(result['midi'] - expected) * 100, 3, (frequency, result))

    def test_strong_overtones_and_missing_fundamental(self):
        for harmonics in [(0.3, 1, 0.4), (0, 1, 0.8, 0.4)]:
            result = reference_frame(self.signal(130.8128, harmonics))
            self.assertIsNotNone(result['midi'], result)
            self.assertLess(abs(result['midi'] - 48) * 100, 5)

    def test_silence_and_white_noise_cannot_become_ground_truth(self):
        self.assertIsNone(reference_frame(np.zeros(WINDOW))['midi'])
        self.assertIsNone(reference_frame(np.random.default_rng(42).normal(0, 0.1, WINDOW))['midi'])

    def test_reject_corrupt_or_wrong_length_input(self):
        for values in [np.zeros(5), np.full(WINDOW, np.nan)]:
            with self.assertRaises(ValueError):
                reference_frame(values)
        with self.assertRaises(ValueError):
            reference_track(np.zeros(3))


if __name__ == '__main__':
    unittest.main()

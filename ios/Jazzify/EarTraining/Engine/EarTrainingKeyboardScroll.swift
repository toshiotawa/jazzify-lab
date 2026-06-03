import Foundation

/// 耳コピバトル鍵盤の初期スクロール位置（ステージ内最高音基準）。
/// アンカー白鍵の算出は [`SurvivalPhraseKeyboardScroll`] と同一式。
enum EarTrainingKeyboardScroll {
    static func maxPitchMidi(in stage: EarTrainingStageDetail) -> Int? {
        var maxValue: Int?

        func absorb(_ midi: Int) {
            if maxValue == nil || midi > maxValue! {
                maxValue = midi
            }
        }

        func absorbOptional(_ midi: Int?) {
            guard let midi else { return }
            absorb(midi)
        }

        if let phrases = stage.phrases {
            for phrase in phrases {
                if let notes = phrase.notes {
                    for note in notes {
                        absorb(note.pitchMidi)
                    }
                }
                if let chords = phrase.chords {
                    for chord in chords {
                        absorbOptional(maxMidiFromVoicing(chord.voicing))
                    }
                }
            }
        }

        for item in stage.sortedChordQuizItems() {
            absorbOptional(maxMidiFromVoicing(item.voicing))
        }

        if let bootstrap = stage.compositePhraseBootstrap {
            for definition in bootstrap.definitions {
                for chord in definition.chords {
                    for note in chord.notes {
                        absorbOptional(EarTrainingChordVoicingEngine.noteNameToMidi(note.noteName))
                    }
                }
            }
        }

        if let bootstrap = stage.phrasePairAdlibBootstrap {
            for patterns in bootstrap.patternsByGroupId.values {
                for pattern in patterns {
                    absorbOptional(maxMidiFromVoicing(pattern.voicing))
                }
            }
        }

        return maxValue
    }

    /// `nil` のときピアノ側は C4 中央へフォールバックする。
    static func scrollAnchorMidi(for stage: EarTrainingStageDetail) -> Int? {
        guard let maxMidi = maxPitchMidi(in: stage) else { return nil }
        return SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: maxMidi)
    }

    private static func maxMidiFromVoicing(_ voicing: [String]?) -> Int? {
        guard let voicing, !voicing.isEmpty else { return nil }
        var maxValue: Int?
        for name in voicing {
            guard let midi = EarTrainingChordVoicingEngine.noteNameToMidi(name) else { continue }
            if maxValue == nil || midi > maxValue! {
                maxValue = midi
            }
        }
        return maxValue
    }
}

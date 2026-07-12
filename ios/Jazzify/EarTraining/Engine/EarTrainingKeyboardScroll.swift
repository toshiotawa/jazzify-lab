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

    static func minPitchMidi(in stage: EarTrainingStageDetail) -> Int? {
        var minValue: Int?

        func absorb(_ midi: Int) {
            if minValue == nil || midi < minValue! {
                minValue = midi
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
                        absorbOptional(minMidiFromVoicing(chord.voicing))
                    }
                }
            }
        }

        for item in stage.sortedChordQuizItems() {
            absorbOptional(minMidiFromVoicing(item.voicing))
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
                    absorbOptional(minMidiFromVoicing(pattern.voicing))
                }
            }
        }

        return minValue
    }

    static func pitchRange(in stage: EarTrainingStageDetail) -> PianoStagePitchRange? {
        guard let maxMidi = maxPitchMidi(in: stage) else { return nil }
        guard let minMidi = minPitchMidi(in: stage) else { return nil }
        return PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: minMidi,
            maxNoteMidi: maxMidi
        )
    }

    static func resolvedDisplayRange(
        for stage: EarTrainingStageDetail,
        displayMode: PianoKeyboardDisplayMode = PianoKeyboardDisplayPreferences.load()
    ) -> PianoStagePitchRange {
        switch displayMode {
        case .full88Keys:
            return .full88
        case .questionRangeFit:
            if let pitchRange = pitchRange(in: stage) {
                return pitchRange
            }
            return .full88
        }
    }

    static func allPitchMidis(in stage: EarTrainingStageDetail) -> [Int] {
        var midis: [Int] = []

        func absorb(_ midi: Int) {
            midis.append(midi)
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
                        if let voicing = chord.voicing {
                            for name in voicing {
                                absorbOptional(EarTrainingChordVoicingEngine.noteNameToMidi(name))
                            }
                        }
                    }
                }
            }
        }

        for item in stage.sortedChordQuizItems() {
            for name in item.voicing {
                absorbOptional(EarTrainingChordVoicingEngine.noteNameToMidi(name))
            }
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
                    if let voicing = pattern.voicing {
                        for name in voicing {
                            absorbOptional(EarTrainingChordVoicingEngine.noteNameToMidi(name))
                        }
                    }
                }
            }
        }

        return midis
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

    private static func minMidiFromVoicing(_ voicing: [String]?) -> Int? {
        guard let voicing, !voicing.isEmpty else { return nil }
        var minValue: Int?
        for name in voicing {
            guard let midi = EarTrainingChordVoicingEngine.noteNameToMidi(name) else { continue }
            if minValue == nil || midi < minValue! {
                minValue = midi
            }
        }
        return minValue
    }
}

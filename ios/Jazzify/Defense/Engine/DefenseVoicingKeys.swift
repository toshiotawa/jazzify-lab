import Foundation

enum DefensePlayStyle: String, Sendable, Equatable {
    case phrase
    case chordVoicing = "chord_voicing"
}

enum DefenseVoicingKeyMode: String, Sendable, Equatable {
    case order
    case random
}

struct DefenseVoicingKeyState: Equatable, Sendable {
    let mode: DefenseVoicingKeyMode
    let keys: [String]
    let index: Int

    var currentKey: String {
        keys[safe: index] ?? keys.first ?? "C"
    }
}

enum DefenseVoicingKeys {
    static func isChordVoicingStage(_ stage: DefenseStageDefinition) -> Bool {
        stage.playStyle == .chordVoicing
    }

    static func buildOrderedKeyCycle(startKey: String) -> [String] {
        let all = TrainingTwoHandVoicingTables.allMajorKeys
        guard let startIndex = all.firstIndex(of: startKey) else { return all }
        return Array(all[startIndex...]) + Array(all[..<startIndex])
    }

    static func buildRandomKeyBag(avoidKey: String?) -> [String] {
        var bag = TrainingTwoHandVoicingTables.allMajorKeys
        bag.shuffle()
        if let avoidKey,
           bag.first == avoidKey,
           bag.count > 1 {
            let swapIndex = Int.random(in: 1..<bag.count)
            bag.swapAt(0, swapIndex)
        }
        return bag
    }

    static func createInitialKeyState(mode: DefenseVoicingKeyMode, startKey: String) -> DefenseVoicingKeyState {
        let keys = mode == .order ? buildOrderedKeyCycle(startKey: startKey) : buildRandomKeyBag(avoidKey: nil)
        return DefenseVoicingKeyState(mode: mode, keys: keys, index: 0)
    }

    static func advanceKeyState(_ state: DefenseVoicingKeyState) -> DefenseVoicingKeyState {
        let nextIndex = state.index + 1
        if nextIndex < state.keys.count {
            return DefenseVoicingKeyState(mode: state.mode, keys: state.keys, index: nextIndex)
        }
        if state.mode == .order {
            return DefenseVoicingKeyState(mode: state.mode, keys: state.keys, index: 0)
        }
        return DefenseVoicingKeyState(
            mode: state.mode,
            keys: buildRandomKeyBag(avoidKey: state.currentKey),
            index: 0
        )
    }

    static func stepKeyState(_ state: DefenseVoicingKeyState, delta: Int) -> DefenseVoicingKeyState {
        guard !state.keys.isEmpty else { return state }
        let count = state.keys.count
        let nextIndex = (state.index + delta % count + count) % count
        return DefenseVoicingKeyState(mode: state.mode, keys: state.keys, index: nextIndex)
    }

    static func buildActivePhrases(stage: DefenseStageDefinition, keyState: DefenseVoicingKeyState) -> [DefensePhraseDefinition] {
        guard isChordVoicingStage(stage),
              let template = stage.phrases.first,
              let referenceKey = stage.voicingLowestKey,
              let minNote = stage.voicingMinLowestNote
        else {
            return stage.phrases
        }
        return [
            transposePhrase(
                template,
                referenceKey: referenceKey,
                targetKey: keyState.currentKey,
                minLowestNote: minNote
            ),
        ]
    }

    private static func transposePhrase(
        _ template: DefensePhraseDefinition,
        referenceKey: String,
        targetKey: String,
        minLowestNote: String
    ) -> DefensePhraseDefinition {
        let keyFifths = TrainingTwoHandVoicingTables.abaSet(key: targetKey)?.keyFifths ?? template.keyFifths
        let chords = template.chords.map {
            transposeChord($0, referenceKey: referenceKey, targetKey: targetKey, minLowestNote: minLowestNote)
        }
        return DefensePhraseDefinition(
            id: template.id,
            orderIndex: template.orderIndex,
            title: targetKey,
            audioUrl: template.audioUrl,
            loopStartMeasure: template.loopStartMeasure,
            loopEndMeasure: template.loopEndMeasure,
            keyFifths: keyFifths,
            requiredCompletionCount: template.requiredCompletionCount,
            chords: chords
        )
    }

    private static func transposeIntervalSpec(
        referenceKey: String,
        targetKey: String
    ) -> TrainingMusicTheory.IntervalSpec? {
        guard referenceKey != targetKey else { return nil }
        return TrainingMusicTheory.ascendingInterval(fromRoot: referenceKey, toRoot: targetKey)
    }

    private static func transposeChord(
        _ chord: SurvivalPhraseChord,
        referenceKey: String,
        targetKey: String,
        minLowestNote: String
    ) -> SurvivalPhraseChord {
        let interval = transposeIntervalSpec(referenceKey: referenceKey, targetKey: targetKey)
        let rawNames = chord.notes.map(\.noteName)
        let transposed = interval == nil
            ? rawNames
            : rawNames.compactMap { transposeNoteName($0, by: interval) }
        let minMidi = TrainingMusicTheory.parseVoicingMidi(minLowestNote) ?? 48
        let repositioned = placeLowestInOctaveAbove(transposed, minMidi: minMidi)
        let notes = zip(chord.notes.indices, chord.notes).map { index, note in
            let name = repositioned[safe: index] ?? note.noteName
            let midi = TrainingMusicTheory.parseVoicingMidi(name) ?? note.pitchMidi
            let staffLabel = note.staffChordName.flatMap { label -> String? in
                guard interval != nil else { return label }
                return transposeChordSymbol(label, referenceKey: referenceKey, targetKey: targetKey)
            }
            return SurvivalPhraseChordNote(
                orderIndex: note.orderIndex,
                pitchMidi: midi,
                pitchClass: ((midi % 12) + 12) % 12,
                noteName: name,
                staff: midi < 60 ? 2 : 1,
                stepIndex: note.stepIndex,
                staffChordName: staffLabel
            )
        }
        let chordName = interval == nil
            ? chord.chordName
            : transposeChordSymbol(chord.chordName, referenceKey: referenceKey, targetKey: targetKey)
        return SurvivalPhraseChord(
            id: chord.id,
            orderIndex: chord.orderIndex,
            chordName: chordName,
            measureNumber: chord.measureNumber,
            notes: notes
        )
    }

    private static func transposeNoteName(
        _ name: String,
        by interval: TrainingMusicTheory.IntervalSpec?
    ) -> String? {
        guard let interval else { return name }
        guard let note = TrainingMusicTheory.parseSpelled(name) else { return nil }
        return TrainingMusicTheory.transpose(note, by: interval).name
    }

    private static func transposeChordSymbol(_ symbol: String, referenceKey: String, targetKey: String) -> String {
        let trimmed = symbol.trimmingCharacters(in: .whitespacesAndNewlines)
        guard referenceKey != targetKey,
              let interval = transposeIntervalSpec(referenceKey: referenceKey, targetKey: targetKey)
        else {
            return symbol
        }
        let parts = trimmed.components(separatedBy: " | ")
        if parts.count > 1 {
            return parts.map { transposeSingleChordSymbol($0, by: interval) }.joined(separator: " | ")
        }
        return transposeSingleChordSymbol(trimmed, by: interval)
    }

    private static func transposeSingleChordSymbol(
        _ symbol: String,
        by interval: TrainingMusicTheory.IntervalSpec
    ) -> String {
        let trimmed = symbol.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let match = trimmed.range(of: #"^[A-G](?:bb|##|b|#|x)?"#, options: .regularExpression) else {
            return symbol
        }
        let root = String(trimmed[match])
        let suffix = String(trimmed[match.upperBound...])
        guard let rootPc = TrainingMusicTheory.parsePitchClassName(root) else {
            return symbol
        }
        let spelled = TrainingMusicTheory.SpelledNote(
            letterIndex: rootPc.letterIndex,
            alter: rootPc.alter,
            octave: 4
        )
        let transposed = TrainingMusicTheory.transpose(spelled, by: interval)
        return transposed.pitchName + suffix
    }

    private static func placeLowestInOctaveAbove(_ names: [String], minMidi: Int) -> [String] {
        let notes = names.compactMap { TrainingMusicTheory.parseSpelled($0) }
        guard !notes.isEmpty else { return names }
        return TrainingMusicTheory.placeLowestInOctaveAbove(notes, minMidi: minMidi).map(\.name)
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}

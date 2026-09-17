import Foundation

/// Web `trainingProgression.ts` と同じコード進行トレーニング出題。
enum TrainingProgression {
    private static let grandStaff: [Int] = [2, 1, 1, 1]

    static func parseProgressionChordRoot(_ chordName: String) -> String? {
        let trimmed = chordName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let range = trimmed.range(of: #"^[A-G](?:bb|##|b|#|x)?"#, options: .regularExpression) else {
            return nil
        }
        return String(trimmed[range])
    }

    static func buildUnits(training: TrainingRow, concertStaffBottom: Int? = nil) -> [TrainingProgressionUnit] {
        let config = training.config
        if let referenceChords = config.referenceChords, !referenceChords.isEmpty, config.referenceKey != nil {
            return buildUnitsFromReference(training: training, stavesConfig: config.staves, voicingForm: config.voicingForm)
        }
        if let progression = config.progression, !progression.isEmpty {
            let unitSize = (config.unitSize ?? 0) > 0 ? (config.unitSize ?? progression.count) : progression.count
            return buildUnitsFromProgression(
                training: training,
                progression: progression,
                unitSize: unitSize,
                concertStaffBottom: concertStaffBottom
            )
        }
        fatalError("Training \(training.slug): progression config missing")
    }

    static func pickInitialCursor(units: [TrainingProgressionUnit], shuffleUnits: Bool) -> TrainingProgressionCursor {
        guard !units.isEmpty else {
            fatalError("progression units empty")
        }
        let unitIndex = shuffleUnits ? Int.random(in: 0..<units.count) : 0
        return TrainingProgressionCursor(unitIndex: unitIndex, chordIndex: 0)
    }

    static func questionAt(units: [TrainingProgressionUnit], cursor: TrainingProgressionCursor) -> TrainingQuestion {
        guard cursor.unitIndex >= 0, cursor.unitIndex < units.count else {
            fatalError("Invalid progression unit index")
        }
        let unit = units[cursor.unitIndex]
        guard cursor.chordIndex >= 0, cursor.chordIndex < unit.questions.count else {
            fatalError("Invalid progression chord index")
        }
        return unit.questions[cursor.chordIndex]
    }

    static func advanceCursor(
        units: [TrainingProgressionUnit],
        cursor: TrainingProgressionCursor,
        shuffleUnits: Bool
    ) -> TrainingProgressionCursor {
        guard cursor.unitIndex >= 0, cursor.unitIndex < units.count else {
            return TrainingProgressionCursor(unitIndex: 0, chordIndex: 0)
        }
        let unit = units[cursor.unitIndex]
        if cursor.chordIndex + 1 < unit.questions.count {
            return TrainingProgressionCursor(unitIndex: cursor.unitIndex, chordIndex: cursor.chordIndex + 1)
        }
        if units.count <= 1 {
            return TrainingProgressionCursor(unitIndex: 0, chordIndex: 0)
        }
        if shuffleUnits {
            var nextUnit = cursor.unitIndex
            while nextUnit == cursor.unitIndex {
                nextUnit = Int.random(in: 0..<units.count)
            }
            return TrainingProgressionCursor(unitIndex: nextUnit, chordIndex: 0)
        }
        let nextUnit = (cursor.unitIndex + 1) % units.count
        return TrainingProgressionCursor(unitIndex: nextUnit, chordIndex: 0)
    }

    static func collectMidis(units: [TrainingProgressionUnit]) -> [Int] {
        units.flatMap { unit in
            unit.questions.flatMap { question in
                question.notes.map(\.midi)
            }
        }
    }

    private static func defaultStaff(for clefMode: TrainingClefMode) -> Int {
        clefMode == .bassConcert ? 2 : 1
    }

    private static func toStaves(_ staves: [Int]?, count: Int, fallback: Int) -> [Int] {
        (0..<count).map { index in
            guard let staves, index < staves.count else { return fallback }
            return staves[index] == 2 ? 2 : 1
        }
    }

    private static func staffForNoteName(_ noteName: String, fallback: Int, useGrandStaff: Bool) -> Int {
        guard useGrandStaff, let midi = TrainingMusicTheory.parseVoicingMidi(noteName) else {
            return fallback
        }
        return midi < 60 ? 2 : 1
    }

    private struct GroupedBuildOptions {
        let scorePerVoicing: Bool
        let playRootOnFirstCorrect: Bool
        let voicingSlots: [[String]]
    }

    private struct HorizontalBuildOptions {
        let ordered: Bool
        let playRootOnFirstCorrect: Bool
    }

    private static func repositionEntry(
        _ entry: TrainingProgressionEntry,
        concertStaffBottom: Int
    ) -> TrainingProgressionEntry {
        let spelled = entry.voicingNames.compactMap { TrainingMusicTheory.parseSpelled($0) }
        guard spelled.count == entry.voicingNames.count else { return entry }
        let names = TrainingMusicTheory.placeLowestInOctaveAbove(spelled, minMidi: concertStaffBottom).map(\.name)
        return TrainingProgressionEntry(
            name: entry.name,
            voicing: names.compactMap { TrainingMusicTheory.parseVoicingMidi($0) },
            voicingNames: names,
            keyFifths: entry.keyFifths,
            voicingStaves: entry.voicingStaves,
            voicingSlots: entry.voicingSlots
        )
    }

    private static func repositionUnitEntries(
        _ slice: [TrainingProgressionEntry],
        concertStaffBottom: Int
    ) -> [TrainingProgressionEntry] {
        let allNames = slice.flatMap(\.voicingNames)
        guard !allNames.isEmpty else { return slice }
        let spelled = allNames.compactMap { TrainingMusicTheory.parseSpelled($0) }
        guard spelled.count == allNames.count else { return slice }
        let repositioned = TrainingMusicTheory.placeLowestInOctaveAbove(spelled, minMidi: concertStaffBottom)
        var cursor = 0
        return slice.map { entry in
            let count = entry.voicingNames.count
            let names = repositioned[cursor..<(cursor + count)].map(\.name)
            cursor += count
            return TrainingProgressionEntry(
                name: entry.name,
                voicing: names.compactMap { TrainingMusicTheory.parseVoicingMidi($0) },
                voicingNames: names,
                keyFifths: entry.keyFifths,
                voicingStaves: entry.voicingStaves,
                voicingSlots: entry.voicingSlots
            )
        }
    }

    private static func repositionUnitEntriesPerChord(
        _ slice: [TrainingProgressionEntry],
        concertStaffBottom: Int
    ) -> [TrainingProgressionEntry] {
        slice.map { repositionEntry($0, concertStaffBottom: concertStaffBottom) }
    }

    private static func buildQuestionFromChord(
        unitIndex: Int,
        chordIndex: Int,
        chordName: String,
        noteNames: [String],
        staves: [Int],
        keyFifths: Int,
        useKeySignature: Bool,
        useGrandStaff: Bool,
        groupedOptions: GroupedBuildOptions? = nil,
        horizontalOptions: HorizontalBuildOptions? = nil
    ) -> TrainingQuestion? {
        if let groupedOptions, !groupedOptions.voicingSlots.isEmpty {
            var notes: [TrainingQuestionNote] = []
            for (groupIndex, slot) in groupedOptions.voicingSlots.enumerated() {
                for name in slot {
                    guard let midi = TrainingMusicTheory.parseVoicingMidi(name) else { return nil }
                    notes.append(TrainingQuestionNote(
                        noteName: name,
                        midi: midi,
                        pitchClass: TrainingMusicTheory.normalizePitchClass(midi),
                        staff: staffForNoteName(name, fallback: staves.first ?? 1, useGrandStaff: useGrandStaff),
                        isTarget: true,
                        groupIndex: groupIndex
                    ))
                }
            }
            guard let lowestMidi = notes.map(\.midi).min() else { return nil }
            let root = parseProgressionChordRoot(chordName)
            let rootMidi = root.flatMap { TrainingMusicTheory.rootMidiBelow(root: $0, lowestMidi: lowestMidi) }
            return TrainingQuestion(
                questionKey: "progression:\(unitIndex):\(chordIndex):\(chordName)",
                promptLabel: chordName,
                notes: notes,
                layout: .grouped,
                ordered: false,
                keyFifths: useKeySignature ? keyFifths : 0,
                rootMidi: rootMidi,
                scorePerVoicing: groupedOptions.scorePerVoicing,
                playRootOnFirstCorrect: groupedOptions.playRootOnFirstCorrect,
                voicingGroupCount: groupedOptions.voicingSlots.count
            )
        }

        var notes: [TrainingQuestionNote] = []
        for (index, name) in noteNames.enumerated() {
            guard let midi = TrainingMusicTheory.parseVoicingMidi(name) else { return nil }
            notes.append(TrainingQuestionNote(
                noteName: name,
                midi: midi,
                pitchClass: TrainingMusicTheory.normalizePitchClass(midi),
                staff: index < staves.count ? staves[index] : 1,
                isTarget: true
            ))
        }
        guard let lowestMidi = notes.map(\.midi).min() else { return nil }
        let root = parseProgressionChordRoot(chordName)
        let rootMidi = root.flatMap { TrainingMusicTheory.rootMidiBelow(root: $0, lowestMidi: lowestMidi) }
        let useHorizontal = horizontalOptions?.ordered == true
        return TrainingQuestion(
            questionKey: "progression:\(unitIndex):\(chordIndex):\(chordName)",
            promptLabel: chordName,
            notes: notes,
            layout: useHorizontal ? .horizontal : .stacked,
            ordered: horizontalOptions?.ordered ?? false,
            keyFifths: useKeySignature ? keyFifths : 0,
            rootMidi: rootMidi,
            playRootOnFirstCorrect: useHorizontal && horizontalOptions?.playRootOnFirstCorrect == true ? true : nil
        )
    }

    private static func buildUnitsFromProgression(
        training: TrainingRow,
        progression: [TrainingProgressionEntry],
        unitSize: Int,
        concertStaffBottom: Int?
    ) -> [TrainingProgressionUnit] {
        let useGrandStaff = training.clefMode == .grandConcert
        let fallbackStaff = defaultStaff(for: training.clefMode)
        let scorePerVoicing = training.config.scorePerVoicing == true
        let playRootOnFirstCorrect = training.config.playRootOnFirstCorrect == true
        let ordered = training.config.ordered == true
        let horizontalOptions = ordered
            ? HorizontalBuildOptions(ordered: true, playRootOnFirstCorrect: playRootOnFirstCorrect)
            : nil
        var units: [TrainingProgressionUnit] = []
        var unitStart = 0
        while unitStart < progression.count {
            let end = min(unitStart + unitSize, progression.count)
            var slice = Array(progression[unitStart..<end])
            if slice.isEmpty { break }
            if let concertStaffBottom {
                slice = training.kind == .scale
                    ? repositionUnitEntriesPerChord(slice, concertStaffBottom: concertStaffBottom)
                    : repositionUnitEntries(slice, concertStaffBottom: concertStaffBottom)
            }
            let unitIndex = unitStart / unitSize
            let keyFifths = slice[0].keyFifths
            let questions = slice.enumerated().compactMap { chordIndex, entry in
                let staves = toStaves(entry.voicingStaves, count: entry.voicingNames.count, fallback: fallbackStaff)
                let groupedOptions: GroupedBuildOptions? = {
                    guard let slots = entry.voicingSlots, !slots.isEmpty else { return nil }
                    return GroupedBuildOptions(
                        scorePerVoicing: scorePerVoicing,
                        playRootOnFirstCorrect: playRootOnFirstCorrect,
                        voicingSlots: slots
                    )
                }()
                return buildQuestionFromChord(
                    unitIndex: unitIndex,
                    chordIndex: chordIndex,
                    chordName: entry.name,
                    noteNames: entry.voicingNames,
                    staves: staves,
                    keyFifths: entry.keyFifths,
                    useKeySignature: training.useKeySignature,
                    useGrandStaff: useGrandStaff,
                    groupedOptions: groupedOptions,
                    horizontalOptions: horizontalOptions
                )
            }
            units.append(TrainingProgressionUnit(unitIndex: unitIndex, keyFifths: keyFifths, questions: questions))
            unitStart += unitSize
        }
        return units
    }

    private static func buildUnitsFromVoicingForm(
        training: TrainingRow,
        form: String,
        stavesConfig: [Int]?
    ) -> [TrainingProgressionUnit] {
        let useGrandStaff = training.clefMode == .grandConcert
        let fallbackStaff = defaultStaff(for: training.clefMode)
        let staves = toStaves(stavesConfig ?? grandStaff, count: grandStaff.count, fallback: fallbackStaff)
        return TrainingTwoHandVoicingTables.allMajorKeys.enumerated().compactMap { unitIndex, key in
            let set: (keyFifths: Int, ii: (name: String, notes: [String]), v: (name: String, notes: [String]), i: (name: String, notes: [String]))?
            if form == "bab" {
                set = TrainingTwoHandVoicingTables.babSet(key: key)
            } else if form == "aba" {
                set = TrainingTwoHandVoicingTables.abaSet(key: key)
            } else {
                return nil
            }
            guard let set else { return nil }
            let sequence = [set.ii, set.v, set.i]
            let questions = sequence.enumerated().compactMap { chordIndex, chord in
                buildQuestionFromChord(
                    unitIndex: unitIndex,
                    chordIndex: chordIndex,
                    chordName: chord.name,
                    noteNames: chord.notes,
                    staves: staves,
                    keyFifths: set.keyFifths,
                    useKeySignature: training.useKeySignature,
                    useGrandStaff: useGrandStaff
                )
            }
            return TrainingProgressionUnit(unitIndex: unitIndex, keyFifths: set.keyFifths, questions: questions)
        }
    }

    private static func buildUnitsFromReference(
        training: TrainingRow,
        stavesConfig: [Int]?,
        voicingForm: String?
    ) -> [TrainingProgressionUnit] {
        guard let voicingForm, voicingForm == "aba" || voicingForm == "bab" else {
            fatalError("Training \(training.slug): reference progression requires voicing_form aba or bab")
        }
        return buildUnitsFromVoicingForm(training: training, form: voicingForm, stavesConfig: stavesConfig)
    }
}

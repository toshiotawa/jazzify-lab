import Foundation

/// Web `trainingQuestionBuilder.ts` と同じ出題ロジック。
/// iOS は記譜楽器プリセットが無いため常にコンサート表記（writtenOffset = 0）。
enum TrainingQuestionBuilder {
    private typealias SpelledNote = TrainingMusicTheory.SpelledNote

    /// 和音・スケール・音程: 5線内に収まる最低音。ト音 E4 / ヘ音 G2
    private static let staffBottomMidi: [String: Int] = ["treble": 64, "bass": 43]

    private static let naturalPitchClasses: Set<Int> = [0, 2, 4, 5, 7, 9, 11]

    /// 譜読み: 加線1本までの幹音。ト音 C4-A5 / ヘ音 E2-C4
    private static let noteReadingCandidates: [String: [Int]] = [
        "treble": (60...81).filter { naturalPitchClasses.contains($0 % 12) },
        "bass": (40...60).filter { naturalPitchClasses.contains($0 % 12) },
    ]

    /// 音程トレーニングの基準音候補（綴りを固定）
    private static let intervalBaseSpellings = [
        "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
    ]

    static func buildQuestion(options: TrainingQuestionBuilderOptions) -> TrainingQuestion {
        let training = options.training
        let previousQuestionKey = options.previousQuestionKey
        // 調号は常にコンサート C（0）。
        let keyFifths = 0

        let mergedConfig: TrainingConfig
        if let lessonItems = options.lessonItems, !lessonItems.isEmpty {
            let index = options.lessonItemIndex ?? 0
            let lessonItem = lessonItems[index % lessonItems.count]
            mergedConfig = mergeConfig(base: training.config, override: lessonItem)
        } else {
            mergedConfig = training.config
        }

        let roots = options.lessonRoots ?? mergedConfig.roots ?? ["C"]
        let root: String
        if options.lessonOrder == "sequential", let index = options.lessonItemIndex {
            root = roots[index % roots.count]
        } else {
            root = roots.randomElement() ?? "C"
        }

        let effectiveClef = resolveEffectiveClef(clefMode: training.clefMode, configClef: mergedConfig.clef)
        let singleClef = effectiveClef == "bass" ? "bass" : "treble"
        let defaultStaff = singleClef == "bass" ? 2 : 1
        let staffBottom = staffBottomMidi[singleClef] ?? 64

        for _ in 0..<12 {
            switch training.kind {
            case .noteReading:
                guard let midi = noteReadingCandidates[singleClef]?.randomElement() else { continue }
                let questionKey = "note:\(midi)"
                if questionKey == previousQuestionKey { continue }
                return makeQuestion(
                    questionKey: questionKey,
                    promptLabel: "",
                    noteNames: [TrainingMusicTheory.flatSpelledName(midi)],
                    staves: [defaultStaff],
                    targets: [true],
                    layout: .stacked,
                    ordered: false,
                    keyFifths: keyFifths,
                    rootMidi: midi
                )

            case .interval:
                let interval = mergedConfig.interval ?? "2m"
                let directionUp = (mergedConfig.direction ?? "up") == "up"
                guard let spec = TrainingMusicTheory.parseInterval(directionUp ? interval : "-\(interval)") else { continue }
                var candidates: [(base: SpelledNote, target: SpelledNote)] = []
                for spelling in intervalBaseSpellings {
                    guard let raw = TrainingMusicTheory.parseSpelled("\(spelling)4") else { continue }
                    guard let base = TrainingMusicTheory.placeLowestInOctaveAbove([raw], minMidi: staffBottom).first else { continue }
                    let target = TrainingMusicTheory.transpose(base, by: spec)
                    guard TrainingMusicTheory.isSimpleSpelling(target) else { continue }
                    if target.midi < staffBottom {
                        candidates.append((
                            TrainingMusicTheory.shiftOctave(base, by: 1),
                            TrainingMusicTheory.shiftOctave(target, by: 1)
                        ))
                    } else {
                        candidates.append((base, target))
                    }
                }
                guard let picked = candidates.randomElement() else { continue }
                let questionKey = "interval:\(picked.base.name):\(picked.target.name)"
                if questionKey == previousQuestionKey { continue }
                return makeQuestion(
                    questionKey: questionKey,
                    promptLabel: training.titleJa,
                    noteNames: [picked.base.name, picked.target.name],
                    staves: [defaultStaff, defaultStaff],
                    targets: [false, true],
                    layout: .stacked,
                    ordered: false,
                    keyFifths: keyFifths,
                    rootMidi: picked.base.midi
                )

            case .scale:
                let scaleType = mergedConfig.scale ?? "major"
                guard let intervals = TrainingMusicTheory.scaleTemplates[scaleType] else { continue }
                let notes = TrainingMusicTheory.placeLowestInOctaveAbove(
                    TrainingMusicTheory.spelledFromIntervals(root: root, octave: 4, intervals: intervals),
                    minMidi: staffBottom
                )
                let questionKey = "scale:\(root):\(scaleType)"
                if questionKey == previousQuestionKey { continue }
                return makeQuestion(
                    questionKey: questionKey,
                    promptLabel: "\(root) \(training.titleJa)",
                    noteNames: notes.map(\.name),
                    staves: notes.map { _ in defaultStaff },
                    targets: notes.map { _ in true },
                    layout: .horizontal,
                    ordered: true,
                    keyFifths: keyFifths,
                    rootMidi: notes.first?.midi
                )

            case .chord, .voicing:
                guard let built = buildChordVoicingQuestion(
                    training: training,
                    config: mergedConfig,
                    root: root,
                    defaultStaff: defaultStaff,
                    staffBottom: staffBottom,
                    previousQuestionKey: previousQuestionKey,
                    keyFifths: keyFifths
                ) else { continue }
                return built

            case .progression:
                continue
            }
        }

        return buildQuestion(options: TrainingQuestionBuilderOptions(
            training: training,
            ignoreNotationInstrument: options.ignoreNotationInstrument,
            lessonRoots: options.lessonRoots,
            lessonOrder: options.lessonOrder,
            lessonItems: options.lessonItems,
            lessonItemIndex: options.lessonItemIndex,
            previousQuestionKey: nil
        ))
    }

    private static func buildChordVoicingQuestion(
        training: TrainingRow,
        config: TrainingConfig,
        root: String,
        defaultStaff: Int,
        staffBottom: Int,
        previousQuestionKey: String?,
        keyFifths: Int
    ) -> TrainingQuestion? {
        let notes: [SpelledNote]
        let staves: [Int]

        if let voicingNotes = config.voicingNotes, !voicingNotes.isEmpty {
            let parsed = voicingNotes.compactMap { TrainingMusicTheory.parseSpelled($0) }
            guard parsed.count == voicingNotes.count else { return nil }
            let transposed: [SpelledNote]
            if let interval = TrainingMusicTheory.ascendingInterval(fromRoot: config.referenceRoot ?? "C", toRoot: root),
               interval.semitones != 0 || interval.steps != 0 {
                transposed = parsed.map { TrainingMusicTheory.transpose($0, by: interval) }
            } else {
                transposed = parsed
            }
            let minMidi = config.minLowestNote.flatMap { TrainingMusicTheory.parseVoicingMidi($0) } ?? staffBottom
            notes = TrainingMusicTheory.placeLowestInOctaveAbove(transposed, minMidi: minMidi)
            staves = toStaves(config.staves, count: notes.count, fallback: defaultStaff)
        } else if let intervals = config.intervals, !intervals.isEmpty {
            let raw = TrainingMusicTheory.spelledFromIntervals(root: root, octave: 3, intervals: intervals)
            let minMidi = config.minLowestNote.flatMap { TrainingMusicTheory.parseVoicingMidi($0) } ?? staffBottom
            notes = TrainingMusicTheory.placeLowestInOctaveAbove(raw, minMidi: minMidi)
            staves = toStaves(config.staves, count: notes.count, fallback: defaultStaff)
        } else if let quality = config.quality, let intervals = TrainingMusicTheory.chordTemplates[quality] {
            notes = TrainingMusicTheory.placeLowestInOctaveAbove(
                TrainingMusicTheory.spelledFromIntervals(root: root, octave: 4, intervals: intervals),
                minMidi: staffBottom
            )
            staves = toStaves(nil, count: notes.count, fallback: defaultStaff)
        } else {
            return nil
        }
        guard !notes.isEmpty, let lowestMidi = notes.map(\.midi).min() else { return nil }

        let noteNames = notes.map(\.name)
        let questionKey = "chord:\(root):\(noteNames.joined(separator: "|"))"
        if questionKey == previousQuestionKey { return nil }
        let suffix: String
        if training.kind == .chord, let quality = config.quality {
            suffix = TrainingMusicTheory.chordSymbolSuffix[quality] ?? quality
        } else {
            suffix = training.titleEn
        }
        return makeQuestion(
            questionKey: questionKey,
            promptLabel: "\(root)\(suffix)",
            noteNames: noteNames,
            staves: staves,
            targets: noteNames.map { _ in true },
            layout: .stacked,
            ordered: false,
            keyFifths: keyFifths,
            rootMidi: TrainingMusicTheory.rootMidiBelow(root: root, lowestMidi: lowestMidi)
        )
    }

    private static func mergeConfig(base: TrainingConfig, override: TrainingConfig) -> TrainingConfig {
        TrainingConfig(
            roots: override.roots ?? base.roots,
            quality: override.quality ?? base.quality,
            scale: override.scale ?? base.scale,
            interval: override.interval ?? base.interval,
            direction: override.direction ?? base.direction,
            clef: override.clef ?? base.clef,
            intervals: override.intervals ?? base.intervals,
            staves: override.staves ?? base.staves,
            voicingNotes: override.voicingNotes ?? base.voicingNotes,
            referenceRoot: override.referenceRoot ?? base.referenceRoot,
            minLowestNote: override.minLowestNote ?? base.minLowestNote
        )
    }

    private static func resolveEffectiveClef(clefMode: TrainingClefMode, configClef: String?) -> String {
        switch clefMode {
        case .bassConcert: return "bass"
        case .grandConcert: return "grand"
        case .instrument:
            if configClef == "bass" { return "bass" }
            return "treble"
        }
    }

    private static func toStaves(_ staves: [Int]?, count: Int, fallback: Int) -> [Int] {
        (0..<count).map { index in
            guard let staves, index < staves.count else { return fallback }
            return staves[index] == 2 ? 2 : (staves[index] == 1 ? 1 : fallback)
        }
    }

    private static func makeQuestion(
        questionKey: String,
        promptLabel: String,
        noteNames: [String],
        staves: [Int],
        targets: [Bool],
        layout: TrainingQuestionLayout,
        ordered: Bool,
        keyFifths: Int,
        rootMidi: Int?
    ) -> TrainingQuestion {
        let notes: [TrainingQuestionNote] = noteNames.enumerated().compactMap { index, name in
            guard let midi = TrainingMusicTheory.parseVoicingMidi(name) else { return nil }
            return TrainingQuestionNote(
                noteName: name,
                midi: midi,
                pitchClass: TrainingMusicTheory.normalizePitchClass(midi),
                staff: index < staves.count ? staves[index] : 1,
                isTarget: index < targets.count ? targets[index] : true
            )
        }
        return TrainingQuestion(
            questionKey: questionKey,
            promptLabel: promptLabel,
            notes: notes,
            layout: layout,
            ordered: ordered,
            keyFifths: keyFifths,
            rootMidi: rootMidi
        )
    }
}

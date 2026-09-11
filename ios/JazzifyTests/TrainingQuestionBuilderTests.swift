import XCTest
@testable import Jazzify

final class TrainingQuestionBuilderTests: XCTestCase {
    private func config(
        roots: [String]? = nil,
        quality: String? = nil,
        scale: String? = nil,
        interval: String? = nil,
        direction: String? = nil,
        clef: String? = nil,
        includeAccidentals: Bool? = nil,
        intervals: [String]? = nil,
        staves: [Int]? = nil,
        voicingNotes: [String]? = nil,
        referenceRoot: String? = nil,
        minLowestNote: String? = nil
    ) -> TrainingConfig {
        TrainingConfig(
            roots: roots,
            quality: quality,
            scale: scale,
            interval: interval,
            direction: direction,
            clef: clef,
            includeAccidentals: includeAccidentals,
            intervals: intervals,
            staves: staves,
            voicingNotes: voicingNotes,
            referenceRoot: referenceRoot,
            minLowestNote: minLowestNote
        )
    }

    private func training(
        kind: TrainingKind,
        clefMode: TrainingClefMode = .instrument,
        title: String = "テスト",
        config: TrainingConfig
    ) -> TrainingRow {
        TrainingRow(
            id: UUID(),
            categoryId: UUID(),
            slug: "test",
            titleJa: title,
            titleEn: title,
            sortOrder: 0,
            kind: kind,
            clefMode: clefMode,
            useKeySignature: false,
            playRootOnCorrect: true,
            bgmUrl: "",
            config: config,
            isActive: true
        )
    }

    private func build(_ row: TrainingRow, previous: String? = nil) -> TrainingQuestion {
        TrainingQuestionBuilder.buildQuestion(options: TrainingQuestionBuilderOptions(
            training: row,
            ignoreNotationInstrument: true,
            lessonRoots: nil,
            lessonOrder: nil,
            lessonItems: nil,
            lessonItemIndex: nil,
            previousQuestionKey: previous
        ))
    }

    func testSpelledTransposition() {
        XCTAssertEqual(TrainingMusicTheory.transpose("Bb2", interval: "3m"), "Db3")
        XCTAssertEqual(TrainingMusicTheory.transpose("Db4", interval: "3M"), "F4")
        XCTAssertEqual(TrainingMusicTheory.transpose("C4", interval: "9M"), "D5")
        XCTAssertEqual(TrainingMusicTheory.transpose("C4", interval: "5d"), "Gb4")
        XCTAssertEqual(TrainingMusicTheory.transpose("B4", interval: "4A"), "E#5")
        // 増4度下は理論上 Cb（音程トレーニングでは isSimpleSpelling で除外される）
        XCTAssertEqual(TrainingMusicTheory.transpose("F5", interval: "-4A"), "Cb5")
        XCTAssertEqual(TrainingMusicTheory.transpose("B4", interval: "-4A"), "F4")
        XCTAssertEqual(TrainingMusicTheory.transpose("Fb3", interval: "3M"), "Ab3")
    }

    func testNoteReadingUsesNaturalNotesInTrebleRange() {
        let row = training(kind: .noteReading, config: config(clef: "treble", includeAccidentals: false))
        for _ in 0..<30 {
            let q = build(row)
            XCTAssertEqual(q.notes.count, 1)
            XCTAssertGreaterThanOrEqual(q.notes[0].midi, 60)
            XCTAssertLessThanOrEqual(q.notes[0].midi, 81)
            XCTAssertTrue([0, 2, 4, 5, 7, 9, 11].contains(q.notes[0].pitchClass))
        }
    }

    func testNoteReadingIncludesAccidentalsWhenEnabled() {
        let row = training(kind: .noteReading, config: config(clef: "treble", includeAccidentals: true))
        var sawAccidental = false
        for _ in 0..<80 {
            let q = build(row)
            XCTAssertGreaterThanOrEqual(q.notes[0].midi, 60)
            XCTAssertLessThanOrEqual(q.notes[0].midi, 81)
            if ![0, 2, 4, 5, 7, 9, 11].contains(q.notes[0].pitchClass) {
                sawAccidental = true
                XCTAssertTrue(q.notes[0].noteName.contains("#") || q.notes[0].noteName.contains("b"))
            }
        }
        XCTAssertTrue(sawAccidental)
    }

    func testBassNoteReadingUsesInCFixedRange() {
        let row = training(
            kind: .noteReading,
            clefMode: .bassConcert,
            config: config(clef: "bass", includeAccidentals: false)
        )
        for _ in 0..<30 {
            let q = build(row)
            XCTAssertGreaterThanOrEqual(q.notes[0].midi, 40)
            XCTAssertLessThanOrEqual(q.notes[0].midi, 60)
            XCTAssertEqual(q.notes[0].staff, 2)
            XCTAssertTrue([0, 2, 4, 5, 7, 9, 11].contains(q.notes[0].pitchClass))
        }
    }

    func testChordKeepsFlatSpellingAndStaffRange() {
        let q = build(training(kind: .chord, config: config(roots: ["Db"], quality: "maj")))
        XCTAssertEqual(q.notes.map(\.noteName), ["Db5", "F5", "Ab5"])
        XCTAssertEqual(q.promptLabel, "Db")
        XCTAssertEqual(q.rootMidi, 61)
        XCTAssertEqual(q.keyFifths, 0)
    }

    func testMajorScaleStartsOneOctaveAboveMiddleC() {
        let q = build(training(kind: .scale, config: config(roots: ["C"], scale: "major")))
        XCTAssertEqual(q.notes.map(\.noteName), ["C5", "D5", "E5", "F5", "G5", "A5", "B5"])
        XCTAssertEqual(q.layout, .horizontal)
        XCTAssertTrue(q.ordered)
        let dim = build(training(kind: .scale, config: config(roots: ["C"], scale: "whole_half_diminished")))
        XCTAssertEqual(dim.notes.count, 8)
    }

    func testTensionVoicingPlacedAboveMinLowestNote() {
        let row = training(
            kind: .voicing,
            clefMode: .bassConcert,
            title: "M7(9)",
            config: config(roots: ["C"], intervals: ["3M", "5P", "7M", "9M"], minLowestNote: "E3")
        )
        let c = build(row)
        XCTAssertEqual(c.notes.map(\.noteName), ["E3", "G3", "B3", "D4"])
        XCTAssertEqual(c.promptLabel, "CM7(9)")
        XCTAssertEqual(c.rootMidi, 48)
        XCTAssertTrue(c.notes.allSatisfy { $0.staff == 2 })
        let b = build(training(
            kind: .voicing,
            clefMode: .bassConcert,
            title: "M7(9)",
            config: config(roots: ["B"], intervals: ["3M", "5P", "7M", "9M"], minLowestNote: "E3")
        ))
        XCTAssertEqual(b.notes.map(\.noteName), ["D#4", "F#4", "A#4", "C#5"])
    }

    func testTwoHandVoicingTransposesFromReferenceRoot() {
        let base = config(
            roots: ["Eb"],
            staves: [2, 2, 2, 1, 1, 1],
            voicingNotes: ["Bb2", "E3", "A3", "D4", "G4", "C5"],
            referenceRoot: "C",
            minLowestNote: "Db3"
        )
        let eb = build(training(kind: .voicing, clefMode: .grandConcert, title: "7 mixo 4th", config: base))
        XCTAssertEqual(eb.notes.map(\.noteName), ["Db3", "G3", "C4", "F4", "Bb4", "Eb5"])
        XCTAssertEqual(eb.notes.map(\.staff), [2, 2, 2, 1, 1, 1])
        XCTAssertEqual(eb.promptLabel, "Eb7 mixo 4th")
        let c = build(training(
            kind: .voicing,
            clefMode: .grandConcert,
            title: "7 mixo 4th",
            config: config(
                roots: ["C"],
                staves: [2, 2, 2, 1, 1, 1],
                voicingNotes: ["Bb2", "E3", "A3", "D4", "G4", "C5"],
                referenceRoot: "C",
                minLowestNote: "Db3"
            )
        ))
        XCTAssertEqual(c.notes.first?.noteName, "Bb3")
        let bvi = build(training(
            kind: .voicing,
            clefMode: .grandConcert,
            config: config(
                roots: ["E"],
                staves: [2, 2, 2, 1, 1],
                voicingNotes: ["Bb2", "Fb3", "Ab3", "C4", "Eb4"],
                referenceRoot: "C",
                minLowestNote: "D3"
            )
        ))
        XCTAssertEqual(bvi.notes.map(\.noteName), ["D3", "Ab3", "C4", "E4", "G4"])
    }

    func testIntervalQuestionHasReferenceAndSimpleSpelledTarget() {
        let row = training(kind: .interval, config: config(interval: "4A", direction: "down"))
        for _ in 0..<40 {
            let q = build(row)
            XCTAssertEqual(q.notes.count, 2)
            XCTAssertFalse(q.notes[0].isTarget)
            XCTAssertTrue(q.notes[1].isTarget)
            XCTAssertEqual(q.notes[0].midi - q.notes[1].midi, 6)
            XCTAssertGreaterThanOrEqual(q.notes[1].midi, 64)
            XCTAssertNil(q.notes[1].noteName.range(of: "x|bb|E#|B#|Cb|Fb", options: .regularExpression))
        }
    }

    func testCollectStageMidisCoversNoteReadingRange() {
        let row = training(kind: .noteReading, config: config(clef: "treble", includeAccidentals: false))
        let midis = TrainingQuestionBuilder.collectStageMidis(training: row)
        XCTAssertEqual(midis.min(), 60)
        XCTAssertEqual(midis.max(), 81)
    }

    func testCollectStageMidisIncludesEveryChordRoot() {
        let row = training(kind: .chord, config: config(roots: ["C", "G"], quality: "maj"))
        let midis = Set(TrainingQuestionBuilder.collectStageMidis(training: row))
        XCTAssertTrue(midis.contains(72))
        XCTAssertTrue(midis.contains(79))
        XCTAssertTrue(midis.contains(74))
    }
}

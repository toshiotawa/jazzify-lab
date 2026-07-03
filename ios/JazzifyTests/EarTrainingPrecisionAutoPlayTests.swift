import XCTest
@testable import Jazzify

final class EarTrainingPrecisionAutoPlayTests: XCTestCase {
    private func makeNote(
        id: String,
        midi: Int,
        startSec: Double,
        durationSec: Double,
        isShortNote: Bool
    ) -> EarTrainingPrecisionNote {
        EarTrainingPrecisionNote(
            id: id,
            midi: midi,
            startSec: startSec,
            durationSec: durationSec,
            isBlackKey: false,
            measureNumber: 1,
            isShortNote: isShortNote
        )
    }

    func testSchedulerFiresNoteOnAndOff() {
        let notes = [
            makeNote(id: "a", midi: 60, startSec: 1, durationSec: 0.5, isShortNote: false),
            makeNote(id: "b", midi: 64, startSec: 1.5, durationSec: 0.25, isShortNote: true),
        ]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        let scheduler = EarTrainingPrecisionAutoPlayScheduler()
        scheduler.setNotes(notes)
        scheduler.reset()

        var events: [String] = []
        let callbacks = EarTrainingPrecisionAutoPlayCallbacks(
            onNoteOn: { midi, noteId in events.append("on:\(noteId):\(midi)") },
            onNoteOff: { midi, noteId in events.append("off:\(noteId):\(midi)") }
        )

        XCTAssertFalse(scheduler.tick(phraseTimeSec: 0.5, states: &states, callbacks: callbacks))
        XCTAssertTrue(scheduler.tick(phraseTimeSec: 1, states: &states, callbacks: callbacks))
        XCTAssertEqual(states["a"]?.judgment, .good)
        XCTAssertEqual(events, ["on:a:60"])

        XCTAssertTrue(scheduler.tick(phraseTimeSec: 1.5, states: &states, callbacks: callbacks))
        XCTAssertEqual(states["b"]?.judgment, .good)
        XCTAssertEqual(states["b"]?.hiddenFromLane, true)
        XCTAssertEqual(states["a"]?.hiddenFromLane, true)
        XCTAssertEqual(events, ["on:a:60", "on:b:64", "off:a:60"])
    }

    func testSchedulerSkipsAlreadyGoodNotes() {
        let notes = [makeNote(id: "a", midi: 60, startSec: 1, durationSec: 0.5, isShortNote: false)]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        states["a"]?.judgment = .good

        let scheduler = EarTrainingPrecisionAutoPlayScheduler()
        scheduler.setNotes(notes)
        scheduler.reset()

        var events: [String] = []
        let callbacks = EarTrainingPrecisionAutoPlayCallbacks(
            onNoteOn: { _, _ in events.append("on") },
            onNoteOff: { _, _ in events.append("off") }
        )

        XCTAssertFalse(scheduler.tick(phraseTimeSec: 2, states: &states, callbacks: callbacks))
        XCTAssertTrue(events.isEmpty)
    }

    func testSchedulerSendsNoteOffEvenWhenAlreadyHidden() {
        let notes = [makeNote(id: "a", midi: 60, startSec: 1, durationSec: 0.5, isShortNote: false)]
        var states = EarTrainingPrecisionJudge.createRuntimeStates(notes: notes)
        let scheduler = EarTrainingPrecisionAutoPlayScheduler()
        scheduler.setNotes(notes)
        scheduler.reset()

        _ = scheduler.tick(phraseTimeSec: 1, states: &states, callbacks: EarTrainingPrecisionAutoPlayCallbacks(
            onNoteOn: { _, _ in },
            onNoteOff: { _, _ in }
        ))
        states["a"]?.hiddenFromLane = true

        var events: [String] = []
        _ = scheduler.tick(phraseTimeSec: 1.5, states: &states, callbacks: EarTrainingPrecisionAutoPlayCallbacks(
            onNoteOn: { _, _ in },
            onNoteOff: { midi, noteId in events.append("off:\(noteId):\(midi)") }
        ))
        XCTAssertEqual(events, ["off:a:60"])
    }
}

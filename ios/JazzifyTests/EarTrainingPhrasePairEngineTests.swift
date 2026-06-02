import XCTest
@testable import Jazzify

final class EarTrainingPhrasePairEngineTests: XCTestCase {
    private let patterns = EarTrainingPhrasePairEngine.cm7Patterns

    private func playSequence(
        _ pcs: [Int],
        initial: EarTrainingPhrasePairEngine.RuntimeState = EarTrainingPhrasePairEngine.createInitialState()
    ) -> (results: [EarTrainingPhrasePairEngine.Evaluation], state: EarTrainingPhrasePairEngine.RuntimeState) {
        var state = initial
        var results: [EarTrainingPhrasePairEngine.Evaluation] = []
        for pc in pcs {
            let ev = EarTrainingPhrasePairEngine.evaluateNoteOn(state: state, pitchClass: pc, patterns: patterns)
            results.append(ev)
            state = ev.nextState
        }
        return (results, state)
    }

    func testCDCompletesA() {
        let (results, _) = playSequence([0, 2])
        XCTAssertEqual(results[1].result, .complete)
        XCTAssertEqual(results[1].completedPattern?.familyId, "CM7-A")
    }

    func testDCCompletesA() {
        let (results, _) = playSequence([2, 0])
        XCTAssertEqual(results[1].result, .complete)
        XCTAssertEqual(results[1].completedPattern?.familyId, "CM7-A")
    }

    func testBCCompletesDWithCarry() {
        let (results, state) = playSequence([11, 0])
        XCTAssertEqual(results[1].result, .complete)
        XCTAssertEqual(results[1].completedPattern?.familyId, "CM7-D")
        XCTAssertEqual(state.buffer, [0])
    }

    func testBCDCompletesDThenA() {
        let (results, _) = playSequence([11, 0, 2])
        XCTAssertEqual(results[1].completedPattern?.familyId, "CM7-D")
        XCTAssertEqual(results[2].result, .complete)
        XCTAssertEqual(results[2].completedPattern?.familyId, "CM7-A")
    }

    func testBDCCompletesAPrime() {
        let (results, state) = playSequence([11, 2, 0])
        XCTAssertEqual(results[2].result, .complete)
        XCTAssertEqual(results[2].completedPattern?.familyId, "CM7-Ap")
        XCTAssertEqual(state.buffer, [0])
    }

    func testAppWinsOverD() {
        let (results, state) = playSequence([11, 2, 1, 11, 0])
        let completes = results.filter { $0.result == .complete }
        XCTAssertEqual(completes.count, 1)
        XCTAssertEqual(completes[0].completedPattern?.familyId, "CM7-App")
        XCTAssertEqual(state.buffer, [0])
    }

    func testABCCompletesCNotD() {
        let (results, _) = playSequence([9, 11, 0])
        XCTAssertEqual(results[1].completedPattern?.familyId, "CM7-C")
        XCTAssertNotEqual(results[2].result, .complete)
    }

    func testResync() {
        var state = EarTrainingPhrasePairEngine.createInitialState()
        state = EarTrainingPhrasePairEngine.evaluateNoteOn(state: state, pitchClass: 0, patterns: patterns).nextState
        let ev = EarTrainingPhrasePairEngine.evaluateNoteOn(state: state, pitchClass: 4, patterns: patterns)
        XCTAssertEqual(ev.result, .resync)
        XCTAssertEqual(ev.nextState.buffer, [4])
    }

    func testChordChangeClearsIncompatibleBuffer() {
        var state = EarTrainingPhrasePairEngine.createInitialState()
        state = EarTrainingPhrasePairEngine.evaluateNoteOn(state: state, pitchClass: 11, patterns: patterns).nextState
        state = EarTrainingPhrasePairEngine.evaluateNoteOn(state: state, pitchClass: 2, patterns: patterns).nextState
        state = EarTrainingPhrasePairEngine.evaluateNoteOn(state: state, pitchClass: 1, patterns: patterns).nextState
        let withoutApp = patterns.filter { $0.familyId != "CM7-App" }
        state = EarTrainingPhrasePairEngine.handleChordChange(state: state, nextPatterns: withoutApp)
        XCTAssertEqual(state.buffer, [])
    }

    func testStaffGroupsUsePatternVoicing() {
        let pattern = EarTrainingPhrasePairEngine.Pattern(
            id: "A",
            label: "A",
            pcs: [0, 2],
            familyId: "CM7-A",
            carryTailLength: 0,
            voicing: ["C4", "D4"],
            voicingStaves: [1, 1]
        )

        let groups = EarTrainingPhrasePairStaff.buildStaffGroups(pattern: pattern, chordName: "CM7")
        let correct = EarTrainingPhrasePairStaff.correctPitchClassesByGroup(pattern: pattern, buffer: [0])

        XCTAssertEqual(groups.map(\.voicing.first), [Optional("C4"), Optional("D4")])
        XCTAssertEqual(groups.first?.chordName, "CM7")
        XCTAssertEqual(groups.dropFirst().first?.chordName, "")
        XCTAssertEqual(correct[groups[0].id], Set([0]))
        XCTAssertNil(correct[groups[1].id])
    }

    func testStaffGroupsFallbackToPitchClassNames() {
        let pattern = EarTrainingPhrasePairEngine.Pattern(
            id: "fallback",
            label: "A",
            pcs: [11, 1],
            familyId: "CM7-A",
            carryTailLength: 0
        )

        let groups = EarTrainingPhrasePairStaff.buildStaffGroups(pattern: pattern, chordName: "CM7")

        XCTAssertEqual(groups.map(\.voicing.first), [Optional("B4"), Optional("C#4")])
    }
}

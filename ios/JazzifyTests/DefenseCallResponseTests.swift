import XCTest
@testable import Jazzify

final class DefenseCallResponseTests: XCTestCase {
    private let config = DefenseCallResponseConfig(audioLoopBars: 8, callResponseBars: 1)
    private let barSec = 2.0
    private let beatsPerBar = 4

    private func crStage() -> DefenseStageDefinition {
        DefenseStageDefinition(
            id: "cr-stage",
            slug: "cr",
            stageNumber: 101,
            title: "CR",
            titleEn: "CR",
            bpm: 120,
            beatsPerBar: 4,
            audioRegistrationMode: .perPhrase,
            audioUrl: nil,
            melodyAudioUrl: nil,
            progressionBars: nil,
            phraseBars: 1,
            audioLoopBars: 8,
            callResponseBars: 1,
            staffLayout: .treble,
            attackTrigger: .note,
            keyFifths: 0,
            requiredCompletionCount: 3,
            difficultyLevel: 5,
            surviveSeconds: 96,
            playerHp: 16,
            productionStaffHintMode: "always",
            productionKeyboardHintMode: "always",
            playStyle: .phrase,
            voicingKeyMode: nil,
            voicingLowestKey: nil,
            voicingStartKey: nil,
            voicingMinLowestNote: nil,
            playRootOnChordChange: false,
            phrases: [],
            progressionChords: []
        )
    }

    func testConfigFromStage() {
        XCTAssertEqual(DefenseCallResponse.config(for: crStage()), config)
        XCTAssertNil(DefenseCallResponse.config(for: crStage().withAudioLoopBars(7)))
    }

    func testBarPhaseCallAndResponse() {
        let call = DefenseCallResponse.resolve(
            config: config,
            elapsedFromPhraseStartSec: 0.5,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: nil
        )
        XCTAssertEqual(call.phase, .call)
        XCTAssertEqual(call.cue, .listen)
        XCTAssertEqual(call.enemyBehavior, .dance)
        XCTAssertFalse(call.judgeActive)

        let response = DefenseCallResponse.resolve(
            config: config,
            elapsedFromPhraseStartSec: 2.5,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: nil
        )
        XCTAssertEqual(response.phase, .response)
        XCTAssertEqual(response.cue, .play)
        XCTAssertEqual(response.enemyBehavior, .approach)
        XCTAssertTrue(response.judgeActive)
    }

    func testLeadWindow() {
        let before = DefenseCallResponse.resolve(
            config: config,
            elapsedFromPhraseStartSec: 1.969,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: nil
        )
        XCTAssertFalse(before.judgeActive)

        let atLead = DefenseCallResponse.resolve(
            config: config,
            elapsedFromPhraseStartSec: 1.97,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: nil
        )
        XCTAssertTrue(atLead.judgeActive)
    }

    func testTransitionWait() {
        let wait = DefenseCallResponse.resolve(
            config: config,
            elapsedFromPhraseStartSec: 5.5,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: 6
        )
        XCTAssertEqual(wait.phase, .transitionWait)
        XCTAssertEqual(wait.enemyBehavior, .pause)
        XCTAssertNil(wait.cue)
        XCTAssertFalse(wait.judgeActive)

        let after = DefenseCallResponse.resolve(
            config: config,
            elapsedFromPhraseStartSec: 6,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: 6
        )
        XCTAssertEqual(after.phase, .call)
        XCTAssertEqual(after.enemyBehavior, .dance)
    }

    func testPlanNextBarSwitchSkipsImmediateBeatWindow() {
        let transportStart = 10.0
        let next = DefenseTransport.planNextBarSwitch(now: 11.2, transportStart: transportStart, barSec: barSec)
        XCTAssertEqual(next, 12.0, accuracy: 1e-9)
        let late = DefenseTransport.planNextBarSwitch(now: 11.95, transportStart: transportStart, barSec: barSec)
        XCTAssertEqual(late, 12.0, accuracy: 1e-9)
    }

    func testTransitionEndBarIndex() {
        XCTAssertEqual(DefenseCallResponse.transitionEndBarIndex(elapsedFromPhraseStartSec: 5.5, barSec: barSec), 3)
        XCTAssertEqual(DefenseCallResponse.transitionEndBarIndex(elapsedFromPhraseStartSec: 0, barSec: barSec), 1)
    }

    func testDanceFramePicksCycle() {
        let frame0 = DefenseEnemyConfig.pickFrame(
            elapsedSec: 0,
            slotIndex: 0,
            moving: false,
            flying: false,
            attacking: false,
            enemyBehavior: .dance,
            danceBeatPhase: 0.25
        )
        let frame1 = DefenseEnemyConfig.pickFrame(
            elapsedSec: 0,
            slotIndex: 1,
            moving: false,
            flying: false,
            attacking: false,
            enemyBehavior: .dance,
            danceBeatPhase: 0.25
        )
        XCTAssertTrue(DefenseEnemyFrame.danceCycle.contains(frame0))
        XCTAssertTrue(DefenseEnemyFrame.danceCycle.contains(frame1))
        XCTAssertNotEqual(frame0, frame1)
    }

    func testResetProgressKeepsCompletionCount() {
        var state = DefensePhraseJudge.createInitialState(phrases: [])
        state.completionCount = 2
        state.chordIndex = 1
        state.correctNoteIndices = [0, 1]
        let reset = DefensePhraseJudge.resetProgressForNextCycle(state)
        XCTAssertEqual(reset.completionCount, 2)
        XCTAssertEqual(reset.chordIndex, 0)
        XCTAssertTrue(reset.correctNoteIndices.isEmpty)
    }

    func testStageDefinitionBackwardCompatibleInit() {
        let stage = DefenseStageDefinition(
            id: "legacy",
            slug: "legacy",
            stageNumber: 1,
            title: "T",
            titleEn: "T",
            bpm: 120,
            beatsPerBar: 4,
            audioRegistrationMode: .perPhrase,
            audioUrl: nil,
            melodyAudioUrl: nil,
            progressionBars: nil,
            phraseBars: 1,
            staffLayout: .treble,
            attackTrigger: .note,
            keyFifths: 0,
            requiredCompletionCount: 1,
            difficultyLevel: 1,
            surviveSeconds: 60,
            playerHp: 10,
            productionStaffHintMode: "always",
            productionKeyboardHintMode: "always",
            playStyle: .phrase,
            voicingKeyMode: nil,
            voicingLowestKey: nil,
            voicingStartKey: nil,
            voicingMinLowestNote: nil,
            playRootOnChordChange: false,
            phrases: [],
            progressionChords: []
        )
        XCTAssertNil(stage.audioLoopBars)
        XCTAssertNil(stage.callResponseBars)
        XCTAssertNil(DefenseCallResponse.config(for: stage))
    }
}

private extension DefenseStageDefinition {
    func withAudioLoopBars(_ bars: Int) -> DefenseStageDefinition {
        DefenseStageDefinition(
            id: id,
            slug: slug,
            stageNumber: stageNumber,
            title: title,
            titleEn: titleEn,
            bpm: bpm,
            beatsPerBar: beatsPerBar,
            audioRegistrationMode: audioRegistrationMode,
            audioUrl: audioUrl,
            melodyAudioUrl: melodyAudioUrl,
            progressionBars: progressionBars,
            phraseBars: phraseBars,
            audioLoopBars: bars,
            callResponseBars: callResponseBars,
            staffLayout: staffLayout,
            attackTrigger: attackTrigger,
            keyFifths: keyFifths,
            requiredCompletionCount: requiredCompletionCount,
            difficultyLevel: difficultyLevel,
            surviveSeconds: surviveSeconds,
            playerHp: playerHp,
            productionStaffHintMode: productionStaffHintMode,
            productionKeyboardHintMode: productionKeyboardHintMode,
            playStyle: playStyle,
            voicingKeyMode: voicingKeyMode,
            voicingLowestKey: voicingLowestKey,
            voicingStartKey: voicingStartKey,
            voicingMinLowestNote: voicingMinLowestNote,
            playRootOnChordChange: playRootOnChordChange,
            phrases: phrases,
            progressionChords: progressionChords
        )
    }
}
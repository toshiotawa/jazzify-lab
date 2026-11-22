import SpriteKit
import XCTest
@testable import Jazzify

final class DefenseCallResponseTests: XCTestCase {
    private let config8x1 = DefenseCallResponseConfig(
        audioLoopBars: 8,
        callBars: 1,
        responseBars: 1,
        cycleBars: 2
    )
    private let config4x1x3 = DefenseCallResponseConfig(
        audioLoopBars: 4,
        callBars: 1,
        responseBars: 3,
        cycleBars: 4
    )
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
            callResponseResponseBars: nil,
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
        XCTAssertEqual(DefenseCallResponse.config(for: crStage()), config8x1)
        XCTAssertNil(DefenseCallResponse.config(for: crStage().withAudioLoopBars(7)))
    }

    func testConfig1c3() {
        let stage = crStage().withLoopAndResponse(audioLoopBars: 4, responseBars: 3)
        XCTAssertEqual(DefenseCallResponse.config(for: stage), config4x1x3)
    }

    func testBarPhaseCallAndResponse() {
        let call = DefenseCallResponse.resolve(
            config: config8x1,
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
            config: config8x1,
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

    func testLoopIndexOnWrap() {
        let snap = DefenseCallResponse.resolve(
            config: config4x1x3,
            elapsedFromPhraseStartSec: 8,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: nil
        )
        XCTAssertEqual(snap.loopIndex, 1)
        XCTAssertEqual(snap.phase, .call)
    }

    func testLeadWindow() {
        let before = DefenseCallResponse.resolve(
            config: config8x1,
            elapsedFromPhraseStartSec: 1.969,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: nil
        )
        XCTAssertFalse(before.judgeActive)

        let atLead = DefenseCallResponse.resolve(
            config: config8x1,
            elapsedFromPhraseStartSec: 1.97,
            barSec: barSec,
            beatsPerBar: beatsPerBar,
            transitionWaitUntilElapsedSec: nil
        )
        XCTAssertTrue(atLead.judgeActive)
    }

    func testTransitionWait() {
        let wait = DefenseCallResponse.resolve(
            config: config8x1,
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
            config: config8x1,
            elapsedFromPhraseStartSec: 8,
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

        let danceOverridesAttack = DefenseEnemyConfig.pickFrame(
            elapsedSec: 0,
            slotIndex: 0,
            moving: false,
            flying: false,
            attacking: true,
            enemyBehavior: .dance,
            danceBeatPhase: 0.25
        )
        XCTAssertTrue(DefenseEnemyFrame.danceCycle.contains(danceOverridesAttack))

        let pauseOverridesAttack = DefenseEnemyConfig.pickFrame(
            elapsedSec: 0,
            slotIndex: 0,
            moving: true,
            flying: true,
            attacking: true,
            enemyBehavior: .pause,
            danceBeatPhase: 0.25
        )
        XCTAssertEqual(pauseOverridesAttack, .idle)
    }

    func testTutorialConstantsMatchCallResponseSpec() {
        XCTAssertEqual(DefenseTutorialConstants.bpm, 60)
        XCTAssertEqual(DefenseTutorialConstants.audioLoopBars, 8)
        XCTAssertEqual(DefenseTutorialConstants.callResponseBars, 1)
        XCTAssertEqual(DefenseTutorialConstants.loopSec, 32, accuracy: 1e-9)
        XCTAssertEqual(
            DefenseTutorialConstants.audioUrl,
            "https://jazzify-cdn.com/sozai/defense-call-response/defense-tutorial-call-response-cde-bpm60.mp3"
        )
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

    func testClearTargetMinimumNotes() {
        let difficulty = DefenseDifficultyDefinition(
            level: 5,
            enemyHp: 3,
            spawnIntervalSec: 2,
            maxEnemies: 6,
            enemySpeedPxPerSec: 64,
            enemyDamage: 2,
            attackIntervalSec: 2,
            attackRangePx: 52
        )
        let phrase = DefensePhraseDefinition(
            id: "p",
            orderIndex: 0,
            title: "t",
            audioUrl: "",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "c",
                    orderIndex: 0,
                    chordName: "Dm7",
                    measureNumber: 1,
                    notes: (0..<6).map { idx in
                        SurvivalPhraseChordNote(
                            orderIndex: idx,
                            pitchMidi: 60 + idx,
                            pitchClass: idx % 12,
                            noteName: "C4",
                            staff: 1,
                            stepIndex: idx,
                            staffChordName: nil
                        )
                    }
                )
            ]
        )
        let stage = crStage()
        let target = DefenseCallResponseCombat.clearTarget(
            stage: stage,
            phrases: [phrase],
            difficulty: difficulty
        )
        XCTAssertNotNil(target)
        XCTAssertGreaterThan(target ?? 0, 0)
    }

    func testAvatarContainerNamedSpritesNotShadowedByCueNode() {
        let player = EarTrainingBattleStageKit.makeAvatarContainer(
            assetName: DefensePlayerPose.idleAssetNames[0],
            position: .zero,
            isPlayer: true
        )
        let cueNode = SKSpriteNode()
        cueNode.zPosition = 7
        player.addChild(cueNode)

        let bodySprite = player.childNode(withName: EarTrainingBattleStageKit.avatarSpriteNodeName) as? SKSpriteNode
        let rimSprite = player.childNode(withName: EarTrainingBattleStageKit.avatarRimNodeName) as? SKSpriteNode

        XCTAssertNotNil(bodySprite)
        XCTAssertNotNil(rimSprite)
        XCTAssertTrue(bodySprite !== cueNode)
        XCTAssertTrue(rimSprite !== cueNode)
        XCTAssertTrue(bodySprite !== rimSprite)
        XCTAssertEqual(rimSprite?.blendMode, .add)
        XCTAssertNotEqual(bodySprite?.blendMode, .add)
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
            callResponseResponseBars: callResponseResponseBars,
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

    func withLoopAndResponse(audioLoopBars: Int, responseBars: Int) -> DefenseStageDefinition {
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
            audioLoopBars: audioLoopBars,
            callResponseBars: 1,
            callResponseResponseBars: responseBars,
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
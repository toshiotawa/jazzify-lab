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

    func testTierPresetClampAndStarRank() {
        XCTAssertEqual(DefenseCallResponseTier.clampTierLevel(0), 1)
        XCTAssertEqual(DefenseCallResponseTier.clampTierLevel(3), 3)
        XCTAssertEqual(DefenseCallResponseTier.clampTierLevel(9), 5)
        XCTAssertEqual(DefenseCallResponseTier.tierPreset(for: 1).enemyHp, 2)
        XCTAssertEqual(DefenseCallResponseTier.tierPreset(for: 5).maxEnemies, 10)
        XCTAssertEqual(DefenseCallResponseTier.starRank(playerHp: 16, playerMaxHp: 16), 3)
        XCTAssertEqual(DefenseCallResponseTier.starRank(playerHp: 9, playerMaxHp: 16), 2)
        XCTAssertEqual(DefenseCallResponseTier.starRank(playerHp: 4, playerMaxHp: 16), 1)
        XCTAssertEqual(DefenseCallResponseTier.formatStarRank(2), "★★☆")
    }

    func testBuildBaseDifficultyMeasureTriggerHalvesHp() {
        let stage = crStage().withAttackTrigger(.measure)
        let difficulty = DefenseCallResponseTier.buildBaseDifficulty(
            tierLevel: 5,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            phraseBars: stage.phraseBars,
            attackTrigger: .measure,
            phrases: []
        )
        XCTAssertEqual(difficulty.enemyHp, 3)
    }

    func testSparse2Bar7NoteClearGuardAllTiers() {
        let sparsePhrase = DefensePhraseDefinition(
            id: "sp",
            orderIndex: 0,
            title: "sparse",
            audioUrl: "",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: 3,
            chords: [
                SurvivalPhraseChord(
                    id: "c",
                    orderIndex: 0,
                    chordName: "Dm7",
                    measureNumber: 1,
                    notes: (0..<7).map { idx in
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
        let stage = DefenseStageDefinition(
            id: "s-sparse",
            slug: "s-sparse",
            stageNumber: 1,
            title: "Sparse",
            titleEn: "Sparse",
            bpm: 120,
            beatsPerBar: 4,
            audioRegistrationMode: .perPhrase,
            audioUrl: nil,
            melodyAudioUrl: nil,
            progressionBars: nil,
            phraseBars: 2,
            audioLoopBars: 8,
            callResponseBars: 2,
            callResponseResponseBars: 6,
            callResponseLaps: 1,
            staffLayout: .treble,
            attackTrigger: .note,
            keyFifths: 0,
            requiredCompletionCount: 3,
            difficultyLevel: 5,
            surviveSeconds: 120,
            playerHp: 16,
            productionStaffHintMode: "always",
            productionKeyboardHintMode: "always",
            playStyle: .phrase,
            voicingKeyMode: nil,
            voicingLowestKey: nil,
            voicingStartKey: nil,
            voicingMinLowestNote: nil,
            playRootOnChordChange: false,
            phrases: [sparsePhrase, sparsePhrase, sparsePhrase, sparsePhrase],
            progressionChords: []
        )
        let scale = DefenseCallResponseTier.phraseDensityScale(
            phrases: stage.phrases,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            phraseBars: stage.phraseBars,
            attackTrigger: .note
        )
        XCTAssertLessThan(scale, 0.75)

        for tier in 1...5 {
            let guarded = DefenseCallResponseClearGuard.resolveGuardedDifficulty(
                stage: stage,
                phrases: stage.phrases,
                tierLevel: tier
            )
            XCTAssertGreaterThanOrEqual(guarded.enemySpeedPxPerSec, 2)
        }
    }

    func testAntiWhiffInstantRespawnOnSameFrameSlash() {
        let diff = DefenseDifficultyDefinition(
            level: 1,
            enemyHp: 1,
            spawnIntervalSec: 5,
            maxEnemies: 4,
            enemySpeedPxPerSec: 40,
            enemyDamage: 1,
            attackIntervalSec: 2,
            attackRangePx: 50
        )
        var runtime = DefenseRuntimeState(
            playerHp: 10,
            surviveSeconds: 120,
            maxEnemies: 4,
            practiceMode: false,
            tutorial: nil,
            attackTrigger: .note
        )
        runtime.callResponseActive = true
        runtime.targetEnemiesDefeated = 5
        DefenseGameLoop.spawnCallResponseInitialEnemy(runtime: &runtime, difficulty: diff)
        XCTAssertTrue(DefenseGameLoop.performSlash(runtime: &runtime, difficulty: diff))
        XCTAssertEqual(runtime.enemiesDefeated, 1)
        XCTAssertEqual(runtime.enemies.filter(\.isActive).count, 1)
        XCTAssertTrue(DefenseGameLoop.performSlash(runtime: &runtime, difficulty: diff))
        XCTAssertEqual(runtime.enemiesDefeated, 2)
    }

    func testResolveEffectiveDifficultyGatedByMarketingVersion() {
        let stage = crStage()
        let legacyDiff = DefenseDifficultyDefinition(
            level: 5,
            enemyHp: 3,
            spawnIntervalSec: 2,
            maxEnemies: 6,
            enemySpeedPxPerSec: 64,
            enemyDamage: 2,
            attackIntervalSec: 2,
            attackRangePx: 52
        )
        let oldVer = DefenseCallResponseCombat.resolveEffectiveDifficulty(
            stage: stage,
            phrases: stage.phrases,
            fetchedDifficulty: legacyDiff,
            marketingVersion: "1.5.1"
        )
        XCTAssertFalse(oldVer.usesTierPath)
        let newVer = DefenseCallResponseCombat.resolveEffectiveDifficulty(
            stage: stage,
            phrases: stage.phrases,
            fetchedDifficulty: legacyDiff,
            marketingVersion: "1.5.2"
        )
        XCTAssertTrue(newVer.usesTierPath)
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

    func testDescentLayoutStageNodesFiltersToAdvancedTierOnly() {
        let basicBlockId = UUID()
        let advBlock1Id = UUID()
        let advBlock2Id = UUID()
        let blocks: [PlayMapBlock] = [
            PlayMapBlock(id: basicBlockId, mode: .defense, tier: .basic, blockKey: "intro", label: "基本", labelEn: "Basic", sortOrder: 0),
            PlayMapBlock(id: advBlock2Id, mode: .defense, tier: .advanced, blockKey: "floor-2", label: "第2階層", labelEn: "Floor 2", sortOrder: 1),
            PlayMapBlock(id: advBlock1Id, mode: .defense, tier: .advanced, blockKey: "intro", label: "はじめに", labelEn: "Intro", sortOrder: 0),
        ]
        let basicStageId = UUID()
        let tutorialId = UUID()
        let stage11Id = UUID()
        let stage12Id = UUID()
        let stage21Id = UUID()
        let nodes: [PlayMapNode] = [
            PlayMapNode(id: basicStageId, blockId: basicBlockId, sortOrder: 0, nodeKind: .stage, survivalMapCategory: nil, survivalStageNumber: nil, defenseStageId: "stage-basic", lessonId: nil, title: "フレーズ I", titleEn: "Phrase I", requiredRank: .C, difficultyLevel: 4, tutorialKey: nil),
            PlayMapNode(id: tutorialId, blockId: advBlock1Id, sortOrder: -1, nodeKind: .tutorial, survivalMapCategory: nil, survivalStageNumber: nil, defenseStageId: nil, lessonId: nil, title: "はじめての設定", titleEn: "Setup", requiredRank: .C, difficultyLevel: nil, tutorialKey: "defense-input-setup-v1"),
            PlayMapNode(id: stage12Id, blockId: advBlock1Id, sortOrder: 1, nodeKind: .stage, survivalMapCategory: nil, survivalStageNumber: nil, defenseStageId: "stage-1-2", lessonId: nil, title: "ステージ 1-2", titleEn: "Stage 1-2", requiredRank: .C, difficultyLevel: 2, tutorialKey: nil),
            PlayMapNode(id: stage11Id, blockId: advBlock1Id, sortOrder: 0, nodeKind: .stage, survivalMapCategory: nil, survivalStageNumber: nil, defenseStageId: "stage-1-1", lessonId: nil, title: "ステージ 1-1", titleEn: "Stage 1-1", requiredRank: .C, difficultyLevel: 1, tutorialKey: nil),
            PlayMapNode(id: stage21Id, blockId: advBlock2Id, sortOrder: 0, nodeKind: .stage, survivalMapCategory: nil, survivalStageNumber: nil, defenseStageId: "stage-2-1", lessonId: nil, title: "ステージ 2-1", titleEn: "Stage 2-1", requiredRank: .C, difficultyLevel: 5, tutorialKey: nil),
        ]

        let layout = DefenseDescentLayoutBuilder.build(blocks: blocks, nodes: nodes, tier: .advanced)
        XCTAssertEqual(layout.stageNodes.map(\.id), [stage11Id, stage12Id, stage21Id])
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

    func withAttackTrigger(_ trigger: DefenseAttackTrigger) -> DefenseStageDefinition {
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
            callResponseBars: callResponseBars,
            callResponseResponseBars: callResponseResponseBars,
            callResponseLaps: callResponseLaps,
            staffLayout: staffLayout,
            attackTrigger: trigger,
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
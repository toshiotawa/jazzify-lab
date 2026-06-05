import Foundation

enum BalloonRushSurvivalBridge {
    /// 準備シート・結果画面・HUD 用の synthetic ステージ（`mapCategory: lesson`）。
    static func presentationStage(
        from br: BalloonRushStageDefinition,
        allowedChordIds: [String]? = nil
    ) -> SurvivalStageDefinition {
        let stageType: SurvivalStageType = br.stageType == .progression ? .progression : .random
        let allowed = allowedChordIds ?? br.resolvedAllowedChordIds()
        let chords = allowed.isEmpty ? ["Dm7"] : allowed
        return SurvivalStageDefinition(
            mapCategory: .lesson,
            stageNumber: 9902,
            stageType: stageType,
            nameJa: br.title,
            nameEn: br.titleEn.isEmpty ? br.title : br.titleEn,
            difficulty: .easy,
            chordSuffix: br.chordSuffix,
            chordDisplayJa: br.chordSuffix,
            chordDisplayEn: br.chordSuffix,
            rootPattern: nil,
            rootPatternJa: "",
            rootPatternEn: "",
            allowedChords: chords,
            blockKey: "balloon_rush",
            isMixedStage: false,
            chordProgression: br.chordProgression,
            lessonOnly: true,
            compositePhraseSources: nil,
            compositePhraseBossType: nil,
            compositePhraseKeyFifths: nil,
            compositePhraseBgmUrl: nil,
            productionStaffHintMode: br.productionStaffHintMode,
            productionKeyboardHintMode: br.productionKeyboardHintMode,
            hideChordNamesInBattle: br.hideChordNamesInBattle
        )
    }

    static func scenarioOverrides(for stage: BalloonRushStageDefinition) -> SurvivalScenarioOverrides {
        let sightReadingRandom = stage.stageType == .random && stage.hideChordNamesInBattle
        var o = SurvivalScenarioOverrides()
        o.isActive = true
        o.hideStatusStrip = true
        o.hidePlayerHpBar = true
        o.hideChordSlots = true
        o.hideComboBadge = true
        o.hideKillCounter = true
        o.hideTimerDisplay = true
        o.hideStaff = false
        o.scenarioStaffClef = stage.stageType == .progression ? 2 : 1
        o.playerInvincible = true
        o.disableEnemyAttacks = true
        o.suppressAutoSpawn = true
        o.useChordMidiNotesForHintHighlights = stage.stageType == .progression || sightReadingRandom
        return o
    }

    static func scenarioOverrides(for stageType: SurvivalStageType) -> SurvivalScenarioOverrides {
        var o = SurvivalScenarioOverrides()
        o.isActive = true
        o.hideStatusStrip = true
        o.hidePlayerHpBar = true
        o.hideChordSlots = true
        o.hideComboBadge = true
        o.hideKillCounter = true
        o.hideTimerDisplay = true
        o.hideStaff = false
        o.scenarioStaffClef = stageType == .progression ? 2 : 1
        o.playerInvincible = true
        o.disableEnemyAttacks = true
        o.suppressAutoSpawn = true
        o.useChordMidiNotesForHintHighlights = stageType == .progression
        return o
    }

    @MainActor
    static func makeUISnapshot(
        from loop: BalloonRushGameLoop,
        stage: SurvivalStageDefinition,
        hintSlotIndex: Int?
    ) -> SurvivalUISnapshot {
        let snap = loop.makeUISnapshot()
        let phase: SurvivalStagePhase = {
            switch snap.phase {
            case .playing: return .playing
            case .cleared: return .cleared
            case .failed: return .gameOver
            }
        }()
        let staffOpacity = snap.unpressedNoteOpacity
        return SurvivalUISnapshot(
            phase: phase,
            hintMode: snap.hintMode,
            stageType: stage.stageType,
            hp: loop.player.hp,
            maxHp: loop.player.maxHp,
            remainingSecondsCoarse: snap.timeLeftSec,
            enemiesDefeated: loop.poppedCount,
            elapsedSecondsRounded: Int(loop.elapsedSeconds.rounded()),
            statusEffectStrip: [],
            slots: snap.slots,
            hintSlotIndex: hintSlotIndex,
            staffPhase: staffOpacity == 0 ? .pressedOnly : .fullHint,
            unpressedNoteOpacity: staffOpacity,
            comboCount: 0,
            scenario: scenarioOverrides(for: loop.stage).toRuntimeState()
        )
    }

    @MainActor
    static func makeRuntime(
        from loop: BalloonRushGameLoop,
        stage: SurvivalStageDefinition
    ) -> SurvivalStageRuntime {
        var runtime = SurvivalStageRuntime(
            stage: stage,
            hintMode: loop.hintMode,
            player: loop.player,
            slots: loop.slots
        )
        runtime.enemies = []
        runtime.elapsedSeconds = loop.elapsedSeconds
        runtime.remainingSeconds = TimeInterval(loop.stage.timeLimitSec) - loop.elapsedSeconds
        runtime.enemiesDefeated = loop.poppedCount
        runtime.phase = {
            switch loop.phase {
            case .playing: return .playing
            case .cleared: return .cleared
            case .failed: return .gameOver
            }
        }()
        runtime.jajii = loop.jajii
        runtime.scenario = scenarioOverrides(for: loop.stage).toRuntimeState()
        runtime.shockwaves = loop.shockwaves
        runtime.balloonRushBalloons = loop.balloons.filter { !$0.popped }.map {
            SurvivalBalloonRenderState(
                id: $0.id,
                x: $0.x,
                y: $0.y,
                visible: true
            )
        }
        return runtime
    }
}

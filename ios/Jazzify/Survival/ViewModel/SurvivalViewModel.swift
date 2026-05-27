import Combine
import Foundation
import QuartzCore

/// SwiftUI が購読する UI 状態のみ。ゲームループの生 `runtime` はここに載せない。
@MainActor
final class SurvivalViewModel: ObservableObject {
    @Published private(set) var uiSnapshot: SurvivalUISnapshot
    @Published private(set) var bossHud: SurvivalBossHUDSnapshot?
    @Published private(set) var isPaused: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []
    @Published private(set) var clearReportInFlight: Bool = false
    @Published private(set) var clearReportError: String?
    @Published private(set) var sceneRestartGeneration: Int = 0
    @Published private(set) var isBossStage: Bool
    /// 鍵盤ヒント用。`SurvivalChordPadView` へ渡す MIDI 集合。
    @Published private(set) var chordPadHintMidis: Set<Int> = []
    /// HINT 構成音のうち、現在のスロット入力で満たされた pitch class に対応するハイライト MIDI。
    @Published private(set) var chordPadCompletedHintMidis: Set<Int> = []
    @Published private(set) var chordPadHintPendingOpacity: CGFloat = 1
    @Published private(set) var phraseStaffSnapshot: SurvivalPhraseStaffSnapshot?
    @Published private(set) var chordPadScrollAnchorMidi: Int?

    private var lastBossHudPublishAt: TimeInterval = 0

    init(
        uiSnapshot: SurvivalUISnapshot,
        bossHud: SurvivalBossHUDSnapshot?,
        isBossStage: Bool,
        chordPadHintMidis: Set<Int>,
        chordPadCompletedHintMidis: Set<Int>,
        chordPadHintPendingOpacity: CGFloat,
        chordPadScrollAnchorMidi: Int?,
        now: TimeInterval
    ) {
        self.uiSnapshot = uiSnapshot
        self.bossHud = bossHud
        self.isBossStage = isBossStage
        self.chordPadHintMidis = chordPadHintMidis
        self.chordPadCompletedHintMidis = chordPadCompletedHintMidis
        self.chordPadHintPendingOpacity = chordPadHintPendingOpacity
        self.chordPadScrollAnchorMidi = chordPadScrollAnchorMidi
        self.lastBossHudPublishAt = now
    }

    func registerMidiKeyDown(_ midi: Int) {
        guard midiHeldKeys.insert(midi).inserted else { return }
    }

    func registerMidiKeyUp(_ midi: Int) {
        guard midiHeldKeys.remove(midi) != nil else { return }
    }

    func clearMidiHeldKeys() {
        midiHeldKeys.removeAll()
    }

    func togglePause() {
        isPaused.toggle()
    }

    func prepareForSceneRestart() {
        sceneRestartGeneration &+= 1
    }

    func resetClearReportState() {
        clearReportInFlight = false
        clearReportError = nil
    }

    func syncPhraseStaff(from gameLoop: SurvivalGameLoop) {
        let next = gameLoop.phraseStaffSnapshot()
        if next != phraseStaffSnapshot {
            phraseStaffSnapshot = next
        }
    }

    func syncKeyboardScrollAnchor(from gameLoop: SurvivalGameLoop) {
        let nextScrollAnchor = gameLoop.keyboardScrollAnchorMidi
        if nextScrollAnchor != chordPadScrollAnchorMidi {
            chordPadScrollAnchorMidi = nextScrollAnchor
        }
    }

    func beginSupabaseClearReport() -> Bool {
        guard !clearReportInFlight else { return false }
        clearReportInFlight = true
        return true
    }

    func endSupabaseClearReport(error: String?) {
        clearReportError = error
        clearReportInFlight = false
    }

    /// `SKScene.update` の末尾で呼び、HUD / スロット用スナップショットだけ更新する。
    func syncAfterFrame(gameLoop: SurvivalGameLoop, now: TimeInterval) {
        let nextSnapshot = SurvivalUISnapshot.make(from: gameLoop.runtime, hintSlotIndex: gameLoop.currentHintSlotIndex)
        let phaseChanged = nextSnapshot.phase != uiSnapshot.phase
        if nextSnapshot != uiSnapshot {
            uiSnapshot = nextSnapshot
        }

        let nextHints = gameLoop.currentHintHighlightMidis()
        if nextHints != chordPadHintMidis {
            chordPadHintMidis = nextHints
        }

        let nextCompletedHints = gameLoop.currentHintCompletedHighlightMidis()
        if nextCompletedHints != chordPadCompletedHintMidis {
            chordPadCompletedHintMidis = nextCompletedHints
        }

        let nextHintOpacity = gameLoop.currentKeyboardHintPendingOpacity()
        if nextHintOpacity != chordPadHintPendingOpacity {
            chordPadHintPendingOpacity = nextHintOpacity
        }

        syncPhraseStaff(from: gameLoop)
        syncKeyboardScrollAnchor(from: gameLoop)

        let forceBossHud = gameLoop.runtime.phase != .playing || phaseChanged
        let nextBossHud = gameLoop.bossBattle.map(Self.makeBossHudSnapshot(from:))
        let throttle: TimeInterval = 1.0 / 15.0
        if forceBossHud || nextBossHud != bossHud || now - lastBossHudPublishAt >= throttle {
            if nextBossHud != bossHud {
                bossHud = nextBossHud
            }
            lastBossHudPublishAt = now
        }
    }

    func syncBalloonRush(
        uiSnapshot nextSnapshot: SurvivalUISnapshot,
        chordPadHintMidis nextHints: Set<Int>,
        chordPadCompletedHintMidis nextCompletedHints: Set<Int>,
        chordPadHintPendingOpacity nextHintOpacity: CGFloat
    ) {
        if nextSnapshot != uiSnapshot {
            uiSnapshot = nextSnapshot
        }
        if nextHints != chordPadHintMidis {
            chordPadHintMidis = nextHints
        }
        if nextCompletedHints != chordPadCompletedHintMidis {
            chordPadCompletedHintMidis = nextCompletedHints
        }
        if nextHintOpacity != chordPadHintPendingOpacity {
            chordPadHintPendingOpacity = nextHintOpacity
        }
    }

    func applyFullReset(from gameLoop: SurvivalGameLoop, now: TimeInterval) {
        isBossStage = gameLoop.isBossStage
        uiSnapshot = SurvivalUISnapshot.make(from: gameLoop.runtime, hintSlotIndex: gameLoop.currentHintSlotIndex)
        bossHud = gameLoop.bossBattle.map(Self.makeBossHudSnapshot(from:))
        lastBossHudPublishAt = now
        chordPadHintMidis = gameLoop.currentHintHighlightMidis()
        chordPadCompletedHintMidis = gameLoop.currentHintCompletedHighlightMidis()
        chordPadHintPendingOpacity = gameLoop.currentKeyboardHintPendingOpacity()
        syncPhraseStaff(from: gameLoop)
        chordPadScrollAnchorMidi = gameLoop.keyboardScrollAnchorMidi
        isPaused = false
        clearMidiHeldKeys()
        resetClearReportState()
    }

    private static func makeBossHudSnapshot(from battle: SurvivalBossBattleState) -> SurvivalBossHUDSnapshot {
        SurvivalBossHUDSnapshot(
            hp: battle.boss.hp,
            maxHp: battle.boss.maxHp,
            phase: battle.boss.phase,
            result: battle.result,
            isDefeating: battle.defeatedAt != nil
        )
    }
}

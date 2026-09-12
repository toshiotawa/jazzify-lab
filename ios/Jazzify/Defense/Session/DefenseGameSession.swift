import Combine
import Foundation
import QuartzCore
import SpriteKit

/// レッスン課題としての起動コンテキスト（本番クリア時に進捗を記録する）。
struct DefenseLessonContext: Sendable {
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
}

/// SwiftUI が購読する低頻度 HUD 状態。毎フレームではなく値が変わったときだけ publish する。
struct DefenseHudState: Equatable {
    var playerHp: Int
    var playerMaxHp: Int
    var remainSec: Int
    var elapsedInt: Int
    var result: DefenseGameResult
}

@MainActor
final class DefenseGameSession: ObservableObject {
    /// 毎フレーム更新される実行時状態。SpriteKit の `update` から直接参照し、publish しない。
    private(set) var runtime: DefenseRuntimeState
    @Published private(set) var judgeState: DefensePhraseJudgeState
    @Published private(set) var hud: DefenseHudState
    @Published private(set) var midiHeldKeys: Set<Int> = []
    @Published private(set) var practiceSpeedPercent = 100

    let stage: DefenseStageDefinition
    let difficulty: DefenseDifficultyDefinition
    let practiceMode: Bool
    private let lessonContext: DefenseLessonContext?

    private var lastSwitchGeneration: UInt64 = 0
    private var pendingSwitchPhraseIndex: Int?
    private var lastFrameTime: TimeInterval?
    private var resultHandled = false
    var isPaused = false
    private let midiSubscriptionHolder = MIDISubscriptionHolder()
    private var lastVoicePcAtMs: [Int: Double] = [:]
    private static let voiceSamePcDebounceMs: Double = 120

    init(
        stage: DefenseStageDefinition,
        difficulty: DefenseDifficultyDefinition,
        practiceMode: Bool,
        lessonContext: DefenseLessonContext?
    ) {
        self.stage = stage
        self.difficulty = difficulty
        self.practiceMode = practiceMode
        self.lessonContext = lessonContext
        let runtime = DefenseRuntimeState(
            playerHp: stage.playerHp,
            surviveSeconds: TimeInterval(stage.surviveSeconds),
            maxEnemies: difficulty.maxEnemies,
            practiceMode: practiceMode
        )
        self.runtime = runtime
        self.judgeState = DefensePhraseJudge.createInitialState(phrases: stage.phrases)
        self.hud = DefenseHudState(
            playerHp: runtime.playerHp,
            playerMaxHp: runtime.playerMaxHp,
            remainSec: Int(runtime.surviveSeconds),
            elapsedInt: 0,
            result: .playing
        )
    }

    func start() async {
        subscribeMidi()
        guard let first = stage.phrases.first,
              let firstUrl = URL(string: first.audioUrl)
        else { return }
        DefenseBackingAudio.shared.setTransportConfig(bpm: stage.bpm, beatsPerBar: stage.beatsPerBar)
        let urls: [URL]
        if practiceMode {
            urls = stage.phrases.compactMap { URL(string: $0.audioUrl) }
        } else {
            urls = [firstUrl] + (stage.phrases.count > 1
                ? stage.phrases[1...].prefix(1).compactMap { URL(string: $0.audioUrl) }
                : [])
        }
        try? await DefenseBackingAudio.shared.preload(urls: urls)
        DefenseBackingAudio.shared.setPlaybackRate(1)
        try? await DefenseBackingAudio.shared.start(firstUrl: firstUrl)
    }

    func stepPhrase(_ delta: Int) {
        guard practiceMode, stage.phrases.count > 1 else { return }
        let currentIndex = judgeState.phraseIndex
        let nextIndex = (currentIndex + delta + stage.phrases.count) % stage.phrases.count
        pendingSwitchPhraseIndex = nil
        judgeState = DefensePhraseJudge.resetToPhraseIndex(nextIndex, phrases: stage.phrases)
        guard let url = URL(string: stage.phrases[nextIndex].audioUrl) else { return }
        Task {
            try? await DefenseBackingAudio.shared.start(firstUrl: url)
        }
    }

    func stepSpeed(_ delta: Int) {
        guard practiceMode else { return }
        let nextSpeed = DefensePracticeSpeed.stepped(practiceSpeedPercent, delta: delta)
        guard nextSpeed != practiceSpeedPercent else { return }
        practiceSpeedPercent = nextSpeed
        let ratio = Float(DefensePracticeSpeed.ratio(nextSpeed))
        DefenseBackingAudio.shared.setPlaybackRate(ratio)
        DefenseBackingAudio.shared.setTransportConfig(
            bpm: stage.bpm * DefensePracticeSpeed.ratio(nextSpeed),
            beatsPerBar: stage.beatsPerBar
        )
    }

    func stop() {
        midiSubscriptionHolder.cancel()
        midiHeldKeys.removeAll()
        DefenseBackingAudio.shared.stop()
    }

    private func subscribeMidi() {
        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = NoteInputManager.shared.subscribe { [weak self] status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            let isNoteOn = messageType == 0x90 && velocity > 0
            let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
            DispatchQueue.main.async {
                guard let self else { return }
                let playPiano = !NoteInputManager.shared.isVoiceInputActive
                if isNoteOn {
                    if playPiano {
                        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: note, velocity: velocity)
                    }
                    self.registerMidiKeyDown(note)
                    self.handleNoteOn(
                        pitchClass: ((note % 12) + 12) % 12,
                        sequential: NoteInputManager.shared.isVoiceInputActive
                    )
                } else if isNoteOff {
                    self.registerMidiKeyUp(note)
                    if playPiano {
                        SurvivalGameAudio.shared.pianoNoteOff(midi: note)
                    }
                }
            }
        }
    }

    func registerMidiKeyDown(_ midi: Int) {
        guard midiHeldKeys.insert(midi).inserted else { return }
    }

    func registerMidiKeyUp(_ midi: Int) {
        guard midiHeldKeys.remove(midi) != nil else { return }
    }

    func handleNoteOn(pitchClass: Int, sequential: Bool = false) {
        guard !isPaused, runtime.result == .playing else { return }
        let normalizedPc = ((pitchClass % 12) + 12) % 12
        if sequential {
            let nowMs = CACurrentMediaTime() * 1000
            if let lastAt = lastVoicePcAtMs[normalizedPc],
               nowMs - lastAt < Self.voiceSamePcDebounceMs {
                return
            }
            lastVoicePcAtMs[normalizedPc] = nowMs
        }
        let evaluation = DefensePhraseJudge.evaluateNoteOn(
            state: judgeState,
            stageRequiredCompletionCount: stage.requiredCompletionCount,
            pitchClass: normalizedPc,
            sequential: sequential,
            attackTrigger: stage.attackTrigger,
            autoAdvance: !practiceMode
        )
        if evaluation.nextState != judgeState {
            judgeState = evaluation.nextState
        }
        if evaluation.attack {
            let speedRatio = practiceMode ? DefensePracticeSpeed.ratio(practiceSpeedPercent) : 1
            let effectiveBpm = stage.bpm > 0 ? stage.bpm * speedRatio : 60
            let guardPoseSec = 60 / effectiveBpm
            _ = DefenseGameLoop.performSlash(runtime: &runtime, guardPoseSec: guardPoseSec)
        }
        if !practiceMode, evaluation.pendingSwitch, pendingSwitchPhraseIndex == nil {
            let nextIndex = DefensePhraseJudge.nextPhraseIndex(
                phrases: stage.phrases,
                current: judgeState.phraseIndex
            )
            pendingSwitchPhraseIndex = nextIndex
            judgeState = DefensePhraseJudge.resetToPhraseIndex(nextIndex, phrases: stage.phrases)
            Task {
                guard let phrase = stage.phrases[safe: nextIndex],
                      let url = URL(string: phrase.audioUrl)
                else { return }
                _ = try? await DefenseBackingAudio.shared.scheduleSwitch(nextUrl: url)
            }
        }
    }

    /// SpriteKit の `update` から毎フレーム呼ばれる。React 相当の publish は値変化時のみ。
    func advanceFrame(currentTime: TimeInterval) {
        if isPaused {
            lastFrameTime = currentTime
            return
        }
        guard runtime.result == .playing else { return }
        let dt: TimeInterval
        if let last = lastFrameTime {
            dt = min(0.05, currentTime - last)
        } else {
            dt = 0
        }
        lastFrameTime = currentTime

        DefenseGameLoop.tick(runtime: &runtime, difficulty: difficulty, deltaTime: dt)

        let switchGen = DefenseBackingAudio.shared.didSwitchGeneration
        if switchGen != lastSwitchGeneration, let switchedToIndex = pendingSwitchPhraseIndex {
            lastSwitchGeneration = switchGen
            pendingSwitchPhraseIndex = nil
            DefenseBackingAudio.shared.commitSwitchFromMainThread()
            let preloadIndex = DefensePhraseJudge.nextPhraseIndex(
                phrases: stage.phrases,
                current: switchedToIndex
            )
            if let phrase = stage.phrases[safe: preloadIndex],
               let url = URL(string: phrase.audioUrl) {
                Task {
                    try? await DefenseBackingAudio.shared.preload(urls: [url])
                }
            }
        }

        let elapsedInt = Int(runtime.elapsedSec)
        let nextHud = DefenseHudState(
            playerHp: runtime.playerHp,
            playerMaxHp: runtime.playerMaxHp,
            remainSec: max(0, Int((runtime.surviveSeconds - runtime.elapsedSec).rounded(.up))),
            elapsedInt: elapsedInt,
            result: runtime.result
        )
        if nextHud != hud {
            hud = nextHud
        }

        if runtime.result != .playing, !resultHandled {
            resultHandled = true
            handleResult()
        }
    }

    private func handleResult() {
        guard runtime.result == .clear, !practiceMode else { return }
        let surviveSec = Int(runtime.elapsedSec)
        let enemiesDefeated = runtime.enemiesDefeated
        let stageId = stage.id
        let lessonContext = lessonContext
        Task {
            if lessonContext == nil {
                if let userId = try? await SupabaseService.shared.currentUserId() {
                    _ = try? await SupabaseService.shared.upsertDefenseStageClear(
                        userId: userId,
                        stageId: stageId,
                        surviveSec: surviveSec,
                        enemiesDefeated: enemiesDefeated
                    )
                }
            }
            if let lessonContext {
                _ = try? await SupabaseService.shared.recordEarTrainingLessonProgress(
                    lessonId: lessonContext.lessonId,
                    lessonSongId: lessonContext.lessonSongId,
                    rank: "S",
                    clearConditions: lessonContext.clearConditions
                )
            }
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}

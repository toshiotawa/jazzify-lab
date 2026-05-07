import Foundation
import Combine
import QuartzCore

/// 耳コピ「コード演奏バトル」モード ([src/components/earTraining/EarTrainingChordVoicingScreen.tsx]) と同等の状態機械。
@MainActor
final class EarTrainingChordVoicingBattleController: ObservableObject {
    private static let inputCooldownMs: Double = 20
    private static let audioEndEpsilonSec: Double = 0.03
    private static let zeroDamage = EarTrainingDamageConfig.zero

    @Published private(set) var gameState: EarTrainingGameState = .idle
    @Published private(set) var phraseIndex: Int = 0
    @Published private(set) var phraseRunId: Int = 0
    @Published private(set) var attempt: EarTrainingChordVoicingAttempt?
    @Published private(set) var enemyHp: Int
    @Published private(set) var playerHp: Int
    @Published private(set) var timeRemaining: Int
    @Published private(set) var countInValue: Int
    @Published private(set) var activeChord: EarTrainingPhraseChordDetail?
    @Published private(set) var lastRank: EarTrainingRank?
    @Published private(set) var statusText: String
    @Published var practiceMode: Bool
    @Published var isMidiConnected: Bool = false
    @Published var isSettingsOpen: Bool = false
    @Published private(set) var midiHeldKeys: Set<Int> = []

    let stage: EarTrainingStageDetail
    let phrases: [EarTrainingPhraseDetail]
    let lessonContext: EarTrainingLessonContext?
    let isEnglishCopy: Bool
    let copy: EarTrainingGameCopy
    let enemyName: String

    private let onExitCallback: () -> Void
    private let audio: EarTrainingAudio
    private let supabase = SupabaseService.shared

    private var lastInputAt: TimeInterval = 0
    private var failTimerTask: Task<Void, Never>?
    private var transitionTimerTask: Task<Void, Never>?
    private var countdownTask: Task<Void, Never>?
    private var timeLimitTask: Task<Void, Never>?
    private var progressSaveStarted: Bool = false
    private var allChordsCompletedFlag: Bool = false

    var damageConfig: EarTrainingDamageConfig {
        if practiceMode { return Self.zeroDamage }
        return EarTrainingDamageConfig(
            perCorrectNote: stage.perCorrectNoteDamage,
            good: stage.goodCompletionDamage,
            great: stage.greatCompletionDamage,
            perfect: stage.perfectCompletionDamage,
            miss: stage.missDamage,
            fail: stage.failDamage
        )
    }

    var rankRule: EarTrainingRankRule {
        EarTrainingRankRule(perfectMaxMisses: stage.perfectMaxMisses, greatMaxMisses: stage.greatMaxMisses)
    }

    var currentPhrase: EarTrainingPhraseDetail? {
        guard phraseIndex >= 0 && phraseIndex < phrases.count else { return nil }
        return phrases[phraseIndex]
    }

    var canChangePracticeMode: Bool {
        gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var showLobbyControls: Bool {
        gameState == .idle || gameState == .stageClear || gameState == .gameOver
    }

    var startButtonLabel: String {
        gameState == .idle ? "START" : "RETRY"
    }

    var timeLabel: String {
        if practiceMode { return "∞" }
        let safe = max(0, timeRemaining)
        let minutes = safe / 60
        let rest = safe % 60
        return String(format: "%d:%02d", minutes, rest)
    }

    init(
        stage: EarTrainingStageDetail,
        phrases: [EarTrainingPhraseDetail],
        lessonContext: EarTrainingLessonContext?,
        isEnglishCopy: Bool,
        enemyName: String,
        audio: EarTrainingAudio,
        onExit: @escaping () -> Void
    ) {
        self.stage = stage
        self.phrases = phrases
        self.lessonContext = lessonContext
        self.isEnglishCopy = isEnglishCopy
        self.copy = EarTrainingGameCopy.make(isEnglish: isEnglishCopy)
        self.enemyName = enemyName
        self.audio = audio
        self.onExitCallback = onExit
        self.enemyHp = stage.enemyHp
        self.playerHp = stage.playerHp
        self.timeRemaining = stage.timeLimitSec
        self.countInValue = stage.countInBeats
        self.practiceMode = lessonContext == nil ? false : false
        self.statusText = copy.idlePrompt
    }

    // MARK: - Lifecycle

    func start() {
        audio.start()
        audio.onTimeUpdate = { [weak self] currentTime in
            Task { @MainActor in
                self?.handleAudioTimeUpdate(currentTime: currentTime)
            }
        }
        audio.onEnded = { [weak self] in
            Task { @MainActor in
                self?.failCurrentPhrase()
            }
        }
    }

    func tearDown() {
        cancelAllTimers()
        audio.onTimeUpdate = nil
        audio.onEnded = nil
        audio.stop()
        midiHeldKeys.removeAll()
    }

    func registerMidiKeyDown(_ midi: Int) { midiHeldKeys.insert(midi) }
    func registerMidiKeyUp(_ midi: Int) { midiHeldKeys.remove(midi) }

    func handleBack() {
        cancelAllTimers()
        audio.stopPhrase()
        onExitCallback()
    }

    func handleOpenSettings() { isSettingsOpen = true }
    func handleCloseSettings() { isSettingsOpen = false }

    func setPracticeMode(_ value: Bool) {
        guard canChangePracticeMode else { return }
        practiceMode = value
    }

    func startBattle() {
        startCountIn()
    }

    func handleNoteOn(midi: Int, velocity: Int = 100, playAudio: Bool = true) {
        if playAudio {
            audio.pianoNoteOn(midi: midi, velocity: velocity)
        }
        handleNoteInput(midi: midi)
    }

    func handleNoteOff(midi: Int, playAudio: Bool = true) {
        if playAudio {
            audio.pianoNoteOff(midi: midi)
        }
    }

    private func handleNoteInput(midi: Int) {
        let now = CACurrentMediaTime() * 1000
        if now - lastInputAt < Self.inputCooldownMs { return }
        lastInputAt = now

        guard gameState == .playingPhrase else { return }
        guard let phrase = currentPhrase, let current = attempt, let chord = activeChord else { return }

        let result = EarTrainingChordVoicingEngine.handleNoteOn(
            attempt: current,
            activeChord: chord,
            midiNote: midi,
            damage: damageConfig
        )

        if result.attempt != current {
            attempt = result.attempt
        }

        if result.evaluationMissAdded {
            statusText = copy.missEnemyAttack
            let nextPlayerHp = max(0, playerHp - result.playerDamage)
            playerHp = nextPlayerHp
            if nextPlayerHp <= 0 {
                finishGameOver(message: copy.gameOver)
            }
            return
        }

        if !result.chordJustCompleted {
            return
        }

        let acknowledged = EarTrainingChordVoicingEngine.acknowledgeChordAward(attempt: result.attempt, chordId: chord.id)
        attempt = acknowledged

        if let rootName = result.rootNoteName {
            playRootNoteIfPossible(rootName: rootName)
        }

        statusText = copy.chordCompleted(chordName: chord.chordName)
        let nextEnemyHp = max(0, enemyHp - result.enemyDamage)
        enemyHp = nextEnemyHp
        if nextEnemyHp <= 0 {
            let rank = EarTrainingChordVoicingEngine.totalMissCount(acknowledged) <= rankRule.perfectMaxMisses ? EarTrainingRank.perfect
                : EarTrainingChordVoicingEngine.totalMissCount(acknowledged) <= rankRule.greatMaxMisses ? .great : .good
            Task { @MainActor in await self.finishStageClear(rank: rank) }
            return
        }

        if EarTrainingChordVoicingEngine.isAllChordsCompleted(phrase: phrase, attempt: acknowledged) {
            handleAllChordsCompleted(phrase: phrase, attempt: acknowledged)
        }
    }

    private func handleAllChordsCompleted(
        phrase: EarTrainingPhraseDetail,
        attempt: EarTrainingChordVoicingAttempt
    ) {
        if allChordsCompletedFlag { return }
        allChordsCompletedFlag = true
        gameState = .phraseComplete
        cancelFailTimer()

        let totalMiss = EarTrainingChordVoicingEngine.totalMissCount(attempt)
        let rank: EarTrainingRank
        if totalMiss <= rankRule.perfectMaxMisses { rank = .perfect }
        else if totalMiss <= rankRule.greatMaxMisses { rank = .great }
        else { rank = .good }
        lastRank = rank
        let completionDamage = EarTrainingEngine.completionDamage(rank: rank, damage: damageConfig)
        let nextEnemyHp = max(0, enemyHp - completionDamage)
        enemyHp = nextEnemyHp
        if nextEnemyHp <= 0 {
            Task { @MainActor in await self.finishStageClear(rank: rank) }
            return
        }
        scheduleTransitionToNextPhrase(rank: rank, phrase: phrase)
    }

    private func scheduleTransitionToNextPhrase(
        rank: EarTrainingRank,
        phrase: EarTrainingPhraseDetail
    ) {
        cancelTransitionTimer()
        let delaySec = EarTrainingEngine.nextMeasureDelaySec(
            currentAudioTimeSec: audio.currentTimeSec,
            loopDurationSec: phrase.loopDurationSec,
            loopMeasures: stage.loopMeasures
        )
        statusText = copy.transitionNextBar(rank: rank.rawValue)
        transitionTimerTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(delaySec * 1_000_000_000))
            guard let self else { return }
            self.audio.stopPhrase()
            try? await Task.sleep(nanoseconds: 420_000_000)
            let next = (self.phraseIndex + 1) % max(1, self.phrases.count)
            self.startPhrase(at: next)
        }
    }

    private func startCountIn() {
        guard !phrases.isEmpty else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        progressSaveStarted = false
        enemyHp = stage.enemyHp
        playerHp = stage.playerHp
        timeRemaining = stage.timeLimitSec
        phraseIndex = 0
        phraseRunId = 0
        countInValue = stage.countInBeats
        gameState = .countIn
        statusText = copy.countIn
        cancelAllTimers()
        audio.stopPhrase()

        countdownTask = Task { @MainActor [weak self] in
            guard let self else { return }
            var remaining = self.stage.countInBeats
            let beatDurationNs = UInt64(max(0.1, 60.0 / Double(self.stage.bpm)) * 1_000_000_000)
            while remaining > 0 {
                try? await Task.sleep(nanoseconds: beatDurationNs)
                remaining -= 1
                self.countInValue = max(remaining, 0)
            }
            self.startTimeLimit()
            self.startPhrase(at: 0)
        }
    }

    private func startPhrase(at nextIndex: Int) {
        guard let phrase = phrases.indices.contains(nextIndex) ? phrases[nextIndex] : nil else {
            finishGameOver(message: copy.noPhrases)
            return
        }
        cancelFailTimer()
        cancelTransitionTimer()
        phraseIndex = nextIndex
        phraseRunId += 1
        let next = EarTrainingChordVoicingEngine.createAttempt(for: phrase)
        attempt = next
        lastRank = nil
        allChordsCompletedFlag = false
        let initialChord = EarTrainingChordVoicingEngine.chordDisplayAt(
            phrase: phrase,
            loopTime: 0,
            bpm: stage.bpm,
            completedChordIds: next.completedChordIds
        )
        activeChord = initialChord
        statusText = copy.phraseLabel(indexOneBased: nextIndex + 1)
        gameState = .playingPhrase
        if let url = URL(string: phrase.audioUrl) {
            audio.playPhrase(url: url)
        }
    }

    private func startTimeLimit() {
        cancelTimeLimitTimer()
        if practiceMode { return }
        timeLimitTask = Task { @MainActor [weak self] in
            guard let self else { return }
            while self.timeRemaining > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                let next = max(0, self.timeRemaining - 1)
                self.timeRemaining = next
                if next <= 0 {
                    self.finishGameOver(message: self.copy.timeOver)
                    return
                }
            }
        }
    }

    private func handleAudioTimeUpdate(currentTime: Double) {
        guard let phrase = currentPhrase else { return }
        let loopDurationSec = phrase.loopDurationSec
        guard loopDurationSec > 0 else { return }
        let loopTime = currentTime.truncatingRemainder(dividingBy: loopDurationSec)
        let completedSet = attempt?.completedChordIds ?? []
        let nextChord = EarTrainingChordVoicingEngine.chordDisplayAt(
            phrase: phrase,
            loopTime: loopTime,
            bpm: stage.bpm,
            completedChordIds: completedSet
        )
        if nextChord?.id != activeChord?.id {
            if let prev = activeChord, let current = attempt,
               !current.completedChordIds.contains(prev.id),
               !current.failedChordIds.contains(prev.id) {
                let tickResult = EarTrainingChordVoicingEngine.advanceTick(
                    attempt: current,
                    previousChord: prev,
                    damage: damageConfig
                )
                if tickResult.failAdded {
                    attempt = tickResult.attempt
                    if tickResult.playerDamage > 0 {
                        let nextPlayerHp = max(0, playerHp - tickResult.playerDamage)
                        playerHp = nextPlayerHp
                        statusText = copy.chordWindowFail(chordName: prev.chordName)
                        if nextPlayerHp <= 0 {
                            finishGameOver(message: copy.gameOver)
                            return
                        }
                    }
                }
            }
            activeChord = nextChord
        }

        let audioDurationSec = phrase.audioDurationSec
        if audioDurationSec.isFinite, currentTime >= audioDurationSec - Self.audioEndEpsilonSec {
            failCurrentPhrase()
        }
    }

    private func failCurrentPhrase() {
        guard let attempt, gameState == .playingPhrase else { return }
        gameState = .phraseFail
        lastRank = .fail
        let nextPlayerHp = max(0, playerHp - damageConfig.fail)
        playerHp = nextPlayerHp
        statusText = copy.failAdvance
        if nextPlayerHp <= 0 {
            finishGameOver(message: copy.gameOver)
            return
        }
        cancelTransitionTimer()
        transitionTimerTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 900_000_000)
            guard let self else { return }
            let next = (self.phraseIndex + 1) % max(1, self.phrases.count)
            self.startPhrase(at: next)
        }
        _ = attempt
    }

    @MainActor
    private func finishStageClear(rank: EarTrainingRank) async {
        cancelAllTimers()
        gameState = .stageClear
        lastRank = rank
        statusText = copy.stageClear
        audio.stopPhrase()
        guard let lessonContext, !practiceMode, !progressSaveStarted else { return }
        progressSaveStarted = true
        let lessonRank = EarTrainingEngine.lessonRank(from: rank)
        do {
            _ = try await supabase.recordEarTrainingLessonProgress(
                lessonId: lessonContext.lessonId,
                lessonSongId: lessonContext.lessonSongId,
                rank: lessonRank,
                clearConditions: lessonContext.clearConditions
            )
        } catch {
            // 失敗時もUIを止めないために握り潰す（既存挙動と同様）。
        }
    }

    private func finishGameOver(message: String) {
        cancelAllTimers()
        gameState = .gameOver
        statusText = message
        audio.stopPhrase()
    }

    private func cancelAllTimers() {
        cancelFailTimer()
        cancelTransitionTimer()
        cancelCountdownTimer()
        cancelTimeLimitTimer()
    }

    private func cancelFailTimer() { failTimerTask?.cancel(); failTimerTask = nil }
    private func cancelTransitionTimer() { transitionTimerTask?.cancel(); transitionTimerTask = nil }
    private func cancelCountdownTimer() { countdownTask?.cancel(); countdownTask = nil }
    private func cancelTimeLimitTimer() { timeLimitTask?.cancel(); timeLimitTask = nil }

    private func playRootNoteIfPossible(rootName: String) {
        guard let pc = EarTrainingChordVoicingEngine.noteNameToPitchClass(rootName) else { return }
        let midi = 36 + pc // C2 (=36) を基点に根音のピッチクラスを再生
        SurvivalGameAudio.shared.playSynthBassRoot(midi: midi)
    }
}

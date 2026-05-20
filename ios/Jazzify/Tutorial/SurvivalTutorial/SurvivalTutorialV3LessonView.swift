import SwiftUI

@MainActor
private final class SurvivalTutorialSessionBox: ObservableObject {
    @Published var session: SurvivalGameSession?
}

/// DB survival_tutorial_scripts v3（scene ベース）。
struct SurvivalTutorialV3LessonView: View {
    let script: SurvivalTutorialScriptPayloadV3
    let locale: AppLocale
    let showSkip: Bool
    let onClose: () -> Void
    var onComplete: (() async -> Void)?

    @State private var sceneIndex = 0
    @State private var showFinishCta = false
    @State private var characterLine = ""

    private var isJapanese: Bool { locale == .ja }

    private var showExitButton: Bool {
        script.ui.showExitButton ?? (!script.ui.hideBackButton)
    }

    var body: some View {
        ZStack {
            if script.scenes.indices.contains(sceneIndex) {
                sceneHost(scene: script.scenes[sceneIndex])
                    .id(sceneIndex)
            }

            OnboardingCharacterDialogView(text: characterLine)

            if showExitButton {
                VStack {
                    HStack {
                        Spacer()
                        Button(isJapanese ? "戻る" : "Exit", action: onClose)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color.white.opacity(0.15))
                            .clipShape(Capsule())
                            .padding(.top, 12)
                            .padding(.trailing, 16)
                    }
                    Spacer()
                }
                .allowsHitTesting(true)
            }

            if showFinishCta {
                Color.black.opacity(0.42)
                    .allowsHitTesting(true)
                    .onTapGesture { }
                Button(SurvivalTutorialV3Scenario.finishCtaLabel(isEnglish: locale == .en)) {
                    Task {
                        await onComplete?()
                        onClose()
                    }
                }
                .buttonStyle(.borderedProminent)
            }

            if showSkip {
                VStack {
                    HStack {
                        Spacer()
                        OnboardingSkipButton(isJa: isJapanese) {
                            onClose()
                        }
                        .padding(.trailing, 16)
                        .padding(.top, 16)
                    }
                    Spacer()
                }
                .allowsHitTesting(true)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black)
        .onAppear {
            OrientationManager.shared.lock(.portrait)
            sceneAdvanceIfFinish(from: script, index: sceneIndex)
        }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
        }
        .onChange(of: sceneIndex) { newIdx in
            characterLine = ""
            showFinishCta = false
            sceneAdvanceIfFinish(from: script, index: newIdx)
        }
    }

    private func sceneAdvanceIfFinish(from script: SurvivalTutorialScriptPayloadV3, index: Int) {
        guard script.scenes.indices.contains(index) else { return }
        if SurvivalTutorialV3Scenario.showFinishCta(script: script, scene: script.scenes[index]) {
            showFinishCta = true
        }
    }

    @ViewBuilder
    private func sceneHost(scene: SurvivalTutorialV3Scene) -> some View {
        switch scene {
        case let .dialogueOnly(diag):
            SurvivalTutorialV3DialogueScene(
                script: script,
                scene: diag,
                locale: locale,
                onCharacter: { txt in characterLine = txt },
                onDone: { advanceScene() }
            )
        case let .finish(fin):
            Color.black.opacity(0.001)
                .task { await finishNoCtaAutoClose(finish: fin) }
        case let .progressionBattle(sceneNode):
            if let payload = SurvivalTutorialChordBattleLessonScene.Payload(script: script, scene: sceneNode) {
                SurvivalTutorialChordBattleLessonScene(
                    locale: locale,
                    payload: payload,
                    onCharacter: { txt in characterLine = txt },
                    onDone: { advanceScene() }
                )
            } else {
                Color.black
                    .onAppear { DispatchQueue.main.async { advanceScene() } }
            }
        case let .randomBattle(sceneNode):
            if let payload = SurvivalTutorialChordBattleLessonScene.Payload(script: script, scene: sceneNode) {
                SurvivalTutorialChordBattleLessonScene(
                    locale: locale,
                    payload: payload,
                    onCharacter: { txt in characterLine = txt },
                    onDone: { advanceScene() }
                )
            } else {
                Color.black
                    .onAppear { DispatchQueue.main.async { advanceScene() } }
            }
        case let .phraseBattle(sceneNode):
            SurvivalTutorialPhraseBattleLessonScene(
                script: script,
                scene: sceneNode,
                locale: locale,
                onCharacter: { txt in characterLine = txt },
                onDone: { advanceScene() }
            )
        }
    }

    private func finishNoCtaAutoClose(finish: SurvivalTutorialV3FinishScene) async {
        let envelope: SurvivalTutorialV3Scene = .finish(finish)
        if SurvivalTutorialV3Scenario.showFinishCta(script: script, scene: envelope) {
            return
        }
        await onComplete?()
        await MainActor.run {
            onClose()
        }
    }

    private func advanceScene() {
        guard sceneIndex &+ 1 < script.scenes.count else {
            Task {
                await onComplete?()
                onClose()
            }
            return
        }
        sceneIndex += 1
    }
}

// MARK: - Chord battle (progression / random)

@MainActor
private struct SurvivalTutorialChordBattleLessonScene: View {
    struct Payload {
        let baseline: SurvivalScenarioOverrides
        let stage: SurvivalStageDefinition
        let config: SurvivalStageConfig
        let chords: [SurvivalResolvedChord]
        let totalQuestions: Int
        let introDelaySeconds: Double
        let dialogue: SurvivalTutorialV3BattleDialogue

        init?(script: SurvivalTutorialScriptPayloadV3, scene: SurvivalTutorialV3ProgressionBattleScene) {
            guard let raw = script.content[scene.contentRef] else { return nil }
            guard case let .progressionRandom(block) = raw else { return nil }
            guard block.stage.stageType == "progression", let defs = block.chordProgression, !defs.isEmpty else { return nil }
            guard let sd = SurvivalTutorialV3StageBuilder.buildStageDefinition(from: raw) else { return nil }
            let cfg = SurvivalTutorialV3StageBuilder.buildStageConfig(stage: sd, content: raw)
            let chords = defs.enumerated().map {
                SurvivalTutorialV3StageBuilder.resolvedChord(from: $0.element, stableIndex: $0.offset, idPrefix: "tutorial-v3-prog")
            }
            let loops = max(0, scene.loopCount)
            baseline = SurvivalTutorialV3Scenario.mergeBaseline(script: script)
            stage = sd
            config = cfg
            self.chords = chords
            totalQuestions = loops
            introDelaySeconds = scene.introDelaySeconds ?? 4
            dialogue = scene.dialogue
        }

        init?(script: SurvivalTutorialScriptPayloadV3, scene: SurvivalTutorialV3RandomBattleScene) {
            guard let raw = script.content[scene.contentRef] else { return nil }
            guard case let .progressionRandom(block) = raw else { return nil }
            guard block.stage.stageType == "random" else { return nil }
            guard let sd = SurvivalTutorialV3StageBuilder.buildStageDefinition(from: raw) else { return nil }
            let cfg = SurvivalTutorialV3StageBuilder.buildStageConfig(stage: sd, content: raw)
            let q = max(0, scene.questionCount)
            let chords = SurvivalTutorialV3StageBuilder.pickRandomResolvedChords(block: block, hard: scene.hardQuestions ?? false, count: q)
            baseline = SurvivalTutorialV3Scenario.mergeBaseline(script: script)
            stage = sd
            config = cfg
            self.chords = chords
            totalQuestions = q
            introDelaySeconds = scene.introDelaySeconds ?? 4
            dialogue = scene.dialogue
        }
    }

    let locale: AppLocale
    let payload: Payload
    let onCharacter: (String) -> Void
    let onDone: () -> Void

    init(locale: AppLocale, payload: Payload, onCharacter: @escaping (String) -> Void, onDone: @escaping () -> Void) {
        self.locale = locale
        self.payload = payload
        self.onCharacter = onCharacter
        self.onDone = onDone
    }

    @StateObject private var scenarioController = SurvivalScenarioController()
    @StateObject private var sessionBox = SurvivalTutorialSessionBox()
    @State private var runIdentity = UUID()
    @State private var introTapNonce = 0
    @State private var pendingIntroTapContinuation: CheckedContinuation<Void, Never>?

    var body: some View {
        ZStack {
            Color.black
            SurvivalGameView(
                stage: payload.stage,
                hintMode: true,
                characterId: "fai",
                locale: locale,
                onClose: {},
                isDemo: true,
                configOverride: payload.config,
                scenarioOverrides: payload.baseline,
                scenarioController: scenarioController,
                inlinePhraseDefinition: nil,
                onSessionReady: { s in sessionBox.session = s }
            )
            .allowsHitTesting(true)

            if introTapNonce > 0 {
                Color.black.opacity(0.001)
                    .contentShape(Rectangle())
                    .onTapGesture { fulfillIntroTap() }
            }
        }
        .onDisappear {
            pendingIntroTapContinuation?.resume()
            pendingIntroTapContinuation = nil
            sessionBox.session?.dispose()
            sessionBox.session = nil
        }
        .task(id: runIdentity) {
            await chordRunLoop()
        }
    }

    private func localized(_ t: SurvivalTutorialV3LocalizedText) -> String {
        locale == .ja ? t.ja : t.en
    }

    private func fulfillIntroTap() {
        pendingIntroTapContinuation?.resume()
        pendingIntroTapContinuation = nil
        introTapNonce = 0
    }

    private func chordRunLoop() async {
        guard payload.totalQuestions > 0, !payload.chords.isEmpty else {
            await MainActor.run { onDone() }
            return
        }
        guard let sess = await pollSession(box: sessionBox, timeoutSeconds: 12) else {
            await MainActor.run { onDone() }
            return
        }
        await MainActor.run {
            scenarioController.setOverrides(payload.baseline)
            scenarioController.clearEnemies()
            scenarioController.setSlotAEnabled(false)
            scenarioController.setSlotBEnabled(true)
        }
        for q in 0..<payload.totalQuestions {
            if Task.isCancelled { return }
            let ch = payload.chords[q % payload.chords.count]
            await MainActor.run {
                scenarioController.setOverrides(SurvivalTutorialV3Scenario.chordIntroBlock(base: payload.baseline))
                scenarioController.clearEnemies()
                onCharacter(localized(payload.dialogue.intro))
                scenarioController.setSlotBChord(ch)
            }

            async let raced: Void = SurvivalTutorialSleep.race(seconds: payload.introDelaySeconds, tap: { await introTapAwaitable() })
            _ = await raced

            if Task.isCancelled { return }

            await MainActor.run {
                scenarioController.setOverrides(SurvivalTutorialV3Scenario.chordReveal(base: payload.baseline))
                onCharacter(localized(payload.dialogue.onReveal))
                scenarioController.clearEnemies()
                scenarioController.spawnStationaryRing(count: 12, radius: 180)
            }

            guard await waitChordCompletion(session: sess) else { return }

            await MainActor.run {
                scenarioController.emitSpecialShockwaveOnly()
                let remaining = max(0, payload.totalQuestions - q - 1)
                let line = payload.dialogue.onCorrectRemaining.interpolateRemaining(locale: locale, remaining: remaining)
                onCharacter(line)
            }
            await SurvivalTutorialSleep.seconds(1)
        }
        await MainActor.run {
            onCharacter("")
            onDone()
        }
    }

    private func introTapAwaitable() async {
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            introTapNonce &+= 1
            pendingIntroTapContinuation = cont
        }
    }

    private func pollSession(box: SurvivalTutorialSessionBox, timeoutSeconds: Double) async -> SurvivalGameSession? {
        let deadline = Date().timeIntervalSince1970 + timeoutSeconds
        while Date().timeIntervalSince1970 < deadline {
            if Task.isCancelled { return nil }
            let maybe = await MainActor.run { box.session }
            if let sess = maybe {
                return sess
            }
            try? await Task.sleep(nanoseconds: 48_000_000)
        }
        return await MainActor.run { box.session }
    }

    /// セッションが立ち上がるまで待機（読み込みのみ・低頻ポーリング）。
    private func waitChordCompletion(session sess: SurvivalGameSession, timeoutSeconds: Double = 180) async -> Bool {
        guard sess.viewModel.uiSnapshot.slots.indices.contains(1) else { return false }
        let start = sess.viewModel.uiSnapshot.slots[1].triggerPulse
        let deadline = Date().timeIntervalSince1970 + timeoutSeconds
        while Date().timeIntervalSince1970 < deadline {
            if Task.isCancelled { return false }
            if sess.viewModel.uiSnapshot.slots[1].triggerPulse != start {
                return true
            }
            try? await Task.sleep(nanoseconds: 40_000_000)
        }
        return false
    }
}

// MARK: - Phrase battle

@MainActor
private struct SurvivalTutorialPhraseBattleLessonScene: View {
    let script: SurvivalTutorialScriptPayloadV3
    let scene: SurvivalTutorialV3PhraseBattleScene
    let locale: AppLocale
    let onCharacter: (String) -> Void
    let onDone: () -> Void

    init(
        script: SurvivalTutorialScriptPayloadV3,
        scene: SurvivalTutorialV3PhraseBattleScene,
        locale: AppLocale,
        onCharacter: @escaping (String) -> Void,
        onDone: @escaping () -> Void
    ) {
        self.script = script
        self.scene = scene
        self.locale = locale
        self.onCharacter = onCharacter
        self.onDone = onDone
    }

    @StateObject private var scenarioController = SurvivalScenarioController()
    @StateObject private var sessionBox = SurvivalTutorialSessionBox()
    @State private var runIdentity = UUID()
    @State private var tapNonce = 0
    @State private var pendingTapContinuation: CheckedContinuation<Void, Never>?

    var body: some View {
        ZStack {
            if let built = phrasePayload {
                SurvivalGameView(
                    stage: built.stage,
                    hintMode: true,
                    characterId: "fai",
                    locale: locale,
                    onClose: {},
                    isDemo: true,
                    configOverride: built.cfg,
                    scenarioOverrides: built.baseline,
                    scenarioController: scenarioController,
                    inlinePhraseDefinition: built.phrase,
                    onSessionReady: { s in sessionBox.session = s }
                )

                if tapNonce > 0 {
                    Color.black.opacity(0.001)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            pendingTapContinuation?.resume()
                            pendingTapContinuation = nil
                            tapNonce = 0
                        }
                }
            } else {
                Color.black.onAppear {
                    DispatchQueue.main.async { onDone() }
                }
            }
        }
        .task(id: runIdentity) {
            await phraseRun()
        }
        .onDisappear {
            pendingTapContinuation?.resume()
            pendingTapContinuation = nil
            sessionBox.session?.dispose()
            sessionBox.session = nil
        }
    }

    private var phrasePayload: (stage: SurvivalStageDefinition, cfg: SurvivalStageConfig, baseline: SurvivalScenarioOverrides, phrase: SurvivalPhraseDefinition)? {
        guard let raw = script.content[scene.contentRef] else { return nil }
        guard case let .phraseStage(ph) = raw else { return nil }
        guard let stage = SurvivalTutorialV3StageBuilder.buildStageDefinition(from: raw),
              let inline = SurvivalTutorialV3StageBuilder.buildInlinePhrase(from: ph)
        else { return nil }
        let cfg = SurvivalTutorialV3StageBuilder.buildStageConfig(stage: stage, content: raw)
        let baseline = SurvivalTutorialV3Scenario.mergeBaseline(script: script)
        return (stage, cfg, baseline, inline)
    }

    private func pollPhraseSession(timeoutSeconds: Double) async -> SurvivalGameSession? {
        let deadline = Date().timeIntervalSince1970 + timeoutSeconds
        while Date().timeIntervalSince1970 < deadline {
            if Task.isCancelled { return nil }
            let maybe = await MainActor.run { sessionBox.session }
            if let sess = maybe {
                return sess
            }
            try? await Task.sleep(nanoseconds: 48_000_000)
        }
        return await MainActor.run { sessionBox.session }
    }

    private func localized(_ t: SurvivalTutorialV3LocalizedText) -> String {
        locale == .ja ? t.ja : t.en
    }

    private func introTapAwait() async {
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            tapNonce &+= 1
            pendingTapContinuation = cont
        }
    }

    private func phraseRun() async {
        guard let built = phrasePayload else { return }
        guard scene.requiredLoops > 0 else {
            await MainActor.run { onDone() }
            return
        }
        guard let sess = await pollPhraseSession(timeoutSeconds: 12) else {
            await MainActor.run { onDone() }
            return
        }
        await MainActor.run {
            scenarioController.setOverrides(built.baseline)
            scenarioController.clearEnemies()
        }
        await SurvivalTutorialSleep.seconds(0.08)
        await MainActor.run {
            scenarioController.setOverrides(SurvivalTutorialV3Scenario.phraseIntroBlock(base: built.baseline))
            onCharacter(localized(scene.dialogue.intro))
        }
        async let introDone: Void = SurvivalTutorialSleep.race(seconds: scene.introDelaySeconds ?? 5, tap: { await introTapAwait() })
        _ = await introDone
        if Task.isCancelled { return }

        let startPulse = sess.gameLoop.phraseFullLoopPulse

        await MainActor.run {
            scenarioController.setOverrides(SurvivalTutorialV3Scenario.phraseReveal(base: built.baseline))
            onCharacter(localized(scene.dialogue.onReveal))
            sess.viewModel.syncPhraseStaff(from: sess.gameLoop)
        }

        guard await SurvivalTutorialPhraseWait.waitLoops(
            getPulse: { sess.gameLoop.phraseFullLoopPulse },
            start: startPulse,
            delta: scene.requiredLoops,
            timeoutSeconds: 320
        ) else {
            await MainActor.run {
                onCharacter("")
                onDone()
            }
            return
        }

        await MainActor.run {
            let line = localized(scene.dialogue.onCorrectRemaining).replacingOccurrences(of: "{{remaining}}", with: "0")
            onCharacter(line)
            scenarioController.emitSpecialShockwaveOnly()
        }
        await SurvivalTutorialSleep.seconds(0.6)

        await MainActor.run {
            onCharacter("")
            onDone()
        }
    }
}

// MARK: - Small async helpers（低頻・チュートリアル限定）

private enum SurvivalTutorialSleep {
    @MainActor
    static func seconds(_ s: Double) async {
        let ns = UInt64(max(0, s) * 1_000_000_000)
        try? await Task.sleep(nanoseconds: ns)
    }

    /// タップ待ちまたは固定秒どちらか先。
    @MainActor
    static func race(seconds: Double, tap: @escaping () async -> Void) async {
        async let sleeper: Void = SurvivalTutorialSleep.seconds(seconds)
        async let tapped: Void = tap()
        _ = await (sleeper, tapped)
    }
}

private enum SurvivalTutorialPhraseWait {
    @MainActor
    static func waitLoops(
        getPulse: @escaping () -> UInt64,
        start: UInt64,
        delta: Int,
        timeoutSeconds: Double
    ) async -> Bool {
        let target = start &+ UInt64(max(0, delta))
        let deadline = Date().timeIntervalSince1970 + timeoutSeconds
        while Date().timeIntervalSince1970 < deadline {
            if Task.isCancelled {
                return false
            }
            if getPulse() >= target {
                return true
            }
            try? await Task.sleep(nanoseconds: 45_000_000)
        }
        return false
    }
}
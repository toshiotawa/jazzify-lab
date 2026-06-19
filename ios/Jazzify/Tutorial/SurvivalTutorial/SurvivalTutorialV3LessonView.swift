import SwiftUI

@MainActor
private final class SurvivalTutorialSessionBox: ObservableObject {
    @Published var session: SurvivalGameSession?
}

@MainActor
final class SurvivalTutorialWorldSessionBox: ObservableObject {
    private struct PlayerPose {
        let x: CGFloat
        let y: CGFloat
        let direction: SurvivalDirection8
    }

    weak var session: SurvivalGameSession?
    private var pose: PlayerPose?

    func activate(_ nextSession: SurvivalGameSession) {
        if let pose {
            nextSession.gameLoop.restoreTutorialPlayerPose(
                x: pose.x,
                y: pose.y,
                direction: pose.direction
            )
        }
        session = nextSession
    }

    func capture() {
        guard let player = session?.gameLoop.runtime.player else { return }
        pose = PlayerPose(x: player.x, y: player.y, direction: player.direction)
    }
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
    @State private var faiBubbleLine = ""
    @State private var jajiiBubbleLine = ""
    @State private var narrationLine = ""
    @StateObject private var tapHub = SurvivalTutorialTapAdvanceHub()
    @StateObject private var drumPlayer = SurvivalTutorialV3DrumLoopPlayer()
    @StateObject private var worldSessionBox = SurvivalTutorialWorldSessionBox()

    private var isJapanese: Bool { locale == .ja }

    private var showExitButton: Bool {
        script.ui.showExitButton ?? (!script.ui.hideBackButton)
    }

    var body: some View {
        ZStack {
            if script.scenes.indices.contains(sceneIndex) {
                sceneHost(scene: script.scenes[sceneIndex])
            }

            OnboardingNarrationCaptionView(text: narrationLine)

            if tapHub.isWaiting {
                VStack {
                    Spacer()
                        .contentShape(Rectangle())
                        .onTapGesture { tapHub.userTappedAdvance() }
                    Spacer()
                        .frame(height: 148)
                        .allowsHitTesting(false)
                }
                .zIndex(50)

                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        SurvivalTutorialTapAdvanceCue(onTap: { tapHub.userTappedAdvance() })
                            .padding(.trailing, 20)
                            .padding(.bottom, 148)
                    }
                }
                .zIndex(51)
            }

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
            let drumUrl = script.audioTracks?.drum_loop?.url
            Task {
                await drumPlayer.prepare(urlString: drumUrl)
                applyBgmPolicyForScene(at: sceneIndex)
            }
        }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            tapHub.cancelWait()
            drumPlayer.stop()
        }
        .onChange(of: sceneIndex) { newIdx in
            faiBubbleLine = ""
            jajiiBubbleLine = ""
            narrationLine = ""
            if case .finish = script.scenes[newIdx] {
                showFinishCta = SurvivalTutorialV3Scenario.showFinishCta(
                    script: script,
                    scene: script.scenes[newIdx]
                )
            } else {
                showFinishCta = false
            }
            applyBgmPolicyForScene(at: newIdx)
        }
        .onChange(of: showFinishCta) { visible in
            if visible {
                QuestJinglePlayer.playComplete()
            }
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
        let nextSceneIsFinish = SurvivalTutorialV3Scenario.isNextSceneFinish(
            script: script,
            sceneIndex: sceneIndex
        )
        switch scene {
        case let .dialogueOnly(diag):
            SurvivalTutorialV3DialogueScene(
                script: script,
                scene: diag,
                locale: locale,
                tapHub: tapHub,
                worldSessionBox: worldSessionBox,
                faiBubbleLine: $faiBubbleLine,
                jajiiBubbleLine: $jajiiBubbleLine,
                onFai: { faiBubbleLine = $0 },
                onNarration: { narrationLine = $0 },
                nextSceneIsFinish: nextSceneIsFinish,
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
                    tapHub: tapHub,
                    worldSessionBox: worldSessionBox,
                    faiBubbleLine: $faiBubbleLine,
                    jajiiBubbleLine: $jajiiBubbleLine,
                    onFai: { faiBubbleLine = $0 },
                    onJajii: { jajiiBubbleLine = $0 },
                    onNarration: { narrationLine = $0 },
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
                    tapHub: tapHub,
                    worldSessionBox: worldSessionBox,
                    faiBubbleLine: $faiBubbleLine,
                    jajiiBubbleLine: $jajiiBubbleLine,
                    onFai: { faiBubbleLine = $0 },
                    onJajii: { jajiiBubbleLine = $0 },
                    onNarration: { narrationLine = $0 },
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
                tapHub: tapHub,
                drumPlayer: drumPlayer,
                worldSessionBox: worldSessionBox,
                faiBubbleLine: $faiBubbleLine,
                jajiiBubbleLine: $jajiiBubbleLine,
                onFai: { faiBubbleLine = $0 },
                onJajii: { jajiiBubbleLine = $0 },
                onNarration: { narrationLine = $0 },
                onDone: { advanceScene() }
            )
        case let .demoPlay(sceneNode):
            SurvivalTutorialV3DemoPlayLessonScene(
                script: script,
                scene: sceneNode,
                locale: locale,
                tapHub: tapHub,
                drumPlayer: drumPlayer,
                worldSessionBox: worldSessionBox,
                faiBubbleLine: $faiBubbleLine,
                jajiiBubbleLine: $jajiiBubbleLine,
                onFai: { faiBubbleLine = $0 },
                onJajii: { jajiiBubbleLine = $0 },
                onNarration: { narrationLine = $0 },
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

    private func applyBgmPolicyForScene(at index: Int) {
        guard script.scenes.indices.contains(index) else { return }
        let scene = script.scenes[index]
        guard !scene.isFinish else {
            drumPlayer.stop()
            return
        }
        let vol = Float(script.audioTracks?.drum_loop?.volume ?? 0.35)
        let sceneBgmUrl = scene.bgm?.url?.trimmingCharacters(in: .whitespacesAndNewlines)
        let drumUrl = sceneBgmUrl?.isEmpty == false
            ? sceneBgmUrl
            : script.audioTracks?.drum_loop?.url
        guard drumUrl != nil else {
            drumPlayer.stop()
            return
        }
        Task {
            if scene.isDemoPlay, scene.bgm?.resetOnEnter == true {
                // demo は intro 終了時を時刻0として開始する。
                drumPlayer.stop()
            } else if scene.bgm?.resetOnEnter == true {
                await drumPlayer.restartFromStart(urlString: drumUrl, volume: vol)
            } else {
                await drumPlayer.ensurePlaying(urlString: drumUrl, volume: vol)
            }
        }
    }

    private func advanceScene() {
        worldSessionBox.capture()
        let nextIdx = sceneIndex &+ 1
        guard nextIdx < script.scenes.count else {
            Task {
                await onComplete?()
                onClose()
            }
            return
        }
        if case .finish = script.scenes[nextIdx] {
            showFinishCta = SurvivalTutorialV3Scenario.showFinishCta(
                script: script,
                scene: script.scenes[nextIdx]
            )
            drumPlayer.stop()
            return
        }
        sceneIndex = nextIdx
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
            introDelaySeconds = scene.introDelaySeconds ?? SurvivalTutorialV3Constants.introHoldSeconds
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
            introDelaySeconds = scene.introDelaySeconds ?? SurvivalTutorialV3Constants.introHoldSeconds
            dialogue = scene.dialogue
        }
    }

    let locale: AppLocale
    let payload: Payload
    let tapHub: SurvivalTutorialTapAdvanceHub
    let worldSessionBox: SurvivalTutorialWorldSessionBox
    @Binding var faiBubbleLine: String
    @Binding var jajiiBubbleLine: String
    let onFai: (String) -> Void
    let onJajii: (String) -> Void
    let onNarration: (String) -> Void
    let onDone: () -> Void

    init(
        locale: AppLocale,
        payload: Payload,
        tapHub: SurvivalTutorialTapAdvanceHub,
        worldSessionBox: SurvivalTutorialWorldSessionBox,
        faiBubbleLine: Binding<String>,
        jajiiBubbleLine: Binding<String>,
        onFai: @escaping (String) -> Void,
        onJajii: @escaping (String) -> Void,
        onNarration: @escaping (String) -> Void,
        onDone: @escaping () -> Void
    ) {
        self.locale = locale
        self.payload = payload
        self.tapHub = tapHub
        self.worldSessionBox = worldSessionBox
        _faiBubbleLine = faiBubbleLine
        _jajiiBubbleLine = jajiiBubbleLine
        self.onFai = onFai
        self.onJajii = onJajii
        self.onNarration = onNarration
        self.onDone = onDone
    }

    @StateObject private var scenarioController = SurvivalScenarioController()
    @StateObject private var sessionBox = SurvivalTutorialSessionBox()
    @State private var runIdentity = UUID()

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
                externalJajiiBubbleText: jajiiBubbleLine,
                externalPlayerBubbleText: faiBubbleLine,
                onSessionReady: { s in
                    worldSessionBox.activate(s)
                    sessionBox.session = s
                }
            )
            .allowsHitTesting(true)
        }
        .onDisappear {
            tapHub.cancelWait()
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

    private func presentLine(_ text: SurvivalTutorialV3LocalizedText) {
        SurvivalTutorialV3LineRouter.present(
            text: text,
            locale: locale,
            context: .battle,
            onFai: onFai,
            onJajii: { line in
                jajiiBubbleLine = line
                onJajii(line)
            },
            onNarration: onNarration
        )
    }

    private func clearLines() {
        SurvivalTutorialV3LineRouter.clear(
            onFai: onFai,
            onJajii: { line in
                jajiiBubbleLine = line
                onJajii(line)
            },
            onNarration: onNarration
        )
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
            sess.applyTutorialSceneKeyboardScroll(fromSceneChords: payload.chords)
        }
        for q in 0..<payload.totalQuestions {
            if Task.isCancelled { return }
            let ch = payload.chords[q % payload.chords.count]
            await MainActor.run {
                scenarioController.setOverrides(SurvivalTutorialV3Scenario.chordIntroBlock(base: payload.baseline))
                scenarioController.clearEnemies()
                scenarioController.setSlotBChord(nil)
                presentLine(payload.dialogue.intro)
            }

            await tapHub.waitForTapOrTimeout(seconds: payload.introDelaySeconds)

            if Task.isCancelled { return }

            await MainActor.run {
                scenarioController.setOverrides(SurvivalTutorialV3Scenario.chordReveal(base: payload.baseline))
                scenarioController.setSlotBChord(ch)
                presentLine(payload.dialogue.onReveal)
                scenarioController.clearEnemies()
                scenarioController.spawnStationaryRing(count: 12, radius: 180)
            }

            guard await waitChordCompletion(session: sess) else { return }

            await MainActor.run {
                scenarioController.emitSpecialShockwaveOnly()
                let remaining = max(0, payload.totalQuestions - q - 1)
                let lineText = payload.dialogue.onCorrectRemaining.interpolateRemaining(
                    locale: locale,
                    remaining: remaining
                )
                SurvivalTutorialV3LineRouter.presentResolvedLine(
                    text: payload.dialogue.onCorrectRemaining,
                    line: lineText,
                    context: .battle,
                    onFai: onFai,
                    onJajii: { txt in
                        jajiiBubbleLine = txt
                        onJajii(txt)
                    },
                    onNarration: onNarration
                )
            }
            let afterNs = UInt64(max(0, SurvivalTutorialV3Constants.afterCorrectSeconds) * 1_000_000_000)
            if afterNs > 0 {
                try? await Task.sleep(nanoseconds: afterNs)
            }
        }
        await MainActor.run {
            clearLines()
            onDone()
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
        guard sess.gameLoop.runtime.slots.indices.contains(1) else { return false }
        let start = await MainActor.run { sess.gameLoop.runtime.slots[1].triggerPulse }
        let deadline = Date().timeIntervalSince1970 + timeoutSeconds
        while Date().timeIntervalSince1970 < deadline {
            if Task.isCancelled { return false }
            let pulse = await MainActor.run { sess.gameLoop.runtime.slots[1].triggerPulse }
            if pulse != start {
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
    let tapHub: SurvivalTutorialTapAdvanceHub
    let drumPlayer: SurvivalTutorialV3DrumLoopPlayer
    let worldSessionBox: SurvivalTutorialWorldSessionBox
    @Binding var faiBubbleLine: String
    @Binding var jajiiBubbleLine: String
    let onFai: (String) -> Void
    let onJajii: (String) -> Void
    let onNarration: (String) -> Void
    let onDone: () -> Void

    init(
        script: SurvivalTutorialScriptPayloadV3,
        scene: SurvivalTutorialV3PhraseBattleScene,
        locale: AppLocale,
        tapHub: SurvivalTutorialTapAdvanceHub,
        drumPlayer: SurvivalTutorialV3DrumLoopPlayer,
        worldSessionBox: SurvivalTutorialWorldSessionBox,
        faiBubbleLine: Binding<String>,
        jajiiBubbleLine: Binding<String>,
        onFai: @escaping (String) -> Void,
        onJajii: @escaping (String) -> Void,
        onNarration: @escaping (String) -> Void,
        onDone: @escaping () -> Void
    ) {
        self.script = script
        self.scene = scene
        self.locale = locale
        self.tapHub = tapHub
        self.drumPlayer = drumPlayer
        self.worldSessionBox = worldSessionBox
        _faiBubbleLine = faiBubbleLine
        _jajiiBubbleLine = jajiiBubbleLine
        self.onFai = onFai
        self.onJajii = onJajii
        self.onNarration = onNarration
        self.onDone = onDone
    }

    @StateObject private var scenarioController = SurvivalScenarioController()
    @StateObject private var sessionBox = SurvivalTutorialSessionBox()
    @State private var runIdentity = UUID()

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
                    externalJajiiBubbleText: jajiiBubbleLine,
                    externalPlayerBubbleText: faiBubbleLine,
                    onSessionReady: { s in
                        worldSessionBox.activate(s)
                        sessionBox.session = s
                    }
                )

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
            tapHub.cancelWait()
            sessionBox.session?.dispose()
            sessionBox.session = nil
            if scene.playAlong != true {
                let vol = Float(script.audioTracks?.drum_loop?.volume ?? 0.35)
                let drumUrl = script.audioTracks?.drum_loop?.url
                Task {
                    await drumPlayer.ensurePlaying(urlString: drumUrl, volume: vol)
                }
            }
        }
    }

    private var phrasePayload: (stage: SurvivalStageDefinition, cfg: SurvivalStageConfig, baseline: SurvivalScenarioOverrides, phrase: SurvivalPhraseDefinition)? {
        guard let raw = script.content[scene.contentRef] else { return nil }
        guard case let .phraseStage(ph) = raw else { return nil }
        guard let stage = SurvivalTutorialV3StageBuilder.buildStageDefinition(from: raw),
              let inline = SurvivalTutorialV3StageBuilder.buildInlinePhrase(from: ph)
        else { return nil }
        let cfg = SurvivalTutorialV3StageBuilder.buildStageConfig(stage: stage, content: raw)
        let baseline = scene.playAlong == true
            ? SurvivalTutorialV3Scenario.mergeBaseline(script: script)
            : SurvivalTutorialV3Scenario.phraseBattleBaseline(script: script)
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

    private func presentLine(_ text: SurvivalTutorialV3LocalizedText) {
        SurvivalTutorialV3LineRouter.present(
            text: text,
            locale: locale,
            context: .battle,
            onFai: onFai,
            onJajii: { line in
                jajiiBubbleLine = line
                onJajii(line)
            },
            onNarration: onNarration
        )
    }

    private func clearLines() {
        SurvivalTutorialV3LineRouter.clear(
            onFai: onFai,
            onJajii: { line in
                jajiiBubbleLine = line
                onJajii(line)
            },
            onNarration: onNarration
        )
    }

    private func phraseRun() async {
        guard let built = phrasePayload else { return }
        guard scene.requiredLoops > 0 else {
            await MainActor.run { onDone() }
            return
        }
        if scene.playAlong != true {
            await MainActor.run { drumPlayer.stop() }
        }
        guard let sess = await pollPhraseSession(timeoutSeconds: 12) else {
            await MainActor.run { onDone() }
            return
        }
        await MainActor.run {
            scenarioController.setOverrides(built.baseline)
            scenarioController.clearEnemies()
        }
        if scene.playAlong == true {
            await phraseRunPlayAlong(sess: sess, built: built)
        } else {
            await phraseRunBattleLoop(sess: sess, built: built)
        }
    }

    /// 従来: フレーズ全周回を requiredLoops 回撃破する撃破バトル。
    private func phraseRunBattleLoop(
        sess: SurvivalGameSession,
        built: (stage: SurvivalStageDefinition, cfg: SurvivalStageConfig, baseline: SurvivalScenarioOverrides, phrase: SurvivalPhraseDefinition)
    ) async {
        await MainActor.run {
            scenarioController.setOverrides(SurvivalTutorialV3Scenario.phraseIntroBlock(base: built.baseline))
            presentLine(scene.dialogue.intro)
        }
        let introSecs = scene.introDelaySeconds ?? SurvivalTutorialV3Constants.introHoldSeconds
        await tapHub.waitForTapOrTimeout(seconds: introSecs)
        if Task.isCancelled { return }

        let startPulse = sess.gameLoop.phraseFullLoopPulse

        await MainActor.run {
            scenarioController.setOverrides(SurvivalTutorialV3Scenario.phraseReveal(base: built.baseline))
            presentLine(scene.dialogue.onReveal)
            scenarioController.clearEnemies()
            scenarioController.spawnStationaryRing(
                count: SurvivalTutorialV3Constants.phraseRevealEnemyCount,
                radius: SurvivalTutorialV3Constants.phraseRevealEnemyRadius
            )
            sess.viewModel.syncPhraseStaff(from: sess.gameLoop)
            sess.resumeScenarioBackgroundMusicIfEnabled()
        }

        guard await SurvivalTutorialPhraseWait.waitLoops(
            getPulse: { sess.gameLoop.phraseFullLoopPulse },
            start: startPulse,
            delta: scene.requiredLoops,
            timeoutSeconds: 320
        ) else {
            await MainActor.run {
                clearLines()
                onDone()
            }
            return
        }

        await MainActor.run {
            let lineText = scene.dialogue.onCorrectRemaining.interpolateRemaining(locale: locale, remaining: 0)
            SurvivalTutorialV3LineRouter.presentResolvedLine(
                text: scene.dialogue.onCorrectRemaining,
                line: lineText,
                context: .battle,
                onFai: onFai,
                onJajii: { txt in
                    jajiiBubbleLine = txt
                    onJajii(txt)
                },
                onNarration: onNarration
            )
            scenarioController.emitSpecialShockwaveOnly()
            clearLines()
            onDone()
        }
    }

    /// play(一緒に弾かせる): 塊を1つずつ正解で進める。塊の quote セリフを塊単位で同期提示し、
    /// 休符塊は自動送り(タップでも送れる)。staff3 bass は正解時に GameLoop が発音する。
    private func phraseRunPlayAlong(
        sess: SurvivalGameSession,
        built: (stage: SurvivalStageDefinition, cfg: SurvivalStageConfig, baseline: SurvivalScenarioOverrides, phrase: SurvivalPhraseDefinition)
    ) async {
        guard let raw = script.content[scene.contentRef],
              case let .phraseStage(ph) = raw,
              let chordDefs = ph.phrases.first?.chords,
              !chordDefs.isEmpty else {
            await MainActor.run { onDone() }
            return
        }

        await MainActor.run {
            scenarioController.setOverrides(SurvivalTutorialV3Scenario.phraseReveal(base: built.baseline))
            scenarioController.clearEnemies()
            scenarioController.spawnStationaryRing(
                count: SurvivalTutorialV3Constants.phraseRevealEnemyCount,
                radius: SurvivalTutorialV3Constants.phraseRevealEnemyRadius
            )
            sess.viewModel.syncPhraseStaff(from: sess.gameLoop)
            if scene.playAlong != true {
                sess.resumeScenarioBackgroundMusicIfEnabled()
            }
            if !(scene.dialogue.intro.ja.isEmpty && scene.dialogue.intro.en.isEmpty) {
                presentLine(scene.dialogue.intro)
            }
        }

        var prevPulse = await MainActor.run { sess.gameLoop.phraseChordCompletePulse }

        for (index, chord) in chordDefs.enumerated() {
            if Task.isCancelled { return }
            await MainActor.run {
                if let quote = chord.quote, !(quote.ja.isEmpty && quote.en.isEmpty) {
                    presentLine(quote)
                }
            }

            if chord.voicing.isEmpty {
                // 会話だけの小節（休符塊）: 自動送り + タップ送り。
                let isLastChunk = index == chordDefs.count - 1
                if !isLastChunk {
                    await tapHub.waitForTapOrTimeout(seconds: SurvivalTutorialV3Constants.playRestSeconds)
                }
                if Task.isCancelled { return }
                await MainActor.run {
                    sess.gameLoop.advancePhraseRestChord()
                    sess.viewModel.syncPhraseStaff(from: sess.gameLoop)
                }
                prevPulse = await MainActor.run { sess.gameLoop.phraseChordCompletePulse }
            } else {
                let ok = await SurvivalTutorialPhraseWait.waitLoops(
                    getPulse: { sess.gameLoop.phraseChordCompletePulse },
                    start: prevPulse,
                    delta: 1,
                    timeoutSeconds: 320
                )
                if !ok {
                    await MainActor.run {
                        clearLines()
                        onDone()
                    }
                    return
                }
                prevPulse &+= 1
            }
        }

        if Task.isCancelled { return }
        await MainActor.run {
            scenarioController.emitSpecialShockwaveOnly()
            clearLines()
            onDone()
        }
    }
}

// MARK: - Small async helpers（低頻・チュートリアル限定）

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

import AVFoundation
import SwiftUI

@MainActor
private final class SurvivalTutorialDemoSessionBox: ObservableObject {
    weak var session: SurvivalGameSession?
}

@MainActor
struct SurvivalTutorialV3DemoPlayLessonScene: View {
    let script: SurvivalTutorialScriptPayloadV3
    let scene: SurvivalTutorialV3DemoPlayScene
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

    @StateObject private var scenarioController = SurvivalScenarioController()
    @StateObject private var sessionBox = SurvivalTutorialDemoSessionBox()
    @State private var demoStaffSnapshot: SurvivalTutorialDemoStaffSnapshot?
    @State private var demoRevealActive = false
    @State private var windowStartMeasure: Int?
    @State private var runIdentity = UUID()

    var body: some View {
        ZStack(alignment: .top) {
            SurvivalGameView(
                stage: OnboardingChords.stageDefinition,
                hintMode: true,
                characterId: "fai",
                locale: locale,
                onClose: {},
                isDemo: true,
                configOverride: demoStageConfig,
                scenarioOverrides: introScenarioOverrides,
                scenarioController: scenarioController,
                inlinePhraseDefinition: nil,
                externalJajiiBubbleText: jajiiBubbleLine,
                externalPlayerBubbleText: faiBubbleLine,
                onSessionReady: { session in
                    worldSessionBox.activate(session)
                    scenarioController.bind(session: session)
                    sessionBox.session = session
                    let scrollChords = SurvivalTutorialDemoPlayScheduler.resolvedChordsForKeyboardScroll(
                        in: scene.chords
                    )
                    session.applyTutorialSceneKeyboardScroll(fromSceneChords: scrollChords)
                }
            )

            if demoRevealActive,
               let demoStaffSnapshot {
                SurvivalTutorialDemoStaffView(snapshot: demoStaffSnapshot)
                    .padding(.top, 96)
                    .padding(.horizontal, 12)
                    .allowsHitTesting(false)
            }
        }
        .task(id: runIdentity) {
            await runDemoPlay()
        }
    }

    private var baseline: SurvivalScenarioOverrides {
        SurvivalTutorialV3Scenario.mergeBaseline(script: script)
    }

    private var introScenarioOverrides: SurvivalScenarioOverrides {
        SurvivalTutorialV3Scenario.demoPlayIntro(base: baseline)
    }

    private var demoStageConfig: SurvivalStageConfig {
        SurvivalStageConfig(
            difficulty: "easy",
            displayName: "Tutorial Demo",
            description: "Tutorial Demo",
            descriptionEn: "Tutorial Demo",
            allowedChords: [],
            enemySpawnRate: 3,
            enemySpawnCount: 2,
            enemyStatMultiplier: 0.5,
            expMultiplier: 0.5,
            itemDropRate: 0.1,
            bgmUrl: nil
        )
    }

    private func clearLines() {
        SurvivalTutorialV3LineRouter.clear(
            onFai: onFai,
            onJajii: { jajiiBubbleLine = $0 },
            onNarration: onNarration
        )
        jajiiBubbleLine = ""
    }

    private func updateStaff(activeChordIndex: Int?) {
        if let activeChordIndex,
           scene.chords.indices.contains(activeChordIndex) {
            windowStartMeasure = scene.chords[activeChordIndex].measure_number
        } else if windowStartMeasure == nil {
            windowStartMeasure = scene.chords.first?.measure_number ?? 1
        }
        demoStaffSnapshot = SurvivalTutorialDemoStaffSnapshot(
            chords: scene.chords,
            activeChordIndex: activeChordIndex,
            keyFifths: scene.keyFifths ?? 0,
            windowStartMeasure: windowStartMeasure ?? scene.chords.first?.measure_number ?? 1
        )
    }

    private func setActiveChord(_ index: Int?) {
        updateStaff(activeChordIndex: index)
        if let index, scene.chords.indices.contains(index) {
            let chord = scene.chords[index]
            scenarioController.setDemoKeyboardHints(chord.voicing)
            if scene.livePlayback == true {
                if !chord.voicing.isEmpty {
                    sessionBox.session?.playOnboardingChord(midis: chord.voicing)
                }
                if let bass = chord.bass, !bass.isEmpty {
                    sessionBox.session?.playOnboardingBass(midis: bass)
                }
            }
        } else {
            scenarioController.setDemoKeyboardHints([])
        }
    }

    private func presentLine(at lineIndex: Int) {
        guard scene.lines.indices.contains(lineIndex) else { return }
        let line = scene.lines[lineIndex]
        let speaker = SurvivalTutorialDemoPlayScheduler.resolveLineSpeaker(line)
        let text = locale == .ja ? line.ja : line.en
        switch speaker {
        case .fai:
            onFai(text)
            jajiiBubbleLine = ""
            onNarration("")
        case .jajii:
            jajiiBubbleLine = text
            onFai("")
            onNarration("")
        case .narration:
            onNarration(text)
            onFai("")
            jajiiBubbleLine = ""
        }
    }

    private func runIntro() async -> Bool {
        drumPlayer.stop()

        let introLines = scene.introLines ?? []
        guard !introLines.isEmpty else { return true }

        scenarioController.setOverrides(introScenarioOverrides)
        updateStaff(activeChordIndex: nil)
        scenarioController.setDemoKeyboardHints([])

        let interval = SurvivalTutorialV3Constants.dialogueLineSeconds
        for line in introLines {
            if Task.isCancelled { return false }
            await MainActor.run {
                SurvivalTutorialV3LineRouter.present(
                    text: line,
                    locale: locale,
                    context: .dialogueOnly,
                    onFai: onFai,
                    onJajii: { jajiiBubbleLine = $0 },
                    onNarration: onNarration
                )
            }
            await tapHub.waitForTapOrTimeout(seconds: interval)
            if Task.isCancelled { return false }
        }

        await MainActor.run { clearLines() }
        return true
    }

    private func runDemoTimeline() async {
        demoRevealActive = true
        scenarioController.setOverrides(SurvivalTutorialV3Scenario.demoPlayReveal(base: baseline))
        updateStaff(activeChordIndex: nil)
        scenarioController.setDemoKeyboardHints([])

        let vol = SurvivalTutorialV3DemoPlayAudioResolver.resolveVolume(scene: scene, script: script)
        let drumUrl = SurvivalTutorialV3DemoPlayAudioResolver.resolveUrlString(
            scene: scene,
            script: script,
            locale: locale
        )
        let anchor = Date()
        await drumPlayer.restartFromStart(urlString: drumUrl, volume: vol)
        if Task.isCancelled { return }
        let elapsed = Date().timeIntervalSince(anchor)

        let schedule = SurvivalTutorialDemoPlayScheduler.buildSchedule(scene: scene)
        // 鍵盤ハイライトの描画レイテンシを見越した先行発火量（出力レイテンシ分は後ろ倒し）。
        // セリフ・終了イベントには適用せず、コード点灯のみ補正する。
        let outputLatency = AVAudioSession.sharedInstance().outputLatency
        let chordHighlightAdvance = SurvivalTutorialV3Constants.demoHighlightRenderLeadSeconds - outputLatency
        var activeChordIndex: Int?
        var activeLineIndex: Int?

        await withTaskGroup(of: Void.self) { group in
            for event in schedule {
                let advance: Double
                switch event.kind {
                case .chordStart, .chordEnd:
                    advance = chordHighlightAdvance
                case .lineStart, .lineEnd, .demoEnd:
                    advance = 0
                }
                let delaySeconds = SurvivalTutorialDemoPlayScheduler.anchoredDelaySeconds(
                    atSeconds: event.atSeconds,
                    elapsedSeconds: elapsed,
                    advanceSeconds: advance
                )
                let delayNs = UInt64(delaySeconds * 1_000_000_000)
                group.addTask { @MainActor in
                    try? await Task.sleep(nanoseconds: delayNs)
                    guard !Task.isCancelled else { return }
                    switch event.kind {
                    case .chordStart:
                        if let idx = event.chordIndex {
                            activeChordIndex = idx
                            setActiveChord(idx)
                        }
                    case .chordEnd:
                        if event.chordIndex == activeChordIndex {
                            activeChordIndex = nil
                            setActiveChord(nil)
                        }
                    case .lineStart:
                        if let idx = event.lineIndex {
                            activeLineIndex = idx
                            presentLine(at: idx)
                        }
                    case .lineEnd:
                        if event.lineIndex == activeLineIndex {
                            activeLineIndex = nil
                            clearLines()
                        }
                    case .demoEnd:
                        clearLines()
                        setActiveChord(nil)
                        onDone()
                    }
                }
            }
        }
    }

    private func runDemoPlay() async {
        guard !scene.chords.isEmpty else {
            onDone()
            return
        }

        let introOk = await runIntro()
        guard introOk, !Task.isCancelled else { return }
        await runDemoTimeline()
    }
}

import SwiftUI

enum EarTrainingTimingAdjustmentEntry {
    case quest
    case settings
}

/// OSMD タイミング調整チュートリアル（Web `EarTrainingTimingAdjustmentExperience` 相当）。
struct EarTrainingTimingAdjustmentView: View {
    let entry: EarTrainingTimingAdjustmentEntry
    let locale: AppLocale
    var lessonId: UUID?
    var lessonSongId: UUID?
    var returnStageId: UUID?
    var returnLessonContext: EarTrainingLessonContext?
    var returnPracticeMode: Bool = false
    let onClose: () -> Void
    var onQuestComplete: (() async -> Void)?

    private static let scriptId = "osmd-timing-adjustment-v1"

    @State private var gate: Gate = .loading
    @State private var script: EarTrainingTutorialScriptPayload?
    @State private var sceneIndex = 0
    @State private var showFinishCta = false
    @State private var showGreatInterstitial = false
    @State private var greatInterstitialPercent: Int?
    @State private var bluetoothNoticeOpen = true
    @State private var playbackReady = false
    @State private var osmdBattleReady = false

    private enum Gate {
        case loading
        case ready
        case failed
    }

    private var isJa: Bool { locale == .ja }

    private var greatInterstitialLabel: String {
        if let greatInterstitialPercent {
            return "Great!!(\(greatInterstitialPercent)%)"
        }
        return "Great!!"
    }

    var body: some View {
        Group {
            switch gate {
            case .loading:
                ProgressView(isJa ? "読み込み中…" : "Loading…")
            case .failed:
                VStack(spacing: 16) {
                    Text(isJa ? "タイミング調整チュートリアルを読み込めませんでした。" : "Could not load the timing adjustment tutorial.")
                        .multilineTextAlignment(.center)
                    Button(isJa ? "戻る" : "Back", action: onClose)
                }
                .padding()
            case .ready:
                if let script {
                    timingContent(script: script)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black)
        .task(id: Self.scriptId) {
            gate = .loading
            if let loaded = await EarTrainingTutorialScriptService.fetchScript(scriptId: Self.scriptId) {
                script = loaded
                sceneIndex = 0
                gate = .ready
            } else {
                gate = .failed
            }
        }
        .onChange(of: showFinishCta) { visible in
            // 通常の耳コピチュートリアルと同様、クエスト課題の完了 CTA 表示時にクリアジングルを鳴らす
            if visible, entry == .quest {
                QuestJinglePlayer.playComplete()
            }
        }
    }

    @ViewBuilder
    private func timingContent(script: EarTrainingTutorialScriptPayload) -> some View {
        GeometryReader { portraitProxy in
            let portraitSize = portraitProxy.size
            let landscapeSize = CGSize(
                width: max(1, portraitSize.height),
                height: max(1, portraitSize.width)
            )
            let scenes = script.scenes
            ZStack {
                ZStack {
                    Group {
                        if playbackReady, scenes.indices.contains(sceneIndex) {
                            switch scenes[sceneIndex] {
                            case .finish:
                                EmptyView()
                            case .dialogueOnly(let dialogue):
                                EarTrainingTutorialDialogueBattleView(
                                    drumLoopUrl: script.audioTracks?.drum_loop?.url,
                                    locale: locale,
                                    lines: dialogue.lines,
                                    intervalSeconds: dialogue.lineIntervalSeconds ?? 4,
                                    fixedLandscapeSize: landscapeSize,
                                    onComplete: { handleSceneFinished(script: script) }
                                )
                                .id("timing-dialogue-\(sceneIndex)")
                            case .chordOsmd(let osmdScene):
                                timingOsmdScene(
                                    script: script,
                                    scene: scenes[sceneIndex],
                                    landscapeSize: landscapeSize,
                                    timingCalibrationMode: osmdScene.contentRef == "osmd-timing-adjustment"
                                )
                                .id("timing-osmd-\(sceneIndex)-\(osmdScene.contentRef)")
                            default:
                                EmptyView()
                            }
                        }
                        if scenes.indices.contains(sceneIndex), case .finish = scenes[sceneIndex], showFinishCta {
                            Color.black
                            Button(isJa ? "完了する" : "Complete") {
                                Task {
                                    await onQuestComplete?()
                                    onClose()
                                }
                            }
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 32)
                            .padding(.vertical, 16)
                            .background(Color(red: 0.58, green: 0.20, blue: 0.92))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .shadow(color: .black.opacity(0.35), radius: 8, x: 0, y: 4)
                        }
                    }
                    .allowsHitTesting(!bluetoothNoticeOpen)

                    if showGreatInterstitial {
                        Color.black.opacity(0.35)
                            .allowsHitTesting(false)
                        Text(greatInterstitialLabel)
                            .font(.system(size: 44, weight: .heavy))
                            .foregroundStyle(Color(red: 0.99, green: 0.92, blue: 0.55))
                            .shadow(color: .black.opacity(0.85), radius: 2, x: 0, y: 4)
                            .zIndex(95)
                    }

                    if bluetoothNoticeOpen {
                        bluetoothNoticeOverlay(size: landscapeSize)
                            .zIndex(100)
                    }

                    if !bluetoothNoticeOpen, shouldShowBottomCta {
                        VStack {
                            HStack {
                                Spacer()
                                Button(action: handleBottomCta) {
                                    Text(bottomCtaLabel)
                                        .font(.headline.bold())
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 24)
                                        .padding(.vertical, 14)
                                        .background(Color.purple)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .padding(.trailing, 16)
                                .padding(.top, 16)
                            }
                            Spacer()
                        }
                        .zIndex(90)
                    }
                }
                .frame(width: landscapeSize.width, height: landscapeSize.height)
                .clipped()
                .rotationEffect(.degrees(90))
                .frame(width: portraitSize.width, height: portraitSize.height)
                .position(x: portraitSize.width / 2, y: portraitSize.height / 2)
            }
        }
    }

    @ViewBuilder
    private func timingOsmdScene(
        script: EarTrainingTutorialScriptPayload,
        scene: EarTrainingTutorialScene,
        landscapeSize: CGSize,
        timingCalibrationMode: Bool
    ) -> some View {
        if case .chordOsmd(let osmdScene) = scene,
           let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
            content: script.content,
            contentRef: osmdScene.contentRef,
            keyboardHintsScriptDefault: uiOverrides(for: osmdScene.contentRef).keyboardHintsDefault,
            locale: locale
           ) {
            let ui = uiOverrides(for: osmdScene.contentRef)
            EarTrainingChordOSMDGameView(
                source: .embedded(stage),
                lessonContext: nil,
                locale: locale,
                initialPracticeMode: false,
                tutorialHooks: makeOsmdHooks(
                    script: script,
                    contentRef: osmdScene.contentRef,
                    requiredLoops: osmdScene.requiredLoops,
                    timedLines: osmdScene.timedLines,
                    timingCalibrationMode: timingCalibrationMode,
                    ui: ui
                ),
                hostedLandscapeSize: landscapeSize,
                onReady: timingCalibrationMode
                    ? {
                        osmdBattleReady = true
                    }
                    : nil,
                onClose: onClose
            )
        }
    }

    private func bluetoothNoticeOverlay(size: CGSize) -> some View {
        Color.black.opacity(0.7)
            .frame(width: size.width, height: size.height)
            .overlay {
                VStack(spacing: 16) {
                    Text(isJa ? "Bluetooth接続について" : "About Bluetooth audio")
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                    Text(isJa
                         ? "Bluetooth接続のイヤホン・ヘッドホン・MIDIキーボードでは遅延が出やすく、タイミングがずれて感じられることがあります。有線接続を推奨します。"
                         : "Bluetooth headphones, earbuds, or MIDI keyboards can add latency and make timing feel off. A wired connection is recommended.")
                        .font(.subheadline)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                    Button {
                        bluetoothNoticeOpen = false
                        playbackReady = true
                    } label: {
                        Text("OK")
                            .font(.headline.bold())
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.purple)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
                .padding(24)
                .background(Color(white: 0.12))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .padding(.horizontal, 24)
            }
    }

    private var bottomCtaLabel: String {
        entry == .quest ? (isJa ? "進む" : "Continue") : (isJa ? "戻る" : "Back")
    }

    /// 進むはタイミング調整 OSMD の読み込み完了後のみ。完了 CTA は中央ボタンを使う
    private var shouldShowBottomCta: Bool {
        if entry == .settings { return true }
        if showFinishCta { return false }
        guard let script, script.scenes.indices.contains(sceneIndex) else { return false }
        if case .chordOsmd(let osmd) = script.scenes[sceneIndex] {
            return osmd.contentRef == "osmd-timing-adjustment" && osmdBattleReady
        }
        return false
    }

    private func handleBottomCta() {
        if entry == .settings {
            onClose()
            return
        }
        guard let script else { return }
        handleSceneFinished(script: script)
    }

    private func uiOverrides(for contentRef: String) -> EarTrainingTutorialUiOverrides {
        switch contentRef {
        case "osmd-timing-adjustment":
            return EarTrainingTutorialUiOverrides(
                hidePlayerHpBar: true,
                hideSettingsButton: true,
                hideBackButton: true,
                hideLobby: true,
                hideMidiToggle: true,
                hidePhraseIntroQuota: true,
                showExitButton: false,
                playerInvincible: true,
                disableEnemyAttacks: true,
                keyboardHintsDefault: false
            )
        default:
            return EarTrainingTutorialUiOverrides(
                hidePlayerHpBar: true,
                hideSettingsButton: true,
                hideBackButton: true,
                hideLobby: true,
                hideMidiToggle: true,
                hidePhraseIntroQuota: true,
                showExitButton: false,
                playerInvincible: true,
                disableEnemyAttacks: true,
                keyboardHintsDefault: true
            )
        }
    }

    private func makeOsmdHooks(
        script: EarTrainingTutorialScriptPayload,
        contentRef: String,
        requiredLoops: Int,
        timedLines: [EarTrainingTutorialOsmdTimedLine]?,
        timingCalibrationMode: Bool,
        ui: EarTrainingTutorialUiOverrides
    ) -> EarTrainingTutorialSceneHooks {
        EarTrainingTutorialSceneHooks(
            ui: ui,
            noCombat: ui.noCombat,
            onCharacterText: { _ in },
            onSceneComplete: { result in handleSceneFinished(script: script, result: result) },
            requiredSuccessfulLoops: max(1, requiredLoops),
            osmdTimedLines: timedLines,
            tutorialDrumLoopUrl: EarTrainingTutorialOsmdDrumLoopResolver.resolveTutorialOsmdDrumLoopUrl(
                content: script.content,
                contentRef: contentRef
            ),
            timingCalibrationMode: timingCalibrationMode
        )
    }

    private func handleSceneFinished(
        script: EarTrainingTutorialScriptPayload,
        result: EarTrainingTutorialOsmdSceneResult? = nil
    ) {
        if script.scenes.indices.contains(sceneIndex) {
            switch script.scenes[sceneIndex] {
            case .dialogueOnly:
                advanceScene(script: script)
                return
            case .chordOsmd(let osmd) where osmd.contentRef == "osmd-timing-adjustment":
                advanceScene(script: script)
                return
            default:
                greatInterstitialPercent = result?.noteHitPercent
                showGreatInterstitial = true
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 1_000_000_000)
                    showGreatInterstitial = false
                    greatInterstitialPercent = nil
                    advanceScene(script: script)
                }
                return
            }
        }
        advanceScene(script: script)
    }

    private func advanceScene(script: EarTrainingTutorialScriptPayload) {
        showGreatInterstitial = false
        greatInterstitialPercent = nil
        osmdBattleReady = false
        let nextIndex = sceneIndex + 1
        guard script.scenes.indices.contains(nextIndex) else {
            Task {
                await onQuestComplete?()
                onClose()
            }
            return
        }
        let nextScene = script.scenes[nextIndex]
        if case .finish = nextScene {
            let needsCta = script.finish?.showCta ?? true
            if needsCta {
                sceneIndex = nextIndex
                showFinishCta = true
            } else {
                Task {
                    await onQuestComplete?()
                    onClose()
                }
            }
            return
        }
        sceneIndex = nextIndex
        showFinishCta = false
    }
}

/// 設定からタイミング調整モードへ遷移する際の復帰コンテキスト。
struct EarTrainingTimingAdjustmentReturnLaunch: Identifiable {
    let id = UUID()
    let stageId: UUID
    let lessonContext: EarTrainingLessonContext?
    let initialPracticeMode: Bool
}

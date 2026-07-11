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
    @State private var bluetoothNoticeOpen = true
    @State private var playbackReady = false

    private enum Gate {
        case loading
        case ready
        case failed
    }

    private var isJa: Bool { locale == .ja }

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
                    if playbackReady, scenes.indices.contains(sceneIndex) {
                        switch scenes[sceneIndex] {
                        case .finish:
                            EmptyView()
                        default:
                            timingOsmdScene(script: script, scene: scenes[sceneIndex], landscapeSize: landscapeSize)
                        }
                    }
                    if scenes.indices.contains(sceneIndex), case .finish = scenes[sceneIndex], showFinishCta {
                        Color.black
                        Text(isJa ? "OSMDタイミング調整チュートリアル" : "OSMD Timing Adjustment Tutorial")
                            .font(.title3.bold())
                            .foregroundStyle(.white)
                    }
                }
                .frame(width: landscapeSize.width, height: landscapeSize.height)
                .rotationEffect(.degrees(90))
                .frame(width: portraitSize.width, height: portraitSize.height)
                .position(x: portraitSize.width / 2, y: portraitSize.height / 2)

                if bluetoothNoticeOpen {
                    bluetoothNoticeOverlay
                }

                if !bluetoothNoticeOpen, shouldShowBottomCta {
                    VStack {
                        Spacer()
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
                            .padding(.bottom, 16)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func timingOsmdScene(
        script: EarTrainingTutorialScriptPayload,
        scene: EarTrainingTutorialScene,
        landscapeSize: CGSize
    ) -> some View {
        if case .chordOsmd(let osmdScene) = scene,
           let stage = try? EarTrainingTutorialStageBuilder.resolveStage(
            content: script.content,
            contentRef: osmdScene.contentRef,
            keyboardHintsScriptDefault: false,
            locale: locale
           ) {
            EarTrainingChordOSMDGameView(
                source: .embedded(stage),
                lessonContext: nil,
                locale: locale,
                initialPracticeMode: false,
                tutorialHooks: makeTimingHooks(script: script, requiredLoops: osmdScene.requiredLoops),
                hostedLandscapeSize: landscapeSize,
                onClose: onClose
            )
        }
    }

    private var bluetoothNoticeOverlay: some View {
        Color.black.opacity(0.7)
            .ignoresSafeArea()
            .overlay {
                VStack(spacing: 16) {
                    Text(isJa ? "Bluetooth接続について" : "About Bluetooth audio")
                        .font(.title3.bold())
                    Text(isJa
                         ? "Bluetooth接続のイヤホン・ヘッドホン・MIDIキーボードでは遅延が出やすく、タイミングがずれて感じられることがあります。有線接続を推奨します。"
                         : "Bluetooth headphones, earbuds, or MIDI keyboards can add latency and make timing feel off. A wired connection is recommended.")
                        .font(.subheadline)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                    Button(isJa ? "OK" : "OK") {
                        bluetoothNoticeOpen = false
                        playbackReady = true
                    }
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.purple)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .padding(24)
                .background(Color(white: 0.12))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .padding(.horizontal, 24)
            }
    }

    private var shouldShowBottomCta: Bool {
        entry == .settings || showFinishCta
    }

    private var bottomCtaLabel: String {
        entry == .quest ? (isJa ? "進む" : "Continue") : (isJa ? "戻る" : "Back")
    }

    private func handleBottomCta() {
        if entry == .settings {
            onClose()
            return
        }
        if showFinishCta {
            Task {
                await onQuestComplete?()
                onClose()
            }
        }
    }

    private func makeTimingHooks(
        script: EarTrainingTutorialScriptPayload,
        requiredLoops: Int
    ) -> EarTrainingTutorialSceneHooks {
        EarTrainingTutorialSceneHooks(
            ui: script.ui,
            noCombat: script.ui.noCombat,
            onCharacterText: { _ in },
            onSceneComplete: { _ in handleSceneFinished(script: script) },
            requiredSuccessfulLoops: max(1, requiredLoops),
            osmdTimedLines: [],
            tutorialDrumLoopUrl: EarTrainingTutorialOsmdDrumLoopResolver.resolveTutorialOsmdDrumLoopUrl(
                content: script.content,
                contentRef: "osmd-timing-adjustment"
            ),
            timingCalibrationMode: true
        )
    }

    private func handleSceneFinished(script: EarTrainingTutorialScriptPayload) {
        let nextIndex = sceneIndex + 1
        guard script.scenes.indices.contains(nextIndex) else {
            Task {
                await onQuestComplete?()
                onClose()
            }
            return
        }
        let nextScene = script.scenes[nextIndex]
        sceneIndex = nextIndex
        if case .finish = nextScene {
            showFinishCta = script.finish?.showCta ?? true
        } else {
            showFinishCta = false
        }
    }
}

/// 設定からタイミング調整モードへ遷移する際の復帰コンテキスト。
struct EarTrainingTimingAdjustmentReturnLaunch: Identifiable {
    let id = UUID()
    let stageId: UUID
    let lessonContext: EarTrainingLessonContext?
    let initialPracticeMode: Bool
}

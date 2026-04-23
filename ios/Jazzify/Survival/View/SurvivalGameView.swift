import SwiftUI
import SpriteKit
import UIKit

/// サバイバル ゲーム画面のルート (fullScreenCover から表示されるネイティブ版)。
/// - SpriteKit ゲーム世界 + SwiftUI オーバーレイ (HUD / スロット / スティック / 鍵盤)
/// - `onAppear` で Supabase から `SurvivalCharacterProfile` / `SurvivalStageConfig` を取得し、
///   `SurvivalGameController` を生成する (失敗時はデフォルト値にフォールバック)
/// - MIDI 入力は `MIDIManager.shared.onMIDIEvent` を直接フックして `SurvivalGameController.handleNoteOn/Off` に中継
struct SurvivalGameView: View {
    let stage: SurvivalStageDefinition
    let hintMode: Bool
    let characterId: String
    let locale: AppLocale
    let onClose: () -> Void

    @State private var controller: SurvivalGameController?
    @State private var isLoading: Bool = true
    @State private var loadError: String?
    @StateObject private var orientation = OrientationManager.shared

    var body: some View {
        ZStack {
            if let controller = controller {
                gameContent(controller: controller)
            } else if isLoading {
                loadingView
            } else {
                errorView
            }
        }
        .background(Color.black)
        .task { await bootstrap() }
        .onDisappear {
            MIDIManager.shared.onMIDIEvent = nil
            controller?.stopAudio()
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Subviews

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .tint(.yellow)
            Text(locale == .ja ? "ステージを準備中..." : "Preparing stage...")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.8))
        }
    }

    private var errorView: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40))
                .foregroundStyle(.yellow)
            Text(loadError ?? (locale == .ja ? "読み込みに失敗しました" : "Failed to load"))
                .foregroundStyle(.white)
            Button(action: { onClose() }) {
                Text(locale == .ja ? "マップに戻る" : "Back to Map")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(Color.yellow)
                    .cornerRadius(8)
            }
        }
    }

    @ViewBuilder
    private func gameContent(controller: SurvivalGameController) -> some View {
        ZStack(alignment: .top) {
            SurvivalSceneContainer(controller: controller)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                SurvivalHUDView(
                    controller: controller,
                    stage: stage,
                    locale: locale
                )
                SurvivalCodeSlotsView(controller: controller)
                    .padding(.top, 4)
                Spacer()
            }

            // 左半分タップ領域 = ジョイスティック（タップ位置に出現）
            GeometryReader { proxy in
                HStack(spacing: 0) {
                    SurvivalJoystickView { analog in
                        controller.analogInput = analog
                    }
                    .frame(width: proxy.size.width * 0.4)
                    Spacer(minLength: 0)
                }
            }
            .allowsHitTesting(controller.runtime.phase == .playing && !controller.isPaused)

            VStack {
                Spacer()
                SurvivalChordPadView(controller: controller)
                    .padding(.horizontal, 8)
                    .padding(.bottom, 8)
            }

            if controller.isPaused && controller.runtime.phase == .playing {
                pauseOverlay(controller: controller)
            }

            if controller.runtime.phase != .playing {
                resultOverlay(controller: controller)
            }
        }
    }

    // MARK: - Bootstrap

    @MainActor
    private func bootstrap() async {
        guard controller == nil else { return }
        isLoading = true
        loadError = nil

        let supabase = SupabaseService.shared
        async let profileTask: SurvivalCharacterProfile = {
            (try? await supabase.fetchFaiProfile()) ?? SurvivalCharacterProfile.defaultFai
        }()
        async let configTask: SurvivalStageConfig = {
            let difficulty = stage.difficulty.rawValue
            if let fetched = try? await supabase.fetchSurvivalStageConfig(difficulty: difficulty) {
                return fetched
            }
            return SurvivalStageConfig.default
        }()

        let profile = await profileTask
        let config = await configTask

        let created = SurvivalGameController(
            stage: stage,
            hintMode: hintMode,
            characterId: characterId,
            profile: profile,
            config: config,
            onExit: { _ in onClose() }
        )
        self.controller = created
        self.isLoading = false

        created.start()
        MIDIManager.shared.onMIDIEvent = { status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            Task { @MainActor in
                if messageType == 0x90 && velocity > 0 {
                    created.handleNoteOn(note)
                } else if messageType == 0x80 || (messageType == 0x90 && velocity == 0) {
                    created.handleNoteOff(note)
                }
            }
        }
    }

    // MARK: - Overlays

    private func pauseOverlay(controller: SurvivalGameController) -> some View {
        ZStack {
            Color.black.opacity(0.5).ignoresSafeArea()
            VStack(spacing: 20) {
                Text(locale == .ja ? "一時停止" : "Paused")
                    .font(.title.bold())
                    .foregroundStyle(.white)
                Button(action: { controller.togglePause() }) {
                    Text(locale == .ja ? "再開" : "Resume")
                        .font(.headline)
                        .foregroundStyle(.black)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 12)
                        .background(Color.yellow)
                        .cornerRadius(10)
                }
                Button(action: { controller.requestExit() }) {
                    Text(locale == .ja ? "マップに戻る" : "Back to Map")
                        .foregroundStyle(.white)
                }
            }
        }
    }

    private func resultOverlay(controller: SurvivalGameController) -> some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalGameResultView(
                isCleared: controller.runtime.phase == .cleared,
                stage: stage,
                enemiesDefeated: controller.runtime.enemiesDefeated,
                elapsedSeconds: Int(controller.runtime.elapsedSeconds.rounded()),
                totalExp: controller.runtime.totalExp,
                playerHp: controller.runtime.player.hp,
                playerMaxHp: controller.runtime.player.maxHp,
                hintMode: hintMode,
                isBossStage: controller.isBossStage,
                locale: locale,
                clearReportInFlight: controller.clearReportInFlight,
                clearReportError: controller.clearReportError,
                onRetry: { onClose() },
                onExit: { controller.requestExit() }
            )
        }
    }
}

// MARK: - SpriteKit ブリッジ

private struct SurvivalSceneContainer: UIViewRepresentable {
    let controller: SurvivalGameController

    func makeUIView(context: Context) -> SKView {
        let view = SKView(frame: .zero)
        view.ignoresSiblingOrder = true
        view.preferredFramesPerSecond = 60
        let scene = SurvivalScene(size: UIScreen.main.bounds.size, controller: controller)
        view.presentScene(scene)
        return view
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        // SurvivalGameController の状態変化は scene.update で直接参照されるため、ここでは何もしない。
    }
}

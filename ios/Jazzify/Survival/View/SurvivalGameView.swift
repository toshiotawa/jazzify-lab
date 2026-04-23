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
    /// ログイン前のデモプレイで true にする。Supabase 問い合わせをスキップし、
    /// `configOverride` と `SurvivalCharacterProfile.defaultFai` をそのまま使用する。
    var isDemo: Bool = false
    /// Supabase から取得する代わりに使用する `SurvivalStageConfig` (デモや固定難易度用)。
    /// `nil` の場合は従来通り `SupabaseService.fetchSurvivalStageConfig` を呼び出す。
    var configOverride: SurvivalStageConfig? = nil

    /// `@State` は値の差し替えしか観測できず、`SurvivalGameController` 内部の
    /// `@Published` プロパティ (`runtime.phase` 等) の変化を SwiftUI が再描画しない。
    /// そのため `controller` が生成された後は `SurvivalGameContent` に委譲し、
    /// そちらの `@ObservedObject` 経由で画面を更新する。
    @State private var controller: SurvivalGameController?
    @State private var isLoading: Bool = true
    @State private var loadError: String?
    @StateObject private var orientation = OrientationManager.shared

    var body: some View {
        ZStack {
            if let controller = controller {
                SurvivalGameContent(
                    controller: controller,
                    stage: stage,
                    hintMode: hintMode,
                    locale: locale,
                    onClose: onClose
                )
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

    // MARK: - Bootstrap

    @MainActor
    private func bootstrap() async {
        guard controller == nil else { return }
        isLoading = true
        loadError = nil

        let profile: SurvivalCharacterProfile
        let config: SurvivalStageConfig

        if isDemo {
            // 未ログイン状態でも動くよう Supabase 問い合わせを完全に回避する。
            profile = SurvivalCharacterProfile.defaultFai
            config = configOverride ?? SurvivalStageConfig.default
        } else {
            let supabase = SupabaseService.shared
            async let profileTask: SurvivalCharacterProfile = {
                (try? await supabase.fetchFaiProfile()) ?? SurvivalCharacterProfile.defaultFai
            }()
            async let configTask: SurvivalStageConfig = {
                if let override = configOverride { return override }
                let difficulty = stage.difficulty.rawValue
                if let fetched = try? await supabase.fetchSurvivalStageConfig(difficulty: difficulty) {
                    return fetched
                }
                return SurvivalStageConfig.default
            }()

            profile = await profileTask
            config = await configTask
        }

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

}

// MARK: - Controller-observing content view

/// `SurvivalGameController` を `@ObservedObject` として購読し、
/// `runtime.phase` / `isPaused` の変化で自動再描画される子ビュー。
/// これを分離しないと、親の `@State var controller: SurvivalGameController?`
/// では Published プロパティの変化が SwiftUI に伝わらず、
/// ゲームオーバー後の終了モーダルがアプリを一度バックグラウンドへ移してからでないと表示されない。
private struct SurvivalGameContent: View {
    @ObservedObject var controller: SurvivalGameController
    let stage: SurvivalStageDefinition
    let hintMode: Bool
    let locale: AppLocale
    let onClose: () -> Void

    var body: some View {
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
                pauseOverlay
            }

            if controller.runtime.phase != .playing {
                resultOverlay
            }
        }
    }

    // MARK: - Overlays

    private var pauseOverlay: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalPauseSettingsSheet(
                locale: locale,
                onResume: { controller.togglePause() },
                onExit: { controller.requestExit() }
            )
        }
    }

    private var resultOverlay: some View {
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

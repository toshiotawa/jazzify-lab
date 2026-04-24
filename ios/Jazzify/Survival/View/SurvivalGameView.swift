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
    /// リトライ要求。呼び出し側 (例: `SurvivalView`) で `launchStage` を一度閉じて再提示することで再起動する。
    /// `nil` の場合はリトライボタンの代わりにマップに戻る挙動にフォールバックする。
    var onRequestReplay: (() -> Void)? = nil

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
                    isDemo: isDemo,
                    onClose: onClose,
                    onRequestReplay: onRequestReplay
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
            onExit: { _ in onClose() },
            isDemo: isDemo
        )
        self.controller = created
        self.isLoading = false

        created.start()
        // MIDI コールバックは CoreMIDI スレッド上で直接呼ばれる (MIDIManager 側で
        // `DispatchQueue.main.async` を挟まなくしたため)。ここで:
        //   1. ピアノ音の発音は CoreMIDI スレッドから即時トリガー (main を経由しない)。
        //      これにより SpriteKit 60fps 描画で main が忙しい時でも発音レイテンシが詰まらない。
        //      `pianoNoteOnRealtime` は内部で `SurvivalPianoSampler.audioQueue` に逃がすため
        //      呼び出しスレッドをブロックしない。
        //   2. ゲームロジック (`handleNoteOn/Off`) は @Published な runtime を触るため main で実行。
        //      `DispatchQueue.main.async` 1 段のみとし、旧実装の Task { @MainActor in } による
        //      余計な Task スケジューリング hop を排除してレイテンシを削減する。
        //   3. velocity (data2) を素通しし、Web 版 MIDI コントローラーと同じく打鍵強度を
        //      ピアノ音量に反映させる (SurvivalPianoSampler 内で velocity/127 スケール)。
        MIDIManager.shared.onMIDIEvent = { [weak created] status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            let isNoteOn = messageType == 0x90 && velocity > 0
            let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
            if isNoteOn {
                SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: note, velocity: velocity)
            } else if isNoteOff {
                SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: note)
            } else {
                return
            }
            DispatchQueue.main.async { [weak created] in
                guard let created else { return }
                if isNoteOn {
                    created.handleNoteOn(note, velocity: velocity, playAudio: false)
                } else {
                    created.handleNoteOff(note, playAudio: false)
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
    let isDemo: Bool
    let onClose: () -> Void
    let onRequestReplay: (() -> Void)?

    var body: some View {
        ZStack(alignment: .top) {
            SurvivalSceneContainer(controller: controller)
                .ignoresSafeArea()

            // 仮想スティックの出現領域。ゲーム画面のどこをタップしてもその位置に
            // スティックが出現するよう、ヒット領域はビュー全体に拡大する。
            // HUD / 鍵盤より下に置くことで、上部の一時停止ボタンや鍵盤タップを阻害しない。
            SurvivalJoystickView(hitMask: .full) { analog in
                controller.analogInput = analog
            }
            .allowsHitTesting(controller.runtime.phase == .playing && !controller.isPaused)

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

            VStack {
                Spacer()
                // 鍵盤の最低 C / 最高 C もタップできるよう左右の余白を取らず、
                // ノッチ付き端末の横向きでもセーフエリア無視で画面幅いっぱいに敷き詰める。
                SurvivalChordPadView(controller: controller)
                    .ignoresSafeArea(.container, edges: .horizontal)
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
                isDemo: isDemo,
                onResume: { controller.togglePause() },
                onExit: { controller.requestExit() }
            )
        }
    }

    private var resultOverlay: some View {
        let isCleared = controller.runtime.phase == .cleared
        // リトライ (同 hintMode) は `onRequestReplay` が提供されている場合のみ有効。
        // 渡されていない場合はマップに戻す挙動にフォールバックする。
        let retry: () -> Void = {
            if let onRequestReplay {
                onRequestReplay()
            } else {
                controller.requestExit()
            }
        }
        return ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalGameResultView(
                isCleared: isCleared,
                stage: stage,
                enemiesDefeated: controller.runtime.enemiesDefeated,
                elapsedSeconds: Int(controller.runtime.elapsedSeconds.rounded()),
                playerHp: controller.runtime.player.hp,
                playerMaxHp: controller.runtime.player.maxHp,
                hintMode: hintMode,
                isBossStage: controller.isBossStage,
                locale: locale,
                clearReportInFlight: controller.clearReportInFlight,
                clearReportError: controller.clearReportError,
                isDemo: isDemo,
                onRetry: retry,
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
        // iPad の Split View / 回転直後は `UIScreen.main.bounds.size` が 0 だったり
        // レイアウトと食い違うことがあるため、初期サイズはダミー (1,1) にして
        // `scaleMode = .resizeFill` で親の bounds に自動追従させる。
        // `didChangeSize` 側で各種初期化フラグをリセットしているので、
        // 最初の layout 時に正しい画面サイズで再計算される。
        let scene = SurvivalScene(size: CGSize(width: 1, height: 1), controller: controller)
        scene.scaleMode = .resizeFill
        view.presentScene(scene)
        return view
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        // SurvivalGameController の状態変化は scene.update で直接参照されるため、ここでは何もしない。
    }
}

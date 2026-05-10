import SwiftUI
import SpriteKit
import UIKit
import QuartzCore

/// サバイバル ゲーム画面のルート (fullScreenCover から表示されるネイティブ版)。
/// - SpriteKit ゲーム世界 + SwiftUI オーバーレイ (HUD / スロット / スティック / 鍵盤)
/// - `onAppear` で Supabase から `SurvivalCharacterProfile` / `SurvivalStageConfig` を取得し、
///   `SurvivalGameController` を生成する (失敗時はデフォルト値にフォールバック)
/// - MIDI 入力は `MIDIManager.shared.onMIDIEvent` を直接フックして `SurvivalGameController.handleNoteOn/Off` に中継
/// - リトライは `SurvivalGameController.restartSameStage()`（fullScreen を閉じずにランタイムと SKScene を初期化）
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
                    isDemo: isDemo,
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
            onExit: { _ in onClose() },
            isDemo: isDemo
        )
        // `start()` を `self.controller = created` より先に呼ぶ。
        // 代入で SwiftUI が再レンダリングされ `SurvivalSceneContainer.makeUIView` →
        // `SKView.presentScene` → 最初の `SKScene.update(_:)` が走り始める。
        // start() で `lastNow = CACurrentMediaTime()` を presentScene 直前に確定させることで、
        // 初回フレームの dt 計算基準とボス `startedAt` (= init 時刻) のズレを最小化する。
        created.start()
        self.controller = created
        self.isLoading = false

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
        // 前画面の closure が残っているケースに備えて必ず nil 化してから差し替える。
        MIDIManager.shared.onMIDIEvent = nil
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
                    created.registerMidiKeyDown(note)
                } else {
                    created.handleNoteOff(note, playAudio: false)
                    created.registerMidiKeyUp(note)
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

    var body: some View {
        ZStack(alignment: .top) {
            SurvivalSceneContainer(controller: controller)
                .ignoresSafeArea()

            // 仮想スティック: 画面上部 (HUD)・下部 (鍵盤) の中央バンドをヒット無効にし、
            // 「どこでも出現」をやめてタッチ競合による操作不能を減らす（ゲーム進行より安定性優先）。
            SurvivalJoystickRepresentable(
                hitMask: .leftRightSides(exclusionRatio: 0.42),
                isInteractive: controller.uiSnapshot.phase == .playing && !controller.isPaused
            ) { analog in
                controller.analogInput = analog
            }
            .allowsHitTesting(controller.uiSnapshot.phase == .playing && !controller.isPaused)

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
                chordPadBar
            }

            if controller.isPaused && controller.uiSnapshot.phase == .playing {
                pauseOverlay
            }

            if controller.uiSnapshot.phase != .playing {
                resultOverlay
            }
        }
    }

    private var chordPadBar: some View {
        SurvivalChordPadView(
            snapshot: SurvivalChordPadSnapshot(
                hintMidis: controller.currentHintHighlightMidis,
                midiHeldKeys: controller.midiHeldKeys,
                isEnabled: controller.uiSnapshot.phase == .playing && !controller.isPaused
            ),
            onPress: { controller.handleNoteOn($0) },
            onRelease: { controller.handleNoteOff($0) }
        )
        .equatable()
        .ignoresSafeArea(.container, edges: .horizontal)
        .padding(.bottom, 8)
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
        let isCleared = controller.uiSnapshot.phase == .cleared
        return ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalGameResultView(
                isCleared: isCleared,
                stage: stage,
                enemiesDefeated: controller.uiSnapshot.enemiesDefeated,
                elapsedSeconds: controller.uiSnapshot.elapsedSecondsRounded,
                playerHp: controller.uiSnapshot.hp,
                playerMaxHp: controller.uiSnapshot.maxHp,
                hintMode: hintMode,
                isBossStage: controller.isBossStage,
                locale: locale,
                clearReportInFlight: controller.clearReportInFlight,
                clearReportError: controller.clearReportError,
                isDemo: isDemo,
                onRetry: { controller.restartSameStage() },
                onExit: { controller.requestExit() }
            )
        }
    }
}

// MARK: - SpriteKit ブリッジ

private struct SurvivalSceneContainer: UIViewRepresentable {
    let controller: SurvivalGameController

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> SKView {
        // `SKView(frame: .zero)` で生成した直後に SwiftUI レイアウトや fullScreenCover の
        // プレゼンテーション アニメーションが絡むと、render loop が起動せず
        // 描画 (= SKScene.update) が呼ばれ始めるまで不安定 (数秒〜永久) に待機するケースがある。
        // UIScreen のフルサイズで初期化し、autoresizingMask で親のレイアウトに追従させると
        // 起動直後からフレーム駆動が安定して働く。
        let initialFrame = UIScreen.main.bounds
        let view = SKView(frame: initialFrame)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.ignoresSiblingOrder = true
        view.preferredFramesPerSecond = 60
        // `isAsynchronous = true` のとき `SKScene.update` が描画スレッドで走り得る。
        // `SurvivalGameController` は @MainActor で @Published を更新するため、
        // そのスレッドから tick → SwiftUI 観測が走ると間欠的にクラッシュする（ボス戦開始直後など）。
        // メインスレッドで update を駆動するデフォルトに戻す。
        view.isAsynchronous = false
        // presentScene 前に必ず isPaused=false を明示。
        // SwiftUI で表示直前に window が一時非アクティブだった場合、SKView のデフォルト挙動で
        // isPaused=true が残って永遠に update が呼ばれなくなる不具合を防ぐ。
        view.isPaused = false
        // SKView 自身に対するタッチ入力は不要（操作は全て SwiftUI 上のジョイスティック /
        // 鍵盤 / HUD ボタンで受けている）。`isUserInteractionEnabled = true` のまま
        // ZStack に積むと、実機で SwiftUI/UIKit 連携のヒットテスト順が稀に逆転して、
        // SKView がジョイスティック層より前にタッチを奪い「9 割動けない（ジョイスティック
        // 反応なし／プレイヤーがダメージを受けない）」状態を引き起こす。SKScene の描画
        // ループには影響しないため、ここで明示的に false にして touch を素通しさせる。
        view.isUserInteractionEnabled = false

        let sceneSize = initialFrame.size.width > 0 && initialFrame.size.height > 0
            ? initialFrame.size
            : CGSize(width: 1, height: 1)
        let scene = SurvivalScene(size: sceneSize, controller: controller)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        view.presentScene(scene)

        // バックグラウンド復帰時に SKView が isPaused=true のまま固着するケースを救済する。
        // 起動直後に即 fullScreenCover を開く (= アプリライフサイクルと画面遷移が重なる)
        // ユーザー操作で顕在化しやすい「一歩も動けない / HP が減らない」症状の主要因。
        context.coordinator.attach(view: view, scene: scene, controller: controller)
        context.coordinator.lastSceneRestartGeneration = controller.sceneRestartGeneration
        return view
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        let gen = controller.sceneRestartGeneration
        guard gen != context.coordinator.lastSceneRestartGeneration else { return }
        context.coordinator.lastSceneRestartGeneration = gen
        let bounds = uiView.bounds
        let sceneSize: CGSize
        if bounds.width > 0, bounds.height > 0 {
            sceneSize = bounds.size
        } else {
            sceneSize = UIScreen.main.bounds.size
        }
        let scene = SurvivalScene(size: sceneSize, controller: controller)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        uiView.isPaused = false
        uiView.isUserInteractionEnabled = false
        uiView.presentScene(scene)
        context.coordinator.attach(view: uiView, scene: scene, controller: controller)
    }

    static func dismantleUIView(_ uiView: SKView, coordinator: Coordinator) {
        coordinator.detach()
    }

    final class Coordinator {
        private weak var view: SKView?
        private weak var scene: SurvivalScene?
        private weak var controller: SurvivalGameController?
        private var watchdog: Timer?

        private var activeObserver: NSObjectProtocol?
        private var willResignObserver: NSObjectProtocol?
        /// `SurvivalGameController.sceneRestartGeneration` の最後に `presentScene` した値。
        var lastSceneRestartGeneration: Int = 0

        func attach(view: SKView, scene: SurvivalScene, controller: SurvivalGameController) {
            detach()

            self.view = view
            self.scene = scene
            self.controller = controller

            activeObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.didBecomeActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                Task { @MainActor in
                    self?.resumeIfPausedExternally()
                }
            }
            willResignObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.willResignActiveNotification,
                object: nil,
                queue: .main
            ) { _ in }

            let w = Timer(timeInterval: 0.25, repeats: true) { [weak self] _ in
                Task { @MainActor in
                    self?.resumeIfSceneLoopStalled()
                }
            }
            watchdog = w
            RunLoop.main.add(w, forMode: .common)
        }

        func detach() {
            watchdog?.invalidate()
            watchdog = nil
            if let o = activeObserver { NotificationCenter.default.removeObserver(o) }
            if let o = willResignObserver { NotificationCenter.default.removeObserver(o) }
            activeObserver = nil
            willResignObserver = nil
            view = nil
            scene = nil
            controller = nil
        }

        @MainActor
        private func resumeIfPausedExternally() {
            guard let view, let scene else { return }
            if view.isPaused { view.isPaused = false }
            if scene.isPaused { scene.isPaused = false }
        }

        /// プレイ中に `SKView` / `SKScene` の `isPaused` 固着、または update 停止 (>0.5s) があれば復帰する。
        @MainActor
        private func resumeIfSceneLoopStalled() {
            guard let view, let scene, let controller else { return }
            guard view.window != nil else { return }
            guard controller.uiSnapshot.phase == .playing, !controller.isPaused else { return }

            let wallNow = CACurrentMediaTime()
            let stalled = wallNow - scene.lastUpdateWallTime > 0.5
            let viewWasPaused = view.isPaused
            let sceneWasPaused = scene.isPaused
            if viewWasPaused || sceneWasPaused || stalled {
                view.isPaused = false
                scene.isPaused = false
            }
        }
    }
}

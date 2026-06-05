import Combine
import QuartzCore
import SpriteKit
import SwiftUI
import UIKit

/// サバイバル ゲーム画面のルート (fullScreenCover から表示されるネイティブ版)。
/// - SpriteKit ゲーム世界 + SwiftUI オーバーレイ (HUD / スロット / スティック / 鍵盤)
/// - `SurvivalGameSession` がゲームループ・入力バッファ・UI 公開を束ねる
struct SurvivalGameView: View {
    let stage: SurvivalStageDefinition
    let characterId: String
    let locale: AppLocale
    let onClose: () -> Void
    var isDemo: Bool = false
    var configOverride: SurvivalStageConfig? = nil
    var scenarioOverrides: SurvivalScenarioOverrides = .init()
    var scenarioController: SurvivalScenarioController? = nil
    var inlinePhraseDefinition: SurvivalPhraseDefinition? = nil
    var inlineCompositePhrases: [SurvivalPhraseDefinition]? = nil
    var lessonRuntime: ResolvedSurvivalLessonRuntime? = nil
    var productionHintModes: ResolvedProductionHintModes? = nil
    var lessonContext: SurvivalLessonContext? = nil
    /// チュートリアル等: ステージ intro より優先するジャ爺吹き出し。
    var externalJajiiBubbleText: String = ""
    /// チュートリアル等: ステージ intro より優先するファイ吹き出し。
    var externalPlayerBubbleText: String = ""
    var onSessionReady: ((SurvivalGameSession) -> Void)? = nil

    init(
        stage: SurvivalStageDefinition,
        hintMode: Bool,
        characterId: String,
        locale: AppLocale,
        onClose: @escaping () -> Void,
        isDemo: Bool = false,
        configOverride: SurvivalStageConfig? = nil,
        scenarioOverrides: SurvivalScenarioOverrides = .init(),
        scenarioController: SurvivalScenarioController? = nil,
        inlinePhraseDefinition: SurvivalPhraseDefinition? = nil,
        inlineCompositePhrases: [SurvivalPhraseDefinition]? = nil,
        lessonRuntime: ResolvedSurvivalLessonRuntime? = nil,
        productionHintModes: ResolvedProductionHintModes? = nil,
        lessonContext: SurvivalLessonContext? = nil,
        externalJajiiBubbleText: String = "",
        externalPlayerBubbleText: String = "",
        onSessionReady: ((SurvivalGameSession) -> Void)? = nil
    ) {
        self.stage = stage
        self.characterId = characterId
        self.locale = locale
        self.onClose = onClose
        self.isDemo = isDemo
        self.configOverride = configOverride
        self.scenarioOverrides = scenarioOverrides
        self.scenarioController = scenarioController
        self.inlinePhraseDefinition = inlinePhraseDefinition
        self.inlineCompositePhrases = inlineCompositePhrases
        self.lessonRuntime = lessonRuntime
        self.productionHintModes = productionHintModes
        self.lessonContext = lessonContext
        self.externalJajiiBubbleText = externalJajiiBubbleText
        self.externalPlayerBubbleText = externalPlayerBubbleText
        self.onSessionReady = onSessionReady
        _activeHintMode = State(initialValue: hintMode)
    }

    @State private var session: SurvivalGameSession?
    @State private var activeHintMode: Bool
    @State private var bootstrapTask: Task<Void, Never>?
    @State private var bootstrapID = UUID()
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()
    @State private var isLoading: Bool = true
    @State private var loadError: String?
    @StateObject private var orientation = OrientationManager.shared

    var body: some View {
        ZStack {
            if stage.playMode == .codeRun {
                SurvivalCodeRunGameContent(
                    stage: stage,
                    hintMode: activeHintMode,
                    characterId: characterId,
                    locale: locale,
                    lessonRuntime: lessonRuntime,
                    productionHintModes: productionHintModes,
                    lessonContext: lessonContext,
                    onApplyHintModeAndRestart: isDemo ? nil : { nextHint in
                        activeHintMode = nextHint
                    },
                    onClose: onClose
                )
                .id(activeHintMode)
            } else if let session = session {
                SurvivalGameContent(
                    session: session,
                    stage: stage,
                    locale: locale,
                    isDemo: isDemo,
                    externalJajiiBubbleText: externalJajiiBubbleText,
                    externalPlayerBubbleText: externalPlayerBubbleText,
                    onApplyHintModeAndRestart: isDemo ? nil : { newHint in
                        applyHintModeRestart(newHint)
                    }
                )
            } else if isLoading {
                loadingView
            } else if loadError != nil {
                errorView
            } else {
                loadingView
            }

            PlayerXpToastOverlay()
                .allowsHitTesting(false)
        }
        .background(Color.black)
        .task {
            guard stage.playMode != .codeRun else {
                isLoading = false
                return
            }
            bootstrapTask?.cancel()
            let id = UUID()
            bootstrapID = id
            bootstrapTask = Task {
                await bootstrap(id: id)
            }
        }
        .onDisappear {
            bootstrapTask?.cancel()
            bootstrapID = UUID()
            midiSubscriptionHolder.cancel()
            session?.dispose()
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
    private func bootstrap(id: UUID) async {
        guard session == nil else { return }

        isLoading = true
        loadError = nil

        SurvivalAssetPreloader.preloadIfNeeded()

        let profile: SurvivalCharacterProfile
        var config: SurvivalStageConfig

        if isDemo {
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
                if let fetched = try? await supabase.fetchSurvivalStageConfig(difficulty: difficulty, stageType: stage.survivalBgmConfigStageType) {
                    return fetched
                }
                return SurvivalStageConfig.default
            }()

            profile = await profileTask
            config = await configTask
        }

        if let bgmStr = stage.compositePhraseBgmUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
           !bgmStr.isEmpty,
           let compositeBgm = URL(string: bgmStr) {
            config = config.withBgmUrl(compositeBgm)
        }

        // 古い task / cancel 済み task は UI を壊さず静かに終了
        guard !Task.isCancelled, bootstrapID == id else { return }

        let created = SurvivalGameSession(
            stage: stage,
            hintMode: activeHintMode,
            characterId: characterId,
            profile: profile,
            config: config,
            onExit: { _ in onClose() },
            isDemo: isDemo,
            lessonContext: lessonContext,
            usesEnglishToastCopy: locale == .en,
            scenarioOverrides: scenarioOverrides,
            scenarioController: scenarioController,
            inlinePhraseDefinition: inlinePhraseDefinition,
            inlineCompositePhrases: inlineCompositePhrases,
            lessonRuntime: lessonRuntime,
            productionHintModes: productionHintModes
        )
        created.start()
        onSessionReady?(created)

        guard !Task.isCancelled, bootstrapID == id else {
            created.dispose()
            return
        }

        self.session = created
        self.isLoading = false

        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = MIDIManager.shared.subscribe { [weak created] status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            let isNoteOn = messageType == 0x90 && velocity > 0
            let isNoteOff = messageType == 0x80 || (messageType == 0x90 && velocity == 0)
            if isNoteOn {
                created?.audioController.pianoNoteOnRealtime(midi: note, velocity: velocity)
            } else if isNoteOff {
                created?.audioController.pianoNoteOffRealtime(midi: note)
            } else {
                return
            }
            DispatchQueue.main.async { [weak created] in
                guard let created else { return }
                if isNoteOn {
                    created.midiGameNoteOn(note, velocity: velocity)
                    created.viewModel.registerMidiKeyDown(note)
                } else {
                    created.midiGameNoteOff(note)
                    created.viewModel.registerMidiKeyUp(note)
                }
            }
        }
    }

    @MainActor
    private func applyHintModeRestart(_ newHintMode: Bool) {
        guard !isDemo else { return }
        activeHintMode = newHintMode
        session?.restartSameStage(hintMode: newHintMode)
    }

}

private enum SurvivalCodeRunNativeStatus: Equatable {
    case playing
    case clear
    case failed
}

private struct SurvivalCodeRunNativePlayer {
    var x: CGFloat = 96
    var y: CGFloat = 390
    var vx: CGFloat = 0
    var vy: CGFloat = 0
    var facing: CGFloat = 1
    var onGround: Bool = false
    var jumpCount: Int = 0
    var chordLockedUntilLanding: Bool = false
    var hp: Int = SurvivalCodeRunNativeRules.maxHP
    var maxHP: Int = SurvivalCodeRunNativeRules.maxHP
    var invulnerableTime: TimeInterval = SurvivalCodeRunNativeRules.startInvulnerability
    var hurtTime: TimeInterval = 0
    var runPhase: CGFloat = 0
    var coyoteFrames: CGFloat = 0
    var jumpBufferFrames: CGFloat = 0
}

private struct SurvivalCodeRunNativeEnemy: Identifiable {
    let id: String
    var rect: CGRect
    var vx: CGFloat
    let minX: CGFloat
    let maxX: CGFloat
    var alive: Bool = true
    var anim: CGFloat = 0
}

private enum SurvivalCodeRunNativeTileKind: String, Sendable {
    case ground
    case brick
    case platform
    case block
}

private struct SurvivalCodeRunNativeSolid: Sendable {
    let kind: SurvivalCodeRunNativeTileKind
    let rect: CGRect
}

private enum SurvivalCodeRunNativeRules {
    static let maxHP = 10
    static let gravity: CGFloat = 0.8
    static let maxFall: CGFloat = 17
    static let walkAccel: CGFloat = 0.7
    static let walkMax: CGFloat = 4.6
    static let groundDecel: CGFloat = 0.6
    static let airDecel: CGFloat = 0.18
    static let jumpVelocity: CGFloat = -15.4
    static let stompBounce: CGFloat = -11.5
    static let knockbackVX: CGFloat = 5.5
    static let knockbackVY: CGFloat = -7
    static let coyoteFrames: CGFloat = 7
    static let jumpBufferFrames: CGFloat = 8
    static let startInvulnerability: TimeInterval = 40.0 / 60.0
    static let damageInvulnerability: TimeInterval = 90.0 / 60.0
    static let hurtDuration: TimeInterval = 26.0 / 60.0
    static let oneWayPlatformLandingEpsilon: CGFloat = 0.01
}

private enum SurvivalCodeRunNativeAssets {
    static let background = Image("code_run_background")
    static let playerFrames = [
        Image("code_run_player_1"),
        Image("code_run_player_2"),
        Image("code_run_player_3"),
        Image("code_run_player_4")
    ]
    static let playerHurt = Image("code_run_player_hurt")
    static let slimeFrames = [Image("code_run_slime_1"), Image("code_run_slime_2")]
    static let groundFill = Image("code_run_ground_fill")
    static let groundTop = Image("code_run_ground_top")
    static let groundTopLeft = Image("code_run_ground_top_left")
    static let groundTopRight = Image("code_run_ground_top_right")
    static let brick = Image("code_run_brick")
    static let platform = Image("code_run_platform")
    static let block = Image("code_run_block")
    static let spike = Image("code_run_spike")
    static let flag = Image("code_run_flag")

    static func solidImage(for solid: SurvivalCodeRunNativeSolid, groundSurfaceY: CGFloat) -> Image {
        switch solid.kind {
        case .ground:
            return solid.rect.minY <= groundSurfaceY ? groundTop : groundFill
        case .brick:
            return brick
        case .platform:
            return platform
        case .block:
            return block
        }
    }
}

private struct SurvivalCodeRunGridPoint: Codable, Sendable {
    let c: Int
    let r: Int

    init(c: Int, r: Int) {
        self.c = c
        self.r = r
    }
}

private struct SurvivalCodeRunPitPlacement: Codable, Sendable {
    let c0: Int
    let c1: Int

    init(c0: Int, c1: Int) {
        self.c0 = c0
        self.c1 = c1
    }
}

private struct SurvivalCodeRunSolidPlacement: Codable, Sendable {
    let kind: String
    let c: Int?
    let r: Int?
    let row: Int?
    let col: Int?
    let c0: Int?
    let c1: Int?
    let r0: Int?
    let r1: Int?

    init(kind: String, c: Int? = nil, r: Int? = nil, row: Int? = nil, col: Int? = nil, c0: Int? = nil, c1: Int? = nil, r0: Int? = nil, r1: Int? = nil) {
        self.kind = kind
        self.c = c
        self.r = r
        self.row = row
        self.col = col
        self.c0 = c0
        self.c1 = c1
        self.r0 = r0
        self.r1 = r1
    }
}

private struct SurvivalCodeRunSpikePlacement: Codable, Sendable {
    let c: Int
    let row: Int?
    let offsetX: CGFloat?
    let width: CGFloat?
    let height: CGFloat?

    init(c: Int, row: Int? = nil, offsetX: CGFloat? = nil, width: CGFloat? = nil, height: CGFloat? = nil) {
        self.c = c
        self.row = row
        self.offsetX = offsetX
        self.width = width
        self.height = height
    }
}

private struct SurvivalCodeRunEnemyPlacement: Codable, Sendable {
    let c: Int
    let r: Int?
    let id: String?
    let width: CGFloat?
    let height: CGFloat?
    let speed: CGFloat?
    let minX: CGFloat?
    let maxX: CGFloat?

    init(c: Int, r: Int? = nil, id: String? = nil, width: CGFloat? = nil, height: CGFloat? = nil, speed: CGFloat? = nil, minX: CGFloat? = nil, maxX: CGFloat? = nil) {
        self.c = c
        self.r = r
        self.id = id
        self.width = width
        self.height = height
        self.speed = speed
        self.minX = minX
        self.maxX = maxX
    }
}

private struct SurvivalCodeRunMapData: Codable, Sendable {
    let id: String?
    let name: String?
    let viewWidth: CGFloat?
    let viewHeight: CGFloat?
    let tileSize: CGFloat?
    let worldTilesWide: Int?
    let worldHeight: CGFloat?
    let groundRow: Int?
    let manualGround: Bool?
    let spawn: SurvivalCodeRunGridPoint?
    let goal: SurvivalCodeRunGridPoint?
    let goalColumn: Int?
    let goalOffsetX: CGFloat?
    let pits: [SurvivalCodeRunPitPlacement]?
    let solids: [SurvivalCodeRunSolidPlacement]?
    let spikes: [SurvivalCodeRunSpikePlacement]?
    let enemies: [SurvivalCodeRunEnemyPlacement]?

    init(
        id: String? = nil,
        name: String? = nil,
        viewWidth: CGFloat? = 960,
        viewHeight: CGFloat? = 528,
        tileSize: CGFloat? = 48,
        worldTilesWide: Int? = 168,
        worldHeight: CGFloat? = nil,
        groundRow: Int? = 9,
        manualGround: Bool? = nil,
        spawn: SurvivalCodeRunGridPoint? = SurvivalCodeRunGridPoint(c: 2, r: 9),
        goal: SurvivalCodeRunGridPoint? = nil,
        goalColumn: Int? = 160,
        goalOffsetX: CGFloat? = 18,
        pits: [SurvivalCodeRunPitPlacement],
        solids: [SurvivalCodeRunSolidPlacement],
        spikes: [SurvivalCodeRunSpikePlacement],
        enemies: [SurvivalCodeRunEnemyPlacement]
    ) {
        self.id = id
        self.name = name
        self.viewWidth = viewWidth
        self.viewHeight = viewHeight
        self.tileSize = tileSize
        self.worldTilesWide = worldTilesWide
        self.worldHeight = worldHeight
        self.groundRow = groundRow
        self.manualGround = manualGround
        self.spawn = spawn
        self.goal = goal
        self.goalColumn = goalColumn
        self.goalOffsetX = goalOffsetX
        self.pits = pits
        self.solids = solids
        self.spikes = spikes
        self.enemies = enemies
    }
}

private struct SurvivalCodeRunMapRow: Decodable, Sendable {
    let id: String
    let name: String
    let mapData: SurvivalCodeRunMapData?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case mapData = "map_data"
    }
}

private extension SurvivalCodeRunMapData {
    static var nightCityRun01: SurvivalCodeRunMapData {
        SurvivalCodeRunMapData(
            pits: [pit(26, 28), pit(60, 63), pit(96, 98), pit(128, 129)],
            solids: [
                single("block", 9, 6),
                row("brick", 8, 21, 23),
                row("platform", 7, 32, 35),
                single("block", 38, 6),
                single("block", 39, 6),
                col("brick", 47, 8, 8),
                col("brick", 48, 7, 8),
                col("brick", 49, 6, 8),
                col("brick", 50, 5, 8),
                row("platform", 7, 61, 62),
                single("block", 70, 6),
                single("block", 71, 6),
                single("block", 84, 6),
                row("platform", 7, 88, 88),
                row("platform", 6, 90, 90),
                row("platform", 5, 92, 92),
                row("platform", 7, 97, 97),
                row("platform", 7, 106, 106),
                row("platform", 6, 108, 108),
                single("block", 112, 6),
                single("block", 113, 6),
                single("block", 114, 6),
                single("block", 136, 6),
                col("brick", 148, 8, 8),
                col("brick", 149, 7, 8),
                col("brick", 150, 6, 8),
                col("brick", 151, 5, 8),
                col("brick", 152, 4, 8)
            ],
            spikes: [spike(75), spike(76), spike(120), spike(121)],
            enemies: [
                enemy(17), enemy(33, 7), enemy(42), enemy(66), enemy(72), enemy(86), enemy(90),
                enemy(104), enemy(110), enemy(118), enemy(134), enemy(140)
            ]
        )
    }

    static var graveyardRun02: SurvivalCodeRunMapData {
        SurvivalCodeRunMapData(
            pits: [pit(22, 24), pit(54, 56), pit(92, 94), pit(132, 133)],
            solids: [
                single("block", 8, 6),
                row("platform", 7, 28, 31),
                row("brick", 8, 40, 42),
                col("brick", 46, 8, 8),
                col("brick", 47, 7, 8),
                col("brick", 48, 6, 8),
                col("brick", 49, 5, 8),
                row("platform", 7, 62, 63),
                single("block", 67, 6),
                single("block", 68, 6),
                row("platform", 7, 84, 86),
                row("platform", 6, 88, 89),
                single("block", 98, 6),
                single("block", 99, 6),
                row("platform", 7, 110, 111),
                row("platform", 6, 113, 114),
                single("block", 140, 6),
                col("brick", 152, 8, 8),
                col("brick", 153, 7, 8),
                col("brick", 154, 6, 8),
                col("brick", 155, 5, 8),
                col("brick", 156, 4, 8)
            ],
            spikes: [spike(71), spike(72), spike(122), spike(123)],
            enemies: [
                enemy(14), enemy(19), enemy(29, 7), enemy(50), enemy(52), enemy(74), enemy(80),
                enemy(85, 7), enemy(90), enemy(105), enemy(112, 6), enemy(128), enemy(138), enemy(148), enemy(154)
            ]
        )
    }

    static var graveyardRun03: SurvivalCodeRunMapData {
        SurvivalCodeRunMapData(
            pits: [pit(30, 31), pit(66, 68), pit(104, 106), pit(144, 145)],
            solids: [
                row("platform", 7, 12, 14),
                row("platform", 7, 19, 22),
                row("platform", 6, 25, 26),
                single("block", 36, 6),
                single("block", 37, 6),
                row("platform", 7, 45, 49),
                row("brick", 8, 56, 58),
                row("platform", 7, 70, 72),
                row("platform", 6, 75, 76),
                row("platform", 7, 81, 84),
                single("block", 94, 6),
                single("block", 95, 6),
                col("brick", 99, 8, 8),
                col("brick", 100, 7, 8),
                col("brick", 101, 6, 8),
                row("platform", 7, 109, 111),
                row("platform", 6, 114, 116),
                row("platform", 7, 122, 126),
                row("platform", 7, 136, 138),
                row("platform", 6, 140, 141),
                col("brick", 152, 8, 8),
                col("brick", 153, 7, 8),
                col("brick", 154, 6, 8),
                col("brick", 155, 5, 8),
                col("brick", 156, 4, 8)
            ],
            spikes: [spike(20), spike(21), spike(46), spike(47), spike(48), spike(82), spike(83), spike(123), spike(124), spike(125)],
            enemies: [
                enemy(13, 7), enemy(27), enemy(40), enemy(48, 7), enemy(60), enemy(75, 6),
                enemy(88), enemy(110, 7), enemy(116, 6), enemy(130), enemy(141, 6), enemy(151), enemy(158)
            ]
        )
    }

    static var towerRun01: SurvivalCodeRunMapData {
        SurvivalCodeRunMapData(
            viewWidth: 960,
            viewHeight: 528,
            worldTilesWide: 32,
            worldHeight: 1248,
            groundRow: 24,
            spawn: SurvivalCodeRunGridPoint(c: 2, r: 24),
            goal: SurvivalCodeRunGridPoint(c: 27, r: 3),
            goalOffsetX: 8,
            pits: [pit(7, 10), pit(17, 19)],
            solids: [
                row("brick", 23, 0, 5),
                row("brick", 23, 11, 16),
                row("brick", 23, 20, 31),
                row("platform", 21, 5, 8),
                row("platform", 20, 12, 15),
                row("platform", 18, 18, 21),
                row("platform", 17, 24, 27),
                row("platform", 15, 20, 22),
                row("platform", 14, 14, 17),
                row("platform", 12, 8, 11),
                row("platform", 11, 3, 6),
                row("platform", 9, 8, 10),
                row("platform", 8, 14, 17),
                row("platform", 6, 20, 23),
                row("platform", 5, 25, 28),
                row("brick", 3, 26, 30),
                col("brick", 0, 18, 24),
                col("brick", 31, 15, 24),
                col("brick", 1, 8, 12),
                col("brick", 30, 4, 9),
                single("block", 9, 16),
                single("block", 16, 10),
                single("block", 24, 4)
            ],
            spikes: [
                spike(13, 23),
                spike(14, 23),
                spike(21, 23),
                spike(22, 23),
                spike(15, 14),
                spike(21, 6)
            ],
            enemies: [
                enemy(13, 20), enemy(20, 18), enemy(25, 17), enemy(15, 14),
                enemy(9, 12), enemy(16, 8), enemy(27, 5)
            ]
        )
    }

    private static func pit(_ c0: Int, _ c1: Int) -> SurvivalCodeRunPitPlacement {
        SurvivalCodeRunPitPlacement(c0: c0, c1: c1)
    }

    private static func single(_ kind: String, _ c: Int, _ r: Int) -> SurvivalCodeRunSolidPlacement {
        SurvivalCodeRunSolidPlacement(kind: kind, c: c, r: r)
    }

    private static func row(_ kind: String, _ r: Int, _ c0: Int, _ c1: Int) -> SurvivalCodeRunSolidPlacement {
        SurvivalCodeRunSolidPlacement(kind: kind, row: r, c0: c0, c1: c1)
    }

    private static func col(_ kind: String, _ c: Int, _ r0: Int, _ r1: Int) -> SurvivalCodeRunSolidPlacement {
        SurvivalCodeRunSolidPlacement(kind: kind, col: c, r0: r0, r1: r1)
    }

    private static func spike(_ c: Int, _ row: Int? = nil) -> SurvivalCodeRunSpikePlacement {
        SurvivalCodeRunSpikePlacement(c: c, row: row)
    }

    private static func enemy(_ c: Int, _ r: Int = 9) -> SurvivalCodeRunEnemyPlacement {
        SurvivalCodeRunEnemyPlacement(c: c, r: r)
    }
}

private struct SurvivalCodeRunNativeMapSpec {
    let id: String
    let name: String
    let viewSize: CGSize
    let tile: CGFloat
    let groundRow: CGFloat
    let worldWidth: CGFloat
    let worldHeight: CGFloat
    let playerSize: CGSize
    let spawn: CGPoint
    let goalX: CGFloat
    let goalY: CGFloat?
    let solids: [SurvivalCodeRunNativeSolid]
    let spikes: [CGRect]
    private let enemyPlacements: [SurvivalCodeRunEnemyPlacement]

    static let playerSize = CGSize(width: 34, height: 42)
    static let defaultTile: CGFloat = 48
    static let defaultEnemySize = CGSize(width: 38, height: 34)

    func enemies() -> [SurvivalCodeRunNativeEnemy] {
        enemyPlacements.map { placement in
            let width = placement.width ?? Self.defaultEnemySize.width
            let height = placement.height ?? Self.defaultEnemySize.height
            let row = CGFloat(placement.r ?? Int(groundRow))
            let x = CGFloat(placement.c) * tile + (tile - width) / 2
            let y = row * tile - height
            return SurvivalCodeRunNativeEnemy(
                id: placement.id ?? "slime-\(placement.c)-\(Int(row))",
                rect: CGRect(x: x, y: y, width: width, height: height),
                vx: -(placement.speed ?? 1.25),
                minX: placement.minX ?? max(0, x - tile * 2),
                maxX: placement.maxX ?? min(worldWidth - width, x + tile * 2)
            )
        }
    }

    static func fallback(mapId: String?) -> SurvivalCodeRunNativeMapSpec {
        let id = mapId ?? "night_city_run_01"
        switch id {
        case "graveyard_run_02":
            return bundled(id: "graveyard_run_02", name: "Graveyard Run 02", data: .graveyardRun02)
        case "graveyard_run_03":
            return bundled(id: "graveyard_run_03", name: "Graveyard Run 03", data: .graveyardRun03)
        case "tower_run_01":
            return bundled(id: "tower_run_01", name: "Tower Run 01", data: .towerRun01)
        default:
            return bundled(id: "night_city_run_01", name: "Night City Run 01", data: .nightCityRun01)
        }
    }

    static func from(row: SurvivalCodeRunMapRow) -> SurvivalCodeRunNativeMapSpec? {
        guard let data = row.mapData else { return nil }
        return build(id: row.id, name: row.name, data: data)
    }

    private static func build(id: String, name: String, data: SurvivalCodeRunMapData) -> SurvivalCodeRunNativeMapSpec? {
        guard let pits = data.pits, let placements = data.solids, let spikes = data.spikes, let enemies = data.enemies else {
            return nil
        }
        return build(id: id, name: name, data: data, pits: pits, placements: placements, spikes: spikes, enemies: enemies)
    }

    private static func bundled(id: String, name: String, data: SurvivalCodeRunMapData) -> SurvivalCodeRunNativeMapSpec {
        build(id: id, name: name, data: data) ?? minimal(id: id, name: name)
    }

    private static func minimal(id: String, name: String) -> SurvivalCodeRunNativeMapSpec {
        let tile = defaultTile
        let groundRow = 9
        let worldWidth = 168 * tile
        let ground = (0..<168).flatMap { c in
            [
                SurvivalCodeRunNativeSolid(
                    kind: .ground,
                    rect: CGRect(x: CGFloat(c) * tile, y: CGFloat(groundRow) * tile, width: tile, height: tile)
                ),
                SurvivalCodeRunNativeSolid(
                    kind: .ground,
                    rect: CGRect(x: CGFloat(c) * tile, y: CGFloat(groundRow + 1) * tile, width: tile, height: tile)
                )
            ]
        }
        return SurvivalCodeRunNativeMapSpec(
            id: id,
            name: name,
            viewSize: CGSize(width: 960, height: 528),
            tile: tile,
            groundRow: CGFloat(groundRow),
            worldWidth: worldWidth,
            worldHeight: 528,
            playerSize: playerSize,
            spawn: CGPoint(x: 2 * tile, y: CGFloat(groundRow) * tile - playerSize.height),
            goalX: 160 * tile + 18,
            goalY: nil,
            solids: ground,
            spikes: [],
            enemyPlacements: []
        )
    }

    private static func build(
        id: String,
        name: String,
        data: SurvivalCodeRunMapData,
        pits: [SurvivalCodeRunPitPlacement],
        placements: [SurvivalCodeRunSolidPlacement],
        spikes spikePlacements: [SurvivalCodeRunSpikePlacement],
        enemies enemyPlacements: [SurvivalCodeRunEnemyPlacement]
    ) -> SurvivalCodeRunNativeMapSpec {
        let tile = data.tileSize ?? defaultTile
        let viewSize = CGSize(width: data.viewWidth ?? 960, height: data.viewHeight ?? 528)
        let worldTilesWide = data.worldTilesWide ?? 168
        let groundRow = data.groundRow ?? 9
        let worldWidth = CGFloat(worldTilesWide) * tile
        let worldHeight = data.worldHeight ?? viewSize.height
        let spawnGrid = data.spawn ?? SurvivalCodeRunGridPoint(c: 2, r: groundRow)
        let goalGrid = data.goal
        var solids: [SurvivalCodeRunNativeSolid] = []

        func isPit(_ c: Int) -> Bool { pits.contains { c >= $0.c0 && c <= $0.c1 } }
        func tileKind(_ raw: String) -> SurvivalCodeRunNativeTileKind {
            SurvivalCodeRunNativeTileKind(rawValue: raw) ?? .block
        }
        func tileRect(_ kind: SurvivalCodeRunNativeTileKind, _ c: Int, _ r: Int) -> SurvivalCodeRunNativeSolid {
            SurvivalCodeRunNativeSolid(
                kind: kind,
                rect: CGRect(x: CGFloat(c) * tile, y: CGFloat(r) * tile, width: tile, height: tile)
            )
        }
        if data.manualGround != true {
            for c in 0..<worldTilesWide where !isPit(c) {
                solids.append(tileRect(.ground, c, groundRow))
                solids.append(tileRect(.ground, c, groundRow + 1))
            }
        }
        for placement in placements {
            let kind = tileKind(placement.kind)
            if let c = placement.c, let r = placement.r {
                solids.append(tileRect(kind, c, r))
            } else if let row = placement.row, let c0 = placement.c0, let c1 = placement.c1, c0 <= c1 {
                for c in c0...c1 { solids.append(tileRect(kind, c, row)) }
            } else if let col = placement.col, let r0 = placement.r0, let r1 = placement.r1, r0 <= r1 {
                for r in r0...r1 { solids.append(tileRect(kind, col, r)) }
            }
        }

        let spikeRects = spikePlacements.map { placement in
            let height = placement.height ?? 26
            let offsetX = placement.offsetX ?? 9
            return CGRect(
                x: CGFloat(placement.c) * tile + offsetX,
                y: CGFloat(placement.row ?? groundRow) * tile - height,
                width: placement.width ?? tile - offsetX * 2,
                height: height
            )
        }

        let displayName = data.name?.trimmingCharacters(in: .whitespacesAndNewlines)
        return SurvivalCodeRunNativeMapSpec(
            id: id,
            name: displayName?.isEmpty == false ? displayName ?? name : name,
            viewSize: viewSize,
            tile: tile,
            groundRow: CGFloat(groundRow),
            worldWidth: worldWidth,
            worldHeight: worldHeight,
            playerSize: playerSize,
            spawn: CGPoint(x: CGFloat(spawnGrid.c) * tile, y: CGFloat(spawnGrid.r) * tile - playerSize.height),
            goalX: CGFloat(goalGrid?.c ?? data.goalColumn ?? 160) * tile + (data.goalOffsetX ?? 18),
            goalY: goalGrid.map { CGFloat($0.r) * tile - 84 },
            solids: solids,
            spikes: spikeRects,
            enemyPlacements: enemyPlacements
        )
    }
}

private extension SupabaseService {
    func fetchSurvivalCodeRunMap(id: String) async throws -> SurvivalCodeRunMapRow? {
        let rows: [SurvivalCodeRunMapRow] = try await client
            .from("survival_run_maps")
            .select("id, name, map_data")
            .eq("id", value: id)
            .limit(1)
            .execute()
            .value
        return rows.first
    }
}

private struct SurvivalCodeRunGameContent: View {
    let stage: SurvivalStageDefinition
    let hintMode: Bool
    let characterId: String
    let locale: AppLocale
    let lessonRuntime: ResolvedSurvivalLessonRuntime?
    let productionHintModes: ResolvedProductionHintModes?
    let lessonContext: SurvivalLessonContext?
    let onApplyHintModeAndRestart: ((Bool) -> Void)?
    let onClose: () -> Void
    private let chords: [SurvivalResolvedChord]
    private let keyboardScrollAnchorMidi: Int?

    init(
        stage: SurvivalStageDefinition,
        hintMode: Bool,
        characterId: String,
        locale: AppLocale,
        lessonRuntime: ResolvedSurvivalLessonRuntime?,
        productionHintModes: ResolvedProductionHintModes?,
        lessonContext: SurvivalLessonContext?,
        onApplyHintModeAndRestart: ((Bool) -> Void)?,
        onClose: @escaping () -> Void
    ) {
        self.stage = stage
        self.hintMode = hintMode
        self.characterId = characterId
        self.locale = locale
        self.lessonRuntime = lessonRuntime
        self.productionHintModes = productionHintModes
        self.lessonContext = lessonContext
        self.onApplyHintModeAndRestart = onApplyHintModeAndRestart
        self.onClose = onClose
        let resolvedChords = (stage.chordProgression ?? []).enumerated().map { idx, entry in
            SurvivalResolvedChord.fromProgressionEntry(entry, index: idx)
        }
        self.chords = resolvedChords
        if let maxMidi = SurvivalPhraseKeyboardScroll.maxPitchMidi(in: resolvedChords) {
            self.keyboardScrollAnchorMidi = SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: maxMidi)
        } else {
            self.keyboardScrollAnchorMidi = nil
        }
    }

    @State private var mapSpec = SurvivalCodeRunNativeMapSpec.fallback(mapId: nil)
    @State private var player = SurvivalCodeRunNativePlayer()
    @State private var enemies = SurvivalCodeRunNativeMapSpec.fallback(mapId: nil).enemies()
    @State private var elapsed: TimeInterval = 0
    @State private var lastTick = Date()
    @State private var inputX: CGFloat = 0
    @State private var status: SurvivalCodeRunNativeStatus = .playing
    @State private var currentChordIndex = 0
    @State private var completedPitchClasses: Set<Int> = []
    @State private var heldKeys: Set<Int> = []
    @State private var visibleWhiteKeys = SurvivalChordPadPreferences.loadVisibleWhiteKeys()
    @State private var showSettings = false
    @State private var showResult = false
    @State private var submittedClear = false
    @State private var midiSubscriptionHolder = MIDISubscriptionHolder()
    @StateObject private var midiManager = MIDIManager.shared

    private let audio = SurvivalAudioController()
    private let timer = Timer.publish(every: 1.0 / 60.0, on: .main, in: .common).autoconnect()
    private var timeLimit: TimeInterval {
        lessonRuntime?.timeLimitSec ?? TimeInterval(stage.runTimeLimitSec ?? Int(SurvivalConstants.stageTimeLimitSec))
    }
    private var currentChord: SurvivalResolvedChord? { chords.isEmpty ? nil : chords[currentChordIndex % chords.count] }
    private var nextChord: SurvivalResolvedChord? { chords.isEmpty ? nil : chords[(currentChordIndex + 1) % chords.count] }
    private var keyboardHintMode: ProductionHintMode { productionHintModes?.keyboardHintMode ?? stage.productionKeyboardHintMode }

    var body: some View {
        GeometryReader { proxy in
            let keyboardHeight: CGFloat = min(190, max(150, proxy.size.height * 0.22))
            VStack(spacing: 0) {
                gameCanvas(size: CGSize(width: proxy.size.width, height: max(1, proxy.size.height - keyboardHeight)))
                    .overlay {
                        SurvivalJoystickRepresentable(
                            hitMask: .full,
                            isInteractive: status == .playing
                        ) { analog in
                            inputX = max(-1, min(1, analog.dx))
                        }
                        .allowsHitTesting(status == .playing)
                    }
                    .frame(height: max(1, proxy.size.height - keyboardHeight))
                SurvivalChordPadView(
                    snapshot: chordPadSnapshot,
                    visibleWhiteKeys: visibleWhiteKeys,
                    onVisibleWhiteKeysChange: { next in
                        visibleWhiteKeys = next
                        SurvivalChordPadPreferences.saveVisibleWhiteKeys(next)
                    },
                    onPress: noteOn,
                    onRelease: noteOff
                )
                .frame(height: keyboardHeight)
            }
            .background(Color.black)
            .overlay(alignment: .topLeading) { topButtons }
            .overlay(alignment: .topTrailing) { statusBadges }
            .overlay(alignment: .top) { chordBadges.padding(.top, 92) }
            .overlay { resultOverlay }
        }
        .onReceive(timer) { now in tick(now: now) }
        .onAppear {
            OrientationManager.shared.lock(.portrait)
            startAudioAndMidi()
        }
        .onDisappear {
            OrientationManager.shared.lock(.portrait)
            midiSubscriptionHolder.cancel()
            audio.stop()
        }
        .sheet(isPresented: $showSettings) { settingsSheet }
    }

    private var chordPadSnapshot: SurvivalChordPadSnapshot {
        guard status == .playing, !player.chordLockedUntilLanding, let chord = currentChord else {
            return SurvivalChordPadSnapshot(hintMidis: [], completedHintMidis: [], hintPendingOpacity: 0, midiHeldKeys: heldKeys, isEnabled: true, scrollAnchorMidi: keyboardScrollAnchorMidi)
        }
        let completedMidis = Set(chord.midiNotes.filter { completedPitchClasses.contains(Self.pitchClass($0)) })
        let pendingOpacity = SurvivalStaffHintOpacity.computeKeyboardHintOpacity(
            elapsed: elapsed,
            hintMode: hintMode,
            hintBuffActive: false,
            productionHintMode: keyboardHintMode,
            phase: .playing
        )
        return SurvivalChordPadSnapshot(
            hintMidis: Set(chord.midiNotes),
            completedHintMidis: completedMidis,
            hintPendingOpacity: pendingOpacity,
            midiHeldKeys: heldKeys,
            isEnabled: true,
            scrollAnchorMidi: keyboardScrollAnchorMidi
        )
    }

    private var topButtons: some View {
        HStack(spacing: 8) {
            codeRunChromeButton(title: locale == .ja ? "戻る" : "BACK", action: onClose)
            codeRunChromeButton(title: locale == .ja ? "設定" : "SETTINGS", action: { showSettings = true })
        }
        .padding(12)
    }

    private func codeRunChromeButton(title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.caption.bold())
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .background(.black.opacity(0.45), in: RoundedRectangle(cornerRadius: 6))
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white.opacity(0.15), lineWidth: 1))
    }

    private var statusBadges: some View {
        VStack(alignment: .trailing, spacing: 6) {
            hpBadge
            timerBadge
        }
        .padding(12)
    }

    private var hpBadge: some View {
        HStack(spacing: 8) {
            HStack(spacing: 2) {
                ForEach(0..<SurvivalCodeRunNativeRules.maxHP, id: \.self) { index in
                    Text(verbatim: "♥")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(index < player.hp ? Color(red: 0.98, green: 0.35, blue: 0.48) : Color.white.opacity(0.25))
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 6))
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white.opacity(0.15), lineWidth: 1))
    }

    private var timerBadge: some View {
        let remaining = max(0, Int(ceil(timeLimit - elapsed)))
        return VStack(spacing: 0) {
            Text(String(format: "%d:%02d", remaining / 60, remaining % 60))
                .font(.title3.monospacedDigit().bold())
            if hintMode {
                Text("HINT").font(.caption2.bold()).foregroundStyle(.white.opacity(0.65))
            }
        }
        .foregroundStyle(remaining <= 15 ? Color.red.opacity(0.95) : .white)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 6))
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.white.opacity(0.15), lineWidth: 1))
    }

    private var chordBadges: some View {
        VStack(spacing: 6) {
            codeBadge(title: "", value: player.chordLockedUntilLanding ? "-" : (currentChord?.displayName ?? "-"), primary: true)
            codeBadge(title: "next", value: player.chordLockedUntilLanding ? "-" : (nextChord?.displayName ?? "-"), primary: false)
        }
    }

    private func codeBadge(title: String, value: String, primary: Bool) -> some View {
        VStack(spacing: 2) {
            if !title.isEmpty {
                Text(title)
                    .font(.system(size: primary ? 11 : 10, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white.opacity(0.68))
                    .shadow(color: .black.opacity(0.75), radius: 2, x: 0, y: 1)
            }
            Text(value)
                .font(.system(size: primary ? 34 : 20, weight: .heavy, design: .rounded))
                .foregroundStyle(primary ? Color(red: 1.0, green: 0.88, blue: 0.30) : .white.opacity(0.88))
                .lineLimit(1)
                .minimumScaleFactor(0.65)
                .shadow(color: Color(red: 0.90, green: 0.22, blue: 0.34).opacity(primary ? 0.9 : 0.55), radius: primary ? 4 : 2, x: 0, y: 2)
                .shadow(color: .black.opacity(0.85), radius: 1, x: 0, y: 1)
        }
        .frame(minWidth: primary ? 160 : 96, maxWidth: primary ? 240 : 128)
        .padding(.horizontal, primary ? 12 : 6)
        .padding(.vertical, primary ? 6 : 4)
    }

    private var settingsSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    if let onApplyHintModeAndRestart {
                        Button(action: { onApplyHintModeAndRestart(!hintMode); showSettings = false }) {
                            Text(hintMode ? (locale == .ja ? "本番で再開" : "Restart Performance") : (locale == .ja ? "HINTで再開" : "Restart with HINT"))
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    SurvivalAudioVolumeSection(
                        locale: locale,
                        title: locale == .ja ? "音量" : "Audio volume"
                    )
                    midiSettingsSection
                    Button(locale == .ja ? "閉じる" : "Close") { showSettings = false }
                        .frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .navigationTitle(locale == .ja ? "コードラン設定" : "Code Run Settings")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { midiManager.refreshDevices() }
        }
        .presentationDetents([.medium, .large])
    }

    private var midiSettingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(locale == .ja ? "MIDI キーボード" : "MIDI Keyboard", systemImage: "pianokeys")
                    .font(.headline)
                Spacer()
                Button(locale == .ja ? "再検出" : "Rescan") {
                    midiManager.refreshDevices()
                }
                .buttonStyle(.bordered)
            }

            if midiManager.availableDevices.isEmpty {
                Text(locale == .ja ? "接続中の MIDI デバイスがありません。" : "No MIDI devices are connected.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 8))
            } else {
                VStack(spacing: 8) {
                    ForEach(midiManager.availableDevices, id: \.uniqueID) { device in
                        midiDeviceRow(device)
                    }
                }
            }
        }
    }

    private func midiDeviceRow(_ device: MIDIDeviceInfo) -> some View {
        Button {
            midiManager.selectDevice(uniqueID: device.uniqueID)
        } label: {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(device.displayName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                    if !device.manufacturer.isEmpty {
                        Text(device.manufacturer)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                if midiManager.selectedDeviceID == device.uniqueID {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                }
            }
            .padding(12)
            .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder private var resultOverlay: some View {
        if showResult {
            VStack(spacing: 14) {
                Text(status == .clear ? "STAGE CLEAR!" : "TIME UP")
                    .font(.title.bold())
                    .foregroundStyle(status == .clear ? .green : .red)
                Text(locale == .ja ? "クリア時間: \(formatElapsed())" : "Clear time: \(formatElapsed())")
                    .font(.headline.monospacedDigit())
                HStack {
                    Button(locale == .ja ? "リトライ" : "Retry") { resetRun() }.buttonStyle(.borderedProminent)
                    Button(locale == .ja ? "戻る" : "Back") { onClose() }.buttonStyle(.bordered)
                }
            }
            .padding(24)
            .background(.black.opacity(0.82), in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.16), lineWidth: 1))
        }
    }

    private func gameCanvas(size: CGSize) -> some View {
        Canvas { context, canvasSize in
            let fitScale = min(canvasSize.width / mapSpec.viewSize.width, canvasSize.height / mapSpec.viewSize.height)
            let coverScale = max(canvasSize.width / mapSpec.viewSize.width, canvasSize.height / mapSpec.viewSize.height)
            let scale = min(coverScale, fitScale * 2.2)
            let visibleWorldWidth = max(1, canvasSize.width / max(scale, 0.01))
            let visibleWorldHeight = max(1, canvasSize.height / max(scale, 0.01))
            let maxCameraX = max(0, mapSpec.worldWidth - visibleWorldWidth)
            let maxCameraY = max(0, mapSpec.worldHeight - visibleWorldHeight)
            let camera = max(0, min(player.x + mapSpec.playerSize.width / 2 - visibleWorldWidth / 2, maxCameraX))
            let cameraY = max(0, min(player.y + mapSpec.playerSize.height / 2 - visibleWorldHeight / 2, maxCameraY))
            let ox = max(0, (canvasSize.width - mapSpec.worldWidth * scale) / 2)
            let oy = max(0, (canvasSize.height - mapSpec.worldHeight * scale) / 2)
            let visibleRect = CGRect(x: camera, y: cameraY, width: visibleWorldWidth, height: visibleWorldHeight)
            context.fill(Path(CGRect(origin: .zero, size: canvasSize)), with: .linearGradient(Gradient(colors: [Color(red: 0.03, green: 0.06, blue: 0.16), Color(red: 0.01, green: 0.015, blue: 0.04)]), startPoint: .zero, endPoint: CGPoint(x: 0, y: canvasSize.height)))
            context.translateBy(x: ox - camera * scale, y: oy - cameraY * scale)
            context.scaleBy(x: scale, y: scale)
            drawWorld(context: &context, visibleRect: visibleRect)
        }
        .frame(width: size.width, height: size.height)
    }

    private func drawWorld(context: inout GraphicsContext, visibleRect: CGRect) {
        drawBackground(context: &context, visibleRect: visibleRect)
        let groundSurfaceY = mapSpec.groundRow * mapSpec.tile
        for solid in mapSpec.solids {
            context.draw(
                SurvivalCodeRunNativeAssets.solidImage(for: solid, groundSurfaceY: groundSurfaceY),
                in: solid.rect
            )
        }
        for rect in mapSpec.spikes {
            context.draw(SurvivalCodeRunNativeAssets.spike, in: rect)
        }
        let flagY = mapSpec.goalY ?? 348
        context.draw(
            SurvivalCodeRunNativeAssets.flag,
            in: CGRect(x: mapSpec.goalX - 4, y: flagY, width: 70, height: 84)
        )
        for enemy in enemies where enemy.alive {
            let frameIndex = Int(enemy.anim) % SurvivalCodeRunNativeAssets.slimeFrames.count
            context.draw(SurvivalCodeRunNativeAssets.slimeFrames[frameIndex], in: enemy.rect)
        }
        let playerFootY = player.y + 42
        let playerCenterX = player.x + 17
        let playerDrawSize = CGSize(width: 43, height: 64)
        let playerRect = CGRect(
            x: playerCenterX - playerDrawSize.width / 2,
            y: playerFootY - playerDrawSize.height,
            width: playerDrawSize.width,
            height: playerDrawSize.height
        )
        let playerImage: Image
        if player.hurtTime > 0 {
            playerImage = SurvivalCodeRunNativeAssets.playerHurt
        } else if !player.onGround {
            playerImage = SurvivalCodeRunNativeAssets.playerFrames[min(3, SurvivalCodeRunNativeAssets.playerFrames.count - 1)]
        } else if abs(player.vx) > 0.3 {
            let frameCount = max(1, SurvivalCodeRunNativeAssets.playerFrames.count - 1)
            let frameIndex = max(0, Int(player.runPhase) % frameCount)
            playerImage = SurvivalCodeRunNativeAssets.playerFrames[frameIndex]
        } else {
            playerImage = SurvivalCodeRunNativeAssets.playerFrames[0]
        }
        let shouldBlink = player.invulnerableTime > 0 && Int(player.invulnerableTime * 20) % 2 == 0
        if !shouldBlink {
            if player.facing < 0 {
                context.translateBy(x: playerCenterX, y: 0)
                context.scaleBy(x: -1, y: 1)
                context.translateBy(x: -playerCenterX, y: 0)
                context.draw(playerImage, in: playerRect)
                context.translateBy(x: playerCenterX, y: 0)
                context.scaleBy(x: -1, y: 1)
                context.translateBy(x: -playerCenterX, y: 0)
            } else {
                context.draw(playerImage, in: playerRect)
            }
        }
    }

    private func drawBackground(context: inout GraphicsContext, visibleRect: CGRect) {
        let imageAspect: CGFloat = 1672.0 / 941.0
        let viewportAspect = visibleRect.width / max(visibleRect.height, 1)
        let drawSize: CGSize
        if viewportAspect > imageAspect {
            drawSize = CGSize(width: visibleRect.width, height: visibleRect.width / imageAspect)
        } else {
            drawSize = CGSize(width: visibleRect.height * imageAspect, height: visibleRect.height)
        }
        let drawRect = CGRect(
            x: visibleRect.midX - drawSize.width / 2,
            y: visibleRect.midY - drawSize.height / 2,
            width: drawSize.width,
            height: drawSize.height
        )
        context.draw(SurvivalCodeRunNativeAssets.background, in: drawRect)
    }

    private func tick(now: Date) {
        guard status == .playing else { return }
        let dt = min(1.0 / 20.0, max(0, now.timeIntervalSince(lastTick)))
        lastTick = now
        elapsed += dt
        let step = CGFloat(dt * 60)
        if abs(inputX) > 0.08 {
            player.vx = max(-SurvivalCodeRunNativeRules.walkMax, min(SurvivalCodeRunNativeRules.walkMax, player.vx + SurvivalCodeRunNativeRules.walkAccel * inputX * step))
            player.facing = inputX >= 0 ? 1 : -1
        } else {
            let decel = (player.onGround ? SurvivalCodeRunNativeRules.groundDecel : SurvivalCodeRunNativeRules.airDecel) * step
            if abs(player.vx) <= decel { player.vx = 0 } else { player.vx -= player.vx.sign == .minus ? -decel : decel }
        }
        player.vy = min(SurvivalCodeRunNativeRules.maxFall, player.vy + SurvivalCodeRunNativeRules.gravity * step)
        player.runPhase += abs(player.vx) * 0.035 * step
        updateCoyoteFrames()
        processJumpBuffer()
        movePlayer(step: step)
        player.invulnerableTime = max(0, player.invulnerableTime - dt)
        player.hurtTime = max(0, player.hurtTime - dt)
        moveEnemies(step: step)
        resolveHazards(step: step)
        if hasReachedGoal() { finish(.clear) }
        if elapsed >= timeLimit { finish(.failed) }
    }

    private func updateCoyoteFrames() {
        if player.onGround {
            player.coyoteFrames = SurvivalCodeRunNativeRules.coyoteFrames
        } else if player.coyoteFrames > 0 {
            player.coyoteFrames -= 1
        }
    }

    private func processJumpBuffer() {
        guard player.jumpBufferFrames > 0 else { return }
        if canExecuteBufferedJump() {
            applyBufferedJump()
        } else {
            player.jumpBufferFrames -= 1
        }
    }

    private func canExecuteBufferedJump() -> Bool {
        if player.chordLockedUntilLanding || player.jumpCount >= 2 { return false }
        if player.jumpCount == 0 {
            return player.onGround || player.coyoteFrames > 0
        }
        return true
    }

    private func applyBufferedJump() {
        player.vy = SurvivalCodeRunNativeRules.jumpVelocity
        player.onGround = false
        player.jumpCount += 1
        player.coyoteFrames = 0
        player.jumpBufferFrames = 0
        if player.jumpCount >= 2 {
            player.chordLockedUntilLanding = true
            completedPitchClasses.removeAll()
        }
    }

    private func movePlayer(step: CGFloat) {
        var rect = CGRect(x: player.x + player.vx * step, y: player.y, width: 34, height: 42)
        for solid in mapSpec.solids where solid.kind != .platform && rect.intersects(solid.rect) {
            if player.vx > 0 { rect.origin.x = solid.rect.minX - rect.width }
            if player.vx < 0 { rect.origin.x = solid.rect.maxX }
            player.vx = 0
        }
        player.x = max(0, min(mapSpec.worldWidth - rect.width, rect.origin.x))
        rect = CGRect(x: player.x, y: player.y + player.vy * step, width: 34, height: 42)
        player.onGround = false
        for solid in mapSpec.solids where rect.intersects(solid.rect) {
            if solid.kind == .platform && !canLandOnPlatform(solid: solid) { continue }
            if player.vy > 0 {
                rect.origin.y = solid.rect.minY - rect.height
                player.vy = 0
                player.onGround = true
                player.jumpCount = 0
                player.chordLockedUntilLanding = false
            } else if player.vy < 0 {
                rect.origin.y = solid.rect.maxY
                player.vy = 0
            }
        }
        player.y = rect.origin.y
        if player.y > mapSpec.worldHeight + 96 { failRun() }
    }

    private func canLandOnPlatform(solid: SurvivalCodeRunNativeSolid) -> Bool {
        solid.kind == .platform
            && player.vy > 0
            && player.y + 42 <= solid.rect.minY + SurvivalCodeRunNativeRules.oneWayPlatformLandingEpsilon
    }

    private func hasReachedGoal() -> Bool {
        guard let goalY = mapSpec.goalY else {
            return player.x + 17 >= mapSpec.goalX
        }
        return player.x < mapSpec.goalX + mapSpec.tile + 16
            && player.x + 34 > mapSpec.goalX
            && player.y < goalY + 84
            && player.y + 42 > goalY
    }

    private func moveEnemies(step: CGFloat) {
        for i in enemies.indices where enemies[i].alive {
            enemies[i].rect.origin.x += enemies[i].vx * step
            if enemies[i].rect.minX < enemies[i].minX || enemies[i].rect.maxX > enemies[i].maxX {
                enemies[i].vx *= -1
                enemies[i].rect.origin.x = max(enemies[i].minX, min(enemies[i].maxX, enemies[i].rect.origin.x))
            }
            enemies[i].anim += 0.15 * step
        }
    }

    private func resolveHazards(step: CGFloat) {
        guard player.invulnerableTime <= 0 else { return }
        let rect = CGRect(x: player.x, y: player.y, width: 34, height: 42)
        if let spike = mapSpec.spikes.first(where: { rect.intersects($0) }) {
            applyDamage(sourceCenterX: spike.midX)
            return
        }
        for i in enemies.indices where enemies[i].alive && rect.intersects(enemies[i].rect) {
            let bottomBefore = rect.maxY - player.vy * step
            if player.vy > 0 && bottomBefore <= enemies[i].rect.minY + 12 {
                enemies[i].alive = false
                player.vy = SurvivalCodeRunNativeRules.stompBounce
                player.onGround = false
            } else {
                applyDamage(sourceCenterX: enemies[i].rect.midX)
            }
            return
        }
    }

    private func noteOn(_ midi: Int) {
        audio.pianoNoteOnRealtime(midi: midi, velocity: 100)
        heldKeys.insert(midi)
        guard status == .playing, !player.chordLockedUntilLanding, let chord = currentChord else { return }
        let pc = Self.pitchClass(midi)
        guard chord.pitchClasses.contains(pc) else { return }
        completedPitchClasses.insert(pc)
        if Set(chord.pitchClasses).isSubset(of: completedPitchClasses) {
            audio.playSynthBassRoot(midi: 36 + chord.rootPitchClass)
            triggerJump()
            currentChordIndex = chords.isEmpty ? 0 : (currentChordIndex + 1) % chords.count
            completedPitchClasses.removeAll()
        }
    }

    private func noteOff(_ midi: Int) {
        audio.pianoNoteOffRealtime(midi: midi)
        heldKeys.remove(midi)
    }

    private func triggerJump() {
        guard player.jumpCount < 2, !player.chordLockedUntilLanding else { return }
        player.jumpBufferFrames = SurvivalCodeRunNativeRules.jumpBufferFrames
    }

    private func applyDamage(sourceCenterX: CGFloat) {
        guard status == .playing, player.invulnerableTime <= 0 else { return }
        let playerCenterX = player.x + 17
        let dir: CGFloat = playerCenterX < sourceCenterX ? -1 : 1
        player.hp -= 1
        player.hurtTime = SurvivalCodeRunNativeRules.hurtDuration
        player.invulnerableTime = SurvivalCodeRunNativeRules.damageInvulnerability
        player.vx = dir * SurvivalCodeRunNativeRules.knockbackVX
        player.vy = SurvivalCodeRunNativeRules.knockbackVY
        player.onGround = false
        if player.hp <= 0 {
            failRun()
        }
    }

    private func failRun() {
        guard status == .playing else { return }
        finish(.failed)
    }

    private func applyMapSpec(_ nextMap: SurvivalCodeRunNativeMapSpec) {
        mapSpec = nextMap
        player = SurvivalCodeRunNativePlayer(x: nextMap.spawn.x, y: nextMap.spawn.y)
        enemies = nextMap.enemies()
        completedPitchClasses.removeAll()
        heldKeys.removeAll()
    }

    private func finish(_ next: SurvivalCodeRunNativeStatus) {
        guard status == .playing else { return }
        status = next
        showResult = true
        audio.playEffect(next == .clear ? .stageClear : .stageGameOver)
        if next == .clear { submitClearIfNeeded() }
    }

    private func resetRun() {
        player = SurvivalCodeRunNativePlayer(x: mapSpec.spawn.x, y: mapSpec.spawn.y)
        enemies = mapSpec.enemies()
        elapsed = 0
        status = .playing
        showResult = false
        submittedClear = false
        currentChordIndex = 0
        inputX = 0
        completedPitchClasses.removeAll()
        audio.start(playBackgroundMusic: true)
    }

    private func startAudioAndMidi() {
        MIDIManager.shared.refreshDevices()
        applyMapSpec(SurvivalCodeRunNativeMapSpec.fallback(mapId: stage.runMapId))
        Task {
            let config = (try? await SupabaseService.shared.fetchSurvivalStageConfig(difficulty: stage.difficulty.rawValue, stageType: stage.survivalBgmConfigStageType)) ?? .default
            await MainActor.run {
                audio.setBgmUrl(lessonRuntime?.bgmUrl ?? config.bgmUrl)
                audio.start(playBackgroundMusic: true)
            }
        }
        Task {
            let mapId = stage.runMapId ?? "night_city_run_01"
            guard let row = try? await SupabaseService.shared.fetchSurvivalCodeRunMap(id: mapId),
                  let nextMap = SurvivalCodeRunNativeMapSpec.from(row: row)
            else { return }
            await MainActor.run {
                applyMapSpec(nextMap)
            }
        }
        midiSubscriptionHolder.cancel()
        midiSubscriptionHolder.subscription = MIDIManager.shared.subscribe { status, data1, data2 in
            let messageType = status & 0xF0
            let note = Int(data1)
            let velocity = Int(data2)
            DispatchQueue.main.async {
                if messageType == 0x90 && velocity > 0 { noteOn(note) }
                if messageType == 0x80 || (messageType == 0x90 && velocity == 0) { noteOff(note) }
            }
        }
    }

    private func submitClearIfNeeded() {
        guard !hintMode, !submittedClear else { return }
        submittedClear = true
        Task {
            do {
                if let lessonContext {
                    _ = try await SupabaseService.shared.recordEarTrainingLessonProgress(
                        lessonId: lessonContext.lessonId,
                        lessonSongId: lessonContext.lessonSongId,
                        rank: "S",
                        clearConditions: lessonContext.clearConditions
                    )
                }
                let userId = try await SupabaseService.shared.currentUserId()
                let first = try await SupabaseService.shared.upsertSurvivalStageClear(
                    userId: userId,
                    stageNumber: stage.stageNumber,
                    survivalTimeSeconds: Int(elapsed.rounded()),
                    finalLevel: 1,
                    enemiesDefeated: 0,
                    characterId: characterId,
                    totalStages: SurvivalStageCatalog.totalStages(in: stage.mapCategory),
                    mapCategory: stage.mapCategory
                )
                if first && stage.mapCategory != .lesson {
                    let badges = try await SupabaseService.shared.grantUserBadgesForEvent(event: "survival_stage_clear", mapCategory: stage.mapCategory.rawValue, stageNumber: stage.stageNumber)
                    await MainActor.run { PlayerLevelHub.shared.ingestAchievementBadges(badges, usesEnglishUi: locale == .en) }
                }
                let award = try await SupabaseService.shared.awardPlayerXp(reason: "survival_stage_first_clear", sourceId: "\(stage.mapCategory.rawValue):\(stage.stageNumber)", amount: 80)
                await MainActor.run { PlayerLevelHub.shared.ingestAwardResponse(award, usesEnglishUi: locale == .en) }
            } catch {
                /* Result UI remains available even if reporting fails. */
            }
        }
    }

    private func formatElapsed() -> String {
        let sec = Int(elapsed.rounded())
        return String(format: "%d:%02d", sec / 60, sec % 60)
    }

    private static func pitchClass(_ midi: Int) -> Int { ((midi % 12) + 12) % 12 }
}

// MARK: - Stage intro (timed lines for stage 1)

@MainActor
private final class SurvivalStageIntroUIModel: ObservableObject {
    @Published var faiLine = ""
    @Published var jajiiLine = ""
    private let player = SurvivalStageIntroPlayer()

    func cancelAll() {
        player.cancel(setLineEmpty: { [weak self] in
            self?.faiLine = ""
            self?.jajiiLine = ""
        })
    }

    func loadAndSchedule(mapCategory: SurvivalMapCategory, usesEnglishCopy: Bool) async {
        cancelAll()
        let script = await SupabaseService.shared.fetchSurvivalStageIntroScript(mapCategory: mapCategory)
        player.schedule(
            script: script,
            usesEnglishCopy: usesEnglishCopy,
            onFaiLine: { [weak self] text in self?.faiLine = text },
            onJajiiLine: { [weak self] text in self?.jajiiLine = text }
        )
    }
}

@MainActor
private final class SurvivalBlockBossIntroUIModel: ObservableObject {
    @Published var faiLine = ""
    @Published var jajiiLine = ""
    private let player = SurvivalStageIntroPlayer()

    func cancelAll() {
        player.cancel(setLineEmpty: { [weak self] in
            self?.faiLine = ""
            self?.jajiiLine = ""
        })
    }

    func loadAndSchedule(mapCategory: SurvivalMapCategory, usesEnglishCopy: Bool) async {
        cancelAll()
        let script = await SupabaseService.shared.fetchSurvivalBlockBossIntroScript(mapCategory: mapCategory)
        player.schedule(
            script: script,
            usesEnglishCopy: usesEnglishCopy,
            onFaiLine: { [weak self] text in self?.faiLine = text },
            onJajiiLine: { [weak self] text in self?.jajiiLine = text }
        )
    }
}

@MainActor
private final class SurvivalStagePlayDialogueUIModel: ObservableObject {
    @Published var faiLine = ""
    @Published var jajiiLine = ""
    private let player = SurvivalStageIntroPlayer()

    func cancelAll() {
        player.cancel(setLineEmpty: { [weak self] in
            self?.faiLine = ""
            self?.jajiiLine = ""
        })
    }

    func loadAndSchedule(
        mapCategory: SurvivalMapCategory,
        stageNumber: Int,
        usesEnglishCopy: Bool
    ) async {
        cancelAll()
        guard let script = await SupabaseService.shared.fetchSurvivalStagePlayDialogue(
            mapCategory: mapCategory,
            stageNumber: stageNumber
        ) else { return }
        scheduleScript(script, usesEnglishCopy: usesEnglishCopy)
    }

    func loadAndScheduleBalloonRush(stageId: UUID, usesEnglishCopy: Bool) async {
        cancelAll()
        guard let script = await SupabaseService.shared.fetchBalloonRushPlayDialogue(stageId: stageId) else { return }
        scheduleScript(script, usesEnglishCopy: usesEnglishCopy)
    }

    private func scheduleScript(_ script: SurvivalStageIntroScriptPayload, usesEnglishCopy: Bool) {
        player.schedule(
            script: script,
            usesEnglishCopy: usesEnglishCopy,
            onFaiLine: { [weak self] text in self?.faiLine = text },
            onJajiiLine: { [weak self] text in self?.jajiiLine = text }
        )
    }
}

// MARK: - Session-observing content view

struct SurvivalGameContent<Session: SurvivalPlaySession>: View {
    @ObservedObject var session: Session
    let stage: SurvivalStageDefinition
    var balloonRushPlayDialogueStageId: UUID?
    let locale: AppLocale
    let isDemo: Bool
    let externalJajiiBubbleText: String
    let externalPlayerBubbleText: String
    let onApplyHintModeAndRestart: ((Bool) -> Void)?


    @StateObject private var stageIntroUIModel = SurvivalStageIntroUIModel()
    @StateObject private var blockBossIntroUIModel = SurvivalBlockBossIntroUIModel()
    @StateObject private var playDialogueUIModel = SurvivalStagePlayDialogueUIModel()
    @State private var hudHeight: CGFloat = 72
    @State private var chordPadVisibleWhiteKeys = SurvivalChordPadPreferences.loadVisibleWhiteKeys()

    private var vm: SurvivalViewModel { session.viewModel }

    private var wantsStageIntroTimedLines: Bool {
        !isDemo &&
            stage.stageNumber == 1 &&
            SurvivalMapCategory.descentDisplayCategories.contains(stage.mapCategory) &&
            !vm.uiSnapshot.scenario.isActive
    }

    /// 第一ブロック末尾ボス（ステージ1のイントロと同時実行しない）。
    private var wantsBlockBossTimedLines: Bool {
        !isDemo &&
            SurvivalMapCategory.descentDisplayCategories.contains(stage.mapCategory) &&
            vm.isBossStage &&
            stage.isFirstBlockBossStage &&
            !vm.uiSnapshot.scenario.isActive &&
            !wantsStageIntroTimedLines
    }

    private var wantsStagePlayDialogue: Bool {
        if balloonRushPlayDialogueStageId != nil {
            return !isDemo && !vm.uiSnapshot.scenario.isActive
        }
        return !isDemo
            && stage.mapCategory == .basic
            && stage.stageNumber == 9901
            && !vm.uiSnapshot.scenario.isActive
            && !wantsStageIntroTimedLines
            && !wantsBlockBossTimedLines
    }

    private var faiTimedBubbleText: String {
        let external = externalPlayerBubbleText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !external.isEmpty { return external }
        if !playDialogueUIModel.faiLine.isEmpty { return playDialogueUIModel.faiLine }
        if !blockBossIntroUIModel.faiLine.isEmpty { return blockBossIntroUIModel.faiLine }
        return stageIntroUIModel.faiLine
    }

    private var jajiiTimedBubbleText: String {
        let trimmed = externalJajiiBubbleText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty { return trimmed }
        if !playDialogueUIModel.jajiiLine.isEmpty { return playDialogueUIModel.jajiiLine }
        if !blockBossIntroUIModel.jajiiLine.isEmpty { return blockBossIntroUIModel.jajiiLine }
        return stageIntroUIModel.jajiiLine
    }

    private var balloonRushStaffPayload: SurvivalStageCenterStaffPayload? {
        guard let balloonSession = session as? BalloonRushGameSession else {
            return nil
        }
        return SurvivalStageCenterStaffPayload.make(from: balloonSession.gameLoop)
    }

    private var balloonRushStaffVisible: Bool {
        guard session is BalloonRushGameSession,
              !vm.uiSnapshot.scenario.hideStaff else {
            return false
        }
        if let balloonStaff = balloonRushStaffPayload, !balloonStaff.voicingNames.isEmpty {
            return true
        }
        return false
    }

    var body: some View {
        ZStack(alignment: .top) {
            SurvivalSceneContainer(
                session: session,
                faiBubbleText: faiTimedBubbleText,
                jajiiBubbleText: jajiiTimedBubbleText,
                speechBubblesBelowCharacter: vm.uiSnapshot.scenario.speechBubblesBelowCharacter
            )
                .ignoresSafeArea()

            SurvivalJoystickRepresentable(
                hitMask: .full,
                isInteractive: vm.uiSnapshot.phase == .playing && !vm.isPaused && !vm.uiSnapshot.scenario.disableJoystick
            ) { analog in
                session.input.setAnalog(analog)
            }
            .allowsHitTesting(vm.uiSnapshot.phase == .playing && !vm.isPaused && !vm.uiSnapshot.scenario.disableJoystick)

            if vm.uiSnapshot.phase == .playing,
               !vm.isPaused,
               !vm.uiSnapshot.scenario.hideStaff,
               let balloonStaff = balloonRushStaffPayload,
               !balloonStaff.voicingNames.isEmpty {
                SurvivalStageCenterStaffOverlay(
                    payload: balloonStaff,
                    unpressedNoteOpacity: vm.uiSnapshot.unpressedNoteOpacity
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .padding(.top, hudHeight + 4)
                .padding(.horizontal, 12)
                .allowsHitTesting(false)
            } else if vm.uiSnapshot.phase == .playing,
               !vm.isPaused,
               !vm.uiSnapshot.scenario.hideStaff,
               scenarioStaffSnapshot == nil,
               let phraseStaff = vm.phraseStaffSnapshot {
                SurvivalPhraseStaffOverlay(snapshot: phraseStaff)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    .padding(.top, hudHeight + 4)
                    .padding(.horizontal, 12)
                    .allowsHitTesting(false)
            } else if vm.uiSnapshot.phase == .playing,
               !vm.isPaused,
               !vm.uiSnapshot.scenario.hideStaff,
               !vm.uiSnapshot.scenario.suppressScenarioStaff,
               scenarioStaffSnapshot == nil,
               let staffPayload = SurvivalStageCenterStaffPayload.make(from: vm.uiSnapshot),
               !staffPayload.voicingNames.isEmpty {
                SurvivalStageCenterStaffOverlay(
                    payload: staffPayload,
                    unpressedNoteOpacity: vm.uiSnapshot.unpressedNoteOpacity
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .padding(.top, hudHeight + 4)
                .padding(.horizontal, 12)
                .allowsHitTesting(false)
            }

            VStack(spacing: 0) {
                SurvivalHUDView(
                    uiSnapshot: vm.uiSnapshot,
                    bossHud: vm.bossHud,
                    isPaused: vm.isPaused,
                    stage: stage,
                    enemyQuotaOverride: session.playLoopFacade.effectiveStageKillQuota,
                    locale: locale,
                    onTogglePause: { session.togglePause() }
                )
                Spacer()
            }
            .onPreferenceChange(SurvivalHUDHeightKey.self) { hudHeight = $0 }

            if session is BalloonRushGameSession,
               vm.uiSnapshot.phase == .playing,
               !vm.isPaused {
                let staffBandHeight = BalloonRushStatusOverlayLayout.staffBandHeight(
                    stageType: stage.stageType,
                    staffVisible: balloonRushStaffVisible
                )
                BalloonRushStatusOverlay(
                    remainingSeconds: vm.uiSnapshot.remainingSecondsCoarse,
                    remainingCount: max(
                        0,
                        session.playLoopFacade.effectiveStageKillQuota - vm.uiSnapshot.enemiesDefeated
                    ),
                    locale: locale,
                    topInset: BalloonRushStatusOverlayLayout.topInset(
                        hudHeight: hudHeight,
                        staffBandHeight: staffBandHeight
                    )
                )
                .equatable()
            }

            if let staffSnapshot = scenarioStaffSnapshot {
                VStack(spacing: 0) {
                    SurvivalScenarioStaffPanel(snapshot: staffSnapshot)
                        .padding(.top, 48)
                    Spacer()
                }
                .allowsHitTesting(false)
            }

            if !vm.uiSnapshot.scenario.hideComboBadge {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        SurvivalComboBadgeView(comboCount: vm.uiSnapshot.comboCount)
                            .padding(Edge.Set.trailing, 16)
                            .padding(Edge.Set.bottom, 140)
                    }
                }
                .allowsHitTesting(false)
            }

            if !vm.uiSnapshot.scenario.hideChordPad {
                VStack {
                    Spacer()
                    chordPadBar
                }
            }

            if vm.isPaused && vm.uiSnapshot.phase == .playing && !vm.uiSnapshot.scenario.hidePauseButton {
                pauseOverlay
            }

            if vm.uiSnapshot.phase != .playing && !vm.uiSnapshot.scenario.disableResultScreen {
                resultOverlay
            }
        }
        .onChange(of: ObjectIdentifier(session)) { _ in
            stageIntroUIModel.cancelAll()
            blockBossIntroUIModel.cancelAll()
            playDialogueUIModel.cancelAll()
        }
        .onChange(of: session.viewModel.sceneRestartGeneration) { _ in
            rescheduleStageIntroTimedLinesIfEligible()
            rescheduleBlockBossIntroTimedLinesIfEligible()
            reschedulePlayDialogueTimedLinesIfEligible()
        }
        .onChange(of: vm.uiSnapshot.phase) { phase in
            if wantsStageIntroTimedLines {
                if phase != .playing {
                    stageIntroUIModel.cancelAll()
                }
            } else {
                stageIntroUIModel.cancelAll()
            }

            if wantsBlockBossTimedLines {
                if phase != .playing {
                    blockBossIntroUIModel.cancelAll()
                }
            } else {
                blockBossIntroUIModel.cancelAll()
            }

            if wantsStagePlayDialogue {
                if phase != .playing {
                    playDialogueUIModel.cancelAll()
                }
            } else {
                playDialogueUIModel.cancelAll()
            }
        }
        .onAppear {
            rescheduleStageIntroTimedLinesIfEligible()
            rescheduleBlockBossIntroTimedLinesIfEligible()
            reschedulePlayDialogueTimedLinesIfEligible()
        }
    }

    private func reschedulePlayDialogueTimedLinesIfEligible() {
        guard wantsStagePlayDialogue else {
            playDialogueUIModel.cancelAll()
            return
        }
        DispatchQueue.main.async {
            guard self.vm.uiSnapshot.phase == .playing else {
                self.playDialogueUIModel.cancelAll()
                return
            }
            Task { @MainActor in
                if let brId = self.balloonRushPlayDialogueStageId {
                    await self.playDialogueUIModel.loadAndScheduleBalloonRush(
                        stageId: brId,
                        usesEnglishCopy: self.locale == .en
                    )
                } else {
                    await self.playDialogueUIModel.loadAndSchedule(
                        mapCategory: self.stage.mapCategory,
                        stageNumber: self.stage.stageNumber,
                        usesEnglishCopy: self.locale == .en
                    )
                }
            }
        }
    }

    private func rescheduleStageIntroTimedLinesIfEligible() {
        guard wantsStageIntroTimedLines else {
            stageIntroUIModel.cancelAll()
            return
        }
        DispatchQueue.main.async {
            guard self.vm.uiSnapshot.phase == .playing else {
                self.stageIntroUIModel.cancelAll()
                return
            }
            Task { @MainActor in
                await self.stageIntroUIModel.loadAndSchedule(
                    mapCategory: self.stage.mapCategory,
                    usesEnglishCopy: self.locale == .en
                )
            }
        }
    }

    private func rescheduleBlockBossIntroTimedLinesIfEligible() {
        guard wantsBlockBossTimedLines else {
            blockBossIntroUIModel.cancelAll()
            return
        }
        DispatchQueue.main.async {
            guard self.vm.uiSnapshot.phase == .playing else {
                self.blockBossIntroUIModel.cancelAll()
                return
            }
            Task { @MainActor in
                await self.blockBossIntroUIModel.loadAndSchedule(
                    mapCategory: self.stage.mapCategory,
                    usesEnglishCopy: self.locale == .en
                )
            }
        }
    }

    private var chordPadBar: some View {
        SurvivalChordPadView(
            snapshot: SurvivalChordPadSnapshot(
                hintMidis: vm.chordPadHintMidis,
                completedHintMidis: vm.chordPadCompletedHintMidis,
                hintPendingOpacity: vm.chordPadHintPendingOpacity,
                midiHeldKeys: vm.midiHeldKeys,
                isEnabled: vm.uiSnapshot.phase == .playing && !vm.isPaused,
                scrollAnchorMidi: vm.chordPadScrollAnchorMidi
            ),
            visibleWhiteKeys: chordPadVisibleWhiteKeys,
            onVisibleWhiteKeysChange: { newValue in
                let clamped = SurvivalChordPadLayout.clampedVisibleWhiteKeys(newValue)
                guard clamped != chordPadVisibleWhiteKeys else { return }
                chordPadVisibleWhiteKeys = clamped
                SurvivalChordPadPreferences.saveVisibleWhiteKeys(clamped)
            },
            onPress: { session.chordPadNoteOn($0, velocity: 100) },
            onRelease: { session.chordPadNoteOff($0) }
        )
        .equatable()
        .ignoresSafeArea(.container, edges: .horizontal)
        .padding(.bottom, 8)
    }

    private var scenarioStaffSnapshot: SurvivalScenarioStaffPanel.Snapshot? {
        if balloonRushPlayDialogueStageId != nil {
            return nil
        }
        let sc = vm.uiSnapshot.scenario
        guard sc.isActive, !sc.hideStaff else { return nil }
        guard !sc.suppressScenarioStaff else { return nil }
        guard session.playLoopFacade.phraseStaffSnapshot() == nil else { return nil }
        guard vm.uiSnapshot.slots.indices.contains(1) else { return nil }
        let slot = vm.uiSnapshot.slots[1]
        guard slot.isEnabled else { return nil }
        guard let chord = slot.chord,
              let staffNames = chord.progressionStaffVoicingNames,
              !staffNames.isEmpty else {
            return nil
        }
        let staves = chord.progressionStaffVoicingStaves
        let perNoteStaves: [Int]? = {
            guard let staves, staves.count == staffNames.count else { return nil }
            return staves
        }()
        return SurvivalScenarioStaffPanel.Snapshot(
            chordDisplayName: chord.displayName,
            voicingNames: staffNames,
            keyFifths: chord.progressionStaffKeyFifths ?? 0,
            correctPitchClasses: SurvivalChordResolver.correctNotes(
                inputPitchClasses: slot.inputPitchClasses,
                target: chord
            ),
            staffClef: sc.scenarioStaffClef,
            voicingStavesPerNote: perNoteStaves
        )
    }

    // MARK: - Overlays

    private var pauseOverlay: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalPauseSettingsSheet(
                locale: locale,
                isDemo: isDemo,
                stageRunMode: (isDemo || stage.survivalUsesCompositePhrasePattern) ? nil : onApplyHintModeAndRestart.map { restart in
                    SurvivalStageRunModeConfig(
                        hintMode: session.currentHintMode,
                        onApplyHintModeAndRestart: restart
                    )
                },
                onResume: { session.togglePause() },
                onExit: { session.requestExit() }
            )
        }
    }

    private var resultOverlay: some View {
        let isCleared = vm.uiSnapshot.phase == .cleared
        return ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            SurvivalGameResultView(
                isCleared: isCleared,
                stage: stage,
                enemiesDefeated: vm.uiSnapshot.enemiesDefeated,
                enemiesDefeatedQuota: session.playLoopFacade.effectiveStageKillQuota,
                enemiesDefeatedLabel: balloonRushPlayDialogueStageId != nil
                    ? (locale == .ja ? "風船" : "Balloons")
                    : (locale == .ja ? "撃破数" : "Enemies"),
                elapsedSeconds: vm.uiSnapshot.elapsedSecondsRounded,
                playerHp: vm.uiSnapshot.hp,
                playerMaxHp: vm.uiSnapshot.maxHp,
                hintMode: session.currentHintMode,
                isBossStage: vm.isBossStage,
                locale: locale,
                clearReportInFlight: vm.clearReportInFlight,
                clearReportError: vm.clearReportError,
                isDemo: isDemo,
                onRetry: { session.restartSameStage(hintMode: nil) },
                onExit: { session.requestExit() }
            )
        }
    }
}

// MARK: - Stage center staff (slots removed; matches Web SurvivalGameScreen overlay)

private struct SurvivalStageCenterStaffPayload: Equatable {
    let chordDisplayName: String
    let voicingNames: [String]
    let keyFifths: Int
    let correctPitchClasses: [Int]
    let staffClef: Int
    /// 中央スタッフ用。`progressionStaffVoicingStaves` があれば構成音単位。
    let voicingStavesPerNote: [Int]?

    static func make(from snapshot: SurvivalUISnapshot) -> Self? {
        guard snapshot.slots.indices.contains(1) else { return nil }
        let slot = snapshot.slots[1]
        guard slot.isEnabled else { return nil }

        if let chord = slot.chord,
           chord.quality == .progression,
           let staffNames = chord.progressionStaffVoicingNames,
           !staffNames.isEmpty,
           let keyFf = chord.progressionStaffKeyFifths {
            let pcs = SurvivalChordResolver.correctNotes(
                inputPitchClasses: slot.inputPitchClasses,
                target: chord
            )
            return Self(
                chordDisplayName: chord.displayName,
                voicingNames: staffNames,
                keyFifths: keyFf,
                correctPitchClasses: pcs,
                staffClef: 2,
                voicingStavesPerNote: chord.progressionStaffVoicingStaves
            )
        }

        if snapshot.stageType != .progression,
           let chord = slot.chord,
           chord.quality != .progression,
           let directVoicing = SurvivalRandomHintStaff.directVoicing(for: chord) {
            let pcs = SurvivalChordResolver.correctNotes(
                inputPitchClasses: slot.inputPitchClasses,
                target: chord
            )
            return Self(
                chordDisplayName: chord.displayName,
                voicingNames: directVoicing.names,
                keyFifths: directVoicing.keyFifths,
                correctPitchClasses: pcs,
                staffClef: 1,
                voicingStavesPerNote: nil
            )
        }

        return nil
    }

    @MainActor
    static func make(from loop: BalloonRushGameLoop) -> Self? {
        guard loop.slots.indices.contains(SurvivalSlotIndex.B.rawValue) else { return nil }
        let slot = loop.slots[SurvivalSlotIndex.B.rawValue]
        guard slot.isEnabled, let chord = slot.chord else { return nil }
        let pcs = SurvivalChordResolver.correctNotes(
            inputPitchClasses: slot.inputPitchClasses,
            target: chord
        )

        if chord.quality == .progression,
           let staffNames = chord.progressionStaffVoicingNames,
           !staffNames.isEmpty,
           let keyFf = chord.progressionStaffKeyFifths {
            return Self(
                chordDisplayName: chord.displayName,
                voicingNames: staffNames,
                keyFifths: keyFf,
                correctPitchClasses: pcs,
                staffClef: 2,
                voicingStavesPerNote: chord.progressionStaffVoicingStaves
            )
        }

        if chord.quality != .progression,
           let directVoicing = SurvivalRandomHintStaff.directVoicing(for: chord) {
            return Self(
                chordDisplayName: chord.displayName,
                voicingNames: directVoicing.names,
                keyFifths: directVoicing.keyFifths,
                correctPitchClasses: pcs,
                staffClef: 1,
                voicingStavesPerNote: nil
            )
        }

        return nil
    }
}

private struct SurvivalStageCenterStaffOverlay: View {
    let payload: SurvivalStageCenterStaffPayload
    let unpressedNoteOpacity: CGFloat

    private var grandStaff: Bool {
        SurvivalStaffOverlayLayout.usesGrandStaff(voicingStavesPerNote: payload.voicingStavesPerNote)
    }

    var body: some View {
        let isPad = SurvivalStaffOverlayLayout.isPad
        SurvivalProgressionStaffView(
            chordDisplayName: payload.chordDisplayName,
            voicingNames: payload.voicingNames,
            keyFifths: payload.keyFifths,
            correctPitchClasses: payload.correctPitchClasses,
            staffClef: payload.staffClef,
            unpressedNoteOpacity: unpressedNoteOpacity,
            compactVerticalLayout: true,
            voicingStavesPerNote: payload.voicingStavesPerNote,
            staffSpacingScale: SurvivalStaffOverlayLayout.staffSpacingScale
        )
        .frame(
            maxWidth: SurvivalStaffOverlayLayout.centerStaffMaxWidth(isPad: isPad),
            maxHeight: SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: isPad, grandStaff: grandStaff),
            alignment: .top
        )
    }
}

private struct SurvivalPhraseStaffOverlay: View {
    let snapshot: SurvivalPhraseStaffSnapshot

    private var grandStaff: Bool {
        SurvivalStaffOverlayLayout.usesGrandStaff(notes: snapshot.currentChord?.notes)
    }

    var body: some View {
        let isPad = SurvivalStaffOverlayLayout.isPad
        SurvivalPhraseStaffView(
            snapshot: snapshot,
            staffSpacingScale: SurvivalStaffOverlayLayout.staffSpacingScale
        )
        .frame(
            maxWidth: SurvivalStaffOverlayLayout.centerStaffMaxWidth(isPad: isPad),
            maxHeight: SurvivalStaffOverlayLayout.centerStaffMaxHeight(isPad: isPad, grandStaff: grandStaff),
            alignment: .top
        )
    }
}

private struct SurvivalScenarioStaffPanel: View, Equatable {
    struct Snapshot: Equatable {
        let chordDisplayName: String
        let voicingNames: [String]
        let keyFifths: Int
        let correctPitchClasses: [Int]
        let staffClef: Int
        /// 1=ト音・2=ヘ音。`voicingNames` と同長のとき大譜表。
        let voicingStavesPerNote: [Int]?
    }

    let snapshot: Snapshot

    private var usesGrandStaffLayout: Bool {
        guard let staves = snapshot.voicingStavesPerNote, staves.count == snapshot.voicingNames.count else {
            return false
        }
        return staves.contains(1) && staves.contains(2)
    }

    var body: some View {
        let isPad = SurvivalStaffOverlayLayout.isPad
        SurvivalProgressionStaffView(
            chordDisplayName: snapshot.chordDisplayName,
            voicingNames: snapshot.voicingNames,
            keyFifths: snapshot.keyFifths,
            correctPitchClasses: snapshot.correctPitchClasses,
            staffClef: snapshot.staffClef,
            compactVerticalLayout: true,
            voicingStavesPerNote: snapshot.voicingStavesPerNote,
            staffSpacingScale: SurvivalStaffOverlayLayout.staffSpacingScale
        )
        .frame(
            maxWidth: SurvivalStaffOverlayLayout.scenarioStaffMaxWidth(isPad: isPad),
            maxHeight: SurvivalStaffOverlayLayout.scenarioStaffMaxHeight(
                isPad: isPad,
                grandStaff: usesGrandStaffLayout
            ),
            alignment: .top
        )
        .modifier(SurvivalTutorialStaffBackdropModifier())
    }
}

/// 鍵盤付近に重ねる A/B コンボ数表示（途切れで非表示）。
private struct SurvivalComboBadgeView: View {
    let comboCount: Int

    var body: some View {
        if comboCount > 0 {
            HStack(spacing: 4) {
                Text("COMBO")
                    .font(.caption.bold())
                    .foregroundStyle(.white.opacity(0.85))
                Text("\(comboCount)")
                    .font(.title2.bold())
                    .foregroundStyle(.yellow)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.black.opacity(0.55), in: Capsule())
            .overlay(
                Capsule()
                    .stroke(.yellow.opacity(0.6), lineWidth: 1)
            )
        }
    }
}

// MARK: - SpriteKit ブリッジ

private func playfieldSize(for session: any SurvivalPlaySession) -> CGSize {
    if session is BalloonRushGameSession {
        return CGSize(width: BalloonRushMap.width, height: BalloonRushMap.height)
    }
    return CGSize(width: SurvivalMap.width, height: SurvivalMap.height)
}

private struct SurvivalSceneContainer: UIViewRepresentable {
    let session: any SurvivalPlaySession
    let faiBubbleText: String
    let jajiiBubbleText: String
    let speechBubblesBelowCharacter: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> SKView {
        let initialFrame = UIScreen.main.bounds
        let view = SKView(frame: initialFrame)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.ignoresSiblingOrder = true
        view.preferredFramesPerSecond = 60
        view.isAsynchronous = false
        view.isPaused = false
        view.isUserInteractionEnabled = false

        let sceneSize = initialFrame.size.width > 0 && initialFrame.size.height > 0
            ? initialFrame.size
            : CGSize(width: 1, height: 1)
        let playfield = playfieldSize(for: session)
        let scene = SurvivalScene(size: sceneSize, driver: session, playfieldSize: playfield)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        view.presentScene(scene)

        context.coordinator.attach(view: view, scene: scene, session: session)
        context.coordinator.lastSceneRestartGeneration = session.viewModel.sceneRestartGeneration
        return view
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        if let scene = uiView.scene as? SurvivalScene {
            scene.setSpeechBubblesBelowCharacter(speechBubblesBelowCharacter)
            scene.setPlayerQuoteText(faiBubbleText)
            scene.setJajiiQuoteText(jajiiBubbleText)
        }

        let gen = session.viewModel.sceneRestartGeneration
        guard gen != context.coordinator.lastSceneRestartGeneration else { return }
        context.coordinator.lastSceneRestartGeneration = gen
        let bounds = uiView.bounds
        let sceneSize: CGSize
        if bounds.width > 0, bounds.height > 0 {
            sceneSize = bounds.size
        } else {
            sceneSize = UIScreen.main.bounds.size
        }
        if let existing = uiView.scene as? SurvivalScene {
            existing.size = sceneSize
            existing.scaleMode = .resizeFill
            existing.isPaused = false
            existing.resetForRestart()
            uiView.isPaused = false
            uiView.isUserInteractionEnabled = false
            context.coordinator.attach(view: uiView, scene: existing, session: session)
            return
        }
        let playfield = playfieldSize(for: session)
        let scene = SurvivalScene(size: sceneSize, driver: session, playfieldSize: playfield)
        scene.scaleMode = .resizeFill
        scene.isPaused = false
        uiView.isPaused = false
        uiView.isUserInteractionEnabled = false
        uiView.presentScene(scene)
        context.coordinator.attach(view: uiView, scene: scene, session: session)
    }

    static func dismantleUIView(_ uiView: SKView, coordinator: Coordinator) {
        coordinator.detach()
    }

    final class Coordinator {
        private weak var view: SKView?
        private weak var scene: SurvivalScene?
        private weak var session: (any SurvivalPlaySession)?
        private var watchdog: Timer?

        private var activeObserver: NSObjectProtocol?
        private var willResignObserver: NSObjectProtocol?
        var lastSceneRestartGeneration: Int = 0

        func attach(view: SKView, scene: SurvivalScene, session: any SurvivalPlaySession) {
            detach()

            self.view = view
            self.scene = scene
            self.session = session

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
            session = nil
        }

        @MainActor
        private func resumeIfPausedExternally() {
            guard let view, let scene else { return }
            if view.isPaused { view.isPaused = false }
            if scene.isPaused { scene.isPaused = false }
        }

        @MainActor
        private func resumeIfSceneLoopStalled() {
            guard let view, let scene, let session else { return }
            guard view.window != nil else { return }
            guard session.allowsGameplayWatchdog else { return }
            let vm = session.viewModel
            guard vm.uiSnapshot.phase == .playing, !vm.isPaused else { return }

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

import SwiftUI
import UIKit

/// サバイバルタブ（魔王城降下）のネイティブ実装。
///
/// 仕様:
/// - iPhone: 画面全体を降下マップで覆う 1 カラム構成。ステージタップでボトムシート表示。
/// - iPad: 左マップ + 右サイドパネル (固定 320pt) の 2 カラム構成で、選択したステージ詳細
///   がサイドパネルに表示される。Web 版 (`SurvivalDescentMap.tsx`) と同一レイアウト。
/// - 無料プランは **各マップ（Basic / Songs）の第一ブロック** が遊べる。それ以外はステージをタップすると
///   `SubscriptionView` に誘導する。
/// - ステージはクリア状況によりアンロック。1 ステージ目は常時解放、
///   それ以外は「前のステージがクリア済み」で解放。
/// - ステージ起動時は既存の `GameWebView(.survivalStage(...))` を `fullScreenCover` で表示する。
///   ゲームクリア後は Supabase の `survival_stage_clears` / `survival_stage_progress` が
///   更新されるため、閉じたタイミングで再読み込みする。
/// - BGM: `SurvivalMapAudio` を onAppear で再生開始、onDisappear / ゲーム起動時に停止。
struct SurvivalView: View {
    @EnvironmentObject var appState: AppState

    @State private var currentStageNumber: Int = 1
    @State private var clearedStages: Set<Int> = []
    @State private var isLoading: Bool = true
    @State private var selectedStageNumber: Int?
    @State private var hintMode: Bool = false
    /// 表示マップカテゴリ。Web 版 `SurvivalDescentMap` と同様、初期は `.basic`。
    @State private var mapCategory: SurvivalMapCategory = .basic
    /// `SurvivalStageDefinition.id` が同一だと SwiftUI が同じシート/カバーを再利用するため、
    /// 同じステージを連続再生したいケースではセッションがリセットされないと状態が残る問題が発生する。
    /// セッションごとに一意の UUID で包んで `fullScreenCover(item:)` を確実に再マウントさせる。
    @State private var stageLaunchSession: StageLaunchSession?
    @State private var showSubscription: Bool = false
    /// `fetchSurvivalStages` が成功した時刻。Basic/Songs 切替では TTL 内はカタログ再取得を省略する。
    @State private var survivalStagesFetchedAt: Date?

    private static let survivalStagesCatalogTTL: TimeInterval = 600

    /// 1 カラム (iPhone) 表示時にステージ詳細シートを出すためのバインド。
    /// 以前は `showMobileDetail: Bool` + computed `selectedStage` で参照していたが、
    /// `.sheet(isPresented:)` + `@State` 同時更新だと初回タップ時に
    /// `selectedStage` が前フレームの値 (現在地 / frontier) で評価されてしまう問題があったため、
    /// `.sheet(item:)` にリファクタして必ず「タップされたステージ自身」を渡すようにした。
    @State private var mobileDetailStage: SurvivalStageDefinition?
    @State private var showSurvivalInfo: Bool = false
    @State private var isSoundMuted: Bool = SurvivalMapAudio.shared.isMuted
    @State private var progressCacheByCategory: [SurvivalMapCategory: SurvivalProgressSnapshot] = [:]

    /// ステージ定義は Supabase からのロード後に再構築されるため、computed property で常に最新を参照する。
    private var blocks: [SurvivalBlockMeta] { SurvivalStageCatalog.blocks(in: mapCategory) }
    private var freeStageNumbers: Set<Int> { SurvivalStageCatalog.freeTierStageNumbers(in: mapCategory) }

    private var locale: AppLocale { appState.locale }

    /// iPad のみ 2 カラムで表示 (iPhone Max 系は 1 カラム固定)
    private var useSplitLayout: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    /// 第一階層のクリア状況から「プレミアムがロックされている無料ユーザー」の表示フラグ。
    private var playLockedForUpsell: Bool { !appState.isPremium }

    private var selectedStage: SurvivalStageDefinition? {
        guard let stageNumber = selectedStageNumber else { return nil }
        return SurvivalStageCatalog.stage(byNumber: stageNumber, in: mapCategory)
    }

    private var selectedStageBlock: SurvivalBlockMeta? {
        guard let stage = selectedStage else { return nil }
        return SurvivalStageCatalog.block(forStage: stage.stageNumber, in: mapCategory)
    }

    /// サイドパネル用: 選択ステージが無ければ現ブロック、無ければ先頭ブロック。
    private var panelBlock: SurvivalBlockMeta? {
        let total = SurvivalStageCatalog.totalStages(in: mapCategory)
        let refStage = selectedStage?.stageNumber ?? max(1, min(max(1, total), currentStageNumber))
        return SurvivalStageCatalog.block(forStage: refStage, in: mapCategory) ?? blocks.first
    }

    private var panelBlockClearedCount: Int {
        guard let b = panelBlock else { return 0 }
        return b.stageNumbers.filter { clearedStages.contains($0) }.count
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                if isLoading {
                    ProgressView()
                        .tint(.purple)
                } else {
                    content
                }
            }
            .navigationTitle(locale == .ja ? "サバイバル" : "Survival")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 12) {
                        Button {
                            let muted = SurvivalMapAudio.shared.toggleMuted()
                            isSoundMuted = muted
                            if !muted { SurvivalMapAudio.shared.play() }
                        } label: {
                            Image(systemName: isSoundMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                                .foregroundStyle(.white)
                        }
                        Button { showSurvivalInfo = true } label: {
                            Image(systemName: "info.circle")
                                .foregroundStyle(.gray)
                        }
                    }
                }
            }
            .task { await loadProgress(showBlockingLoader: true, forceCatalogFetch: false) }
            .onChange(of: appState.profile?.id) { _ in
                survivalStagesFetchedAt = nil
                progressCacheByCategory = [:]
                Task { await loadProgress(showBlockingLoader: true, forceCatalogFetch: false) }
            }
            .onAppear {
                if !SurvivalMapAudio.shared.isMuted {
                    SurvivalMapAudio.shared.play()
                }
                Task { await appState.ensureFreshBilling() }
            }
            .onDisappear {
                SurvivalMapAudio.shared.stop()
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView()
            }
            .sheet(item: $mobileDetailStage) { stage in
                // `.sheet(item:)` によりシート表示時点のステージ本体が直接クロージャに渡されるため、
                // `@State` の反映タイミング揺らぎで「現在地」の詳細が表示されてしまうバグを回避できる。
                let block = SurvivalStageCatalog.block(forStage: stage.stageNumber, in: stage.mapCategory)
                    ?? SurvivalStageCatalog.blocks(in: stage.mapCategory).first
                let blockClearedCount = block?.stageNumbers.filter { clearedStages.contains($0) }.count ?? 0
                NavigationStack {
                    SurvivalDescentSidePanel(
                        locale: locale,
                        totalClearedCount: clearedStages.count,
                        totalStages: SurvivalStageCatalog.totalStages(in: stage.mapCategory),
                        activeBlock: block,
                        blockClearedCount: blockClearedCount,
                        selectedStage: stage,
                        selectedStageIsUnlocked: isStageUnlocked(stage.stageNumber),
                        selectedStageIsCleared: clearedStages.contains(stage.stageNumber),
                        hintMode: $hintMode,
                        playLocked: playLockedForUpsell && !freeStageNumbers.contains(stage.stageNumber),
                        onStart: {
                            startStage(stage)
                        },
                        onRequestUpgrade: {
                            mobileDetailStage = nil
                            showSubscription = true
                        }
                    )
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(hex: "050308").ignoresSafeArea())
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button(locale == .ja ? "閉じる" : "Close") {
                                mobileDetailStage = nil
                            }
                            .foregroundStyle(.purple)
                        }
                    }
                }
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
            }
            .sheet(isPresented: $showSurvivalInfo) {
                FeatureInfoModal(
                    icon: "flame.fill",
                    iconColor: .orange,
                    title: locale == .ja ? "サバイバル" : "Survival",
                    description: locale == .ja
                        ? "順番にステージをクリアしましょう。90秒間生き残れ、表示されているコードを演奏するとスキルが発動、ボス戦はボスの体力を0にすると勝利。"
                        : "Clear stages in order. Survive for 90 seconds—play the displayed chords to trigger skills. In boss fights, reduce the boss's HP to 0 to win.",
                    locale: locale
                )
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
            .fullScreenCover(item: $stageLaunchSession) { session in
                SurvivalGameView(
                    stage: session.stage,
                    hintMode: session.hintMode,
                    characterId: "fai",
                    locale: locale,
                    onClose: { stageLaunchSession = nil }
                )
            }
            .onChange(of: stageLaunchSession == nil) { isNil in
                if isNil {
                    Task { await loadProgress(showBlockingLoader: false, forceCatalogFetch: false) }
                    if !SurvivalMapAudio.shared.isMuted {
                        SurvivalMapAudio.shared.play()
                    }
                }
            }
        }
    }

    // MARK: - Layout

    @ViewBuilder
    private var content: some View {
        VStack(spacing: 8) {
            if let bannerKind = appState.paymentIssueBannerKind {
                PaymentIssueBannerView(kind: bannerKind, locale: locale)
                    .padding(.horizontal, 12)
                    .padding(.top, 8)
            }
            if playLockedForUpsell {
                upsellBanner
                    .padding(.horizontal, 12)
            }

            if useSplitLayout {
                HStack(spacing: 12) {
                    descentMap
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    SurvivalDescentSidePanel(
                        locale: locale,
                        totalClearedCount: clearedStages.count,
                        totalStages: SurvivalStageCatalog.totalStages(in: mapCategory),
                        activeBlock: panelBlock,
                        blockClearedCount: panelBlockClearedCount,
                        selectedStage: selectedStage,
                        selectedStageIsUnlocked: selectedStage.map { isStageUnlocked($0.stageNumber) } ?? false,
                        selectedStageIsCleared: selectedStage.map { clearedStages.contains($0.stageNumber) } ?? false,
                        hintMode: $hintMode,
                        playLocked: playLockedForUpsell && !(selectedStage.map { freeStageNumbers.contains($0.stageNumber) } ?? false),
                        onStart: {
                            if let stage = selectedStage { startStage(stage) }
                        },
                        onRequestUpgrade: { showSubscription = true }
                    )
                    .frame(width: 320)
                    .padding(.trailing, 12)
                    .padding(.vertical, 8)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                descentMap
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    // MARK: - Descent map

    private var descentMap: some View {
        ZStack(alignment: .bottom) {
            SurvivalDescentView(
                currentStageNumber: currentStageNumber,
                clearedStages: clearedStages,
                selectedStageNumber: $selectedStageNumber,
                freeStageNumbers: freeStageNumbers,
                playLockedForUpsell: playLockedForUpsell,
                mapCategory: mapCategory,
                onStageSelect: { stage in
                    handleDescentStageSelect(stage: stage)
                }
            )
            .environmentObject(appState)

            // マップ下部にフローティング固定 (マップスクロールに追尾しない)。
            // Web 版ではモバイル時の `compact` トグルと同じ位置・スタイルを採用する。
            SurvivalMapCategoryToggle(
                value: mapCategory,
                isEnglishCopy: locale == .en,
                onChange: { next in
                    handleSelectMapCategory(next)
                }
            )
            .padding(.bottom, 12)
            .allowsHitTesting(true)
        }
    }

    private func handleSelectMapCategory(_ next: SurvivalMapCategory) {
        guard next != mapCategory else { return }
        mapCategory = next
        selectedStageNumber = nil
        mobileDetailStage = nil
        if let cached = progressCacheByCategory[next] {
            currentStageNumber = cached.currentStageNumber
            clearedStages = cached.clearedStages
        }
        Task { await loadProgress(showBlockingLoader: false, forceCatalogFetch: false) }
    }

    private func handleDescentStageSelect(stage: SurvivalStageDefinition) {
        selectedStageNumber = stage.stageNumber
        hintMode = false
        if !useSplitLayout {
            mobileDetailStage = stage
        }
    }

    // MARK: - Shared pieces

    private var upsellBanner: some View {
        Button {
            showSubscription = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "lock.fill")
                    .foregroundStyle(.yellow)
                VStack(alignment: .leading, spacing: 2) {
                    Text(locale == .ja
                         ? "フリープランは Basic / Songs それぞれで第一階層（最初のブロック）まで遊べます"
                         : "Free plan: first tier (first block) on Basic & Songs maps")
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                    Text(locale == .ja
                         ? "プレミアムに登録するとすべての階層を解放できます →"
                         : "Subscribe to Premium to unlock all tiers →")
                        .font(.caption2)
                        .foregroundStyle(Color(hex: "fde68a"))
                }
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color.yellow.opacity(0.08))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.yellow.opacity(0.4), lineWidth: 1)
            )
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Logic

    private func isStageUnlocked(_ stageNumber: Int) -> Bool {
        if stageNumber == 1 { return true }
        return clearedStages.contains(stageNumber - 1)
    }

    private func startStage(_ stage: SurvivalStageDefinition) {
        let freeAllowed = freeStageNumbers.contains(stage.stageNumber)
        if playLockedForUpsell && !freeAllowed {
            mobileDetailStage = nil
            Task {
                let premium = await appState.ensureFreshBilling()
                if !premium {
                    showSubscription = true
                }
            }
            return
        }
        guard isStageUnlocked(stage.stageNumber) else { return }
        mobileDetailStage = nil
        SurvivalMapAudio.shared.stop()
        stageLaunchSession = StageLaunchSession(stage: stage, hintMode: hintMode)
    }

    private func loadProgress(showBlockingLoader: Bool = true, forceCatalogFetch: Bool = false) async {
        guard let userId = appState.profile?.id else {
            isLoading = false
            return
        }
        let category = mapCategory
        if showBlockingLoader {
            isLoading = true
        }
        defer {
            if showBlockingLoader {
                isLoading = false
            }
        }

        let catalogStale = forceCatalogFetch
            || survivalStagesFetchedAt == nil
            || Date().timeIntervalSince(survivalStagesFetchedAt!) > Self.survivalStagesCatalogTTL
        let needCatalogBecauseEmpty = SurvivalStageCatalog.totalStages(in: category) == 0

        if catalogStale || needCatalogBecauseEmpty {
            if let rows = try? await SupabaseService.shared.fetchSurvivalStages(), !rows.isEmpty {
                SurvivalStageCatalog.load(rows: rows)
                survivalStagesFetchedAt = Date()
            }
        }

        async let progressTask: SurvivalStageProgressRow? = {
            try? await SupabaseService.shared.fetchSurvivalStageProgress(userId: userId, mapCategory: category)
        }()
        async let clearsTask: [SurvivalStageClearRow] = {
            (try? await SupabaseService.shared.fetchSurvivalStageClears(userId: userId, mapCategory: category)) ?? []
        }()

        let progress = await progressTask
        let clears = await clearsTask

        let snapshot = SurvivalProgressSnapshot(
            currentStageNumber: progress?.currentStageNumber ?? 1,
            clearedStages: Set(clears.map { $0.stageNumber })
        )
        progressCacheByCategory[category] = snapshot

        guard category == mapCategory else { return }

        currentStageNumber = snapshot.currentStageNumber
        clearedStages = snapshot.clearedStages

        if selectedStageNumber == nil {
            if let frontierBlock = SurvivalStageCatalog.block(forStage: currentStageNumber, in: category) {
                selectedStageNumber = frontierBlock.stageNumbers.first { isStageUnlocked($0) && !clearedStages.contains($0) }
                    ?? frontierBlock.stageNumbers.first
            } else {
                selectedStageNumber = SurvivalStageCatalog.blocks(in: category).first?.stageNumbers.first
            }
        }
    }
}

// MARK: - Map category toggle (Basic / Songs)

/// 魔王城降下マップのカテゴリ切替トグル。
/// iOS 標準の Segmented Picker 風に大型化し、選択中のセグメントを濃い塗りで強調する。
private struct SurvivalMapCategoryToggle: View {
    let value: SurvivalMapCategory
    let isEnglishCopy: Bool
    let onChange: (SurvivalMapCategory) -> Void

    private let cornerRadius: CGFloat = 16
    private let innerPadding: CGFloat = 4

    var body: some View {
        HStack(spacing: 0) {
            ForEach(SurvivalMapCategory.allCases, id: \.self) { category in
                let selected = category == value
                Button(action: {
                    if selected { return }
                    withAnimation(.easeOut(duration: 0.15)) {
                        onChange(category)
                    }
                }) {
                    Text(label(for: category))
                        .font(.headline.weight(.bold))
                        .tracking(0.6)
                        .lineLimit(1)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .foregroundStyle(selected ? Color.black : Color(hex: "fde68a"))
                        .background(
                            RoundedRectangle(cornerRadius: cornerRadius - innerPadding, style: .continuous)
                                .fill(selected ? Color(hex: "f59e0b") : Color.clear)
                                .shadow(
                                    color: selected ? Color.black.opacity(0.35) : .clear,
                                    radius: selected ? 4 : 0,
                                    x: 0,
                                    y: selected ? 2 : 0
                                )
                        )
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected ? [.isSelected] : [])
                .accessibilityLabel(label(for: category))
            }
        }
        .padding(innerPadding)
        .frame(maxWidth: 360)
        .background(
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(Color.black.opacity(0.65))
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(Color(hex: "f59e0b").opacity(0.55), lineWidth: 1.5)
                )
                .shadow(color: Color.black.opacity(0.55), radius: 12, x: 0, y: 6)
        )
        .padding(.horizontal, 16)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(isEnglishCopy ? "Map category" : "マップ種別")
    }

    private func label(for category: SurvivalMapCategory) -> String {
        switch category {
        case .basic: return "Basic"
        case .songs: return "Songs"
        }
    }
}

// MARK: - fullScreenCover セッション（ステージ ID だけでは再マウントされない問題の回避）

private struct StageLaunchSession: Identifiable {
    let id = UUID()
    let stage: SurvivalStageDefinition
    let hintMode: Bool
}

private struct SurvivalProgressSnapshot {
    let currentStageNumber: Int
    let clearedStages: Set<Int>
}

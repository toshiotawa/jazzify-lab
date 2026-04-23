import SwiftUI
import UIKit

/// サバイバルタブ（魔王城降下）のネイティブ実装。
///
/// 仕様:
/// - iPhone: 画面全体を降下マップで覆う 1 カラム構成。ステージタップでボトムシート表示。
/// - iPad: 左マップ + 右サイドパネル (固定 320pt) の 2 カラム構成で、選択したステージ詳細
///   がサイドパネルに表示される。Web 版 (`SurvivalDescentMap.tsx`) と同一レイアウト。
/// - 無料プランは **第一階層全体 (Major 1〜5)** が遊べる。それ以外はステージをタップすると
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
    @State private var launchStage: SurvivalStageDefinition?
    @State private var launchHintMode: Bool = false
    @State private var showSubscription: Bool = false
    @State private var showMobileDetail: Bool = false
    @State private var showSurvivalInfo: Bool = false
    @State private var isSoundMuted: Bool = SurvivalMapAudio.shared.isMuted

    private let blocks: [SurvivalBlockMeta] = SurvivalStageCatalog.blocks
    private let freeStageNumbers: Set<Int> = SurvivalStageCatalog.freeTierStageNumbers

    private var locale: AppLocale { appState.locale }

    /// iPad のみ 2 カラムで表示 (iPhone Max 系は 1 カラム固定)
    private var useSplitLayout: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    /// 第一階層のクリア状況から「プレミアムがロックされている無料ユーザー」の表示フラグ。
    private var playLockedForUpsell: Bool { !appState.isPremium }

    private var selectedStage: SurvivalStageDefinition? {
        guard let stageNumber = selectedStageNumber else { return nil }
        return SurvivalStageCatalog.stage(byNumber: stageNumber)
    }

    private var selectedStageBlock: SurvivalBlockMeta? {
        guard let stage = selectedStage else { return nil }
        return SurvivalStageCatalog.block(forStage: stage.stageNumber)
    }

    /// サイドパネル用: 選択ステージが無ければ現ブロック、無ければ先頭ブロック。
    private var panelBlock: SurvivalBlockMeta? {
        let refStage = selectedStage?.stageNumber ?? max(1, min(SurvivalStageCatalog.totalStages, currentStageNumber))
        return SurvivalStageCatalog.block(forStage: refStage) ?? blocks.first
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
            .task { await loadProgress() }
            .onChange(of: appState.profile?.id) { _ in
                Task { await loadProgress() }
            }
            .onAppear {
                if !SurvivalMapAudio.shared.isMuted {
                    SurvivalMapAudio.shared.play()
                }
            }
            .onDisappear {
                SurvivalMapAudio.shared.stop()
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView()
            }
            .sheet(isPresented: $showMobileDetail) {
                if selectedStage != nil {
                    NavigationStack {
                        SurvivalDescentSidePanel(
                            locale: locale,
                            totalClearedCount: clearedStages.count,
                            totalStages: SurvivalStageCatalog.totalStages,
                            activeBlock: panelBlock,
                            blockClearedCount: panelBlockClearedCount,
                            selectedStage: selectedStage,
                            selectedStageIsUnlocked: selectedStage.map { isStageUnlocked($0.stageNumber) } ?? false,
                            selectedStageIsCleared: selectedStage.map { clearedStages.contains($0.stageNumber) } ?? false,
                            hintMode: $hintMode,
                            playLocked: playLockedForUpsell && !(selectedStage.map { freeStageNumbers.contains($0.stageNumber) } ?? false),
                            onStart: {
                                if let stage = selectedStage {
                                    startStage(stage)
                                }
                            },
                            onRequestUpgrade: {
                                showMobileDetail = false
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
                                    showMobileDetail = false
                                }
                                .foregroundStyle(.purple)
                            }
                        }
                    }
                    .presentationDetents([.large])
                    .presentationDragIndicator(.visible)
                }
            }
            .sheet(isPresented: $showSurvivalInfo) {
                FeatureInfoModal(
                    icon: "flame.fill",
                    iconColor: .orange,
                    title: locale == .ja ? "サバイバル" : "Survival",
                    description: locale == .ja
                        ? "コードの構成音を制限時間内に演奏するモードです。全\(SurvivalStageCatalog.totalStages)ステージあり、21 の階層（コードタイプ）に分かれ、各階層の最後はその階層のコードを総合する Mixed ステージです。ステージをクリアすると次が解放されます。ヒントモードを使うと構成音が表示されますが、クリア扱いにはなりません。"
                        : "Play chord tones within a time limit. There are \(SurvivalStageCatalog.totalStages) stages across 21 tiers (chord types). Each tier ends with a Mixed stage covering all chord types and all roots for that tier. Clear a stage to unlock the next. Hint mode shows chord tones but clears won't count as official.",
                    locale: locale
                )
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
            .fullScreenCover(item: $launchStage) { stage in
                SurvivalGameView(
                    stage: stage,
                    hintMode: launchHintMode,
                    characterId: "fai",
                    locale: locale,
                    onClose: { launchStage = nil }
                )
            }
            .onChange(of: launchStage == nil) { isNil in
                if isNil {
                    Task { await loadProgress() }
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
                        totalStages: SurvivalStageCatalog.totalStages,
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
        SurvivalDescentView(
            currentStageNumber: currentStageNumber,
            clearedStages: clearedStages,
            selectedStageNumber: $selectedStageNumber,
            freeStageNumbers: freeStageNumbers,
            playLockedForUpsell: playLockedForUpsell,
            onStageSelect: { stage in
                handleDescentStageSelect(stage: stage)
            }
        )
        .environmentObject(appState)
    }

    private func handleDescentStageSelect(stage: SurvivalStageDefinition) {
        selectedStageNumber = stage.stageNumber
        hintMode = false
        if !useSplitLayout {
            showMobileDetail = true
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
                         ? "フリープランは第一階層（Major 1〜5）まで遊べます"
                         : "Free plan lets you play through the first tier (Major 1–5)")
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
            showMobileDetail = false
            Task {
                let premium = await appState.ensureFreshBilling()
                if !premium {
                    showSubscription = true
                }
            }
            return
        }
        guard isStageUnlocked(stage.stageNumber) else { return }
        launchHintMode = hintMode
        showMobileDetail = false
        SurvivalMapAudio.shared.stop()
        launchStage = stage
    }

    private func loadProgress() async {
        guard let userId = appState.profile?.id else {
            isLoading = false
            return
        }
        isLoading = true
        defer { isLoading = false }

        async let progressTask: SurvivalStageProgressRow? = {
            try? await SupabaseService.shared.fetchSurvivalStageProgress(userId: userId)
        }()
        async let clearsTask: [SurvivalStageClearRow] = {
            (try? await SupabaseService.shared.fetchSurvivalStageClears(userId: userId)) ?? []
        }()

        let progress = await progressTask
        let clears = await clearsTask

        currentStageNumber = progress?.currentStageNumber ?? 1
        clearedStages = Set(clears.map { $0.stageNumber })

        if selectedStageNumber == nil {
            if let frontierBlock = SurvivalStageCatalog.block(forStage: currentStageNumber) {
                selectedStageNumber = frontierBlock.stageNumbers.first { isStageUnlocked($0) && !clearedStages.contains($0) }
                    ?? frontierBlock.stageNumbers.first
            } else {
                selectedStageNumber = blocks.first?.stageNumbers.first
            }
        }
    }
}

// MARK: - Identifiable helper for fullScreenCover

extension SurvivalStageDefinition {
    // `Identifiable` は既に `id: Int` を持つため `fullScreenCover(item:)` で直接利用できる
}

import SwiftUI

/// サバイバルタブ（魔王城降下）のネイティブ実装。
///
/// 仕様:
/// - iPhone (compact): 1 カラムの階層リスト。ステージタップで詳細モーダル (sheet)
/// - iPad (regular): 2 カラム（左 階層リスト / 右 階層内ステージ一覧 + ステージ詳細）
/// - 無料プランは **第一階層全体 (Major 1〜5)** が遊べる。それ以外はステージをタップすると
///   `SubscriptionView` に誘導する。
/// - ステージはクリア状況によりアンロック。1 ステージ目は常時解放、
///   それ以外は「前のステージがクリア済み」で解放。
/// - ステージ起動時は既存の `GameWebView(.survivalStage(...))` を `fullScreenCover` で表示する。
///   ゲームクリア後は Supabase の `survival_stage_clears` / `survival_stage_progress` が
///   更新されるため、閉じたタイミングで再読み込みする。
struct SurvivalView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

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

    private let blocks: [SurvivalBlockMeta] = SurvivalStageCatalog.blocks
    private let freeStageNumbers: Set<Int> = SurvivalStageCatalog.freeTierStageNumbers

    private var locale: AppLocale { appState.locale }

    private var isRegular: Bool { horizontalSizeClass == .regular }

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
                    Button { showSurvivalInfo = true } label: {
                        Image(systemName: "info.circle")
                            .foregroundStyle(.gray)
                    }
                }
            }
            .task { await loadProgress() }
            .onChange(of: appState.profile?.id) { _ in
                Task { await loadProgress() }
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView()
            }
            .sheet(isPresented: $showMobileDetail) {
                if let stage = selectedStage, let block = selectedStageBlock {
                    stageDetailSheet(stage: stage, block: block)
                        .presentationDetents([.medium, .large])
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
                GameWebView(
                    mode: .survivalStage(
                        stageNumber: stage.stageNumber,
                        characterId: "fai",
                        hintMode: launchHintMode
                    ),
                    locale: locale,
                    onClose: { launchStage = nil }
                )
            }
            .onChange(of: launchStage == nil) { isNil in
                if isNil {
                    Task { await loadProgress() }
                }
            }
        }
    }

    // MARK: - Layout

    @ViewBuilder
    private var content: some View {
        if isRegular {
            iPadLayout
        } else {
            iPhoneLayout
        }
    }

    private var iPadLayout: some View {
        HStack(spacing: 0) {
            descentMap
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            Divider()
                .background(Color.white.opacity(0.05))

            VStack(alignment: .leading, spacing: 12) {
                if let bannerKind = appState.paymentIssueBannerKind {
                    PaymentIssueBannerView(kind: bannerKind, locale: locale)
                }
                if playLockedForUpsell {
                    upsellBanner
                }

                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        if let stage = selectedStage, let block = selectedStageBlock {
                            stageDetailPanel(stage: stage, block: block)
                        } else {
                            emptyStageDetail
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .padding(12)
            .frame(width: 360)
            .background(Color(hex: "0b1220"))
        }
    }

    private var iPhoneLayout: some View {
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
            descentMap
                .frame(maxWidth: .infinity, maxHeight: .infinity)
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
        if isRegular {
            return
        }
        showMobileDetail = true
    }

    // MARK: - Detail panel & sheet

    private var emptyStageDetail: some View {
        Text(locale == .ja ? "ステージをタップすると詳細が表示されます。" : "Tap a stage to see details.")
            .font(.caption)
            .foregroundStyle(.gray)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(Color(hex: "1e293b"))
            .cornerRadius(12)
    }

    private func stageDetailPanel(stage: SurvivalStageDefinition, block: SurvivalBlockMeta) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(stage.localizedName(locale))
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                    Spacer()
                    if clearedStages.contains(stage.stageNumber) {
                        Text(locale == .ja ? "クリア済" : "Cleared")
                            .font(.caption.bold())
                            .foregroundStyle(.green)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color.green.opacity(0.2))
                            .cornerRadius(999)
                    }
                }
                HStack(spacing: 8) {
                    difficultyBadge(stage.difficulty)
                    Text(stage.localizedRootPattern(locale))
                        .font(.caption)
                        .foregroundStyle(.gray)
                    Spacer()
                }
            }

            stageChordPreview(stage: stage)

            hintToggle(stage: stage)

            startControls(stage: stage)
        }
        .padding(18)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    private func stageDetailSheet(stage: SurvivalStageDefinition, block: SurvivalBlockMeta) -> some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(blockTitle(block))
                            .font(.caption.bold())
                            .foregroundStyle(.purple)
                        Text(stage.localizedName(locale))
                            .font(.title3.bold())
                            .foregroundStyle(.white)
                    }
                    HStack(spacing: 8) {
                        difficultyBadge(stage.difficulty)
                        Text(stage.localizedRootPattern(locale))
                            .font(.caption)
                            .foregroundStyle(.gray)
                        Spacer()
                        if clearedStages.contains(stage.stageNumber) {
                            Text(locale == .ja ? "クリア済" : "Cleared")
                                .font(.caption.bold())
                                .foregroundStyle(.green)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Color.green.opacity(0.2))
                                .cornerRadius(999)
                        }
                    }

                    stageChordPreview(stage: stage)

                    hintToggle(stage: stage)

                    startControls(stage: stage)
                }
                .padding(20)
            }
            .background(Color(hex: "0f172a").ignoresSafeArea())
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
    }

    private func stageChordPreview(stage: SurvivalStageDefinition) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(locale == .ja ? "出題されるコード" : "Chords")
                .font(.caption.bold())
                .foregroundStyle(.gray)

            let preview = stage.allowedChords.prefix(16)
            FlowLayoutChips(items: Array(preview))

            if stage.allowedChords.count > preview.count {
                Text(locale == .ja
                     ? "ほか \(stage.allowedChords.count - preview.count) 種"
                     : "+\(stage.allowedChords.count - preview.count) more")
                    .font(.caption2)
                    .foregroundStyle(.gray)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "0f172a").opacity(0.6))
        .cornerRadius(10)
    }

    private func hintToggle(stage: SurvivalStageDefinition) -> some View {
        Toggle(isOn: $hintMode) {
            VStack(alignment: .leading, spacing: 2) {
                Text(locale == .ja ? "ヒントモード" : "Hint mode")
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                Text(locale == .ja
                     ? "構成音を表示する代わりにクリア記録は付きません。"
                     : "Show chord tones, but clears won't be recorded.")
                    .font(.caption2)
                    .foregroundStyle(.gray)
            }
        }
        .tint(.purple)
        .padding(12)
        .background(Color(hex: "0f172a").opacity(0.6))
        .cornerRadius(10)
    }

    private func startControls(stage: SurvivalStageDefinition) -> some View {
        let stageUnlocked = isStageUnlocked(stage.stageNumber)
        let freeAllowed = freeStageNumbers.contains(stage.stageNumber)
        let requiresPremium = playLockedForUpsell && !freeAllowed

        return VStack(spacing: 10) {
            if requiresPremium {
                Button {
                    showMobileDetail = false
                    showSubscription = true
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "crown.fill")
                        Text(locale == .ja ? "プレミアムに登録してプレイ" : "Subscribe to Premium to play")
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        LinearGradient(
                            colors: [.purple, .pink],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
                }
                .buttonStyle(.plain)
                Text(locale == .ja
                     ? "第一階層（Major 1〜5）は無料プランでも遊べます。"
                     : "Major 1–5 (first tier) is playable on the Free plan.")
                    .font(.caption2)
                    .foregroundStyle(.gray)
                    .frame(maxWidth: .infinity, alignment: .center)
            } else if !stageUnlocked {
                Text(locale == .ja
                     ? "前のステージをクリアすると解放されます。"
                     : "Clear the previous stage to unlock.")
                    .font(.caption)
                    .foregroundStyle(.orange)
                    .frame(maxWidth: .infinity, alignment: .center)
            } else {
                Button {
                    startStage(stage)
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "play.fill")
                        Text(locale == .ja ? "スタート" : "Start")
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.purple)
                    .cornerRadius(12)
                }
                .buttonStyle(.plain)
            }
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

    private func difficultyBadge(_ difficulty: SurvivalDifficulty) -> some View {
        let color: Color = {
            switch difficulty {
            case .easy: return .green
            case .normal: return .blue
            case .hard: return .orange
            case .extreme: return .red
            }
        }()
        return Text(difficulty.displayName(locale))
            .font(.caption2.bold())
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(color.opacity(0.18))
            .cornerRadius(999)
    }

    private func blockTitle(_ block: SurvivalBlockMeta) -> String {
        let index = block.blockIndex + 1
        return locale == .ja
            ? "階層 \(index) ・ \(block.localizedLabel(locale))"
            : "Tier \(index) · \(block.localizedLabel(locale))"
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

// MARK: - Chip flow layout

/// コード候補を折り返し表示するためのシンプルなフローコンテナ。
private struct FlowLayoutChips: View {
    let items: [String]

    var body: some View {
        FlowLayout(spacing: 6) {
            ForEach(items, id: \.self) { chord in
                Text(chord)
                    .font(.caption2.monospaced())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.purple.opacity(0.2))
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color.purple.opacity(0.35), lineWidth: 1)
                    )
                    .cornerRadius(6)
            }
        }
    }
}

private struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var totalHeight: CGFloat = 0
        var currentLineWidth: CGFloat = 0
        var currentLineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentLineWidth + size.width > maxWidth {
                totalHeight += currentLineHeight + spacing
                currentLineWidth = size.width + spacing
                currentLineHeight = size.height
            } else {
                currentLineWidth += size.width + spacing
                currentLineHeight = max(currentLineHeight, size.height)
            }
        }
        totalHeight += currentLineHeight
        return CGSize(width: proposal.width ?? currentLineWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x: CGFloat = bounds.minX
        var y: CGFloat = bounds.minY
        var lineHeight: CGFloat = 0
        let maxX = bounds.maxX

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxX {
                x = bounds.minX
                y += lineHeight + spacing
                lineHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }
    }
}

// MARK: - Identifiable helper for fullScreenCover

extension SurvivalStageDefinition {
    // `Identifiable` は既に `id: Int` を持つため `fullScreenCover(item:)` で直接利用できる
}

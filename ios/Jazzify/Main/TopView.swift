import SwiftUI

struct TopView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var playerXpHub = PlayerLevelHub.shared
    @ObservedObject private var badgeStore = AchievementBadgeStore.shared
    @State private var announcements: [AnnouncementRow] = []
    @State private var userStats: UserStats?

    @State private var mainQuestProgress: SupabaseService.MainQuestProgressResult?
    @State private var mainQuestLessonToOpen: Lesson?
    @State private var autoStartFirstQuestRequirement = false
    @State private var showSubscription = false
    @State private var subscriptionEntry: SubscriptionEntry = .default
    @State private var showMainQuestResumeSheet = false
    @State private var resumeNextLesson: Lesson?
    @State private var resumePremiumUpsell = false
    @State private var pendingResumeAfterUpdateNotice = false
    @State private var pendingSubscriptionAfterResume = false

    private var locale: AppLocale { appState.locale }
    private var profile: Profile? { appState.profile }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        if let bannerKind = appState.paymentIssueBannerKind {
                            PaymentIssueBannerView(kind: bannerKind, locale: locale)
                        }
                        MarketingOptInBannerView()
                        mainQuestCard
                        profileCard
                        if !appState.isPremium {
                            Button {
                                subscriptionEntry = .dashboard
                                showSubscription = true
                            } label: {
                                membershipBanner
                            }
                        }
                        statsCard
                        announcementCard
                        achievementCard
                    }
                    .padding()
                }
            }
            .navigationTitle("Jazzify")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .task { await loadData() }
            .refreshable { await loadData() }
            .onChange(of: locale) { _ in
                Task { await fetchDashboardAnnouncements() }
            }
            .navigationDestination(
                isPresented: Binding(
                    get: { mainQuestLessonToOpen != nil },
                    set: { if !$0 { mainQuestLessonToOpen = nil } }
                )
            ) {
                Group {
                    if let lesson = mainQuestLessonToOpen {
                        if appState.isPremium || (lesson.blockNumber ?? 1) <= MainQuestFreeTier.maxFreeBlockNumber {
                            LessonDetailView(
                                lesson: lesson,
                                autoStartFirstRequirement: autoStartFirstQuestRequirement
                            )
                        } else {
                            Color.clear
                                .frame(width: 0, height: 0)
                                .task {
                                    await MainActor.run {
                                        mainQuestLessonToOpen = nil
                                        subscriptionEntry = .dashboard
                                        showSubscription = true
                                    }
                                }
                        }
                    }
                }
            }
            .onChange(of: mainQuestLessonToOpen == nil) { isNil in
                if isNil {
                    autoStartFirstQuestRequirement = false
                    Task { await loadData() }
                }
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView(entry: subscriptionEntry)
            }
            .sheet(isPresented: $showMainQuestResumeSheet, onDismiss: {
                MainQuestResumePreferences.markShown()
                if pendingSubscriptionAfterResume {
                    pendingSubscriptionAfterResume = false
                    subscriptionEntry = .resumeModal
                    showSubscription = true
                }
            }) {
                MainQuestResumeSheet(
                    locale: locale,
                    premiumUpsell: resumePremiumUpsell,
                    onContinue: {
                        MainQuestResumePreferences.markShown()
                        showMainQuestResumeSheet = false
                        autoStartFirstQuestRequirement = true
                        if let lesson = resumeNextLesson {
                            mainQuestLessonToOpen = lesson
                        }
                    },
                    onPremium: {
                        MainQuestResumePreferences.markShown()
                        pendingSubscriptionAfterResume = true
                        showMainQuestResumeSheet = false
                    },
                    onLater: {
                        MainQuestResumePreferences.markShown()
                        showMainQuestResumeSheet = false
                    }
                )
            }
            .onChange(of: appState.appUpdateNotice) { notice in
                guard notice == nil, pendingResumeAfterUpdateNotice else { return }
                pendingResumeAfterUpdateNotice = false
                showMainQuestResumeSheet = true
            }
            .onChange(of: appState.isAppUpdateCheckComplete) { complete in
                guard complete, pendingResumeAfterUpdateNotice, appState.appUpdateNotice == nil else { return }
                pendingResumeAfterUpdateNotice = false
                showMainQuestResumeSheet = true
            }
        }
    }

    // MARK: - Profile

    private var dashboardDefaultAvatar: some View {
        Image("default-avater")
            .resizable()
            .scaledToFit()
            .frame(width: 56, height: 56)
            .clipShape(Circle())
    }

    private var profileCard: some View {
        VStack(spacing: 12) {
            HStack {
                if let avatarUrl = profile?.avatarUrl,
                   let url = URL(string: avatarUrl) {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        dashboardDefaultAvatar
                    }
                    .frame(width: 56, height: 56)
                    .clipShape(Circle())
                } else {
                    dashboardDefaultAvatar
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(locale == .ja ? "おかえりなさい" : "Welcome back")
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                    Text(profile?.nickname ?? "Player")
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                }
                Spacer()
            }

            if profile != nil {
                HStack {
                    Text(appState.displayPlanLabel)
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(appState.displayPlanUsesPremiumAccent ? Color.purple.opacity(0.3) : Color.gray.opacity(0.3))
                        .foregroundStyle(appState.displayPlanUsesPremiumAccent ? .purple : .gray)
                        .cornerRadius(12)
                    Spacer()
                }
            }

            if let snap = playerXpHub.snapshot {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(locale == .ja ? "レベル" : "Level")
                            .font(.caption.bold())
                            .foregroundStyle(.gray)
                        Spacer()
                        Text("Lv.\(snap.level)")
                            .font(.subheadline.bold())
                            .foregroundStyle(.cyan)
                    }
                    ProgressView(
                        value: {
                            let cap = max(snap.nextLevelXp, 1)
                            return Double(min(snap.inLevelXp, cap))
                        }(),
                        total: Double(max(snap.nextLevelXp, 1))
                    )
                        .progressViewStyle(.linear)
                        .tint(.cyan)
                    Text(
                        {
                            let cap = max(snap.nextLevelXp, 1)
                            let rem = max(cap - snap.inLevelXp, 0)
                            return locale == .ja
                                ? "次のレベルまで あと \(rem) EXP（\(snap.inLevelXp)/\(cap)）"
                                : "\(rem) EXP to next (\(snap.inLevelXp)/\(cap))"
                        }()
                    )
                        .font(.caption2)
                        .foregroundStyle(.gray)
                }
                .padding(.top, 4)
            }
        }
        .padding(20)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    // MARK: - Membership Banner

    private var membershipBanner: some View {
        VStack(spacing: 8) {
            Text(locale == .ja
                 ? "プレミアムプランで全機能をアンロック"
                 : "Unlock all features with Premium")
                .font(.subheadline.bold())
                .foregroundStyle(.white)

            Text(locale == .ja
                 ? "全クエスト・全ステージ・全機能が使い放題"
                 : "Access all quests, stages, and features")
                .font(.caption)
                .foregroundStyle(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(
            LinearGradient(
                colors: [Color.purple.opacity(0.3), Color.pink.opacity(0.3)],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.purple.opacity(0.5), lineWidth: 1)
        )
    }

    // MARK: - Main Quest

    @ViewBuilder
    private var mainQuestCard: some View {
        if let progress = mainQuestProgress, progress.totalLessons > 0 {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Image(systemName: "star.fill")
                        .foregroundStyle(.cyan)
                    Text(locale == .ja ? "メインクエスト" : "Main Quest")
                        .font(.headline)
                        .foregroundStyle(.white)
                }

                mainQuestProgressRow(
                    completed: progress.completedLessons,
                    total: progress.totalLessons
                )

                Group {
                    if progress.completedLessons >= progress.totalLessons {
                        Text(locale == .ja
                             ? "メインクエストをすべて完了しました！"
                             : "Main Quest complete!")
                            .font(.subheadline)
                            .foregroundStyle(.green)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else if let nextLesson = mainQuestPlayableNextLesson(progress: progress) {
                        VStack(alignment: .leading, spacing: 6) {
                            mainQuestNextLessonPrompt(nextLesson: nextLesson)
                                .font(.subheadline)
                                .lineLimit(2)

                            Button {
                                autoStartFirstQuestRequirement = true
                                mainQuestLessonToOpen = nextLesson
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "play.fill")
                                        .font(.caption2)
                                    Text(locale == .ja ? "クエストを始める" : "Start Quest")
                                        .font(.subheadline.bold())
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(.cyan.opacity(0.8))
                                .cornerRadius(20)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    } else if !appState.isPremium,
                              progress.completedLessons < progress.totalLessons,
                              let gatedNext = progress.nextLesson,
                              (gatedNext.blockNumber ?? 1) > MainQuestFreeTier.maxFreeBlockNumber {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(locale == .ja
                                 ? "メインクエスト第2チャプター以降はプレミアムでプレイできます。"
                                 : "Main Quest chapters 2+ require Premium.")
                                .font(.subheadline)
                                .foregroundStyle(.orange)
                                .frame(maxWidth: .infinity, alignment: .leading)

                            Button {
                                subscriptionEntry = .dashboard
                                showSubscription = true
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "lock.fill")
                                        .font(.caption2)
                                    Text(locale == .ja ? "プレミアムを見る" : "View Premium")
                                        .font(.subheadline.bold())
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.purple.opacity(0.85))
                                .cornerRadius(20)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            .padding(16)
            .background(Color(hex: "1e293b"))
            .cornerRadius(12)
        }
    }

    private func mainQuestPlayableNextLesson(progress: SupabaseService.MainQuestProgressResult) -> Lesson? {
        guard let raw = progress.nextLesson else { return nil }
        if appState.isPremium { return raw }
        let bn = raw.blockNumber ?? 1
        return bn <= MainQuestFreeTier.maxFreeBlockNumber ? raw : nil
    }

    private func mainQuestProgressPercent(completed: Int, total: Int) -> Int {
        guard total > 0 else { return 0 }
        return Int((Double(completed) / Double(total) * 100).rounded())
    }

    private func mainQuestProgressRow(completed: Int, total: Int) -> some View {
        let percent = mainQuestProgressPercent(completed: completed, total: total)
        return HStack(spacing: 8) {
            mainQuestProgressBar(fraction: Double(percent) / 100.0)
            Text("\(percent)%")
                .font(.caption)
                .fontWeight(.semibold)
                .monospacedDigit()
                .foregroundStyle(Color(hex: "67e8f9"))
        }
    }

    private func mainQuestProgressBar(fraction: Double) -> some View {
        GeometryReader { geometry in
            let clamped = min(max(fraction, 0), 1)
            ZStack(alignment: .leading) {
                Capsule().fill(Color.black.opacity(0.48))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "22d3ee"), Color(hex: "0891b2")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * clamped)
            }
        }
        .frame(height: 5)
    }

    @ViewBuilder
    private func mainQuestNextLessonPrompt(nextLesson: Lesson) -> some View {
        let title = nextLesson.localizedTitle(locale)
        let quotedTitle = locale == .ja ? "「\(title)」" : "\"\(title)\""
        if locale == .ja {
            (
                Text(quotedTitle)
                    .foregroundColor(Color(hex: "fcd34d"))
                    .fontWeight(.semibold)
                + Text("を完了しましょう")
                    .foregroundColor(Color(white: 0.82))
            )
        } else {
            (
                Text("Complete ")
                    .foregroundColor(Color(white: 0.82))
                + Text(quotedTitle)
                    .foregroundColor(Color(hex: "fcd34d"))
                    .fontWeight(.semibold)
            )
        }
    }

    // MARK: - Stats

    private var statsCard: some View {
        Group {
            if let stats = userStats {
                VStack(alignment: .leading, spacing: 12) {
                    Text(locale == .ja ? "統計" : "Stats")
                        .font(.headline)
                        .foregroundStyle(.white)

                    HStack(spacing: 16) {
                        StatItem(
                            icon: "checkmark.circle.fill",
                            value: "\(stats.lessonCompletedCount)",
                            label: locale == .ja ? "クエストクリア" : "Quests cleared",
                            color: .green
                        )
                        StatItem(
                            icon: "flame.fill",
                            value: "\(stats.survivalClearCount)",
                            label: locale == .ja ? "サバイバルクリア" : "Survival cleared",
                            color: .orange
                        )
                    }
                }
                .padding(16)
                .background(Color(hex: "1e293b"))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Announcements

    private var announcementCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "bell.fill")
                    .foregroundStyle(.yellow)
                Text(locale == .ja ? "お知らせ" : "Announcements")
                    .font(.headline)
                    .foregroundStyle(.white)
            }

            if let latest = announcements.first {
                let bodyMarkdown = latest.localizedContent(locale)
                let previewText = AnnouncementMarkdownParsing.plainPreview(from: bodyMarkdown)
                NavigationLink(destination: AnnouncementDetailView(announcement: latest)) {
                    HStack(alignment: .top, spacing: 8) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(latest.localizedTitle(locale))
                                .font(.subheadline.bold())
                                .foregroundStyle(.white)
                                .multilineTextAlignment(.leading)
                            if let thumbURL = AnnouncementMarkdownParsing.firstImageURL(in: bodyMarkdown) {
                                AnnouncementDashboardThumbnail(url: thumbURL)
                            }
                            if !previewText.isEmpty {
                                Text(previewText)
                                    .font(.caption)
                                    .foregroundStyle(.gray)
                                    .lineLimit(3)
                                    .multilineTextAlignment(.leading)
                            }
                            Text(latest.createdAt.formatted(date: .abbreviated, time: .omitted))
                                .font(.caption2)
                                .foregroundStyle(.gray.opacity(0.6))
                        }
                        Spacer(minLength: 4)
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.gray.opacity(0.7))
                            .padding(.top, 2)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(hex: "334155"))
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .accessibilityHint(locale == .ja ? "タップして全文を表示" : "Tap to read full announcement")
            } else {
                Text(locale == .ja ? "お知らせはありません" : "No announcements")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Color(hex: "334155"))
                    .cornerRadius(8)
            }

            NavigationLink(destination: AnnouncementListView()) {
                HStack {
                    Text(locale == .ja ? "一覧で見る" : "View all")
                        .font(.subheadline)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                }
                .foregroundStyle(.blue)
            }
        }
        .padding(16)
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }

    private var achievementCard: some View {
        NavigationLink(destination: AchievementListView()) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Color(hex: "451a03").opacity(0.55))
                    Image(systemName: "medal.fill")
                        .font(.title2)
                        .foregroundStyle(Color(hex: "fbbf24"))
                }
                .frame(width: 52, height: 52)

                VStack(alignment: .leading, spacing: 5) {
                    Text(locale == .ja ? "取得称号" : "Earned Titles")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Text(locale == .ja
                         ? "\(AchievementBadgeCatalog.totalCount)個中 \(badgeStore.earnedCount)個 獲得"
                         : "\(badgeStore.earnedCount)/\(AchievementBadgeCatalog.totalCount) titles earned")
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
            .padding(16)
            .background(Color(hex: "1e293b"))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Data Loading

    private func fetchDashboardAnnouncements() async {
        let currentLocale = locale
        do {
            announcements = try await SupabaseService.shared.fetchActiveAnnouncements(locale: currentLocale)
        } catch {
            announcements = []
        }
    }

    private func loadData() async {
        await fetchDashboardAnnouncements()

        guard let userId = profile?.id else {
            userStats = nil
            badgeStore.clear()
            mainQuestProgress = nil
            return
        }

        async let statsTask: UserStats? = {
            do {
                return try await SupabaseService.shared.fetchUserStats(userId: userId)
            } catch {
                return nil
            }
        }()

        async let mainQuestTask: SupabaseService.MainQuestProgressResult? = {
            do {
                return try await SupabaseService.shared.fetchMainQuestProgress(userId: userId)
            } catch {
                return nil
            }
        }()

        async let badgeTask: Void = {
            await badgeStore.refresh(userId: userId, forceSync: false, usesEnglishUi: locale == .en)
        }()

        let (loadedStats, loadedMainQuestProgress, _) = await (statsTask, mainQuestTask, badgeTask)
        userStats = loadedStats
        mainQuestProgress = loadedMainQuestProgress
        await playerXpHub.refreshFromServer()

        if appState.pendingMainQuestAutoStart {
            appState.pendingMainQuestAutoStart = false
            if let progress = loadedMainQuestProgress,
               let nextLesson = mainQuestPlayableNextLesson(progress: progress) {
                if nextLesson.orderIndex == 0, let userId = appState.profile?.id {
                    AnalyticsTracker.trackTutorialBegin(userId: userId, tutorialName: "first_quest")
                }
                autoStartFirstQuestRequirement = true
                mainQuestLessonToOpen = nextLesson
            }
        } else if let progress = loadedMainQuestProgress,
                  let rawNext = progress.nextLesson,
                  let lastPlayedAt = progress.lastPlayedAt,
                  MainQuestResumePreferences.shouldShowResumeSheet(lastPlayedAt: lastPlayedAt) {
            let playable = MainQuestFreeTier.isBlockPlayable(
                isPremium: appState.isPremium,
                blockNumber: rawNext.blockNumber ?? 1
            )
            let shouldShowResume = playable || !appState.isPremium
            if shouldShowResume {
                await MainActor.run {
                    resumeNextLesson = rawNext
                    resumePremiumUpsell = !playable && !appState.isPremium
                    if !appState.isAppUpdateCheckComplete || appState.appUpdateNotice != nil {
                        pendingResumeAfterUpdateNotice = true
                    } else {
                        showMainQuestResumeSheet = true
                    }
                }
            }
        }
    }
}

// MARK: - Subviews

struct StatItem: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(.white)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(hex: "0f172a").opacity(0.5))
        .cornerRadius(8)
    }
}

struct AchievementBadgeCategory: Identifiable, Equatable {
    let id: String
    let labelJa: String
    let labelEn: String
}

struct AchievementBadgeDefinition: Identifiable, Equatable {
    let id: String
    let categoryId: String
    let rank: Int
    let nameJa: String
    let nameEn: String
    let conditionJa: String
    let conditionEn: String
    let imageFileName: String

    func localizedName(_ locale: AppLocale) -> String {
        locale == .ja ? nameJa : nameEn
    }

    func localizedCondition(_ locale: AppLocale) -> String {
        locale == .ja ? conditionJa : conditionEn
    }
}

enum AchievementBadgeCatalog {
    static let categories: [AchievementBadgeCategory] = [
        AchievementBadgeCategory(id: "survival_basic", labelJa: "Basicクリアステージ数", labelEn: "Basic stage clears"),
        AchievementBadgeCategory(id: "survival_songs", labelJa: "Songsクリアステージ数", labelEn: "Songs stage clears"),
        AchievementBadgeCategory(id: "survival_phrases", labelJa: "Phrasesクリアステージ数", labelEn: "Phrases stage clears"),
        AchievementBadgeCategory(id: "player_level", labelJa: "到達レベル", labelEn: "Player level reached"),
        AchievementBadgeCategory(id: "quest_clear", labelJa: "クエストクリア数", labelEn: "Quest clears")
    ]

    static let definitions: [AchievementBadgeDefinition] = [
        AchievementBadgeDefinition(id: "survival_basic_1", categoryId: "survival_basic", rank: 1, nameJa: "基礎の第一歩", nameEn: "Basic Starter", conditionJa: "サバイバル Basic のステージ1を初回クリア", conditionEn: "Clear Survival Basic stage 1 for the first time", imageFileName: "achievement_monster_02"),
        AchievementBadgeDefinition(id: "survival_basic_50", categoryId: "survival_basic", rank: 2, nameJa: "基礎固め", nameEn: "Basic Builder", conditionJa: "サバイバル Basic のステージ50を初回クリア", conditionEn: "Clear Survival Basic stage 50 for the first time", imageFileName: "achievement_monster_09"),
        AchievementBadgeDefinition(id: "survival_basic_100", categoryId: "survival_basic", rank: 3, nameJa: "基礎の達人", nameEn: "Basic Master", conditionJa: "サバイバル Basic のステージ100を初回クリア", conditionEn: "Clear Survival Basic stage 100 for the first time", imageFileName: "achievement_monster_11"),
        AchievementBadgeDefinition(id: "survival_songs_1", categoryId: "survival_songs", rank: 1, nameJa: "曲に挑む者", nameEn: "Song Challenger", conditionJa: "サバイバル Songs のステージ1を初回クリア", conditionEn: "Clear Survival Songs stage 1 for the first time", imageFileName: "achievement_monster_13"),
        AchievementBadgeDefinition(id: "survival_songs_50", categoryId: "survival_songs", rank: 2, nameJa: "曲を渡る者", nameEn: "Song Voyager", conditionJa: "サバイバル Songs のステージ50を初回クリア", conditionEn: "Clear Survival Songs stage 50 for the first time", imageFileName: "achievement_monster_19"),
        AchievementBadgeDefinition(id: "survival_songs_100", categoryId: "survival_songs", rank: 3, nameJa: "曲を制する者", nameEn: "Song Conqueror", conditionJa: "サバイバル Songs のステージ100を初回クリア", conditionEn: "Clear Survival Songs stage 100 for the first time", imageFileName: "achievement_monster_22"),
        AchievementBadgeDefinition(id: "survival_phrases_1", categoryId: "survival_phrases", rank: 1, nameJa: "フレーズ見習い", nameEn: "Phrase Apprentice", conditionJa: "サバイバル Phrases のステージ1を初回クリア", conditionEn: "Clear Survival Phrases stage 1 for the first time", imageFileName: "achievement_monster_33"),
        AchievementBadgeDefinition(id: "survival_phrases_50", categoryId: "survival_phrases", rank: 2, nameJa: "フレーズ使い", nameEn: "Phrase Handler", conditionJa: "サバイバル Phrases のステージ50を初回クリア", conditionEn: "Clear Survival Phrases stage 50 for the first time", imageFileName: "achievement_monster_35"),
        AchievementBadgeDefinition(id: "survival_phrases_100", categoryId: "survival_phrases", rank: 3, nameJa: "フレーズマスター", nameEn: "Phrase Master", conditionJa: "サバイバル Phrases のステージ100を初回クリア", conditionEn: "Clear Survival Phrases stage 100 for the first time", imageFileName: "achievement_monster_45"),
        AchievementBadgeDefinition(id: "player_level_2", categoryId: "player_level", rank: 1, nameJa: "駆け出しプレイヤー", nameEn: "Rising Player", conditionJa: "プレイヤーレベル2に到達", conditionEn: "Reach player level 2", imageFileName: "achievement_monster_47"),
        AchievementBadgeDefinition(id: "player_level_50", categoryId: "player_level", rank: 2, nameJa: "実力派プレイヤー", nameEn: "Skilled Player", conditionJa: "プレイヤーレベル50に到達", conditionEn: "Reach player level 50", imageFileName: "achievement_monster_49"),
        AchievementBadgeDefinition(id: "player_level_100", categoryId: "player_level", rank: 3, nameJa: "熟練プレイヤー", nameEn: "Veteran Player", conditionJa: "プレイヤーレベル100に到達", conditionEn: "Reach player level 100", imageFileName: "achievement_monster_51"),
        AchievementBadgeDefinition(id: "quest_clear_1", categoryId: "quest_clear", rank: 1, nameJa: "クエスト見習い", nameEn: "Quest Rookie", conditionJa: "クエストを1個完了", conditionEn: "Complete 1 quest", imageFileName: "achievement_monster_53"),
        AchievementBadgeDefinition(id: "quest_clear_50", categoryId: "quest_clear", rank: 2, nameJa: "クエスト冒険者", nameEn: "Quest Adventurer", conditionJa: "クエストを50個完了", conditionEn: "Complete 50 quests", imageFileName: "achievement_monster_55"),
        AchievementBadgeDefinition(id: "quest_clear_100", categoryId: "quest_clear", rank: 3, nameJa: "クエスト制覇者", nameEn: "Quest Champion", conditionJa: "クエストを100個完了", conditionEn: "Complete 100 quests", imageFileName: "achievement_monster_59")
    ]

    static var totalCount: Int { definitions.count }

    static func definition(id: String) -> AchievementBadgeDefinition? {
        definitions.first { $0.id == id }
    }

    static func definitionsForCategory(_ categoryId: String) -> [AchievementBadgeDefinition] {
        definitions.filter { $0.categoryId == categoryId }
    }
}

struct AchievementListView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var badgeStore = AchievementBadgeStore.shared
    @State private var selectedBadge: AchievementBadgeDefinition?
    @State private var medalImagesReady = false

    private var locale: AppLocale { appState.locale }

    var body: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(locale == .ja ? "称号一覧" : "Titles")
                                .font(.title2.bold())
                                .foregroundStyle(.white)
                            Text(locale == .ja
                                 ? "\(AchievementBadgeCatalog.totalCount)個中 \(badgeStore.earnedCount)個 獲得"
                                 : "\(badgeStore.earnedCount)/\(AchievementBadgeCatalog.totalCount) earned")
                                .font(.subheadline)
                                .foregroundStyle(.gray)
                        }
                        Spacer()
                    }

                    LazyVStack(spacing: 14) {
                        ForEach(AchievementBadgeCatalog.categories) { category in
                            achievementCategorySection(category)
                        }
                    }
                    .id(medalImagesReady)
                }
                .padding()
            }
        }
        .navigationTitle(locale == .ja ? "称号" : "Titles")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task {
            await loadBadges(forceSync: false)
            await Task.detached {
                await AchievementBadgeAssets.preloadAll(displaySize: AchievementBadgeAssets.listDisplaySize)
            }.value
            medalImagesReady = true
        }
        .refreshable { await loadBadges(forceSync: true) }
        .onAppear {
            LessonMapAudio.shared.stop()
            SurvivalMapAudio.shared.stop()
        }
        .sheet(item: $selectedBadge) { badge in
            AchievementBadgeDetailSheet(
                badge: badge,
                earnedBadge: badgeStore.earnedById[badge.id],
                locale: locale,
                hasLoadedFromServer: badgeStore.hasLoadedFromServer
            )
        }
    }

    private func achievementCategorySection(_ category: AchievementBadgeCategory) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "medal.fill")
                    .foregroundStyle(Color(hex: "fbbf24"))
                Text(locale == .ja ? category.labelJa : category.labelEn)
                    .font(.headline)
                    .foregroundStyle(.white)
            }

            VStack(spacing: 10) {
                ForEach(AchievementBadgeCatalog.definitionsForCategory(category.id)) { badge in
                    achievementBadgeRow(badge)
                }
            }
        }
        .padding(16)
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }

    private func achievementBadgeRow(_ badge: AchievementBadgeDefinition) -> some View {
        let earnedBadge = badgeStore.earnedById[badge.id]
        let earned = earnedBadge != nil
        let statusKnown = badgeStore.hasLoadedFromServer
        return Button {
            if earned {
                QuestJinglePlayer.playPreComplete()
            }
            selectedBadge = badge
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    achievementMedalImage(
                        badge: badge,
                        earned: statusKnown ? earned : true,
                        size: AchievementBadgeAssets.listDisplaySize
                    )
                    if statusKnown && !earned {
                        Circle()
                            .fill(Color.black.opacity(0.35))
                        Image(systemName: "lock.fill")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }
                .frame(width: 64, height: 64)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Rank \(badge.rank)")
                        .font(.caption2.bold())
                        .foregroundStyle(Color(hex: "fde68a"))
                    Text(badge.localizedName(locale))
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.leading)
                    if statusKnown {
                        Text(earned ? (locale == .ja ? "獲得済み" : "Earned") : (locale == .ja ? "未獲得" : "Locked"))
                            .font(.caption)
                            .foregroundStyle(.gray)
                    } else {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(hex: "334155"))
                            .frame(width: 56, height: 12)
                    }
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(hex: "0f172a").opacity(0.55))
            .cornerRadius(10)
        }
        .buttonStyle(.plain)
    }

    private func achievementMedalImage(
        badge: AchievementBadgeDefinition,
        earned: Bool,
        size: CGFloat
    ) -> some View {
        Group {
            if let uiImage = AchievementBadgeAssets.cachedImage(
                fileName: badge.imageFileName,
                displaySize: size
            ) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFit()
            } else {
                Circle()
                    .fill(Color(hex: "334155"))
                    .overlay {
                        Image(systemName: "medal.fill")
                            .foregroundStyle(Color(hex: "94a3b8"))
                    }
            }
        }
        .frame(width: size, height: size)
        .saturation(earned ? 1 : 0)
        .opacity(earned ? 1 : 0.35)
    }

    private func loadBadges(forceSync: Bool) async {
        guard let userId = appState.profile?.id else {
            badgeStore.clear()
            return
        }
        await badgeStore.refresh(
            userId: userId,
            forceSync: forceSync,
            usesEnglishUi: locale == .en
        )
    }
}

private struct AchievementBadgeDetailSheet: View {
    let badge: AchievementBadgeDefinition
    let earnedBadge: SupabaseService.UserBadgeRow?
    let locale: AppLocale
    let hasLoadedFromServer: Bool

    var body: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            VStack(spacing: 18) {
                Text(locale == .ja ? "称号詳細" : "Title Detail")
                    .font(.headline)
                    .foregroundStyle(Color(hex: "fde68a"))

                Group {
                    if let uiImage = AchievementBadgeAssets.cachedImage(
                        fileName: badge.imageFileName,
                        displaySize: AchievementBadgeAssets.detailDisplaySize
                    ) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFit()
                    } else {
                        Circle()
                            .fill(Color(hex: "334155"))
                            .overlay {
                                Image(systemName: "medal.fill")
                                    .font(.largeTitle)
                                    .foregroundStyle(Color(hex: "94a3b8"))
                            }
                    }
                }
                .frame(width: AchievementBadgeAssets.detailDisplaySize, height: AchievementBadgeAssets.detailDisplaySize)
                .saturation(earnedBadge == nil && hasLoadedFromServer ? 0 : 1)
                .opacity(earnedBadge == nil && hasLoadedFromServer ? 0.35 : 1)

                VStack(spacing: 6) {
                    Text(badge.localizedName(locale))
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                    Text("Rank \(badge.rank)")
                        .font(.caption.bold())
                        .foregroundStyle(.gray)
                }

                VStack(alignment: .leading, spacing: 12) {
                    detailRow(
                        title: locale == .ja ? "獲得条件" : "Condition",
                        body: badge.localizedCondition(locale)
                    )
                    detailRow(
                        title: locale == .ja ? "獲得日" : "Earned date",
                        body: earnedBadge.map { formattedDate($0.earnedAt) }
                            ?? (hasLoadedFromServer
                                ? (locale == .ja ? "未獲得" : "Not earned yet")
                                : (locale == .ja ? "読み込み中…" : "Loading…"))
                    )
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Spacer(minLength: 0)
            }
            .padding(24)
        }
        .presentationDetents([.medium])
    }

    private func detailRow(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption.bold())
                .foregroundStyle(.gray)
            Text(body)
                .font(.subheadline)
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "1e293b"))
        .cornerRadius(10)
    }

    private func formattedDate(_ raw: String) -> String {
        let parserWithFraction = ISO8601DateFormatter()
        parserWithFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let parser = ISO8601DateFormatter()
        let date = parserWithFraction.date(from: raw) ?? parser.date(from: raw)
        guard let date else {
            return locale == .ja ? "不明" : "Unknown"
        }
        return date.formatted(date: .abbreviated, time: .omitted)
    }
}

import SwiftUI

struct TopView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var playerXpHub = PlayerLevelHub.shared
    @State private var announcements: [AnnouncementRow] = []
    @State private var userStats: UserStats?

    @State private var mainQuestProgress: SupabaseService.MainQuestProgressResult?
    @State private var mainQuestLessonToOpen: Lesson?
    @State private var showSubscription = false

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
                        mainQuestCard
                        profileCard
                        if !appState.isPremium {
                            Button { showSubscription = true } label: {
                                membershipBanner
                            }
                        }
                        statsCard
                        announcementCard
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
                            LessonDetailView(lesson: lesson)
                        } else {
                            Color.clear
                                .frame(width: 0, height: 0)
                                .task {
                                    await MainActor.run {
                                        mainQuestLessonToOpen = nil
                                        showSubscription = true
                                    }
                                }
                        }
                    }
                }
            }
            .onChange(of: mainQuestLessonToOpen == nil) { isNil in
                if isNil {
                    Task { await loadData() }
                }
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView()
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

                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .stroke(Color(hex: "334155"), lineWidth: 5)
                            .frame(width: 56, height: 56)
                        Circle()
                            .trim(
                                from: 0,
                                to: progress.totalLessons > 0
                                    ? CGFloat(progress.completedLessons) / CGFloat(progress.totalLessons)
                                    : 0
                            )
                            .stroke(
                                progress.completedLessons >= progress.totalLessons ? Color.green : Color.cyan,
                                style: StrokeStyle(lineWidth: 5, lineCap: .round)
                            )
                            .frame(width: 56, height: 56)
                            .rotationEffect(.degrees(-90))
                        Text("\(progress.completedLessons)/\(progress.totalLessons)")
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                    }

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
                                Text(locale == .ja
                                     ? "クエスト\(nextLesson.orderIndex + 1)：\(nextLesson.localizedTitle(locale))"
                                     : "Quest \(nextLesson.orderIndex + 1): \(nextLesson.localizedTitle(locale))")
                                    .font(.subheadline)
                                    .foregroundStyle(.cyan)
                                    .lineLimit(2)

                                Button {
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

                    Spacer()
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

        let (loadedStats, loadedMainQuestProgress) = await (statsTask, mainQuestTask)
        userStats = loadedStats
        mainQuestProgress = loadedMainQuestProgress
        await playerXpHub.refreshFromServer()
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

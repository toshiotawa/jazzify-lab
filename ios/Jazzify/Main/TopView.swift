import SwiftUI

struct TopView: View {
    @EnvironmentObject var appState: AppState
    @State private var announcements: [AnnouncementRow] = []
    @State private var userStats: UserStats?
    @State private var isLoading = true

    @State private var selectedDifficulty = "beginner"
    @State private var weeklyRecords: [DailyChallengeRecordRow] = []
    @State private var isDCLoading = false
    @State private var showDailyChallenge = false

    private var locale: AppLocale { appState.locale }
    private var profile: Profile? { appState.profile }

    private static let difficulties: [(key: String, ja: String, en: String)] = [
        ("super_beginner", "超初級", "Super Beginner"),
        ("beginner", "初級", "Beginner"),
        ("intermediate", "中級", "Intermediate"),
        ("advanced", "上級", "Advanced"),
        ("super_advanced", "超上級", "Super Advanced"),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        profileCard
                        if !appState.isPremium {
                            membershipBanner
                        }
                        statsCard
                        dailyChallengeCard
                        announcementCard
                    }
                    .padding()
                }
            }
            .navigationTitle("Jazzify")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task { await loadData() }
            .refreshable { await loadData() }
            .fullScreenCover(isPresented: $showDailyChallenge) {
                GameWebView(
                    mode: .dailyChallenge(difficulty: selectedDifficulty),
                    locale: locale,
                    onClose: { showDailyChallenge = false }
                )
            }
            .onChange(of: showDailyChallenge) { isPresented in
                if !isPresented {
                    Task { await loadData() }
                }
            }
        }
    }

    // MARK: - Profile

    private var profileCard: some View {
        VStack(spacing: 12) {
            HStack {
                if let avatarUrl = profile?.avatarUrl,
                   let url = URL(string: avatarUrl) {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        Circle().fill(Color(hex: "374151"))
                    }
                    .frame(width: 56, height: 56)
                    .clipShape(Circle())
                } else {
                    Circle()
                        .fill(Color(hex: "374151"))
                        .frame(width: 56, height: 56)
                        .overlay(
                            Image(systemName: "person.fill")
                                .foregroundStyle(.gray)
                        )
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

            if let profile {
                HStack {
                    Text(profile.rank.label(locale: locale))
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(profile.rank.isPremium ? Color.purple.opacity(0.3) : Color.gray.opacity(0.3))
                        .foregroundStyle(profile.rank.isPremium ? .purple : .gray)
                        .cornerRadius(12)
                    Spacer()
                }
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
                 ? "全レッスン・全ステージ・全機能が使い放題"
                 : "Access all lessons, stages, and features")
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
                            label: locale == .ja ? "レッスンクリア" : "Lessons cleared",
                            color: .green
                        )
                        StatItem(
                            icon: "calendar.badge.checkmark",
                            value: "\(stats.dailyChallengeParticipationDays)",
                            label: locale == .ja ? "チャレンジ日数" : "Challenge days",
                            color: .blue
                        )
                    }
                }
                .padding(16)
                .background(Color(hex: "1e293b"))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Daily Challenge

    private var dailyChallengeCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image(systemName: "flame.circle.fill")
                    .foregroundStyle(.orange)
                Text(locale == .ja ? "デイリーチャレンジ" : "Daily Challenge")
                    .font(.headline)
                    .foregroundStyle(.white)
            }

            difficultyPicker

            weeklyBarChart

            playButton
        }
        .padding(16)
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }

    private var difficultyPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Self.difficulties, id: \.key) { diff in
                    let isSelected = selectedDifficulty == diff.key
                    Button {
                        selectedDifficulty = diff.key
                        Task { await loadDailyChallengeRecords() }
                    } label: {
                        Text(locale == .ja ? diff.ja : diff.en)
                            .font(.caption)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(isSelected ? Color.orange.opacity(0.3) : Color(hex: "334155"))
                            .foregroundStyle(isSelected ? .orange : .gray)
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(isSelected ? Color.orange.opacity(0.6) : Color.clear, lineWidth: 1)
                            )
                    }
                }
            }
        }
    }

    private var weeklyBarChart: some View {
        let days = weekDayLabels()
        let scores = weekDayScores(days: days)
        let maxScore = max(scores.max() ?? 1, 1)

        return VStack(spacing: 4) {
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(0..<7, id: \.self) { index in
                    let score = scores[index]
                    let height = score > 0 ? CGFloat(score) / CGFloat(maxScore) * 80 : 0

                    VStack(spacing: 4) {
                        if score > 0 {
                            Text("\(score)")
                                .font(.system(size: 8))
                                .foregroundStyle(.orange)
                        }

                        RoundedRectangle(cornerRadius: 3)
                            .fill(score > 0 ? Color.orange : Color(hex: "334155"))
                            .frame(height: max(height, 4))

                        Text(days[index].label)
                            .font(.system(size: 9))
                            .foregroundStyle(.gray)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 110)
        }
        .padding(.vertical, 4)
    }

    private var playButton: some View {
        let alreadyPlayed = hasPlayedToday()

        return Button {
            showDailyChallenge = true
        } label: {
            HStack {
                Image(systemName: alreadyPlayed ? "checkmark.circle" : "play.fill")
                Text(alreadyPlayed
                     ? (locale == .ja ? "本日プレイ済み" : "Already played today")
                     : (locale == .ja ? "プレイする" : "Play"))
                    .font(.subheadline.bold())
            }
            .frame(maxWidth: .infinity)
            .frame(height: 40)
        }
        .buttonStyle(.borderedProminent)
        .tint(alreadyPlayed ? .gray : .orange)
        .disabled(alreadyPlayed)
    }

    // MARK: - Chart Helpers

    private struct DayLabel: Equatable {
        let dateString: String
        let label: String
    }

    private func weekDayLabels() -> [DayLabel] {
        let cal = Calendar.current
        let today = Date()
        let weekdayJa = ["日", "月", "火", "水", "木", "金", "土"]
        let weekdayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        return (0..<7).reversed().map { offset -> DayLabel in
            let date = cal.date(byAdding: .day, value: -offset, to: today)!
            let wd = cal.component(.weekday, from: date) - 1
            let label = locale == .ja ? weekdayJa[wd] : weekdayEn[wd]
            return DayLabel(dateString: formatter.string(from: date), label: label)
        }
    }

    private func weekDayScores(days: [DayLabel]) -> [Int] {
        let scoreMap = Dictionary(grouping: weeklyRecords, by: \.playedOn)
            .mapValues { rows in rows.map(\.score).max() ?? 0 }
        return days.map { scoreMap[$0.dateString] ?? 0 }
    }

    private func hasPlayedToday() -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())
        return weeklyRecords.contains(where: { $0.playedOn == today })
    }

    // MARK: - Announcements

    private var announcementCard: some View {
        Group {
            if !announcements.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "bell.fill")
                            .foregroundStyle(.yellow)
                        Text(locale == .ja ? "お知らせ" : "Announcements")
                            .font(.headline)
                            .foregroundStyle(.white)
                    }

                    if let latest = announcements.first {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(latest.localizedTitle(locale))
                                .font(.subheadline.bold())
                                .foregroundStyle(.white)
                            Text(latest.localizedContent(locale))
                                .font(.caption)
                                .foregroundStyle(.gray)
                                .lineLimit(3)
                            Text(latest.createdAt.formatted(date: .abbreviated, time: .omitted))
                                .font(.caption2)
                                .foregroundStyle(.gray.opacity(0.6))
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
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
        }
    }

    // MARK: - Data Loading

    private func loadData() async {
        isLoading = true
        defer { isLoading = false }

        guard let userId = profile?.id else { return }

        async let announcementsTask: () = {
            do {
                self.announcements = try await SupabaseService.shared.fetchActiveAnnouncements(locale: locale)
            } catch {
                self.announcements = []
            }
        }()

        async let statsTask: () = {
            do {
                self.userStats = try await SupabaseService.shared.fetchUserStats(userId: userId)
            } catch {
                self.userStats = nil
            }
        }()

        async let dcTask: () = loadDailyChallengeRecords()

        _ = await (announcementsTask, statsTask, dcTask)
    }

    private func loadDailyChallengeRecords() async {
        guard let userId = profile?.id else { return }

        isDCLoading = true
        defer { isDCLoading = false }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let since = formatter.string(from: Calendar.current.date(byAdding: .day, value: -6, to: Date())!)

        do {
            weeklyRecords = try await SupabaseService.shared.fetchDailyChallengeRecords(
                userId: userId,
                difficulty: selectedDifficulty,
                since: since
            )
        } catch {
            weeklyRecords = []
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

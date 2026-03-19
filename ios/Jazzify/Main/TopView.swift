import SwiftUI

struct TopView: View {
    @EnvironmentObject var appState: AppState
    @State private var announcements: [AnnouncementRow] = []
    @State private var userStats: UserStats?
    @State private var isLoading = true

    @State private var selectedDifficulty = "beginner"
    @State private var dcRecords: [DailyChallengeRecordRow] = []
    @State private var isDCLoading = false
    @State private var showDailyChallenge = false
    @State private var dcPeriod: DCPeriod = .week
    @State private var weekChoice: WeekChoice = .thisWeek
    @State private var selectedYearMonth: String?

    private enum DCPeriod { case week, month }
    private enum WeekChoice { case thisWeek, lastWeek }

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
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackgroundVisibility(.visible, for: .navigationBar)
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
                            icon: "flame.fill",
                            value: "\(stats.survivalClearCount)",
                            label: locale == .ja ? "サバイバルクリア" : "Survival cleared",
                            color: .orange
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
                Spacer()
                playButton
            }

            HStack(spacing: 8) {
                dcPeriodPicker
                Spacer()
                difficultyPicker
            }

            dcSubControls

            dcBarChart

            dcPlayedStatus
        }
        .padding(16)
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }

    private var dcPeriodPicker: some View {
        HStack(spacing: 0) {
            dcPeriodButton(locale == .ja ? "週" : "Week", period: .week)
            dcPeriodButton(locale == .ja ? "月" : "Month", period: .month)
        }
        .cornerRadius(6)
    }

    private func dcPeriodButton(_ title: String, period: DCPeriod) -> some View {
        Button {
            dcPeriod = period
        } label: {
            Text(title)
                .font(.caption.bold())
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(dcPeriod == period ? Color.orange.opacity(0.3) : Color(hex: "334155"))
                .foregroundStyle(dcPeriod == period ? .orange : .gray)
        }
    }

    private var difficultyPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(Self.difficulties, id: \.key) { diff in
                    let isSelected = selectedDifficulty == diff.key
                    Button {
                        selectedDifficulty = diff.key
                        Task { await loadDailyChallengeRecords() }
                    } label: {
                        Text(locale == .ja ? diff.ja : diff.en)
                            .font(.system(size: 10))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 4)
                            .background(isSelected ? Color.orange.opacity(0.3) : Color(hex: "334155"))
                            .foregroundStyle(isSelected ? .orange : .gray)
                            .cornerRadius(6)
                    }
                }
            }
        }
    }

    private var dcSubControls: some View {
        HStack {
            if dcPeriod == .week {
                Menu {
                    Button(locale == .ja ? "今週" : "This Week") { weekChoice = .thisWeek }
                    Button(locale == .ja ? "先週" : "Last Week") { weekChoice = .lastWeek }
                } label: {
                    HStack(spacing: 4) {
                        Text(weekChoice == .thisWeek
                             ? (locale == .ja ? "今週" : "This Week")
                             : (locale == .ja ? "先週" : "Last Week"))
                            .font(.caption)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 8))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(hex: "334155"))
                    .foregroundStyle(.white)
                    .cornerRadius(6)
                }
            } else {
                Menu {
                    ForEach(monthsWithRecords.reversed(), id: \.self) { ym in
                        Button(formatYearMonth(ym)) {
                            selectedYearMonth = ym
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(selectedYearMonth.map { formatYearMonth($0) } ?? "—")
                            .font(.caption)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 8))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(hex: "334155"))
                    .foregroundStyle(.white)
                    .cornerRadius(6)
                }
            }
            Spacer()
        }
    }

    private var dcBarChart: some View {
        let data = chartData()
        let maxScore = max(data.map(\.score).max() ?? 1, 1)

        return Group {
            if dcPeriod == .month {
                ScrollView(.horizontal, showsIndicators: false) {
                    barChartContent(data: data, maxScore: maxScore)
                        .frame(minWidth: CGFloat(data.count) * 16)
                }
            } else {
                barChartContent(data: data, maxScore: maxScore)
            }
        }
    }

    private func barChartContent(data: [(label: String, score: Int)], maxScore: Int) -> some View {
        HStack(alignment: .bottom, spacing: dcPeriod == .month ? 2 : 6) {
            ForEach(Array(data.enumerated()), id: \.offset) { _, item in
                let height = item.score > 0 ? CGFloat(item.score) / CGFloat(maxScore) * 80 : 0

                VStack(spacing: 2) {
                    if item.score > 0 {
                        Text("\(item.score)")
                            .font(.system(size: dcPeriod == .month ? 6 : 8))
                            .foregroundStyle(.orange)
                    }

                    RoundedRectangle(cornerRadius: 2)
                        .fill(item.score > 0 ? Color.orange : Color(hex: "334155"))
                        .frame(height: max(height, 3))

                    Text(item.label)
                        .font(.system(size: dcPeriod == .month ? 6 : 9))
                        .foregroundStyle(.gray)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .frame(height: 110)
        .padding(.vertical, 4)
    }

    private var playButton: some View {
        let alreadyPlayed = hasPlayedToday()

        return Button {
            showDailyChallenge = true
        } label: {
            Text(locale == .ja ? "プレイ" : "Play")
                .font(.caption.bold())
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
        }
        .buttonStyle(.borderedProminent)
        .tint(alreadyPlayed ? .gray : .orange)
        .disabled(alreadyPlayed)
    }

    private var dcPlayedStatus: some View {
        let alreadyPlayed = hasPlayedToday()
        return HStack {
            Spacer()
            Text(alreadyPlayed
                 ? (locale == .ja ? "本日はプレイ済み" : "Already played today")
                 : (locale == .ja ? "本日は未プレイ" : "Not played today"))
                .font(.caption2)
                .foregroundStyle(alreadyPlayed ? .green : .gray)
        }
    }

    // MARK: - Chart Helpers

    private var scoreByDate: [String: Int] {
        var map: [String: Int] = [:]
        for r in dcRecords {
            if let existing = map[r.playedOn] {
                map[r.playedOn] = max(existing, r.score)
            } else {
                map[r.playedOn] = r.score
            }
        }
        return map
    }

    private var monthsWithRecords: [String] {
        let months = Set(dcRecords.map { String($0.playedOn.prefix(7)) })
        return months.sorted()
    }

    private func formatYearMonth(_ ym: String) -> String {
        let parts = ym.split(separator: "-")
        guard parts.count == 2, let m = Int(parts[1]) else { return ym }
        if locale == .ja {
            return "\(parts[0])年\(m)月"
        }
        let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        let idx = m - 1
        return idx >= 0 && idx < 12 ? "\(monthNames[idx]) \(parts[0])" : ym
    }

    private func chartData() -> [(label: String, score: Int)] {
        let scores = scoreByDate
        if dcPeriod == .week {
            return weekChartData(scores: scores)
        } else {
            return monthChartData(scores: scores)
        }
    }

    private func weekChartData(scores: [String: Int]) -> [(label: String, score: Int)] {
        let cal = Calendar.current
        let today = Date()
        let dayOfWeek = (cal.component(.weekday, from: today) + 5) % 7 // Mon=0 ... Sun=6
        let monday = cal.date(byAdding: .day, value: -dayOfWeek, to: today)!
        let baseMonday = weekChoice == .thisWeek ? monday : cal.date(byAdding: .day, value: -7, to: monday)!
        let dayLabelsJa = ["月", "火", "水", "木", "金", "土", "日"]
        let dayLabelsEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        let labels = locale == .ja ? dayLabelsJa : dayLabelsEn
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        return (0..<7).map { offset in
            let date = cal.date(byAdding: .day, value: offset, to: baseMonday)!
            let dateStr = formatter.string(from: date)
            return (label: labels[offset], score: scores[dateStr] ?? 0)
        }
    }

    private func monthChartData(scores: [String: Int]) -> [(label: String, score: Int)] {
        guard let ym = effectiveYearMonth else { return [] }
        let parts = ym.split(separator: "-")
        guard parts.count == 2, let y = Int(parts[0]), let m = Int(parts[1]) else { return [] }
        var comps = DateComponents()
        comps.year = y
        comps.month = m + 1
        comps.day = 0
        let daysInMonth = Calendar.current.date(from: comps).map { Calendar.current.component(.day, from: $0) } ?? 30

        return (1...daysInMonth).map { day in
            let dateStr = String(format: "%04d-%02d-%02d", y, m, day)
            return (label: "\(day)", score: scores[dateStr] ?? 0)
        }
    }

    private var effectiveYearMonth: String? {
        if let sel = selectedYearMonth, monthsWithRecords.contains(sel) {
            return sel
        }
        return monthsWithRecords.last
    }

    private func hasPlayedToday() -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())
        return dcRecords.contains(where: { $0.playedOn == today })
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
        let since = formatter.string(from: Calendar.current.date(byAdding: .day, value: -365, to: Date())!)

        do {
            dcRecords = try await SupabaseService.shared.fetchDailyChallengeRecords(
                userId: userId,
                difficulty: selectedDifficulty,
                since: since
            )
            if selectedYearMonth == nil, let latest = monthsWithRecords.last {
                selectedYearMonth = latest
            }
        } catch {
            dcRecords = []
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

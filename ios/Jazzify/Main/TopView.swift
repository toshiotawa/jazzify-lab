import SwiftUI

struct TopView: View {
    @EnvironmentObject var appState: AppState

    private var locale: AppLocale { appState.locale }
    private var profile: Profile? { appState.profile }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        profileCard
                        membershipBanner
                        quickActions
                    }
                    .padding()
                }
            }
            .navigationTitle("Jazzify")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }

    private var profileCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(locale == .ja ? "おかえりなさい" : "Welcome back")
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                    Text(profile?.nickname ?? "Player")
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Lv. \(profile?.level ?? 1)")
                        .font(.headline)
                        .foregroundStyle(.purple)
                    Text("\(profile?.xp ?? 0) XP")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
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

    private var membershipBanner: some View {
        Group {
            if !appState.isPremium {
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
        }
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(locale == .ja ? "クイックアクション" : "Quick Actions")
                .font(.headline)
                .foregroundStyle(.white)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickActionCard(
                    icon: "book.fill",
                    title: locale == .ja ? "レッスン" : "Lessons",
                    color: .blue
                )

                QuickActionCard(
                    icon: "gamecontroller.fill",
                    title: locale == .ja ? "ファンタジー" : "Fantasy",
                    color: .purple
                )

                QuickActionCard(
                    icon: "music.note",
                    title: locale == .ja ? "練習" : "Practice",
                    color: .green
                )

                QuickActionCard(
                    icon: "chart.bar.fill",
                    title: locale == .ja ? "統計" : "Stats",
                    color: .orange
                )
            }
        }
    }
}

struct QuickActionCard: View {
    let icon: String
    let title: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 80)
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }
}

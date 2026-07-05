import SwiftUI

struct MainQuestResumeSheet: View {
    let locale: AppLocale
    let previousQuestTitle: String
    let nextQuestTitle: String
    let onContinue: () -> Void
    let onLater: () -> Void

    private var isJapanese: Bool { locale == .ja }

    var body: some View {
        VStack(spacing: 20) {
            Text(isJapanese ? "続きから始めますか？" : "Pick up where you left off?")
                .font(.title3.bold())
                .multilineTextAlignment(.center)
            Text(
                isJapanese
                    ? "前回は「\(previousQuestTitle)」をクリアしました。次は「\(nextQuestTitle)」です。"
                    : "You cleared \"\(previousQuestTitle)\". Next is \"\(nextQuestTitle)\"."
            )
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
            VStack(spacing: 12) {
                Button(
                    isJapanese ? "続きから再開" : "Resume",
                    action: onContinue
                )
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .frame(maxWidth: .infinity)
                Button(isJapanese ? "あとで" : "Later", action: onLater)
                    .buttonStyle(.bordered)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(24)
        .presentationDetents([.medium])
    }
}

enum MainQuestResumePreferences {
    private static let lastShownDayKey = "mainQuestResumeSheetLastShownDay"
    private static let resumeThresholdSeconds: TimeInterval = 3 * 60 * 60

    private static func dayKey(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar.current
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Calendar.current.startOfDay(for: date))
    }

    static func shouldShowResumeSheet(lastPlayedAt: Date) -> Bool {
        let isFirstLaunchToday = UserDefaults.standard.string(forKey: lastShownDayKey) != dayKey(for: Date())
        let hoursSincePlay = Date().timeIntervalSince(lastPlayedAt) >= resumeThresholdSeconds
        return isFirstLaunchToday || hoursSincePlay
    }

    static func markShownToday() {
        UserDefaults.standard.set(dayKey(for: Date()), forKey: lastShownDayKey)
    }
}

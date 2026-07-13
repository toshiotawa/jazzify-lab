import SwiftUI

struct MainQuestResumeSheet: View {
    let locale: AppLocale
    let onContinue: () -> Void
    let onLater: () -> Void

    private var isJapanese: Bool { locale == .ja }

    var body: some View {
        VStack(spacing: 20) {
            Text(isJapanese ? "メインクエストを再開しますか？" : "Resume Main Quest?")
                .font(.title3.bold())
                .foregroundStyle(.white)
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
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .presentationDetents([.medium])
        .presentationBackground(Color(hex: "0f172a"))
        .preferredColorScheme(.dark)
    }
}

enum MainQuestResumePreferences {
    private static let lastShownAtKey = "mainQuestResumeSheetLastShownAt"
    private static let resumeThresholdSeconds: TimeInterval = 3 * 60 * 60

    static func shouldShowResumeSheet(lastPlayedAt: Date) -> Bool {
        let now = Date()
        guard now.timeIntervalSince(lastPlayedAt) >= resumeThresholdSeconds else {
            return false
        }
        let lastShownAt = UserDefaults.standard.object(forKey: lastShownAtKey) as? TimeInterval
        guard let lastShownAt else {
            return true
        }
        return now.timeIntervalSince(Date(timeIntervalSince1970: lastShownAt)) >= resumeThresholdSeconds
    }

    static func markShown() {
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: lastShownAtKey)
    }
}

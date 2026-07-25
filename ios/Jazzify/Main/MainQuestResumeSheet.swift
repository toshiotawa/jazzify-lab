import SwiftUI

struct MainQuestResumeSheet: View {
    let locale: AppLocale
    let premiumUpsell: Bool
    let onContinue: () -> Void
    let onPremium: () -> Void
    let onLater: () -> Void

    private var isJapanese: Bool { locale == .ja }

    var body: some View {
        VStack(spacing: 20) {
            Text(isJapanese
                 ? (premiumUpsell ? "プレミアムでメインクエストを続ける" : "メインクエストを再開しますか？")
                 : (premiumUpsell ? "Continue Main Quest with Premium" : "Resume Main Quest?"))
                .font(.title3.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)

            if premiumUpsell {
                Text(isJapanese
                     ? "第1チャプターをクリアしました。第2チャプター以降はプレミアムでプレイできます。"
                     : "You cleared Chapter 1. Unlock Premium to play Chapter 2 and beyond.")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.75))
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 12) {
                if premiumUpsell {
                    Button(isJapanese ? "プレミアムを見る" : "See Premium plans", action: onPremium)
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        .frame(maxWidth: .infinity)
                } else {
                    Button(
                        isJapanese ? "続きから再開" : "Resume",
                        action: onContinue
                    )
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity)
                }
                Button(isJapanese ? "あとで" : "Later", action: onLater)
                    .buttonStyle(.bordered)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .presentationDetents([.medium])
        .jazzifyPresentationBackground(Color(hex: "0f172a"))
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

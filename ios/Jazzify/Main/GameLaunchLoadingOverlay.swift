import SwiftUI

/// ゲーム開始ボタン〜ゲーム画面表示までの待ち時間用オーバーレイ。
struct GameLaunchLoadingOverlay: View {
    let locale: AppLocale
    var tint: Color = .yellow
    var message: String?
    var backgroundOpacity: Double = 1.0

    private var displayMessage: String {
        if let message { return message }
        return locale == .ja ? "読み込み中…" : "Loading…"
    }

    var body: some View {
        ZStack {
            Color.black.opacity(backgroundOpacity).ignoresSafeArea()
            VStack(spacing: 12) {
                ProgressView()
                    .tint(tint)
                Text(displayMessage)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.8))
            }
        }
        .allowsHitTesting(true)
    }
}

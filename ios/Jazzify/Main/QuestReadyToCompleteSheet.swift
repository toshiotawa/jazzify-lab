import SwiftUI

struct QuestReadyToCompleteSheet: View {
    let locale: AppLocale
    let onComplete: () -> Void
    let onLater: () -> Void

    private var isJapanese: Bool { locale == .ja }

    private var heading: String {
        isJapanese ? "クエスト完了です！" : "Quest ready to complete!"
    }

    private var bodyText: String {
        isJapanese
            ? "全ての課題が完了しました、クエスト完了です！"
            : "All practice tasks are complete. Ready to finish this quest!"
    }

    var body: some View {
        VStack(spacing: 20) {
            Text("🎉")
                .font(.system(size: 44))
            Text(heading)
                .font(.title3.bold())
                .multilineTextAlignment(.center)
            Text(bodyText)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            VStack(spacing: 12) {
                Button(isJapanese ? "完了" : "Complete", action: onComplete)
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

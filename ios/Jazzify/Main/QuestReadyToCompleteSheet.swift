import SwiftUI

struct QuestReadyToCompleteSheet: View {
    let locale: AppLocale
    let hasOptionalRemaining: Bool
    let optionalTaskTitle: String?
    let onComplete: () -> Void
    let onLater: () -> Void
    let onTryOptionalTask: (() -> Void)?

    init(
        locale: AppLocale,
        hasOptionalRemaining: Bool = false,
        optionalTaskTitle: String? = nil,
        onComplete: @escaping () -> Void,
        onLater: @escaping () -> Void,
        onTryOptionalTask: (() -> Void)? = nil
    ) {
        self.locale = locale
        self.hasOptionalRemaining = hasOptionalRemaining
        self.optionalTaskTitle = optionalTaskTitle
        self.onComplete = onComplete
        self.onLater = onLater
        self.onTryOptionalTask = onTryOptionalTask
    }

    private var isJapanese: Bool { locale == .ja }

    private var heading: String {
        if hasOptionalRemaining {
            return isJapanese ? "クエスト完了できます！" : "Quest ready to complete!"
        }
        return isJapanese ? "クエスト完了です！" : "Quest ready to complete!"
    }

    private var bodyText: String {
        if hasOptionalRemaining {
            return isJapanese
                ? "必修の課題はすべてクリアしました。残りはおまけ課題なので、クリアしなくても次に進めます。"
                : "All required tasks are complete. Remaining tasks are optional — you can finish the quest without clearing them."
        }
        return isJapanese
            ? "全ての課題が完了しました、クエスト完了です！"
            : "All practice tasks are complete. Ready to finish this quest!"
    }

    var body: some View {
        VStack(spacing: 20) {
            Text("🎉")
                .font(.system(size: 44))
            Text(heading)
                .font(.title3.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            Text(bodyText)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
                .multilineTextAlignment(.center)
            if hasOptionalRemaining, let optionalTaskTitle, onTryOptionalTask != nil {
                Text(optionalTaskTitle)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Color.blue.opacity(0.85))
                    .multilineTextAlignment(.center)
            }
            VStack(spacing: 12) {
                Button(isJapanese ? "クエストを完了する" : "Complete this quest", action: onComplete)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity)
                if hasOptionalRemaining, let onTryOptionalTask {
                    Button(isJapanese ? "おまけ課題に挑戦" : "Try optional task", action: onTryOptionalTask)
                        .buttonStyle(.bordered)
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

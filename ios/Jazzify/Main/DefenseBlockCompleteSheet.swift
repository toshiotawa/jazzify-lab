import SwiftUI

struct DefenseBlockCompleteSheet: View {
    let locale: AppLocale
    let onPremium: () -> Void
    let onTraining: () -> Void
    let onDismiss: () -> Void

    private var isJapanese: Bool { locale == .ja }

    var body: some View {
        VStack(spacing: 20) {
            Text(isJapanese ? "第1階層 クリア" : "FLOOR 1 COMPLETE")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color(hex: "6ee7b7"))
                .textCase(.uppercase)
                .tracking(2)

            Text(isJapanese ? "第1階層をクリアしました！" : "You cleared Floor 1!")
                .font(.title3.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)

            Text(DefenseTrainingGuidanceResolver.blockCompleteBodyCopy(locale: locale))
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.75))
                .multilineTextAlignment(.center)

            VStack(alignment: .leading, spacing: 8) {
                Text(isJapanese ? "次のステップ" : "Next up")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color(hex: "93c5fd"))
                Text(isJapanese ? "Advanced フレーズディフェンス" : "Advanced Phrase Defense")
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(isJapanese
                     ? "より難しいステージを解放して、ディフェンス力を伸ばしましょう。"
                     : "Unlock harder stages and keep building your defense skills.")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.75))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(Color(hex: "0f172a").opacity(0.7))
            .cornerRadius(12)

            VStack(spacing: 12) {
                Button(
                    DefenseTrainingGuidanceResolver.blockCompleteTrialLabel(locale: locale),
                    action: onPremium
                )
                .buttonStyle(.borderedProminent)
                .tint(.green)
                .controlSize(.large)
                .frame(maxWidth: .infinity)

                Button(
                    DefenseTrainingGuidanceResolver.blockCompleteTrainingLabel(locale: locale),
                    action: onTraining
                )
                .buttonStyle(.bordered)
                .frame(maxWidth: .infinity)

                Button(isJapanese ? "マップに戻る" : "Back to map", action: onDismiss)
                    .buttonStyle(.plain)
                    .foregroundStyle(.gray)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .presentationDetents([.medium, .large])
        .jazzifyPresentationBackground(Color(hex: "0f172a"))
        .preferredColorScheme(.dark)
    }
}

import SwiftUI

struct SoftLandingOfferSheet: View {
    let locale: AppLocale
    let course: Course
    let onAccept: () -> Void
    let onDismiss: () -> Void

    private var isJapanese: Bool { locale == .ja }

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "gift.fill")
                .font(.system(size: 36))
                .foregroundStyle(.green)

            Text(isJapanese ? "次のコースへ進みますか？" : "Continue to the next course?")
                .font(.title3.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)

            Text(course.localizedTitle(locale))
                .font(.headline)
                .foregroundStyle(Color(hex: "fcd34d"))
                .multilineTextAlignment(.center)

            if let description = course.localizedDescription(locale), !description.isEmpty {
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.75))
                    .multilineTextAlignment(.center)
                    .lineLimit(4)
            }

            Text(isJapanese
                 ? "第1ブロックを無料で体験できます。"
                 : "Block 1 is free to play.")
                .font(.subheadline)
                .foregroundStyle(.green.opacity(0.9))
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                Button(isJapanese ? "無料で始める" : "Start for free", action: onAccept)
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity)
                Button(isJapanese ? "あとで" : "Later", action: onDismiss)
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

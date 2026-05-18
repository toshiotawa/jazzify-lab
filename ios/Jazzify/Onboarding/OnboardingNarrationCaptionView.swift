import SwiftUI

/// 画面中央下付近のナレーション字幕。
struct OnboardingNarrationCaptionView: View {
    let text: String

    var body: some View {
        VStack {
            Spacer()
            if !text.isEmpty {
                Text(text)
                    .font(.callout)
                    .foregroundStyle(Color(hex: "e2e8f0"))
                    .multilineTextAlignment(.center)
                    .padding(16)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.black.opacity(0.55)))
                    .padding(.horizontal, 20)
                    .padding(.bottom, 200)
            }
        }
        .allowsHitTesting(false)
    }
}

import SwiftUI

struct OnboardingCtaView: View {
    let isJa: Bool
    /// nil のときオンボーディング既定文言。
    var buttonTitle: String? = nil
    let onTap: () -> Void

    private var resolvedTitle: String {
        if let buttonTitle {
            return buttonTitle
        }
        return isJa ? "最初のクエストへ" : "Start your first quest"
    }

    var body: some View {
        VStack {
            Spacer()
            Button(action: onTap) {
                Text(resolvedTitle)
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.yellow)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 100)
        }
    }
}

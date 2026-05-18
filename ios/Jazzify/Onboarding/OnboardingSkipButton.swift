import SwiftUI

struct OnboardingSkipButton: View {
    let isJa: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            Text(isJa ? "終了 ▶︎" : "Exit ▶︎")
                .font(.caption.bold())
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.black.opacity(0.55)))
        }
    }
}

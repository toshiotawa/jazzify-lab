import SwiftUI

struct OnboardingCtaView: View {
    let isJa: Bool
    let onTap: () -> Void

    var body: some View {
        VStack {
            Spacer()
            Button(action: onTap) {
                Text(isJa ? "最初のクエストへ" : "Start your first quest")
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

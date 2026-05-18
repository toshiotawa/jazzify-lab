import SwiftUI

/// MIDI デバイス名表示（例: Connected: Roland FP-30X）。
struct OnboardingDeviceConnectedBannerView: View {
    let line: String

    var body: some View {
        VStack {
            Text(line)
                .font(.caption.bold())
                .foregroundStyle(.green)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.black.opacity(0.6)))
                .padding(.top, 120)
            Spacer()
        }
        .allowsHitTesting(false)
    }
}

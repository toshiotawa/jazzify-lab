import SwiftUI

/// II-V-I リキャップ用の3コード横並びスタッフ。
struct OnboardingChordCarouselView: View {
    let isJa: Bool

    var body: some View {
        GeometryReader { proxy in
            VStack(spacing: 6) {
                Text(isJa ? "II-V-I" : "II-V-I")
                    .font(.caption.bold())
                    .foregroundStyle(.white.opacity(0.8))

                HStack(spacing: 8) {
                    ForEach(0..<OnboardingChords.sceneThreeProgressionChords.count, id: \.self) { idx in
                        let chord = OnboardingChords.sceneThreeProgressionChords[idx]
                        VStack(spacing: 0) {
                            if let names = chord.progressionStaffVoicingNames {
                                SurvivalProgressionStaffView(
                                    chordDisplayName: chord.displayName,
                                    voicingNames: names,
                                    keyFifths: chord.progressionStaffKeyFifths ?? 0,
                                    correctPitchClasses: [],
                                    staffClef: 1
                                )
                                .frame(height: staffHeight(in: proxy.size))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 6)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.black.opacity(0.5))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(
                                    Color.white.opacity(0.2),
                                    lineWidth: 1.4
                                )
                        )
                    }
                }
                .frame(maxWidth: max(1, min(proxy.size.width - 20, 720)))
            }
            .frame(maxWidth: .infinity, alignment: .top)
        }
        .frame(height: 150)
        .padding(.top, 52)
        .padding(.horizontal, 10)
        .allowsHitTesting(false)
    }

    private func staffHeight(in size: CGSize) -> CGFloat {
        size.width < 560 ? 82 : 96
    }
}

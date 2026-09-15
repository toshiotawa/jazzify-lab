import SwiftUI

struct TrainingGoalBannerView: View {
    let title: String
    let cleared: Int
    let total: Int
    let stageNumber: Int
    let locale: AppLocale
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            TrainingGoalArtCardView(stageNumber: stageNumber) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(locale == .ja ? "現在の目標" : "CURRENT GOAL")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Color(hex: "c7d2fe"))
                    HStack(alignment: .firstTextBaseline) {
                        Text(title)
                            .font(.headline)
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.leading)
                        Spacer()
                        Text("\(cleared)/\(total)")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color(hex: "e0e7ff"))
                            .monospacedDigit()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(Color(hex: "c7d2fe"))
                    }
                }
            }
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
    }
}

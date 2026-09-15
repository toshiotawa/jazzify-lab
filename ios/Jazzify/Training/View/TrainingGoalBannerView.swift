import SwiftUI

struct TrainingGoalBannerView: View {
    let title: String
    let cleared: Int
    let total: Int
    let locale: AppLocale
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                Text(locale == .ja ? "現在の目標" : "CURRENT GOAL")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.indigo)
                HStack(alignment: .firstTextBaseline) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .multilineTextAlignment(.leading)
                    Spacer()
                    Text("\(cleared)/\(total)")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.indigo)
                        .monospacedDigit()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [Color.indigo.opacity(0.18), Color(.secondarySystemBackground)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.indigo.opacity(0.4), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
    }
}

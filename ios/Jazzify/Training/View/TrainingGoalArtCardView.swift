import SwiftUI

struct TrainingGoalArtCardView<Content: View>: View {
    let stageNumber: Int
    let minHeight: CGFloat
    @ViewBuilder let content: () -> Content

    init(
        stageNumber: Int,
        minHeight: CGFloat = 138,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.stageNumber = stageNumber
        self.minHeight = minHeight
        self.content = content
    }

    var body: some View {
        ZStack(alignment: .leading) {
            QuestStageArtwork(stageNumber: stageNumber, rectangular: true)
            LinearGradient(
                colors: [
                    Color.black.opacity(0.86),
                    Color.black.opacity(0.52),
                    Color.black.opacity(0.12),
                ],
                startPoint: .leading,
                endPoint: .trailing
            )
            content()
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(minHeight: minHeight)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.purple.opacity(0.55), lineWidth: 1)
        )
    }
}

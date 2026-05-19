import SwiftUI

/// キャラ立ち絵 + 吹き出しセリフ。
struct OnboardingCharacterDialogView: View {
    let text: String
    /// 省略時は従来のプレイヤー直上（縦ポートレート換算）。
    var tutorialPlacement: EarTrainingTutorialDialogPlacement?
    /// `tutorialPlacement` 利用時のみ必須（landscape 寸法）。
    var tutorialLandscapeSize: CGSize?

    init(
        text: String,
        tutorialPlacement: EarTrainingTutorialDialogPlacement? = nil,
        tutorialLandscapeSize: CGSize? = nil
    ) {
        self.text = text
        self.tutorialPlacement = tutorialPlacement
        self.tutorialLandscapeSize = tutorialLandscapeSize
    }

    var body: some View {
        if text.isEmpty {
            EmptyView()
        } else if let placement = tutorialPlacement, let size = tutorialLandscapeSize {
            VStack(spacing: 0) {
                Color.clear.frame(height: topInset(for: placement, landscapeSize: size))
                speechBubble
                    .frame(maxWidth: min(size.width - 32, EarTrainingTutorialDialogLayoutConstants.maxBubbleWidth))
                Spacer(minLength: 0)
            }
            .frame(width: size.width, height: size.height, alignment: .top)
            .allowsHitTesting(false)
        } else {
            GeometryReader { proxy in
                let size = proxy.size
                speechBubble
                    .frame(maxWidth: min(size.width - 32, EarTrainingTutorialDialogLayoutConstants.maxBubbleWidth))
                    .position(legacyBubbleCenter(in: size))
            }
            .allowsHitTesting(false)
        }
    }

    private var speechBubble: some View {
        VStack(spacing: 0) {
            Text(text)
                .font(.caption.weight(.bold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .lineLimit(4)
                .minimumScaleFactor(0.78)
                .padding(.horizontal, 11)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.black.opacity(0.78))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.26), lineWidth: 1)
                        )
                )
            OnboardingSpeechTail()
                .fill(Color.black.opacity(0.78))
                .frame(width: 21, height: 10)
        }
    }

    private func topInset(for placement: EarTrainingTutorialDialogPlacement, landscapeSize: CGSize) -> CGFloat {
        switch placement {
        case .belowChordHud:
            return EarTrainingTutorialDialogLayoutConstants.compactChordHudTopY
                + EarTrainingTutorialDialogLayoutConstants.compactChordChipBandHeight
                + 8
        case let .belowVoicingPhraseSlots(slotCount):
            let band = EarTrainingTutorialDialogLayoutConstants.voicingPhraseSlotBandHeight(
                slotCount: slotCount,
                landscapeWidth: landscapeSize.width
            )
            let slotRowTop = landscapeSize.height
                - EarTrainingTutorialDialogLayoutConstants.pianoOverlayHeight
                - band
                - 8
            return max(
                EarTrainingTutorialDialogLayoutConstants.compactChordHudTopY,
                slotRowTop - EarTrainingTutorialDialogLayoutConstants.bubbleApproxHalfHeight * 2 - 14
            )
        case .dialogueIntroUpperCenter:
            return max(56, landscapeSize.height * 0.22 - EarTrainingTutorialDialogLayoutConstants.bubbleApproxHalfHeight)
        }
    }

    private func legacyBubbleCenter(in size: CGSize) -> CGPoint {
        let abovePlayer = size.height * 0.5 - 92
        let y = max(70, min(max(86, abovePlayer), size.height - 240))
        let margin = EarTrainingTutorialDialogLayoutConstants.bubbleApproxHalfHeight + 16
        let clampedY = max(margin, min(size.height - margin, y))
        return CGPoint(x: size.width * 0.5, y: clampedY)
    }
}

private struct OnboardingSpeechTail: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

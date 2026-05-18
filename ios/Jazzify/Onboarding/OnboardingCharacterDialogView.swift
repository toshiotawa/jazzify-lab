import SwiftUI

/// キャラ立ち絵 + 吹き出しセリフ。
struct OnboardingCharacterDialogView: View {
    let text: String

    var body: some View {
        GeometryReader { proxy in
            if !text.isEmpty {
                VStack(spacing: 0) {
                    Text(text)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .lineLimit(4)
                        .minimumScaleFactor(0.78)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(Color.black.opacity(0.78))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(Color.white.opacity(0.26), lineWidth: 1)
                                )
                        )
                    OnboardingSpeechTail()
                        .fill(Color.black.opacity(0.78))
                        .frame(width: 24, height: 12)
                }
                .frame(width: max(1, min(proxy.size.width - 32, 380)))
                .position(
                    x: proxy.size.width * 0.5,
                    y: bubbleCenterY(in: proxy.size)
                )
            }
        }
        .allowsHitTesting(false)
    }

    private func bubbleCenterY(in size: CGSize) -> CGFloat {
        let abovePlayer = size.height * 0.5 - 92
        return max(70, min(max(86, abovePlayer), size.height - 240))
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

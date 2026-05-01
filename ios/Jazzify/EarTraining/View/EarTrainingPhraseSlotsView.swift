import SwiftUI

/// デモループ中の吹き出し (fukidashi.png) を表示する補助レイヤ。
/// HUD と鍵盤の間、敵キャラ頭上に重なるよう絶対配置する。
struct EarTrainingDemoBubbleView: View {
    @ObservedObject var controller: EarTrainingBattleController

    var body: some View {
        if controller.demoBubbleVisible, controller.gameState == .playingPhrase {
            GeometryReader { proxy in
                let bubbleWidth: CGFloat = 82
                let bubbleHeight: CGFloat = 54
                let enemyCenterX = proxy.size.width * 0.77
                let desiredBubbleX = enemyCenterX + 88
                let bubbleX = min(
                    max(bubbleWidth / 2 + 12, desiredBubbleX),
                    proxy.size.width - bubbleWidth / 2 - 12
                )
                ZStack {
                    if let bubble = bubbleImage {
                        Image(uiImage: bubble)
                            .resizable()
                            .scaledToFit()
                            .frame(width: bubbleWidth, height: bubbleHeight)
                    } else {
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(Color.white.opacity(0.92))
                            .frame(width: bubbleWidth, height: 50)
                            .overlay(
                                Text(controller.isEnglishCopy ? "Demo" : "お手本")
                                    .font(.system(size: 11, weight: .heavy))
                                    .foregroundColor(.black)
                            )
                    }
                }
                .position(
                    x: bubbleX,
                    y: max(82, proxy.size.height * 0.38)
                )
                .transition(.opacity.combined(with: .scale))
                .animation(.easeOut(duration: 0.18), value: controller.demoBubbleVisible)
            }
            .allowsHitTesting(false)
        }
    }

    private var bubbleImage: UIImage? {
        UIImage(named: "ear-training-fukidashi")
    }
}

import SwiftUI

/// デモループ中の吹き出し (fukidashi.png) を表示する補助レイヤ。
/// HUD と鍵盤の間、敵キャラ頭上に重なるよう絶対配置する。
struct EarTrainingDemoBubbleView: View {
    @ObservedObject var controller: EarTrainingBattleController

    var body: some View {
        if controller.demoBubbleVisible, controller.gameState == .playingPhrase {
            GeometryReader { proxy in
                ZStack {
                    if let bubble = bubbleImage {
                        Image(uiImage: bubble)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 120, height: 80)
                    } else {
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(Color.white.opacity(0.92))
                            .frame(width: 120, height: 70)
                            .overlay(
                                Text(controller.isEnglishCopy ? "Demo" : "お手本")
                                    .font(.system(size: 14, weight: .heavy))
                                    .foregroundColor(.black)
                            )
                    }
                }
                .position(x: proxy.size.width * 0.77, y: proxy.size.height * 0.36)
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

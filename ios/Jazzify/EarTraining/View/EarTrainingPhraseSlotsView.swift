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
                            .frame(width: 96, height: 64)
                    } else {
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(Color.white.opacity(0.92))
                            .frame(width: 96, height: 58)
                            .overlay(
                                Text(controller.isEnglishCopy ? "Demo" : "お手本")
                                    .font(.system(size: 12, weight: .heavy))
                                    .foregroundColor(.black)
                            )
                    }
                }
                .position(
                    x: proxy.size.width * 0.83,
                    y: max(214, proxy.size.height - 356)
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

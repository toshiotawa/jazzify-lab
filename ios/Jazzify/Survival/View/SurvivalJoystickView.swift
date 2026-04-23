import SwiftUI

/// 画面左側のタップで出現する仮想スティック。
/// - タップを始めた位置にジョイスティックのベース円を配置し、その位置を原点にドラッグ量をアナログ入力に変換する。
/// - ドラッグが終了したらジョイスティックは消える（WEB 版モバイル操作に合わせる）。
/// - 8 方向離散化は `SurvivalDirection8.fromVector` に委ねる。
struct SurvivalJoystickView: View {
    let onChange: (CGVector) -> Void

    private let outerRadius: CGFloat = 64
    private let innerRadius: CGFloat = 28

    @State private var basePosition: CGPoint? = nil
    @State private var knobOffset: CGSize = .zero

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                // 透明なヒット領域（親側でフレームサイズを指定する前提）
                Color.clear
                    .contentShape(Rectangle())

                if let base = basePosition {
                    // ベース円
                    Circle()
                        .fill(Color.white.opacity(0.08))
                        .overlay(Circle().stroke(Color.white.opacity(0.3), lineWidth: 1.5))
                        .frame(width: outerRadius * 2, height: outerRadius * 2)
                        .position(base)
                    // ノブ
                    Circle()
                        .fill(Color.white.opacity(0.8))
                        .shadow(color: .white.opacity(0.2), radius: 4)
                        .frame(width: innerRadius * 2, height: innerRadius * 2)
                        .position(
                            x: base.x + knobOffset.width,
                            y: base.y + knobOffset.height
                        )
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
            .gesture(
                DragGesture(minimumDistance: 0, coordinateSpace: .local)
                    .onChanged { value in
                        if basePosition == nil {
                            basePosition = value.startLocation
                        }
                        guard let base = basePosition else { return }
                        let dx = value.location.x - base.x
                        let dy = value.location.y - base.y
                        let length = hypot(dx, dy)
                        if length > outerRadius {
                            let scale = outerRadius / length
                            knobOffset = CGSize(width: dx * scale, height: dy * scale)
                        } else {
                            knobOffset = CGSize(width: dx, height: dy)
                        }
                        let nx = knobOffset.width / outerRadius
                        let ny = knobOffset.height / outerRadius
                        onChange(CGVector(dx: nx, dy: ny))
                    }
                    .onEnded { _ in
                        basePosition = nil
                        knobOffset = .zero
                        onChange(.zero)
                    }
            )
        }
    }
}

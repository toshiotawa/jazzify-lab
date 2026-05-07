import SwiftUI

/// タップで出現する仮想スティック。
/// - タップを始めた位置にジョイスティックのベース円を配置し、その位置を原点にドラッグ量をアナログ入力に変換する。
/// - ドラッグが終了したらジョイスティックは消える（WEB 版モバイル操作に合わせる）。
/// - 出現判定領域は `hitMask` でカスタマイズ可能。左右両サイドを有効化するなど柔軟に調整できる。
/// - 8 方向離散化は `SurvivalDirection8.fromVector` に委ねる。
struct SurvivalJoystickView: View {
    /// スティックが出現するヒット領域の指定。
    enum HitMask {
        /// ビュー全体がヒット領域 (従来互換)。
        case full
        /// 画面の左右両サイドのみをヒット領域にする。
        /// - Parameter exclusionRatio: 中央側で無効化する比率 (0.0〜1.0)。
        ///   例: `0.2` なら中央 20% がデッドゾーンになり、左右それぞれ 40% がヒット領域になる。
        case leftRightSides(exclusionRatio: CGFloat)
    }

    let hitMask: HitMask
    let onChange: (CGVector) -> Void

    private let outerRadius: CGFloat = 64
    private let innerRadius: CGFloat = 28

    @State private var basePosition: CGPoint? = nil
    @State private var knobOffset: CGSize = .zero

    init(hitMask: HitMask = .full, onChange: @escaping (CGVector) -> Void) {
        self.hitMask = hitMask
        self.onChange = onChange
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                // ヒット領域。`contentShape` に渡すシェイプでタップ受け付け範囲を限定する。
                Color.clear
                    .contentShape(JoystickHitShape(mask: hitMask))

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
                        // ヒット領域外から始まったジェスチャーは無視 (中央デッドゾーン対策)
                        if basePosition == nil {
                            guard isInsideHitArea(
                                point: value.startLocation,
                                in: proxy.size
                            ) else { return }
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
                        let vLen = hypot(nx, ny)
                        let deadNorm: CGFloat = 0.18
                        if vLen < deadNorm {
                            onChange(.zero)
                        } else {
                            let inv = 1 / vLen
                            let ux = nx * inv
                            let uy = ny * inv
                            let mag = min(CGFloat(1), (vLen - deadNorm) / (CGFloat(1) - deadNorm))
                            var odx = ux * mag
                            var ody = uy * mag
                            if abs(odx) < 0.01 { odx = 0 }
                            if abs(ody) < 0.01 { ody = 0 }
                            onChange(CGVector(dx: odx, dy: ody))
                        }
                    }
                    .onEnded { _ in
                        // スティックが出ていなければ (デッドゾーン開始) 何もしない
                        guard basePosition != nil else { return }
                        basePosition = nil
                        knobOffset = .zero
                        onChange(.zero)
                    }
            )
        }
    }

    /// ヒット領域内かどうかを判定 (ジェスチャーの開始位置チェック用)。
    /// `contentShape` だけでは `DragGesture(minimumDistance: 0)` がデッドゾーン上で発火するケースがある
    /// ため、`onChanged` 側で二重に弾いて確実にデッドゾーンを機能させる。
    private func isInsideHitArea(point: CGPoint, in size: CGSize) -> Bool {
        switch hitMask {
        case .full:
            return point.x >= 0 && point.x <= size.width
                && point.y >= 0 && point.y <= size.height
        case .leftRightSides(let exclusionRatio):
            let clamped = max(0, min(1, exclusionRatio))
            let halfExclusion = (size.width * clamped) / 2
            let centerX = size.width / 2
            let leftMax = centerX - halfExclusion
            let rightMin = centerX + halfExclusion
            return point.x <= leftMax || point.x >= rightMin
        }
    }
}

/// ジョイスティックのヒット領域シェイプ。`.contentShape()` に渡して SwiftUI 側の
/// 下位レイヤ (ゲームシーン等) へのタップ透過を実現する。
private struct JoystickHitShape: Shape {
    let mask: SurvivalJoystickView.HitMask

    func path(in rect: CGRect) -> Path {
        var path = Path()
        switch mask {
        case .full:
            path.addRect(rect)
        case .leftRightSides(let exclusionRatio):
            let clamped = max(0, min(1, exclusionRatio))
            let exclusionWidth = rect.width * clamped
            let sideWidth = (rect.width - exclusionWidth) / 2
            path.addRect(CGRect(x: rect.minX, y: rect.minY, width: sideWidth, height: rect.height))
            path.addRect(CGRect(x: rect.maxX - sideWidth, y: rect.minY, width: sideWidth, height: rect.height))
        }
        return path
    }
}

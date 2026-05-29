import SwiftUI
import UIKit

// MARK: - Hit mask (SwiftUI / UIKit 共通)

/// 仮想スティックのタッチ有効領域。
enum SurvivalJoystickHitMask: Sendable {
    /// ビュー全体がヒット領域。
    case full
    /// 画面の左右両サイドのみ。`exclusionRatio` は中央で無効化する幅の比率 (0〜1)。
    case leftRightSides(exclusionRatio: CGFloat)

    fileprivate func containsStartPoint(_ point: CGPoint, in size: CGSize) -> Bool {
        switch self {
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

// MARK: - UIKit 実装（ドラッグ中に SwiftUI の body を毎イベント再評価しない）

/// タップで出現する仮想スティック（UIKit）。
/// - タップ開始位置にベース円を表示し、ドラッグ量をアナログ入力に変換する。
/// - 指を離すと消える（Web 版モバイル操作に合わせる）。
/// - ノブ位置は `UIView` のレイアウトのみ更新し、SpriteKit 60fps とメインスレッドを争わない。
final class SurvivalJoystickHostView: UIView {
    var onAnalogChange: ((CGVector) -> Void)?
    var hitMask: SurvivalJoystickHitMask = .full

    private let outerRadius: CGFloat = 64
    private let innerRadius: CGFloat = 28
    private let deadNorm: CGFloat = 0.18

    private var activeTouch: UITouch?
    private var basePoint: CGPoint = .zero
    private var knobOffsetX: CGFloat = 0
    private var knobOffsetY: CGFloat = 0

    private let baseVisual = UIView()
    private let knobVisual = UIView()

    override init(frame: CGRect) {
        super.init(frame: frame)
        isMultipleTouchEnabled = true
        backgroundColor = .clear

        baseVisual.isHidden = true
        baseVisual.backgroundColor = UIColor.white.withAlphaComponent(0.08)
        baseVisual.layer.borderColor = UIColor.white.withAlphaComponent(0.3).cgColor
        baseVisual.layer.borderWidth = 1.5
        baseVisual.layer.cornerRadius = outerRadius

        knobVisual.isHidden = true
        knobVisual.backgroundColor = UIColor.white.withAlphaComponent(0.8)
        knobVisual.layer.cornerRadius = innerRadius
        knobVisual.layer.shadowColor = UIColor.white.withAlphaComponent(0.2).cgColor
        knobVisual.layer.shadowRadius = 4
        knobVisual.layer.shadowOpacity = 1
        knobVisual.layer.shadowOffset = .zero

        addSubview(baseVisual)
        addSubview(knobVisual)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        guard isUserInteractionEnabled else { return false }
        return bounds.contains(point)
    }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard isUserInteractionEnabled, !isHidden, alpha > 0.01 else { return nil }
        guard bounds.contains(point) else { return nil }
        switch hitMask {
        case .full:
            return self
        case .leftRightSides:
            return hitMask.containsStartPoint(point, in: bounds.size) ? self : nil
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let od = outerRadius * 2
        let id = innerRadius * 2
        baseVisual.bounds = CGRect(x: 0, y: 0, width: od, height: od)
        knobVisual.bounds = CGRect(x: 0, y: 0, width: id, height: id)
        repositionVisuals()
    }

    private func repositionVisuals() {
        baseVisual.center = basePoint
        knobVisual.center = CGPoint(x: basePoint.x + knobOffsetX, y: basePoint.y + knobOffsetY)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        reconcileActiveTouchIfNeeded(with: event)
        guard isUserInteractionEnabled, activeTouch == nil, let touch = touches.first else { return }
        let p = touch.location(in: self)
        guard hitMask.containsStartPoint(p, in: bounds.size) else { return }
        activeTouch = touch
        basePoint = p
        knobOffsetX = 0
        knobOffsetY = 0
        baseVisual.isHidden = false
        knobVisual.isHidden = false
        repositionVisuals()
        emitAnalog()
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = activeTouch, touches.contains(touch) else { return }
        updateKnob(using: touch)
        emitAnalog()
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = activeTouch, touches.contains(touch) else { return }
        endInteraction()
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = activeTouch, touches.contains(touch) else { return }
        endInteraction()
    }

    private func endInteraction() {
        activeTouch = nil
        knobOffsetX = 0
        knobOffsetY = 0
        baseVisual.isHidden = true
        knobVisual.isHidden = true
        onAnalogChange?(.zero)
    }

    /// システムが `touchesEnded` / `touchesCancelled` を配信しなかった場合でも
    /// `activeTouch` が残って新規タッチを弾かないよう、終了済み・無効なタッチを掃除する。
    private func reconcileActiveTouchIfNeeded(with _: UIEvent?) {
        guard let touch = activeTouch else { return }
        switch touch.phase {
        case .ended, .cancelled:
            endInteraction()
            return
        default:
            break
        }
        if touch.window == nil {
            endInteraction()
        }
    }

    /// 一時停止・フェーズ遷移などで SwiftUI から無効化されるときに呼ぶ。
    func clearInteractionStateForExternalDisable() {
        if activeTouch != nil || !baseVisual.isHidden {
            endInteraction()
            return
        }
    }

    private func updateKnob(using touch: UITouch) {
        let loc = touch.location(in: self)
        var dx = loc.x - basePoint.x
        var dy = loc.y - basePoint.y
        let len = hypot(dx, dy)
        if len > outerRadius, len > 0 {
            let scale = outerRadius / len
            dx *= scale
            dy *= scale
        }
        knobOffsetX = dx
        knobOffsetY = dy
        repositionVisuals()
    }

    private func emitAnalog() {
        let nx = knobOffsetX / outerRadius
        let ny = knobOffsetY / outerRadius
        let vLen = hypot(nx, ny)
        if vLen < deadNorm {
            onAnalogChange?(.zero)
            return
        }
        let inv = 1 / vLen
        let ux = nx * inv
        let uy = ny * inv
        let mag = min(CGFloat(1), (vLen - deadNorm) / (CGFloat(1) - deadNorm))
        var odx = ux * mag
        var ody = uy * mag
        if abs(odx) < 0.01 { odx = 0 }
        if abs(ody) < 0.01 { ody = 0 }
        onAnalogChange?(CGVector(dx: odx, dy: ody))
    }
}

// MARK: - SwiftUI ブリッジ

struct SurvivalJoystickRepresentable: UIViewRepresentable {
    var hitMask: SurvivalJoystickHitMask = .full
    var isInteractive: Bool
    let onChange: (CGVector) -> Void

    func makeUIView(context: Context) -> SurvivalJoystickHostView {
        let v = SurvivalJoystickHostView()
        v.hitMask = hitMask
        v.onAnalogChange = onChange
        v.isUserInteractionEnabled = isInteractive
        return v
    }

    func updateUIView(_ uiView: SurvivalJoystickHostView, context: Context) {
        uiView.hitMask = hitMask
        uiView.onAnalogChange = onChange
        if !isInteractive {
            uiView.clearInteractionStateForExternalDisable()
        }
        uiView.isUserInteractionEnabled = isInteractive
    }
}

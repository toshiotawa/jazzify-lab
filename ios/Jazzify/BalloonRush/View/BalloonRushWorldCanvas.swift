import SwiftUI
import UIKit

/// Web `balloonRushWorldDraw.ts` 相当の 2D 描画。
struct BalloonRushWorldCanvas: UIViewRepresentable {
    let snapshot: BalloonRushDrawSnapshot

    func makeUIView(context: Context) -> BalloonRushWorldUIView {
        BalloonRushWorldUIView()
    }

    func updateUIView(_ uiView: BalloonRushWorldUIView, context: Context) {
        uiView.snapshot = snapshot
    }
}

final class BalloonRushWorldUIView: UIView {
    var snapshot: BalloonRushDrawSnapshot?

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1)
        isOpaque = true
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { nil }

    override func draw(_ rect: CGRect) {
        guard let snap = snapshot, let ctx = UIGraphicsGetCurrentContext() else { return }
        let width = bounds.width
        let height = bounds.height
        guard width > 0, height > 0 else { return }

        let mapW = SurvivalMap.width
        let mapH = SurvivalMap.height
        let scale = min(width / mapW, height / mapH) * 0.98
        let ox = (width - mapW * scale) / 2
        let oy = (height - mapH * scale) / 2

        ctx.saveGState()
        ctx.translateBy(x: ox, y: oy)
        ctx.scaleBy(x: scale, y: scale)

        ctx.setStrokeColor(UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1).cgColor)
        ctx.setLineWidth(4 / scale)
        ctx.stroke(CGRect(x: 0, y: 0, width: mapW, height: mapH))

        let camX = snap.playerX
        let camY = snap.playerY
        let viewHalfW = width / scale / 2
        let viewHalfH = height / scale / 2
        ctx.translateBy(x: -camX + viewHalfW, y: -camY + viewHalfH)

        let shockDuration = SurvivalConstants.meleeShockwaveLifetime
        for w in snap.shockwaves {
            let age = snap.nowPerfMs / 1000 - w.startPerfMs / 1000
            guard age >= 0, age < shockDuration else { continue }
            let t = CGFloat(age / shockDuration)
            let r = w.maxRadius * t
            ctx.setStrokeColor(UIColor(red: 250/255, green: 204/255, blue: 21/255, alpha: 0.55 * (1 - t)).cgColor)
            ctx.setLineWidth((8 * (1 - t) + 2) / scale)
            ctx.addEllipse(in: CGRect(x: w.x - r, y: w.y - r, width: r * 2, height: r * 2))
            ctx.strokePath()
        }

        if let jx = snap.jajiiX, let jy = snap.jajiiY {
            drawEmoji("🧙", at: CGPoint(x: jx, y: jy), size: 48, scale: scale, in: ctx)
        }

        for b in snap.balloons where b.visible {
            drawEmoji("🎈", at: CGPoint(x: b.x, y: b.y), size: 52, scale: scale, in: ctx)
        }

        drawEmoji("🧑‍🎤", at: CGPoint(x: snap.playerX, y: snap.playerY), size: 52, scale: scale, in: ctx)

        ctx.restoreGState()
    }

    private func drawEmoji(_ text: String, at point: CGPoint, size: CGFloat, scale: CGFloat, in ctx: CGContext) {
        let font = UIFont.systemFont(ofSize: size / scale)
        let attrs: [NSAttributedString.Key: Any] = [
            .font: font,
        ]
        let ns = NSAttributedString(string: text, attributes: attrs)
        let sz = ns.size()
        let origin = CGPoint(x: point.x - sz.width / 2, y: point.y - sz.height / 2)
        UIGraphicsPushContext(ctx)
        ns.draw(at: origin)
        UIGraphicsPopContext()
    }
}

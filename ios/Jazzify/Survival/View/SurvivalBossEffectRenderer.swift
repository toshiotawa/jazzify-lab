import UIKit
import CoreGraphics

/// Web 版 `SurvivalCanvas.tsx` のボス戦エフェクト描画 (扇/突進/リング/十字/引力/血溜まり/毒沼/毒弾) を
/// CoreGraphics で忠実移植するレンダラー。各メソッドは UIImage と sprite 配置情報を返し、
/// `SurvivalScene` 側で SKSpriteNode のテクスチャに毎フレーム差し替える。
///
/// - 出力画像はローカル座標系で「正方向（右向き）」を基本に描き、
///   SKSpriteNode の `zRotation` で実際の角度を適用する。
/// - `anchorPoint` は線分系のみ (0, 0.5) を返し、それ以外は (0.5, 0.5)。
enum SurvivalBossEffectRenderer {

    struct Output {
        let image: UIImage
        let anchorPoint: CGPoint
        /// SpriteKit (y-up) 用の追加回転 (rad)。Web 側の y-down 角度を反転させて渡す想定。
        let rotation: CGFloat
    }

    /// 高解像度ディスプレイでも輪郭がぼやけないよう scale=2 固定。さらに上げるとメモリが増えるため抑制。
    private static let imageScale: CGFloat = 2.0

    private static func makeRenderer(size: CGSize) -> UIGraphicsImageRenderer {
        let format = UIGraphicsImageRendererFormat()
        format.opaque = false
        format.scale = imageScale
        return UIGraphicsImageRenderer(size: size, format: format)
    }

    // MARK: - Hazard 描画ディスパッチ

    static func renderHazard(
        kind: SurvivalBossHazard.Kind,
        startAt: TimeInterval,
        endAt: TimeInterval,
        nowMs: Double,
        idHash: Int
    ) -> Output? {
        let lifeMs = max(1.0, (endAt - startAt) * 1000.0)
        let elapsedMs = max(0.0, (nowMs / 1.0) - startAt * 1000.0)
        let progress = max(0.0, min(1.0, elapsedMs / lifeMs))

        switch kind {
        case .fanTelegraph(let angle, let spread, let radius):
            return renderFanTelegraph(spread: spread, radius: radius, nowMs: nowMs, rotation: -angle)
        case .fanActive(let angle, let spread, let radius, _):
            return renderFanActive(spread: spread, radius: radius, nowMs: nowMs, progress: progress, rotation: -angle)
        case .lineTelegraph(let angle, let length, let thickness):
            return renderChargeTelegraph(length: length, thickness: thickness, nowMs: nowMs, progress: progress, rotation: -angle)
        case .lineActive(let angle, let length, let thickness, _):
            return renderChargeActive(length: length, thickness: thickness, nowMs: nowMs, progress: progress, rotation: -angle)
        case .ringTelegraph(let inner, let outer):
            return renderRingTelegraph(innerRadius: inner, outerRadius: outer, nowMs: nowMs, progress: progress)
        case .ringActive(let inner, let outer, _):
            return renderRingActive(innerRadius: inner, outerRadius: outer, nowMs: nowMs, progress: progress)
        case .crossTelegraph(let length, let thickness):
            return renderCrossTelegraph(length: length, thickness: thickness, nowMs: nowMs, progress: progress)
        case .crossActive(let length, let thickness, _):
            return renderCrossActive(length: length, thickness: thickness, nowMs: nowMs, progress: progress)
        case .healTelegraph(let range):
            return renderHealTelegraph(radius: range, nowMs: nowMs, progress: progress)
        case .healField(let range):
            return renderHealActive(radius: range, nowMs: nowMs, progress: progress)
        case .bloodPool(let radius, _):
            return renderBloodPool(radius: radius, nowMs: nowMs, progress: progress, idHash: idHash)
        case .acidPool(let radius, _):
            return renderAcidPool(radius: radius, nowMs: nowMs, progress: progress, idHash: idHash)
        case .eggTelegraph(let radius):
            return renderEggTelegraph(radius: radius, nowMs: nowMs)
        case .bombExplosion(let radius, _):
            return renderBombExplosion(radius: radius, progress: progress)
        }
    }

    // MARK: - 扇形 予兆

    private static func renderFanTelegraph(spread: CGFloat, radius: CGFloat, nowMs: Double, rotation: CGFloat) -> Output {
        let pad: CGFloat = 8
        let size = CGSize(width: radius * 2 + pad * 2, height: radius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            let alpha = 0.18 + sin(nowMs / 120.0) * 0.06
            cg.saveGState()
            // 扇形パス（右向き 0 を中心に開く）
            cg.beginPath()
            cg.move(to: CGPoint(x: cx, y: cy))
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: radius, startAngle: -spread / 2, endAngle: spread / 2, clockwise: false)
            cg.closePath()
            cg.setFillColor(red: 1.0, green: 90.0/255, blue: 90.0/255, alpha: CGFloat(alpha))
            cg.fillPath()
            // 点線縁
            cg.beginPath()
            cg.move(to: CGPoint(x: cx, y: cy))
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: radius, startAngle: -spread / 2, endAngle: spread / 2, clockwise: false)
            cg.closePath()
            cg.setStrokeColor(red: 1.0, green: 120.0/255, blue: 120.0/255, alpha: 0.8)
            cg.setLineWidth(2)
            cg.setLineDash(phase: 0, lengths: [8, 6])
            cg.strokePath()
            cg.restoreGState()
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: rotation)
    }

    // MARK: - 扇形 発動

    private static func renderFanActive(spread: CGFloat, radius: CGFloat, nowMs: Double, progress: Double, rotation: CGFloat) -> Output {
        let pad: CGFloat = 24
        let size = CGSize(width: radius * 2 + pad * 2, height: radius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // 放射グラデーション
            let colorSpace = CGColorSpaceCreateDeviceRGB()
            let colors: [CGColor] = [
                UIColor(white: 1.0, alpha: 0.95).cgColor,
                UIColor(red: 1.0, green: 200.0/255, blue: 80.0/255, alpha: 0.85).cgColor,
                UIColor(red: 1.0, green: 40.0/255, blue: 20.0/255, alpha: 0.75).cgColor,
                UIColor(red: 180.0/255, green: 0, blue: 0, alpha: 0.35).cgColor
            ]
            let locs: [CGFloat] = [0, 0.25, 0.7, 1.0]
            guard let grad = CGGradient(colorsSpace: colorSpace, colors: colors as CFArray, locations: locs) else { return }
            // 扇形クリップ
            cg.saveGState()
            cg.beginPath()
            cg.move(to: CGPoint(x: cx, y: cy))
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: radius, startAngle: -spread / 2, endAngle: spread / 2, clockwise: false)
            cg.closePath()
            cg.clip()
            cg.drawRadialGradient(grad, startCenter: CGPoint(x: cx, y: cy), startRadius: 10, endCenter: CGPoint(x: cx, y: cy), endRadius: radius, options: [])
            cg.restoreGState()

            // 外縁ゴールド（簡易グロー: 太い半透明線 + 細い実線）
            for (lw, alpha) in [(10.0, 0.35), (5.0, 1.0)] {
                cg.setStrokeColor(red: 1.0, green: 240.0/255, blue: 120.0/255, alpha: CGFloat(alpha))
                cg.setLineWidth(CGFloat(lw))
                cg.beginPath()
                cg.addArc(center: CGPoint(x: cx, y: cy), radius: radius, startAngle: -spread / 2, endAngle: spread / 2, clockwise: false)
                cg.strokePath()
            }
            // スラッシュ軌跡
            let slashAngle = -spread / 2 + spread * CGFloat(progress)
            cg.setStrokeColor(red: 1, green: 1, blue: 1, alpha: 0.95)
            cg.setLineWidth(8)
            cg.beginPath()
            cg.move(to: CGPoint(x: cx, y: cy))
            cg.addLine(to: CGPoint(x: cx + cos(slashAngle) * radius, y: cy + sin(slashAngle) * radius))
            cg.strokePath()
            // 先端スパーク
            for i in 0..<6 {
                let t = CGFloat(i) / 6.0
                let a = -spread / 2 + spread * t
                let r = radius * (0.85 + sin(CGFloat(nowMs) / 40.0 + CGFloat(i)) * 0.08)
                cg.setFillColor(red: 1, green: 1, blue: 200.0/255, alpha: 0.9)
                cg.fillEllipse(in: CGRect(x: cx + cos(a) * r - 5, y: cy + sin(a) * r - 5, width: 10, height: 10))
            }
            // 中心の衝撃閃光
            let cR = 18 + CGFloat(progress) * 14
            cg.setFillColor(red: 1, green: 1, blue: 1, alpha: CGFloat(0.8 * (1 - progress)))
            cg.fillEllipse(in: CGRect(x: cx - cR, y: cy - cR, width: cR * 2, height: cR * 2))
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: rotation)
    }

    // MARK: - 直線 (突進) 予兆

    private static func renderChargeTelegraph(length: CGFloat, thickness: CGFloat, nowMs: Double, progress: Double, rotation: CGFloat) -> Output {
        let padX: CGFloat = 24
        let padY: CGFloat = thickness * 1.6 + 12
        let size = CGSize(width: length + padX * 2, height: padY * 2)
        let renderer = makeRenderer(size: size)
        let pulse = 0.5 + sin(nowMs / 90.0) * 0.5
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let originX: CGFloat = padX
            let cy: CGFloat = size.height / 2
            // 予兆帯（淡赤グラデ）
            if let grad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 1, green: 80.0/255, blue: 80.0/255, alpha: CGFloat(0.25 + 0.12 * pulse)).cgColor,
                                        UIColor(red: 1, green: 80.0/255, blue: 80.0/255, alpha: 0.05).cgColor
                                     ] as CFArray,
                                     locations: [0, 1]) {
                cg.saveGState()
                cg.addRect(CGRect(x: originX, y: cy - thickness, width: length, height: thickness * 2))
                cg.clip()
                cg.drawLinearGradient(grad, start: CGPoint(x: originX, y: cy), end: CGPoint(x: originX + length, y: cy), options: [])
                cg.restoreGState()
            }
            // 点線ボーダー
            cg.setLineDash(phase: 0, lengths: [10, 7])
            cg.setLineWidth(2)
            cg.setStrokeColor(red: 1, green: 140.0/255, blue: 140.0/255, alpha: 0.85)
            cg.stroke(CGRect(x: originX, y: cy - thickness, width: length, height: thickness * 2))
            cg.setLineDash(phase: 0, lengths: [])

            // 走る閃光
            let flashX = originX + length * CGFloat(progress)
            if let fg = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                   colors: [
                                    UIColor(red: 1, green: 240.0/255, blue: 180.0/255, alpha: 0.9).cgColor,
                                    UIColor(red: 1, green: 120.0/255, blue: 80.0/255, alpha: 0).cgColor
                                   ] as CFArray, locations: [0, 1]) {
                cg.drawRadialGradient(fg, startCenter: CGPoint(x: flashX, y: cy), startRadius: 0, endCenter: CGPoint(x: flashX, y: cy), endRadius: thickness * 1.2, options: [])
            }

            // 先端の矢印マーカー
            cg.setFillColor(red: 1, green: 220.0/255, blue: 80.0/255, alpha: CGFloat(0.75 + 0.25 * pulse))
            cg.beginPath()
            cg.move(to: CGPoint(x: originX + length, y: cy))
            cg.addLine(to: CGPoint(x: originX + length - 18, y: cy - thickness * 0.9))
            cg.addLine(to: CGPoint(x: originX + length - 18, y: cy + thickness * 0.9))
            cg.closePath()
            cg.fillPath()

            // 起点の警告スパーク
            for i in 0..<3 {
                let t = (nowMs / 90.0 + Double(i) * 0.3).truncatingRemainder(dividingBy: 1.0)
                let r = 3 + CGFloat(t) * 4
                cg.setFillColor(red: 1, green: 220.0/255, blue: 120.0/255, alpha: CGFloat((1 - t) * 0.8))
                cg.fillEllipse(in: CGRect(x: originX + 20 + CGFloat(t) * 30 - r, y: cy - r, width: r * 2, height: r * 2))
            }
        }
        return Output(image: img, anchorPoint: CGPoint(x: padX / size.width, y: 0.5), rotation: rotation)
    }

    // MARK: - 直線 (突進) 発動

    private static func renderChargeActive(length: CGFloat, thickness: CGFloat, nowMs: Double, progress: Double, rotation: CGFloat) -> Output {
        let padX: CGFloat = 32
        let padY: CGFloat = thickness * 2.4 + 16
        let size = CGSize(width: length + padX * 2, height: padY * 2)
        let renderer = makeRenderer(size: size)
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let originX: CGFloat = padX
            let cy: CGFloat = size.height / 2

            // 疾走帯本体グラデ（縦方向）
            if let bodyGrad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                         colors: [
                                            UIColor(red: 1, green: 100.0/255, blue: 60.0/255, alpha: 0.1).cgColor,
                                            UIColor(red: 1, green: 230.0/255, blue: 120.0/255, alpha: CGFloat(0.85 * (1 - progress * 0.2))).cgColor,
                                            UIColor(red: 1, green: 100.0/255, blue: 60.0/255, alpha: 0.1).cgColor
                                         ] as CFArray,
                                         locations: [0, 0.5, 1]) {
                cg.saveGState()
                cg.addRect(CGRect(x: originX, y: cy - thickness, width: length, height: thickness * 2))
                cg.clip()
                cg.drawLinearGradient(bodyGrad, start: CGPoint(x: originX, y: cy - thickness), end: CGPoint(x: originX, y: cy + thickness), options: [])
                cg.restoreGState()
            }
            // 白い中芯
            cg.setFillColor(red: 1, green: 1, blue: 1, alpha: CGFloat(0.85 * (1 - progress * 0.3)))
            cg.fill(CGRect(x: originX, y: cy - thickness * 0.25, width: length, height: thickness * 0.5))
            // 外縁ゴールド + グロー（多重ストローク）
            for (lw, a) in [(10.0, 0.35), (4.0, 1.0)] {
                cg.setStrokeColor(red: 1, green: 240.0/255, blue: 160.0/255, alpha: CGFloat(a))
                cg.setLineWidth(CGFloat(lw))
                cg.stroke(CGRect(x: originX, y: cy - thickness, width: length, height: thickness * 2))
            }
            // 疾走線 (スピードライン)
            for i in 0..<7 {
                let t = (nowMs / 200.0 + Double(i) * 0.14).truncatingRemainder(dividingBy: 1.0)
                let lx = originX + CGFloat(t) * length
                let ly = cy + ((i % 2 == 0) ? -1 : 1) * thickness * (0.3 + CGFloat(i % 3) * 0.25)
                cg.setStrokeColor(red: 1, green: 1, blue: 1, alpha: CGFloat(0.4 + 0.4 * (1 - t)))
                cg.setLineWidth(3)
                cg.beginPath()
                cg.move(to: CGPoint(x: lx - 40, y: ly))
                cg.addLine(to: CGPoint(x: lx + 20, y: ly))
                cg.strokePath()
            }
            // 先端の爆発光
            let tipX = originX + length
            if let tg = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                   colors: [
                                    UIColor(red: 1, green: 1, blue: 220.0/255, alpha: CGFloat(0.9 * (1 - progress))).cgColor,
                                    UIColor(red: 1, green: 180.0/255, blue: 80.0/255, alpha: CGFloat(0.7 * (1 - progress))).cgColor,
                                    UIColor(red: 1, green: 80.0/255, blue: 40.0/255, alpha: 0).cgColor
                                   ] as CFArray, locations: [0, 0.5, 1]) {
                cg.drawRadialGradient(tg, startCenter: CGPoint(x: tipX, y: cy), startRadius: 0, endCenter: CGPoint(x: tipX, y: cy), endRadius: thickness * 2, options: [])
            }
            // 飛散スパーク
            for i in 0..<8 {
                let sa = CGFloat(i) / 8.0 * .pi * 2
                let sr = thickness * (1 + CGFloat(progress) * 1.5) + sin(CGFloat(nowMs) / 60.0 + CGFloat(i)) * 4
                cg.setFillColor(red: 1, green: 220.0/255, blue: 100.0/255, alpha: CGFloat(0.85 * (1 - progress)))
                cg.fillEllipse(in: CGRect(x: tipX + cos(sa) * sr - 3, y: cy + sin(sa) * sr - 3, width: 6, height: 6))
            }
            // 土煙
            for i in 0..<6 {
                let px = originX + CGFloat(i) / 6.0 * length + CGFloat((nowMs / 120.0).truncatingRemainder(dividingBy: Double(length / 6)))
                let py = cy + sin(CGFloat(nowMs) / 50.0 + CGFloat(i)) * thickness * 0.6
                let r = 4 + CGFloat(i % 3) * 2
                cg.setFillColor(red: 180.0/255, green: 120.0/255, blue: 70.0/255, alpha: CGFloat(0.35 * (1 - progress)))
                cg.fillEllipse(in: CGRect(x: px - r, y: py - r, width: r * 2, height: r * 2))
            }
        }
        return Output(image: img, anchorPoint: CGPoint(x: padX / size.width, y: 0.5), rotation: rotation)
    }

    // MARK: - リング 予兆

    private static func renderRingTelegraph(innerRadius: CGFloat, outerRadius: CGFloat, nowMs: Double, progress: Double) -> Output {
        let pad: CGFloat = 16
        let size = CGSize(width: outerRadius * 2 + pad * 2, height: outerRadius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let pulse = 0.5 + sin(nowMs / 110.0) * 0.5
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // ドーナツ塗り
            cg.saveGState()
            cg.setFillColor(red: 180.0/255, green: 120.0/255, blue: 1, alpha: CGFloat(0.10 + 0.05 * pulse))
            cg.beginPath()
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: outerRadius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: innerRadius, startAngle: 0, endAngle: .pi * 2, clockwise: true)
            cg.fillPath(using: .evenOdd)
            cg.restoreGState()
            // 二重リング 外
            for (lw, a) in [(8.0, 0.35), (3.0, 0.85)] {
                cg.setStrokeColor(red: 200.0/255, green: 150.0/255, blue: 1, alpha: CGFloat(a))
                cg.setLineWidth(CGFloat(lw))
                cg.beginPath()
                cg.addArc(center: CGPoint(x: cx, y: cy), radius: outerRadius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
                cg.strokePath()
            }
            // 回転する破線リング
            cg.setLineDash(phase: CGFloat(nowMs.truncatingRemainder(dividingBy: 1000)) * 0.06, lengths: [10, 8])
            cg.setLineWidth(2)
            cg.setStrokeColor(red: 230.0/255, green: 200.0/255, blue: 1, alpha: 0.75)
            cg.beginPath()
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: outerRadius - 6, startAngle: 0, endAngle: .pi * 2, clockwise: false)
            cg.strokePath()
            cg.setLineDash(phase: 0, lengths: [])
            // 内縁
            cg.setStrokeColor(red: 200.0/255, green: 150.0/255, blue: 1, alpha: 0.9)
            cg.setLineWidth(3)
            cg.beginPath()
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: innerRadius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
            cg.strokePath()
            // 収縮するカウントダウンリング
            let shrinkR = innerRadius + (outerRadius - innerRadius) * CGFloat(1 - progress)
            cg.setStrokeColor(red: 1, green: 1, blue: 1, alpha: CGFloat(0.4 + 0.4 * pulse))
            cg.setLineWidth(2)
            cg.beginPath()
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: shrinkR, startAngle: 0, endAngle: .pi * 2, clockwise: false)
            cg.strokePath()
            // ルーン風放射マーク (8 方向)
            for i in 0..<8 {
                let a = CGFloat(i) / 8 * .pi * 2 + CGFloat(nowMs) / 900.0
                let rOuter = outerRadius - 2
                let rInner = outerRadius - 16
                cg.setStrokeColor(red: 220.0/255, green: 180.0/255, blue: 1, alpha: 0.75)
                cg.setLineWidth(2)
                cg.beginPath()
                cg.move(to: CGPoint(x: cx + cos(a) * rInner, y: cy + sin(a) * rInner))
                cg.addLine(to: CGPoint(x: cx + cos(a) * rOuter, y: cy + sin(a) * rOuter))
                cg.strokePath()
            }
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - リング 発動

    private static func renderRingActive(innerRadius: CGFloat, outerRadius: CGFloat, nowMs: Double, progress: Double) -> Output {
        let pad: CGFloat = 24
        let size = CGSize(width: outerRadius * 2 + pad * 2, height: outerRadius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let ringMid = (outerRadius + innerRadius) / 2
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // 灼熱グラデ
            if let grad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 1, green: 240.0/255, blue: 120.0/255, alpha: 0.1).cgColor,
                                        UIColor(red: 1, green: 180.0/255, blue: 60.0/255, alpha: CGFloat(0.7 * (1 - progress * 0.3))).cgColor,
                                        UIColor(red: 1, green: 80.0/255, blue: 60.0/255, alpha: CGFloat(0.85 * (1 - progress * 0.2))).cgColor,
                                        UIColor(red: 120.0/255, green: 0, blue: 80.0/255, alpha: 0.2).cgColor
                                     ] as CFArray, locations: [0, 0.3, 0.6, 1]) {
                cg.saveGState()
                cg.beginPath()
                cg.addArc(center: CGPoint(x: cx, y: cy), radius: outerRadius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
                cg.addArc(center: CGPoint(x: cx, y: cy), radius: innerRadius, startAngle: 0, endAngle: .pi * 2, clockwise: true)
                cg.clip(using: .evenOdd)
                cg.drawRadialGradient(grad, startCenter: CGPoint(x: cx, y: cy), startRadius: innerRadius, endCenter: CGPoint(x: cx, y: cy), endRadius: outerRadius, options: [])
                cg.restoreGState()
            }
            // 外縁・内縁を閃光で縁取り（多重ストロークで擬似グロー）
            for (r, lw, a) in [(outerRadius, 12.0, 0.35), (outerRadius, 5.0, 1.0), (innerRadius, 12.0, 0.35), (innerRadius, 5.0, 1.0)] {
                cg.setStrokeColor(red: 1, green: 1, blue: 1, alpha: CGFloat(a))
                cg.setLineWidth(CGFloat(lw))
                cg.beginPath()
                cg.addArc(center: CGPoint(x: cx, y: cy), radius: r, startAngle: 0, endAngle: .pi * 2, clockwise: false)
                cg.strokePath()
            }
            // リング上の閃光スパーク
            for i in 0..<14 {
                let a = CGFloat(i) / 14 * .pi * 2 + CGFloat(nowMs) / 180.0
                let r = ringMid + sin(CGFloat(nowMs) / 90.0 + CGFloat(i)) * 14
                cg.setFillColor(red: 1, green: 1, blue: 200.0/255, alpha: CGFloat(0.9 * (1 - progress)))
                cg.fillEllipse(in: CGRect(x: cx + cos(a) * r - 4, y: cy + sin(a) * r - 4, width: 8, height: 8))
            }
            // 外側へ飛び散る火花
            for i in 0..<10 {
                let a = CGFloat(i) / 10 * .pi * 2 + CGFloat(nowMs) / 220.0
                let r = outerRadius + CGFloat(progress) * 18 + sin(CGFloat(nowMs) / 100.0 + CGFloat(i)) * 4
                cg.setStrokeColor(red: 1, green: 200.0/255, blue: 80.0/255, alpha: CGFloat(0.7 * (1 - progress)))
                cg.setLineWidth(2)
                cg.beginPath()
                cg.move(to: CGPoint(x: cx + cos(a) * (outerRadius + 2), y: cy + sin(a) * (outerRadius + 2)))
                cg.addLine(to: CGPoint(x: cx + cos(a) * r, y: cy + sin(a) * r))
                cg.strokePath()
            }
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - 十字 予兆

    private static func renderCrossTelegraph(length: CGFloat, thickness: CGFloat, nowMs: Double, progress: Double) -> Output {
        let pad: CGFloat = 16
        let size = CGSize(width: length + pad * 2, height: length + pad * 2)
        let renderer = makeRenderer(size: size)
        let pulse = 0.5 + sin(nowMs / 110.0) * 0.5
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // 帯
            cg.setFillColor(red: 180.0/255, green: 80.0/255, blue: 1, alpha: CGFloat(0.16 + 0.08 * pulse))
            cg.fill(CGRect(x: cx - length / 2, y: cy - thickness, width: length, height: thickness * 2))
            cg.fill(CGRect(x: cx - thickness, y: cy - length / 2, width: thickness * 2, height: length))
            // 点線ボーダー
            cg.setLineDash(phase: 0, lengths: [10, 7])
            cg.setLineWidth(2)
            cg.setStrokeColor(red: 220.0/255, green: 180.0/255, blue: 1, alpha: 0.85)
            cg.stroke(CGRect(x: cx - length / 2, y: cy - thickness, width: length, height: thickness * 2))
            cg.stroke(CGRect(x: cx - thickness, y: cy - length / 2, width: thickness * 2, height: length))
            cg.setLineDash(phase: 0, lengths: [])
            // 詠唱サークル
            cg.setStrokeColor(red: 220.0/255, green: 180.0/255, blue: 1, alpha: 0.9)
            cg.setLineWidth(2)
            cg.beginPath()
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: 20 + CGFloat(pulse) * 4, startAngle: 0, endAngle: .pi * 2, clockwise: false)
            cg.strokePath()
            cg.setStrokeColor(red: 220.0/255, green: 180.0/255, blue: 1, alpha: 0.7)
            cg.beginPath()
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: 30 + CGFloat(pulse) * 6, startAngle: CGFloat(nowMs) / 700.0, endAngle: CGFloat(nowMs) / 700.0 + .pi * 1.5, clockwise: false)
            cg.strokePath()
            // 走る予兆エネルギー
            let beamOffset = CGFloat((progress * 2).truncatingRemainder(dividingBy: 1.0)) * length
            cg.setFillColor(red: 230.0/255, green: 200.0/255, blue: 1, alpha: 0.85)
            cg.fill(CGRect(x: cx - length / 2 + beamOffset - 12, y: cy - 2, width: 24, height: 4))
            cg.fill(CGRect(x: cx + length / 2 - beamOffset - 12, y: cy - 2, width: 24, height: 4))
            cg.fill(CGRect(x: cx - 2, y: cy - length / 2 + beamOffset - 12, width: 4, height: 24))
            cg.fill(CGRect(x: cx - 2, y: cy + length / 2 - beamOffset - 12, width: 4, height: 24))
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - 十字 発動

    private static func renderCrossActive(length: CGFloat, thickness: CGFloat, nowMs: Double, progress: Double) -> Output {
        let pad: CGFloat = 24
        let size = CGSize(width: length + pad * 2, height: length + pad * 2)
        let renderer = makeRenderer(size: size)
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // 横ビーム グラデ
            if let hg = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                   colors: [
                                    UIColor(red: 180.0/255, green: 60.0/255, blue: 1, alpha: 0.05).cgColor,
                                    UIColor(red: 1, green: 220.0/255, blue: 120.0/255, alpha: CGFloat(0.9 * (1 - progress * 0.3))).cgColor,
                                    UIColor(red: 180.0/255, green: 60.0/255, blue: 1, alpha: 0.05).cgColor
                                   ] as CFArray, locations: [0, 0.5, 1]) {
                cg.saveGState()
                cg.addRect(CGRect(x: cx - length / 2, y: cy - thickness, width: length, height: thickness * 2))
                cg.clip()
                cg.drawLinearGradient(hg, start: CGPoint(x: cx - length / 2, y: cy), end: CGPoint(x: cx + length / 2, y: cy), options: [])
                cg.restoreGState()
            }
            // 縦ビーム グラデ
            if let vg = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                   colors: [
                                    UIColor(red: 180.0/255, green: 60.0/255, blue: 1, alpha: 0.05).cgColor,
                                    UIColor(red: 1, green: 220.0/255, blue: 120.0/255, alpha: CGFloat(0.9 * (1 - progress * 0.3))).cgColor,
                                    UIColor(red: 180.0/255, green: 60.0/255, blue: 1, alpha: 0.05).cgColor
                                   ] as CFArray, locations: [0, 0.5, 1]) {
                cg.saveGState()
                cg.addRect(CGRect(x: cx - thickness, y: cy - length / 2, width: thickness * 2, height: length))
                cg.clip()
                cg.drawLinearGradient(vg, start: CGPoint(x: cx, y: cy - length / 2), end: CGPoint(x: cx, y: cy + length / 2), options: [])
                cg.restoreGState()
            }
            // 白い中芯
            cg.setFillColor(red: 1, green: 1, blue: 1, alpha: CGFloat(0.85 * (1 - progress * 0.4)))
            cg.fill(CGRect(x: cx - length / 2, y: cy - thickness * 0.25, width: length, height: thickness * 0.5))
            cg.fill(CGRect(x: cx - thickness * 0.25, y: cy - length / 2, width: thickness * 0.5, height: length))
            // 外縁ゴールド + グロー
            for (lw, a) in [(10.0, 0.35), (4.0, 1.0)] {
                cg.setStrokeColor(red: 1, green: 240.0/255, blue: 160.0/255, alpha: CGFloat(a))
                cg.setLineWidth(CGFloat(lw))
                cg.stroke(CGRect(x: cx - length / 2, y: cy - thickness, width: length, height: thickness * 2))
                cg.stroke(CGRect(x: cx - thickness, y: cy - length / 2, width: thickness * 2, height: length))
            }
            // 中心十字閃光
            let cR = 24 + CGFloat(1 - progress) * 12
            cg.setFillColor(red: 1, green: 1, blue: 1, alpha: CGFloat(0.9 * (1 - progress)))
            cg.fillEllipse(in: CGRect(x: cx - cR, y: cy - cR, width: cR * 2, height: cR * 2))
            // 先端ビームトレイル
            for dirSign in [-1, 1] {
                for i in 0..<4 {
                    let t = CGFloat(i) / 4
                    let alpha = CGFloat(0.6 * (1 - progress)) * (1 - t)
                    cg.setFillColor(red: 1, green: 230.0/255, blue: 160.0/255, alpha: alpha)
                    let dx = CGFloat(dirSign) * (length / 2 - 60 - CGFloat(i) * 28)
                    cg.fill(CGRect(x: cx + dx, y: cy - 3, width: 22, height: 6))
                    cg.fill(CGRect(x: cx - 3, y: cy + dx, width: 6, height: 22))
                }
            }
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - 自己回復 予兆

    /// C ボス自己回復スキルの予兆。緑のオーラと回復十字 (➕) のリングが浮かぶ。
    private static func renderHealTelegraph(radius: CGFloat, nowMs: Double, progress: Double) -> Output {
        let pad: CGFloat = 16
        let size = CGSize(width: radius * 2 + pad * 2, height: radius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // 緑の回復オーラ
            if let aura = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 140.0/255, green: 1, blue: 160.0/255, alpha: 0.40).cgColor,
                                        UIColor(red: 60.0/255, green: 200.0/255, blue: 110.0/255, alpha: 0.18).cgColor,
                                        UIColor(red: 10.0/255, green: 80.0/255, blue: 40.0/255, alpha: 0).cgColor
                                     ] as CFArray, locations: [0, 0.6, 1]) {
                cg.drawRadialGradient(aura, startCenter: CGPoint(x: cx, y: cy), startRadius: 10, endCenter: CGPoint(x: cx, y: cy), endRadius: radius, options: [])
            }
            // 外縁点線 (緑)
            cg.setLineDash(phase: 0, lengths: [12, 8])
            cg.setLineWidth(2)
            cg.setStrokeColor(red: 150.0/255, green: 1, blue: 170.0/255, alpha: 0.85)
            cg.beginPath()
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: radius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
            cg.strokePath()
            cg.setLineDash(phase: 0, lengths: [])
            // 上向きに湧き上がる光粒子 (回復の上昇感)
            for i in 0..<14 {
                let phase = (nowMs / 1300.0 + Double(i) * 0.07).truncatingRemainder(dividingBy: 1.0)
                let ang = CGFloat(i) / 14 * .pi * 2 + CGFloat(nowMs) / 2000.0
                let r = radius * CGFloat(0.2 + phase * 0.8)
                let alpha = CGFloat((1 - phase) * 0.9)
                cg.setFillColor(red: 200.0/255, green: 1, blue: 220.0/255, alpha: alpha)
                // 下から上へ吹き上がる位置
                let px = cx + cos(ang) * r
                let py = cy + sin(ang) * r - CGFloat(phase) * 30
                cg.fillEllipse(in: CGRect(x: px - 3, y: py - 3, width: 6, height: 6))
            }
            // 中央に回復クロス (十字マーク)
            let crossArm = radius * 0.18
            let crossThick = radius * 0.05
            let crossAlpha: CGFloat = 0.75 + 0.2 * CGFloat(sin(nowMs / 220.0))
            cg.setFillColor(red: 1, green: 1, blue: 1, alpha: crossAlpha)
            cg.fill(CGRect(x: cx - crossArm, y: cy - crossThick / 2, width: crossArm * 2, height: crossThick))
            cg.fill(CGRect(x: cx - crossThick / 2, y: cy - crossArm, width: crossThick, height: crossArm * 2))
            // 収縮リング (仕込みの進行を視覚化)
            let shrinkR = radius * CGFloat(1 - progress * 0.4)
            cg.setStrokeColor(red: 220.0/255, green: 1, blue: 230.0/255, alpha: 0.7)
            cg.setLineWidth(2)
            cg.beginPath()
            cg.addArc(center: CGPoint(x: cx, y: cy), radius: shrinkR, startAngle: 0, endAngle: .pi * 2, clockwise: false)
            cg.strokePath()
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - 自己回復 発動

    /// C ボス自己回復スキルの発動中。強い緑の光が放射し、中央に回復十字マーク。
    private static func renderHealActive(radius: CGFloat, nowMs: Double, progress: Double) -> Output {
        let pad: CGFloat = 24
        let size = CGSize(width: radius * 2 + pad * 2, height: radius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let pulse = 0.4 + sin(nowMs / 80.0) * 0.6
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // 強い緑の回復パルス
            if let grad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 220.0/255, green: 1, blue: 230.0/255, alpha: CGFloat(0.75 * (1 - progress))).cgColor,
                                        UIColor(red: 120.0/255, green: 235.0/255, blue: 150.0/255, alpha: CGFloat(0.55 * (1 - progress))).cgColor,
                                        UIColor(red: 10.0/255, green: 100.0/255, blue: 40.0/255, alpha: 0).cgColor
                                     ] as CFArray, locations: [0, 0.4, 1]) {
                cg.drawRadialGradient(grad, startCenter: CGPoint(x: cx, y: cy), startRadius: 0, endCenter: CGPoint(x: cx, y: cy), endRadius: radius, options: [])
            }
            // リング輪郭 + グロー
            for (lw, a) in [(14.0, 0.30), (5.0, CGFloat(0.75 + 0.2 * pulse))] {
                cg.setStrokeColor(red: 200.0/255, green: 1, blue: 210.0/255, alpha: a)
                cg.setLineWidth(CGFloat(lw))
                cg.beginPath()
                cg.addArc(center: CGPoint(x: cx, y: cy), radius: radius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
                cg.strokePath()
            }
            // 外向きに放射する光 (回復の溢れ出る感)
            for i in 0..<16 {
                let phase = (nowMs / 320.0 + Double(i) * 0.062).truncatingRemainder(dividingBy: 1.0)
                let a = CGFloat(i) / 16 * .pi * 2 + CGFloat(nowMs) / 420.0
                let r1 = radius * CGFloat(phase)
                let r2 = radius * CGFloat(min(1, phase + 0.18))
                cg.setStrokeColor(red: 220.0/255, green: 1, blue: 235.0/255, alpha: CGFloat(0.85 * (1 - phase)))
                cg.setLineWidth(2)
                cg.beginPath()
                cg.move(to: CGPoint(x: cx + cos(a) * r1, y: cy + sin(a) * r1))
                cg.addLine(to: CGPoint(x: cx + cos(a) * r2, y: cy + sin(a) * r2))
                cg.strokePath()
            }
            // 中央の強い白+緑の輝き
            let r1 = 18 + CGFloat(pulse) * 8
            cg.setFillColor(red: 1, green: 1, blue: 1, alpha: 0.9)
            cg.fillEllipse(in: CGRect(x: cx - r1, y: cy - r1, width: r1 * 2, height: r1 * 2))
            let r2 = 32 + CGFloat(pulse) * 10
            cg.setFillColor(red: 180.0/255, green: 1, blue: 200.0/255, alpha: 0.75)
            cg.fillEllipse(in: CGRect(x: cx - r2, y: cy - r2, width: r2 * 2, height: r2 * 2))
            // 中央の大きめ回復クロス
            let crossArm = radius * 0.22
            let crossThick = radius * 0.07
            cg.setFillColor(red: 1, green: 1, blue: 1, alpha: 0.95)
            cg.fill(CGRect(x: cx - crossArm, y: cy - crossThick / 2, width: crossArm * 2, height: crossThick))
            cg.fill(CGRect(x: cx - crossThick / 2, y: cy - crossArm, width: crossThick, height: crossArm * 2))
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - 血溜まり

    private static func renderBloodPool(radius: CGFloat, nowMs: Double, progress: Double, idHash: Int) -> Output {
        let pad: CGFloat = radius * 0.5 + 8
        let size = CGSize(width: radius * 2 + pad * 2, height: radius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let fadeAlpha: CGFloat = progress > 0.85 ? max(0, 1 - CGFloat((progress - 0.85) / 0.15)) : 1
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // 暗い外周ハロー
            if let halo = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 100.0/255, green: 10.0/255, blue: 20.0/255, alpha: 0).cgColor,
                                        UIColor(red: 90.0/255, green: 10.0/255, blue: 15.0/255, alpha: CGFloat(0.2) * fadeAlpha).cgColor,
                                        UIColor(red: 80.0/255, green: 10.0/255, blue: 10.0/255, alpha: 0).cgColor
                                     ] as CFArray, locations: [0, 0.6, 1]) {
                cg.drawRadialGradient(halo, startCenter: CGPoint(x: cx, y: cy), startRadius: radius * 0.2, endCenter: CGPoint(x: cx, y: cy), endRadius: radius * 1.3, options: [])
            }
            // 不規則な縁
            let wobbleT = nowMs * 0.0012 + Double(idHash) * 0.0017
            let segs = 28
            cg.beginPath()
            for i in 0...segs {
                let a = CGFloat(i) / CGFloat(segs) * .pi * 2
                let noise = sin(a * 3 + CGFloat(wobbleT) * 1.2) * 0.07
                    + sin(a * 5 - CGFloat(wobbleT) * 1.6) * 0.04
                    + cos(a * 2 + CGFloat(wobbleT) * 0.8) * 0.05
                let r = radius * (1 + noise)
                let px = cx + cos(a) * r
                let py = cy + sin(a) * r
                if i == 0 { cg.move(to: CGPoint(x: px, y: py)) } else { cg.addLine(to: CGPoint(x: px, y: py)) }
            }
            cg.closePath()
            cg.saveGState()
            cg.clip()
            // 本体: 鮮やかな赤→深紅のグラデ
            if let body = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 220.0/255, green: 50.0/255, blue: 50.0/255, alpha: CGFloat(0.75) * fadeAlpha).cgColor,
                                        UIColor(red: 170.0/255, green: 20.0/255, blue: 30.0/255, alpha: CGFloat(0.72) * fadeAlpha).cgColor,
                                        UIColor(red: 90.0/255, green: 0, blue: 10.0/255, alpha: CGFloat(0.85) * fadeAlpha).cgColor
                                     ] as CFArray, locations: [0, 0.55, 1]) {
                cg.drawRadialGradient(body, startCenter: CGPoint(x: cx, y: cy), startRadius: 0, endCenter: CGPoint(x: cx, y: cy), endRadius: radius, options: [])
            }
            // 光沢ハイライト
            cg.setFillColor(red: 1, green: 130.0/255, blue: 130.0/255, alpha: 0.25 * fadeAlpha)
            cg.fillEllipse(in: CGRect(x: cx - radius * 0.25 - radius * 0.45, y: cy - radius * 0.3 - radius * 0.22, width: radius * 0.9, height: radius * 0.44))
            cg.restoreGState()
            // 縁: 暗赤で二重
            cg.beginPath()
            for i in 0...segs {
                let a = CGFloat(i) / CGFloat(segs) * .pi * 2
                let noise = sin(a * 3 + CGFloat(wobbleT) * 1.2) * 0.07
                    + sin(a * 5 - CGFloat(wobbleT) * 1.6) * 0.04
                    + cos(a * 2 + CGFloat(wobbleT) * 0.8) * 0.05
                let r = radius * (1 + noise)
                let px = cx + cos(a) * r
                let py = cy + sin(a) * r
                if i == 0 { cg.move(to: CGPoint(x: px, y: py)) } else { cg.addLine(to: CGPoint(x: px, y: py)) }
            }
            cg.closePath()
            cg.setStrokeColor(red: 60.0/255, green: 0, blue: 10.0/255, alpha: 0.85 * fadeAlpha)
            cg.setLineWidth(2)
            cg.strokePath()
            cg.beginPath()
            for i in 0...segs {
                let a = CGFloat(i) / CGFloat(segs) * .pi * 2
                let noise = sin(a * 3 + CGFloat(wobbleT) * 1.2) * 0.07
                    + sin(a * 5 - CGFloat(wobbleT) * 1.6) * 0.04
                    + cos(a * 2 + CGFloat(wobbleT) * 0.8) * 0.05
                let r = radius * (1 + noise)
                let px = cx + cos(a) * r
                let py = cy + sin(a) * r
                if i == 0 { cg.move(to: CGPoint(x: px, y: py)) } else { cg.addLine(to: CGPoint(x: px, y: py)) }
            }
            cg.closePath()
            cg.setStrokeColor(red: 220.0/255, green: 40.0/255, blue: 40.0/255, alpha: 0.6 * fadeAlpha)
            cg.setLineWidth(1)
            cg.strokePath()
            // 飛び散った血滴
            for i in 0..<7 {
                let seed = Double(idHash) * 0.097 + Double(i) * 1.73
                let sa = CGFloat(seed * 5.7).truncatingRemainder(dividingBy: .pi * 2)
                let sr = radius * (0.95 + CGFloat(i % 3) * 0.1)
                let r = 2 + CGFloat(i % 3) * 1.5
                cg.setFillColor(red: 150.0/255, green: 10.0/255, blue: 20.0/255, alpha: 0.75 * fadeAlpha)
                cg.fillEllipse(in: CGRect(x: cx + cos(sa) * sr - r, y: cy + sin(sa) * sr - r, width: r * 2, height: r * 2))
            }
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - 毒沼

    private static func renderAcidPool(radius: CGFloat, nowMs: Double, progress: Double, idHash: Int) -> Output {
        let pad: CGFloat = radius * 0.5 + 12
        let size = CGSize(width: radius * 2 + pad * 2, height: radius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let fadeAlpha: CGFloat = progress > 0.85 ? max(0, 1 - CGFloat((progress - 0.85) / 0.15)) : 1
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            // 毒気ハロー
            if let halo = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 60.0/255, green: 140.0/255, blue: 30.0/255, alpha: 0).cgColor,
                                        UIColor(red: 80.0/255, green: 180.0/255, blue: 40.0/255, alpha: 0.18 * fadeAlpha).cgColor,
                                        UIColor(red: 80.0/255, green: 180.0/255, blue: 40.0/255, alpha: 0).cgColor
                                     ] as CFArray, locations: [0, 0.6, 1]) {
                cg.drawRadialGradient(halo, startCenter: CGPoint(x: cx, y: cy), startRadius: radius * 0.2, endCenter: CGPoint(x: cx, y: cy), endRadius: radius * 1.35, options: [])
            }
            // 毒沼本体（不規則な縁）
            let wobbleSeed = Double(idHash) * 0.0017
            let wobbleT = nowMs * 0.0015 + wobbleSeed
            let segs = 28
            cg.beginPath()
            for i in 0...segs {
                let a = CGFloat(i) / CGFloat(segs) * .pi * 2
                let noise = sin(a * 3 + CGFloat(wobbleT) * 1.8) * 0.06
                    + sin(a * 5 - CGFloat(wobbleT) * 2.3) * 0.035
                    + cos(a * 2 + CGFloat(wobbleT)) * 0.04
                let r = radius * (1 + noise)
                let px = cx + cos(a) * r
                let py = cy + sin(a) * r
                if i == 0 { cg.move(to: CGPoint(x: px, y: py)) } else { cg.addLine(to: CGPoint(x: px, y: py)) }
            }
            cg.closePath()
            cg.saveGState()
            cg.clip()
            if let body = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 150.0/255, green: 230.0/255, blue: 80.0/255, alpha: 0.62 * fadeAlpha).cgColor,
                                        UIColor(red: 90.0/255, green: 190.0/255, blue: 40.0/255, alpha: 0.6 * fadeAlpha).cgColor,
                                        UIColor(red: 40.0/255, green: 110.0/255, blue: 20.0/255, alpha: 0.78 * fadeAlpha).cgColor
                                     ] as CFArray, locations: [0, 0.55, 1]) {
                cg.drawRadialGradient(body, startCenter: CGPoint(x: cx, y: cy), startRadius: 0, endCenter: CGPoint(x: cx, y: cy), endRadius: radius, options: [])
            }
            // 内部の暗いハイライト
            cg.setFillColor(red: 20.0/255, green: 60.0/255, blue: 10.0/255, alpha: 0.25 * fadeAlpha)
            let dr = radius * 0.55
            cg.fillEllipse(in: CGRect(x: cx + radius * 0.15 - dr, y: cy + radius * 0.2 - dr, width: dr * 2, height: dr * 2))
            cg.restoreGState()
            // 毒々しい縁
            cg.beginPath()
            for i in 0...segs {
                let a = CGFloat(i) / CGFloat(segs) * .pi * 2
                let noise = sin(a * 3 + CGFloat(wobbleT) * 1.8) * 0.06
                    + sin(a * 5 - CGFloat(wobbleT) * 2.3) * 0.035
                    + cos(a * 2 + CGFloat(wobbleT)) * 0.04
                let r = radius * (1 + noise)
                let px = cx + cos(a) * r
                let py = cy + sin(a) * r
                if i == 0 { cg.move(to: CGPoint(x: px, y: py)) } else { cg.addLine(to: CGPoint(x: px, y: py)) }
            }
            cg.closePath()
            cg.setStrokeColor(red: 180.0/255, green: 1, blue: 90.0/255, alpha: 0.85 * fadeAlpha)
            cg.setLineWidth(2.5)
            cg.strokePath()
            cg.beginPath()
            for i in 0...segs {
                let a = CGFloat(i) / CGFloat(segs) * .pi * 2
                let noise = sin(a * 3 + CGFloat(wobbleT) * 1.8) * 0.06
                    + sin(a * 5 - CGFloat(wobbleT) * 2.3) * 0.035
                    + cos(a * 2 + CGFloat(wobbleT)) * 0.04
                let r = radius * (1 + noise)
                let px = cx + cos(a) * r
                let py = cy + sin(a) * r
                if i == 0 { cg.move(to: CGPoint(x: px, y: py)) } else { cg.addLine(to: CGPoint(x: px, y: py)) }
            }
            cg.closePath()
            cg.setStrokeColor(red: 40.0/255, green: 80.0/255, blue: 10.0/255, alpha: 0.7 * fadeAlpha)
            cg.setLineWidth(1)
            cg.strokePath()
            // 泡
            for i in 0..<6 {
                let seed = Double(idHash) * 0.113 + Double(i) * 1.732
                let bx = cx + cos(CGFloat(seed * 4.2)) * radius * 0.55
                let by = cy + sin(CGFloat(seed * 3.7)) * radius * 0.5
                let phase = (nowMs * 0.0018 + seed).truncatingRemainder(dividingBy: 1.0)
                let rise = phase
                let br = radius * CGFloat(0.06 + rise * 0.12)
                let alpha = CGFloat((1 - rise) * 0.75) * fadeAlpha
                if alpha <= 0 { continue }
                cg.setFillColor(red: 210.0/255, green: 1, blue: 140.0/255, alpha: alpha * 0.6)
                cg.fillEllipse(in: CGRect(x: bx - br, y: by - CGFloat(rise) * 2 - br, width: br * 2, height: br * 2))
                cg.setStrokeColor(red: 160.0/255, green: 230.0/255, blue: 60.0/255, alpha: alpha)
                cg.setLineWidth(1.2)
                cg.strokeEllipse(in: CGRect(x: bx - br, y: by - CGFloat(rise) * 2 - br, width: br * 2, height: br * 2))
                cg.setFillColor(red: 240.0/255, green: 1, blue: 200.0/255, alpha: alpha * 0.8)
                let hr = br * 0.3
                cg.fillEllipse(in: CGRect(x: bx - br * 0.35 - hr, y: by - CGFloat(rise) * 2 - br * 0.35 - hr, width: hr * 2, height: hr * 2))
            }
            // 立ち昇る毒気
            for i in 0..<3 {
                let seed = Double(idHash) * 0.071 + Double(i) * 2.17
                let phase = (nowMs * 0.0009 + seed).truncatingRemainder(dividingBy: 1.0)
                let gx = cx + cos(CGFloat(seed * 5.3)) * radius * 0.4
                let gyTop = cy - CGFloat(phase) * radius * 1.2
                let alpha = CGFloat((1 - phase) * 0.22) * fadeAlpha
                if alpha <= 0 { continue }
                cg.setFillColor(red: 170.0/255, green: 230.0/255, blue: 90.0/255, alpha: alpha)
                cg.fillEllipse(in: CGRect(x: gx - radius * 0.12, y: gyTop - radius * 0.28, width: radius * 0.24, height: radius * 0.56))
            }
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - 卵 予兆 (現状未使用だが将来拡張用)

    private static func renderEggTelegraph(radius: CGFloat, nowMs: Double) -> Output {
        let pad: CGFloat = 8
        let size = CGSize(width: radius * 2 + pad * 2, height: radius * 2 + pad * 2)
        let renderer = makeRenderer(size: size)
        let pulse = 0.5 + sin(nowMs / 110.0) * 0.5
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            cg.setFillColor(red: 0.7, green: 0.8, blue: 0.3, alpha: 0.4 * CGFloat(pulse))
            cg.fillEllipse(in: CGRect(x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2))
            cg.setStrokeColor(red: 1, green: 1, blue: 0.3, alpha: 0.9)
            cg.setLineWidth(2)
            cg.strokeEllipse(in: CGRect(x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2))
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - 爆弾ミニオン 爆発 (Web 版 `SurvivalCanvas.tsx` の `bombExplosion` 描画準拠)

    /// B ボス ミニオン自爆時の爆風。時間経過で半径 `0.6 → 1.8` に拡大しながらフェードアウトし、
    /// 中央に 💥 のインパクト絵文字を置く。色合いは Web 版と同じ暖色系 (オレンジ) に揃える。
    private static func renderBombExplosion(radius: CGFloat, progress: Double) -> Output {
        // ハザード自体の range は一定 (`SurvivalBossHazard.kind.bombExplosion(radius)`) だが、
        // 演出としては `scaleFactor * radius` をキャンバスの中心に描く。
        // キャンバスサイズは最大スケール (`1.8`) + 余白ぶん確保する。
        let pad: CGFloat = 12
        let maxScale: CGFloat = 1.8
        let canvas = radius * 2 * maxScale + pad * 2
        let size = CGSize(width: canvas, height: canvas)
        let renderer = makeRenderer(size: size)
        let t = CGFloat(max(0, min(1, progress)))
        let scale = 0.6 + t * 1.2
        let alpha = CGFloat(0.75) * (1 - t)
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            let r = radius * scale

            // 外側ハロー (淡い黄色) で爆発感を強調。
            if let halo = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 1.0, green: 230.0/255, blue: 140.0/255, alpha: alpha * 0.9).cgColor,
                                        UIColor(red: 1.0, green: 150.0/255, blue: 40.0/255, alpha: alpha * 0.55).cgColor,
                                        UIColor(red: 1.0, green: 90.0/255, blue: 20.0/255, alpha: 0).cgColor
                                     ] as CFArray, locations: [0, 0.55, 1]) {
                cg.drawRadialGradient(halo, startCenter: CGPoint(x: cx, y: cy), startRadius: 0, endCenter: CGPoint(x: cx, y: cy), endRadius: r, options: [])
            }

            // 主爆風 (Web 版 `rgba(255, 140, 40, alpha)` 相当) をベタ塗り。
            cg.setFillColor(red: 1.0, green: 140.0/255, blue: 40.0/255, alpha: alpha)
            cg.fillEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))

            // 縁ライン (焦げる輪郭) でクッキリさせる。
            cg.setStrokeColor(red: 1.0, green: 200.0/255, blue: 80.0/255, alpha: CGFloat(0.85) * (1 - t))
            cg.setLineWidth(3)
            cg.strokeEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))

            // 💥 インパクト絵文字 (Web 版と同サイズ比)
            let impact = "💥" as NSString
            let font = UIFont.systemFont(ofSize: 36 * scale)
            let attr: [NSAttributedString.Key: Any] = [
                .font: font
            ]
            let textSize = impact.size(withAttributes: attr)
            impact.draw(at: CGPoint(x: cx - textSize.width / 2, y: cy - textSize.height / 2), withAttributes: attr)
        }
        return Output(image: img, anchorPoint: CGPoint(x: 0.5, y: 0.5), rotation: 0)
    }

    // MARK: - ボス毒弾 (acid projectile)

    /// 進行ベクトル `dx, dy` に応じた向きで毒弾を描画する。
    /// SpriteKit 配置時は `zRotation = 0` でよく、画像内ですでに進行方向に応じた装飾が付く。
    static func renderAcidProjectile(radius: CGFloat, dx: CGFloat, dy: CGFloat, nowMs: Double, idHash: Int) -> UIImage {
        let pad: CGFloat = radius * 2.4 + 8
        let size = CGSize(width: radius * 4.4 + pad * 2, height: radius * 4.4 + pad * 2)
        let renderer = makeRenderer(size: size)
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy = size.height / 2
            let t = nowMs * 0.008 + Double(idHash) * 0.17
            // 毒オーラ
            if let aura = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 160.0/255, green: 240.0/255, blue: 80.0/255, alpha: 0.55).cgColor,
                                        UIColor(red: 110.0/255, green: 210.0/255, blue: 50.0/255, alpha: 0.25).cgColor,
                                        UIColor(red: 80.0/255, green: 180.0/255, blue: 40.0/255, alpha: 0).cgColor
                                     ] as CFArray, locations: [0, 0.5, 1]) {
                cg.drawRadialGradient(aura, startCenter: CGPoint(x: cx, y: cy), startRadius: radius * 0.3, endCenter: CGPoint(x: cx, y: cy), endRadius: radius * 2.1, options: [])
            }
            // 軌跡 (進行方向の逆)
            let len = max(1, sqrt(dx * dx + dy * dy))
            let ndx = dx / len
            let ndy = dy / len
            cg.saveGState()
            cg.translateBy(x: cx - ndx * radius * 1.2, y: cy - ndy * radius * 1.2)
            cg.rotate(by: atan2(ndy, ndx))
            if let tg = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                   colors: [
                                    UIColor(red: 120.0/255, green: 200.0/255, blue: 40.0/255, alpha: 0).cgColor,
                                    UIColor(red: 150.0/255, green: 230.0/255, blue: 70.0/255, alpha: 0.65).cgColor
                                   ] as CFArray, locations: [0, 1]) {
                cg.saveGState()
                cg.addEllipse(in: CGRect(x: -radius * 2.2, y: -radius * 0.9, width: radius * 4.4, height: radius * 1.8))
                cg.clip()
                cg.drawLinearGradient(tg, start: CGPoint(x: -radius * 2.2, y: 0), end: CGPoint(x: radius * 2.2, y: 0), options: [])
                cg.restoreGState()
            }
            cg.restoreGState()
            // 本体（不定形液滴）
            cg.beginPath()
            let segs = 18
            for i in 0...segs {
                let a = CGFloat(i) / CGFloat(segs) * .pi * 2
                let wob = sin(a * 3 + CGFloat(t) * 1.2) * 0.14 + sin(a * 5 - CGFloat(t) * 1.8) * 0.08
                let r = radius * (1 + wob)
                let px = cx + cos(a) * r
                let py = cy + sin(a) * r
                if i == 0 { cg.move(to: CGPoint(x: px, y: py)) } else { cg.addLine(to: CGPoint(x: px, y: py)) }
            }
            cg.closePath()
            cg.saveGState()
            cg.clip()
            if let body = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                     colors: [
                                        UIColor(red: 220.0/255, green: 1, blue: 160.0/255, alpha: 0.95).cgColor,
                                        UIColor(red: 150.0/255, green: 230.0/255, blue: 70.0/255, alpha: 0.95).cgColor,
                                        UIColor(red: 60.0/255, green: 130.0/255, blue: 20.0/255, alpha: 0.95).cgColor
                                     ] as CFArray, locations: [0, 0.45, 1]) {
                cg.drawRadialGradient(body, startCenter: CGPoint(x: cx - radius * 0.3, y: cy - radius * 0.3), startRadius: 0, endCenter: CGPoint(x: cx, y: cy), endRadius: radius * 1.2, options: [])
            }
            cg.restoreGState()
            // 縁
            cg.beginPath()
            for i in 0...segs {
                let a = CGFloat(i) / CGFloat(segs) * .pi * 2
                let wob = sin(a * 3 + CGFloat(t) * 1.2) * 0.14 + sin(a * 5 - CGFloat(t) * 1.8) * 0.08
                let r = radius * (1 + wob)
                let px = cx + cos(a) * r
                let py = cy + sin(a) * r
                if i == 0 { cg.move(to: CGPoint(x: px, y: py)) } else { cg.addLine(to: CGPoint(x: px, y: py)) }
            }
            cg.closePath()
            cg.setStrokeColor(red: 40.0/255, green: 90.0/255, blue: 10.0/255, alpha: 0.85)
            cg.setLineWidth(1.2)
            cg.strokePath()
            // ハイライト
            cg.setFillColor(red: 240.0/255, green: 1, blue: 200.0/255, alpha: 0.8)
            let hr = radius * 0.28
            cg.fillEllipse(in: CGRect(x: cx - radius * 0.35 - hr, y: cy - radius * 0.35 - hr, width: hr * 2, height: hr * 2))
            // しずく
            for i in 0..<2 {
                let dripPhase = (nowMs * 0.003 + Double(idHash) * 0.11 + Double(i) * 0.41).truncatingRemainder(dividingBy: 1.0)
                let dripX = cx + (i == 0 ? -radius * 0.4 : radius * 0.4)
                let dripY = cy + radius * 0.3 + CGFloat(dripPhase) * radius * 1.2
                let dripR = radius * 0.18 * CGFloat(1 - dripPhase * 0.4)
                let dripAlpha = CGFloat((1 - dripPhase) * 0.75)
                if dripR <= 0 || dripAlpha <= 0 { continue }
                cg.setFillColor(red: 140.0/255, green: 220.0/255, blue: 60.0/255, alpha: dripAlpha)
                cg.fillEllipse(in: CGRect(x: dripX - dripR, y: dripY - dripR * 1.4, width: dripR * 2, height: dripR * 2.8))
            }
        }
        return img
    }

    // MARK: - ボス予備動作 警告

    /// `⚠️` アイコン付き警告リング + 残時間ゲージを描画。
    static func renderBossWindupWarning(progress: Double, nowMs: Double) -> UIImage {
        let size = CGSize(width: 90, height: 80)
        let renderer = makeRenderer(size: size)
        let pulse = 1 + sin(nowMs / 80.0) * 0.18
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let cx = size.width / 2
            let cy: CGFloat = 30
            let r = 22 * CGFloat(pulse)
            cg.setFillColor(red: 0, green: 0, blue: 0, alpha: 0.55)
            cg.fillEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))
            cg.setStrokeColor(red: 1, green: 80.0/255, blue: 80.0/255, alpha: CGFloat(0.6 + progress * 0.4))
            cg.setLineWidth(3)
            cg.strokeEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))
            // ⚠️ アイコン
            let warnText = "⚠️" as NSString
            let attr: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 28 * CGFloat(pulse))
            ]
            let textSize = warnText.size(withAttributes: attr)
            warnText.draw(at: CGPoint(x: cx - textSize.width / 2, y: cy - textSize.height / 2), withAttributes: attr)
            // 残時間ゲージ
            let gaugeW: CGFloat = 60
            let gaugeH: CGFloat = 4
            let gaugeY: CGFloat = cy + 24
            cg.setFillColor(red: 17.0/255, green: 17.0/255, blue: 17.0/255, alpha: 1)
            cg.fill(CGRect(x: cx - gaugeW / 2, y: gaugeY, width: gaugeW, height: gaugeH))
            cg.setFillColor(red: 239.0/255, green: 68.0/255, blue: 68.0/255, alpha: 1)
            cg.fill(CGRect(x: cx - gaugeW / 2, y: gaugeY, width: gaugeW * CGFloat(progress), height: gaugeH))
        }
        return img
    }

    // MARK: - ボス HP バー (頭上)

    /// 横長HPバー + フェーズマーカー (0.35 / 0.7) を描画。
    static func renderBossHpBar(ratio: CGFloat) -> UIImage {
        let barWidth: CGFloat = 120
        let barHeight: CGFloat = 6
        let size = CGSize(width: barWidth + 4, height: barHeight + 4)
        let renderer = makeRenderer(size: size)
        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            let originX: CGFloat = 2
            let originY: CGFloat = 2
            cg.setFillColor(red: 17.0/255, green: 17.0/255, blue: 17.0/255, alpha: 1)
            cg.fill(CGRect(x: originX, y: originY, width: barWidth, height: barHeight))
            let color: UIColor
            if ratio > 0.7 { color = UIColor(red: 239.0/255, green: 68.0/255, blue: 68.0/255, alpha: 1) }
            else if ratio > 0.35 { color = UIColor(red: 245.0/255, green: 158.0/255, blue: 11.0/255, alpha: 1) }
            else { color = UIColor(red: 220.0/255, green: 38.0/255, blue: 38.0/255, alpha: 1) }
            cg.setFillColor(color.cgColor)
            cg.fill(CGRect(x: originX, y: originY, width: barWidth * max(0, min(1, ratio)), height: barHeight))
            cg.setStrokeColor(red: 1, green: 1, blue: 1, alpha: 0.4)
            cg.setLineWidth(1)
            cg.stroke(CGRect(x: originX, y: originY, width: barWidth, height: barHeight))
            for m: CGFloat in [0.35, 0.7] {
                let x = originX + barWidth * m
                cg.setStrokeColor(red: 1, green: 1, blue: 1, alpha: 0.7)
                cg.beginPath()
                cg.move(to: CGPoint(x: x, y: originY))
                cg.addLine(to: CGPoint(x: x, y: originY + barHeight))
                cg.strokePath()
            }
        }
        return img
    }
}

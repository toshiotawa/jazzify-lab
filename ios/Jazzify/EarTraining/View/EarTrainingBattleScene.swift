import SpriteKit
import UIKit

/// 耳コピバトル用 SpriteKit シーン。
/// Web 版 [src/game/earTraining/EarTrainingBattleScene.ts](src/game/earTraining/EarTrainingBattleScene.ts) を移植。
/// HUD / ロビー / 結果モーダル / ピアノ等は SwiftUI 側で別途描画する。
@MainActor
final class EarTrainingBattleScene: SKScene, EarTrainingBattleSceneHandle {
    // MARK: - Constants

    private static let pianoOverlayHeight: CGFloat = 104
    private static let hudHeight: CGFloat = 104
    private static let phraseIntroFadeMs: TimeInterval = 2.6
    private static let floorClearanceFromPiano: CGFloat = 48
    private static let characterDisplaySize: CGFloat = 88
    private static let characterShadowWidth: CGFloat = 82
    private static let characterShadowHeight: CGFloat = 18
    private static let enemyKnockbackDelaySec: TimeInterval = 0.016

    private static func jazzBackdropEdgeColor() -> UIColor {
        UIColor(red: 0.018, green: 0.020, blue: 0.055, alpha: 1.0)
    }

    // MARK: - Public state

    private var snapshot: EarTrainingBattleSceneSnapshot?
    private var lastEffectId: Int = -1
    private var lastPhraseIntroKey: String?
    private var lastBuiltAvatarSignature: String?
    /// 着弾 (HP 反映) 通知をコントローラーへ伝えるブロック。
    var onEffectImpact: ((Int) -> Void)?

    // MARK: - Layers / nodes

    private let backgroundLayer = SKNode()
    private let characterLayer = SKNode()
    private let effectLayer = SKNode()
    private let phraseLayer = SKNode()
    private let cameraNode = SKCameraNode()

    private var playerNode: CharacterView?
    private var enemyNode: CharacterView?
    private var phraseIntroLabel: SKLabelNode?
    private var demoBubbleNode: SKSpriteNode?
    private var lastBuildSize: CGSize = .zero

    // MARK: - Init

    override init(size: CGSize) {
        super.init(size: size)
        scaleMode = .resizeFill
        backgroundColor = Self.jazzBackdropEdgeColor()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func didMove(to view: SKView) {
        super.didMove(to: view)
        if children.contains(cameraNode) == false {
            addChild(cameraNode)
            self.camera = cameraNode
        }
        resetCameraToCenter()
        // 背景/キャラ/演出/フレーズ層
        for node in [backgroundLayer, characterLayer, phraseLayer, effectLayer] where node.parent == nil {
            addChild(node)
        }
        rebuildScene()
    }

    override func didChangeSize(_ oldSize: CGSize) {
        super.didChangeSize(oldSize)
        if size != lastBuildSize {
            rebuildScene()
        }
    }

    // MARK: - Snapshot / Effects (EarTrainingBattleSceneHandle)

    func applySnapshot(_ snapshot: EarTrainingBattleSceneSnapshot) {
        let prevSnapshot = self.snapshot
        self.snapshot = snapshot
        let avatarSignature = "\(snapshot.playerAvatarName)|\(snapshot.enemyAvatarName)|\(snapshot.enemyAvatarFlipX ? 1 : 0)"
        let needsRebuild = prevSnapshot == nil
            || size != lastBuildSize
            || avatarSignature != lastBuiltAvatarSignature
        if needsRebuild {
            lastBuiltAvatarSignature = avatarSignature
            rebuildScene()
            return
        }
        // 軽量更新: フレーズイントロのみ再描画する（キャラの進行中アニメを温存）。
        let height = max(320, size.height)
        let width = max(320, size.width)
        let floorY = floorYForHeight(height)
        drawPhraseIntro(width: width, height: height, floorY: floorY)
    }

    func runEffect(_ command: EarTrainingBattleEffectCommand) {
        guard lastEffectId != command.id else { return }
        lastEffectId = command.id
        switch command.kind {
        case .correct: playCorrectEffect(command)
        case .complete: playCompleteEffect(command)
        case .miss: playEnemyAttackEffect(command, heavy: false)
        case .fail: playEnemyAttackEffect(command, heavy: true)
        }
    }

    // MARK: - Scene rebuild

    private func rebuildScene() {
        guard size.width > 0, size.height > 0 else { return }
        lastBuildSize = size
        backgroundLayer.removeAllChildren()
        characterLayer.removeAllChildren()
        phraseLayer.removeAllChildren()
        playerNode = nil
        enemyNode = nil
        // effectLayer は残す（進行中エフェクトを破壊しない）

        let width = max(320, size.width)
        let height = max(320, size.height)
        let floorY = floorYForHeight(height)

        resetCameraToCenter()
        drawBackground(width: width, height: height, floorY: floorY)
        drawCharacters(width: width, height: height, floorY: floorY)
        drawPhraseIntro(width: width, height: height, floorY: floorY)
        bringEffectLayerToFront()
    }

    private func bringEffectLayerToFront() {
        effectLayer.removeFromParent()
        addChild(effectLayer)
    }

    // MARK: - Background

    private func drawBackground(width: CGFloat, height: CGFloat, floorY: CGFloat) {
        let backdrop = SKSpriteNode(texture: makeBackdropTexture(width: width, height: height, floorY: floorY))
        backdrop.anchorPoint = CGPoint(x: 0.5, y: 0)
        backdrop.position = CGPoint(x: width / 2, y: 0)
        backdrop.size = CGSize(width: width, height: height)
        backgroundLayer.addChild(backdrop)

        let shadowRadiusX: CGFloat = 84
        let shadowRadiusY: CGFloat = 14
        let leftShadow = SKShapeNode(ellipseOf: CGSize(width: shadowRadiusX * 2, height: shadowRadiusY * 2))
        leftShadow.fillColor = UIColor.black.withAlphaComponent(0.2)
        leftShadow.strokeColor = .clear
        leftShadow.position = CGPoint(x: width * 0.23, y: floorY - 6)
        backgroundLayer.addChild(leftShadow)
        let rightShadow = SKShapeNode(ellipseOf: CGSize(width: shadowRadiusX * 2, height: shadowRadiusY * 2))
        rightShadow.fillColor = UIColor.black.withAlphaComponent(0.2)
        rightShadow.strokeColor = .clear
        rightShadow.position = CGPoint(x: width * 0.77, y: floorY - 6)
        backgroundLayer.addChild(rightShadow)
    }

    private func makeBackdropTexture(width: CGFloat, height: CGFloat, floorY: CGFloat) -> SKTexture {
        let textureSize = CGSize(width: max(1, width), height: max(1, height))
        let renderer = UIGraphicsImageRenderer(size: textureSize)
        let image = renderer.image { ctx in
            Self.paintJazzBarBackdrop(cgContext: ctx.cgContext, size: textureSize, floorY: floorY)
        }
        let texture = SKTexture(image: image)
        texture.filteringMode = .linear
        return texture
    }

    /// 画像アセット無しでジャズバー風の背景を描く（UIKit座標・上原点）。
    private static func paintJazzBarBackdrop(cgContext cg: CGContext, size textureSize: CGSize, floorY: CGFloat) {
        let width = textureSize.width
        let height = textureSize.height
        let fyMax = height - Self.hudHeight - 48
        let fyMin = Self.pianoOverlayHeight + 24
        let fyClamped = min(max(floorY, fyMin), fyMax)
        let wallHeightUi = height - fyClamped

        let rgb = CGColorSpaceCreateDeviceRGB()

        // 1 ベース: 天井〜壁（ワインレッド〜深いインディゴ）
        let baseColors = [
            UIColor(red: 0.22, green: 0.08, blue: 0.12, alpha: 1.0).cgColor,
            UIColor(red: 0.10, green: 0.05, blue: 0.16, alpha: 1.0).cgColor,
            UIColor(red: 0.035, green: 0.045, blue: 0.10, alpha: 1.0).cgColor,
            UIColor(red: 0.018, green: 0.020, blue: 0.055, alpha: 1.0).cgColor,
        ] as CFArray
        let baseLoc: [CGFloat] = [0, 0.35, 0.72, 1]
        if let g = CGGradient(colorsSpace: rgb, colors: baseColors, locations: baseLoc) {
            cg.drawLinearGradient(g, start: CGPoint(x: 0, y: 0), end: CGPoint(x: width, y: height), options: [.drawsAfterEndLocation])
        } else {
            Self.jazzBackdropEdgeColor().setFill()
            cg.fill(CGRect(origin: .zero, size: textureSize))
        }

        cg.saveGState()
        defer { cg.restoreGState() }

        func fillOval(_ r: CGRect) {
            cg.beginPath()
            cg.addEllipse(in: r)
            cg.fillPath()
        }

        // 2 フルワイド背面レンガ（端〜端に近く伸ばす。不透明な両柱カーテンは使わず）
        let wallBleed: CGFloat = max(14, width * 0.012)
        let brickLeft = wallBleed
        let brickRight = width - wallBleed
        let brickMargin: CGFloat = 0
        let brickTopUI = wallHeightUi * 0.06
        let brickBotUI = wallHeightUi * 0.90
        if brickBotUI - brickTopUI > 32, brickRight - brickLeft > 40 {
            let brickWall = CGRect(x: brickLeft + brickMargin, y: brickTopUI, width: brickRight - brickLeft - brickMargin * 2, height: brickBotUI - brickTopUI)
            cg.saveGState()
            cg.clip(to: brickWall)
            let mortar = UIColor(red: 0.11, green: 0.055, blue: 0.07, alpha: 1.0).cgColor
            cg.setFillColor(mortar)
            cg.fill(brickWall)
            let hues: [CGFloat] = [0.15, 0.13, 0.145, 0.12]
            let rowH: CGFloat = max(11, brickWall.height * 0.034)
            var rowY = brickWall.minY
            var rowParity = 0
            while rowY <= brickWall.maxY {
                let offsetX = CGFloat(rowParity % 2) * (rowH * 0.9)
                rowParity += 1
                var colX = brickWall.minX - rowH + offsetX
                let brickW = rowH * 2.85
                var col = 0
                while colX < brickWall.maxX {
                    cg.setAllowsAntialiasing(false)
                    let ix = hues[(col & 7) % hues.count]
                    cg.setFillColor(UIColor(red: ix + 0.035, green: ix * 0.72, blue: ix * 0.68, alpha: 1).cgColor)
                    let r = CGRect(x: colX, y: rowY, width: brickW + 2, height: rowH + 3)
                    cg.fill(CGRectInset(r, 1.2, 2))
                    col += 1
                    colX += brickW + 3
                }
                rowY += rowH + 4
            }
            cg.setBlendMode(.overlay)
            cg.setFillColor(UIColor(red: 0.25, green: 0.12, blue: 0.07, alpha: 0.12).cgColor)
            cg.fill(brickWall)
            cg.restoreGState()
            // ベースボード（ほぼ全幅）
            let baseboard = CGRect(x: brickLeft, y: brickBotUI + 4, width: brickRight - brickLeft, height: max(26, wallHeightUi * 0.07))
            cg.setBlendMode(.normal)
            cg.setFillColor(UIColor(red: 0.06, green: 0.03, blue: 0.04, alpha: 0.94).cgColor)
            cg.fill(baseboard)
        }

        // 2-soft 両端のみ薄くドレープ感（不透明のピラーリングをしない）
        let drapeReach = min(max(width * 0.072, 52), CGFloat(160))
        let drapeHue = UIColor(red: 0.16, green: 0.04, blue: 0.065, alpha: 1).cgColor
        let drapeHueClear = UIColor(red: 0.16, green: 0.04, blue: 0.065, alpha: 0).cgColor
        let midYi = wallHeightUi * 0.5
        if let gLeft = CGGradient(colorsSpace: rgb, colors: [drapeHue, drapeHueClear] as CFArray, locations: [0, 1]) {
            cg.drawLinearGradient(
                gLeft,
                start: CGPoint(x: 0, y: midYi),
                end: CGPoint(x: drapeReach, y: midYi),
                options: [.drawsAfterEndLocation]
            )
        }
        if let gRight = CGGradient(colorsSpace: rgb, colors: [drapeHueClear, drapeHue] as CFArray, locations: [0, 1]) {
            cg.drawLinearGradient(
                gRight,
                start: CGPoint(x: width - drapeReach, y: midYi),
                end: CGPoint(x: width, y: midYi),
                options: [.drawsAfterEndLocation]
            )
        }

        // 2c 左右奥に楽器シルエット（コントラバス・ドラム類の暗示）
        cg.setAllowsAntialiasing(true)
        let instAlpha: CGFloat = 0.42
        let instColor = UIColor(red: 0.02, green: 0.018, blue: 0.04, alpha: instAlpha).cgColor
        cg.setFillColor(instColor)
        let lipInsetTrim = wallBleed + 16
        let wx1 = wallBleed + width * 0.055
        let wx2 = width - wallBleed - width * 0.28
        let insYBase = brickBotUI > 48 ? brickBotUI - wallHeightUi * 0.12 : wallHeightUi * 0.78
        // バス側（細長ボディ＋ヘッド）
        let bassBody = CGRect(x: wx1, y: insYBase - wallHeightUi * 0.32, width: width * 0.055, height: wallHeightUi * 0.34)
        let bassHead = CGRect(x: bassBody.midX - 9, y: bassBody.minY - 18, width: 18, height: 26)
        cg.fill(bassBody)
        cg.fill(bassHead)
        let drumX = wx2 + width * 0.02
        let drumY = insYBase - wallHeightUi * 0.14
        fillOval(CGRect(x: drumX, y: drumY - 20, width: width * 0.11, height: width * 0.068))
        fillOval(CGRect(x: drumX + width * 0.08, y: drumY - 8, width: width * 0.086, height: width * 0.055))
        fillOval(CGRect(x: drumX + width * 0.18, y: drumY - 54, width: 40, height: 10))

        // 3 背面ボトル列（半透明シルエット）
        cg.setAllowsAntialiasing(true)
        let shelfRect = CGRect(
            x: width * 0.10,
            y: wallHeightUi * 0.22,
            width: width * 0.80,
            height: wallHeightUi * 0.38
        )
        let bottleHue = UIColor(red: 0.04, green: 0.035, blue: 0.08, alpha: 0.72)
        cg.setFillColor(bottleHue.cgColor)
        let bottleCount = 14
        for index in 0..<bottleCount {
            let t = CGFloat(index) / CGFloat(bottleCount - 1)
            let bx = shelfRect.minX + t * shelfRect.width + sin(Double(index) * 1.17) * 2
            let bW = CGFloat(5 + index % 3)
            let bH = shelfRect.height * CGFloat(0.55 + CGFloat(index % 5) * 0.07)
            let by = shelfRect.midY - bH * 0.5 + CGFloat((index % 3) - 1) * 6
            cg.fill(CGRect(x: bx - bW / 2, y: by, width: bW, height: bH))
        }

        // 4 アンバー系スポットライト（径方向）
        func castSpot(centerX: CGFloat, centerYUi: CGFloat, radius: CGFloat, alphaAmber: CGFloat) {
            guard let spot = CGGradient(
                colorsSpace: rgb,
                colors: [
                    UIColor(red: 0.98, green: 0.72, blue: 0.34, alpha: alphaAmber).cgColor,
                    UIColor(red: 0.45, green: 0.25, blue: 0.12, alpha: 0.0).cgColor,
                ] as CFArray,
                locations: [0, 1]
            )
            else { return }
            cg.drawRadialGradient(
                spot,
                startCenter: CGPoint(x: centerX, y: centerYUi),
                startRadius: 0,
                endCenter: CGPoint(x: centerX, y: centerYUi),
                endRadius: radius,
                options: [.drawsAfterEndLocation]
            )
        }

        cg.setBlendMode(.plusLighter)
        castSpot(centerX: width * 0.28, centerYUi: wallHeightUi * 0.08 + 8, radius: width * 0.72, alphaAmber: 0.118)
        castSpot(centerX: width * 0.53, centerYUi: wallHeightUi * 0.045, radius: width * 0.98, alphaAmber: 0.19)
        castSpot(centerX: width * 0.78, centerYUi: wallHeightUi * 0.09 + 8, radius: width * 0.68, alphaAmber: 0.108)
        // ステージ手前への集光（床ライン〜壁下寄り）
        castSpot(centerX: width * 0.52, centerYUi: wallHeightUi * 0.86, radius: max(width * 0.78, fyClamped * 0.5), alphaAmber: 0.15)
        cg.setBlendMode(.normal)

        // 5 バーカウンター帯（手前下端）
        let barSkCapDesired = min(Self.pianoOverlayHeight + 56, max(12, fyClamped - 10))
        if barSkCapDesired > 8 {
            let barRectUIKit = CGRect(x: 0, y: height - barSkCapDesired, width: width, height: barSkCapDesired)
            let woodDark = UIColor(red: 0.16, green: 0.09, blue: 0.06, alpha: 1.0).cgColor
            let woodLight = UIColor(red: 0.24, green: 0.14, blue: 0.095, alpha: 1.0).cgColor
            cg.setFillColor(woodDark)
            cg.fill(barRectUIKit)
            if let band = CGGradient(colorsSpace: rgb, colors: [woodLight, woodDark] as CFArray, locations: [0, 1]) {
                cg.drawLinearGradient(
                    band,
                    start: CGPoint(x: 0, y: barRectUIKit.maxY - 12),
                    end: CGPoint(x: 0, y: barRectUIKit.minY + 8),
                    options: []
                )
            }
            let goldTrim = UIColor(red: 0.78, green: 0.61, blue: 0.32, alpha: 0.75)
            cg.setStrokeColor(goldTrim.cgColor)
            cg.setLineWidth(2)
            let trimY = barRectUIKit.minY + 2
            cg.beginPath()
            cg.move(to: CGPoint(x: lipInsetTrim, y: trimY))
            cg.addLine(to: CGPoint(x: width - lipInsetTrim, y: trimY))
            cg.strokePath()
        }

        // 6 ダンスフロア（バーカウンター上〜足元）
        let parquetH = fyClamped - barSkCapDesired
        if parquetH > 12 {
            let pqRectUIKit = CGRect(x: 0, y: height - fyClamped, width: width, height: parquetH)
            cg.setFillColor(UIColor(red: 0.05, green: 0.04, blue: 0.065, alpha: 1.0).cgColor)
            cg.fill(pqRectUIKit)
            cg.setStrokeColor(UIColor(red: 0.09, green: 0.07, blue: 0.10, alpha: 0.45).cgColor)
            cg.setLineWidth(1)
            let dx: CGFloat = 16
            var xStride = -pqRectUIKit.height * 0.35
            let endStride = width + pqRectUIKit.height * 2
            while xStride < endStride {
                cg.beginPath()
                cg.move(to: CGPoint(x: xStride, y: pqRectUIKit.minY))
                cg.addLine(to: CGPoint(x: xStride + pqRectUIKit.height + 140, y: pqRectUIKit.maxY))
                cg.strokePath()
                xStride += dx
            }

            // 6b ダンスフロア手前の客席シルエット（密集する頭の列）
            let audBaseY = pqRectUIKit.minY + parquetH * 0.38
            cg.setAllowsAntialiasing(true)
            for seatIndex in 0..<26 {
                let norm = CGFloat(seatIndex + 2) / 28.0
                let jitter = CGFloat(sin(Double(seatIndex) * 1.13) * 4.5)
                let bx = pqRectUIKit.minX + pqRectUIKit.width * (0.045 + norm * 0.91) + jitter
                let headW = 15 + CGFloat(seatIndex % 5) * 2
                let headH = 11 + CGFloat((seatIndex / 7) % 3)
                let shoulderW = headW + 12
                let shoulderH = 8 + CGFloat(seatIndex % 3)
                cg.setFillColor(UIColor(red: 0.018, green: 0.012, blue: 0.038, alpha: 0.5 + CGFloat(seatIndex % 3) * 0.035).cgColor)
                fillOval(CGRect(x: bx - headW / 2, y: audBaseY + CGFloat(seatIndex % 5) - headH + 6, width: headW, height: headH))
                cg.fill(CGRect(x: bx - shoulderW / 2, y: audBaseY + CGFloat(seatIndex % 5) + 6, width: shoulderW, height: shoulderH))
            }
        }

        // 7 ステージ縁・壁床の境界（二重ゴールドライン／奥行き感）
        let lipToneStrong = UIColor(red: 0.82, green: 0.62, blue: 0.30, alpha: 0.55).cgColor
        let lipToneSoft = UIColor(red: 0.72, green: 0.55, blue: 0.26, alpha: 0.42).cgColor
        cg.setLineWidth(2)
        cg.setStrokeColor(lipToneStrong)
        cg.beginPath()
        cg.move(to: CGPoint(x: lipInsetTrim + 8, y: wallHeightUi - 3))
        cg.addLine(to: CGPoint(x: width - lipInsetTrim - 8, y: wallHeightUi - 3))
        cg.strokePath()
        cg.setLineWidth(3)
        cg.setStrokeColor(lipToneSoft)
        cg.beginPath()
        cg.move(to: CGPoint(x: lipInsetTrim + 8, y: wallHeightUi + 2))
        cg.addLine(to: CGPoint(x: width - lipInsetTrim - 8, y: wallHeightUi + 2))
        cg.strokePath()

        // 8 天井付近のみ軽いヴィネット（角をほんのり落とす）
        cg.setBlendMode(.multiply)
        cg.setAllowsAntialiasing(true)
        if let vignetteColors = CGGradient(colorsSpace: rgb,
                                           colors: [UIColor.black.withAlphaComponent(0.35).cgColor, UIColor.clear.cgColor] as CFArray,
                                           locations: [0, 1]) {
            let topY = height * 0.22
            cg.drawRadialGradient(
                vignetteColors,
                startCenter: CGPoint(x: width * 0.5, y: topY),
                startRadius: 0,
                endCenter: CGPoint(x: width * 0.5, y: topY),
                endRadius: max(width, wallHeightUi) * 1.08,
                options: [.drawsAfterEndLocation]
            )
        }
    }

    // MARK: - Characters

    private func drawCharacters(width: CGFloat, height: CGFloat, floorY: CGFloat) {
        guard let snapshot else { return }
        playerNode = createCharacter(
            x: width * 0.23,
            footY: floorY,
            isPlayer: true,
            avatarAssetName: snapshot.playerAvatarName,
            flipX: false
        )
        enemyNode = createCharacter(
            x: width * 0.77,
            footY: floorY,
            isPlayer: false,
            avatarAssetName: snapshot.enemyAvatarName,
            flipX: snapshot.enemyAvatarFlipX
        )
    }

    private func createCharacter(x: CGFloat, footY: CGFloat, isPlayer: Bool, avatarAssetName: String, flipX: Bool) -> CharacterView {
        let container = SKNode()
        container.position = CGPoint(x: x, y: footY)
        container.zPosition = 5

        let shadow = SKShapeNode(ellipseOf: CGSize(width: Self.characterShadowWidth, height: Self.characterShadowHeight))
        shadow.fillColor = UIColor.black.withAlphaComponent(0.34)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -4)
        container.addChild(shadow)

        var imageNode: SKSpriteNode?
        if let image = UIImage(named: avatarAssetName) {
            let texture = SKTexture(image: image)
            let sprite = SKSpriteNode(texture: texture)
            sprite.anchorPoint = CGPoint(x: 0.5, y: 0)
            sprite.size = CGSize(width: Self.characterDisplaySize, height: Self.characterDisplaySize)
            sprite.position = .zero
            sprite.xScale = flipX ? -1 : 1
            container.addChild(sprite)
            imageNode = sprite
        }

        let fallback = SKLabelNode(text: isPlayer ? "P" : "E")
        fallback.fontName = "AvenirNext-Heavy"
        fallback.fontSize = 34
        fallback.fontColor = .white
        fallback.verticalAlignmentMode = .baseline
        fallback.horizontalAlignmentMode = .center
        fallback.position = CGPoint(x: 0, y: 6)
        fallback.isHidden = imageNode != nil
        container.addChild(fallback)

        characterLayer.addChild(container)
        return CharacterView(container: container, image: imageNode, fallback: fallback)
    }

    // MARK: - Phrase intro

    private func drawPhraseIntro(width: CGFloat, height: CGFloat, floorY: CGFloat) {
        guard let snapshot, snapshot.totalPhrases > 0 else { return }
        if snapshot.showLobbyControls {
            phraseIntroLabel?.removeFromParent()
            phraseIntroLabel = nil
            lastPhraseIntroKey = nil
            return
        }
        let key = "\(snapshot.phraseIndex):\(snapshot.totalPhrases)"
        if lastPhraseIntroKey == key { return }
        lastPhraseIntroKey = key
        phraseIntroLabel?.removeFromParent()
        let label = SKLabelNode(text: snapshot.phraseIntroLine)
        label.fontName = "AvenirNext-Heavy"
        label.fontSize = 24
        label.fontColor = UIColor(red: 0.996, green: 0.953, blue: 0.780, alpha: 1.0)
        label.zPosition = 30
        let y = min(height - 190, max(floorY + 150, height * 0.55))
        label.position = CGPoint(x: width / 2, y: y)
        label.alpha = 0.95
        effectLayer.addChild(label)
        phraseIntroLabel = label
        let move = SKAction.moveBy(x: 0, y: 24, duration: Self.phraseIntroFadeMs)
        let fade = SKAction.fadeOut(withDuration: Self.phraseIntroFadeMs)
        let group = SKAction.group([move, fade])
        label.run(SKAction.sequence([group, SKAction.removeFromParent()])) { [weak self, weak label] in
            guard let self else { return }
            if self.phraseIntroLabel === label { self.phraseIntroLabel = nil }
        }
    }

    // MARK: - Effects

    private func playCorrectEffect(_ command: EarTrainingBattleEffectCommand) {
        let anchors = battleAnchors()
        let fireball = makeEffectSprite(name: "ear-training-effect-fireball", size: 78)
        fireball.position = CGPoint(x: anchors.player.x + 44, y: anchors.player.castY)
        fireball.zRotation = -24 * (.pi / 180)
        effectLayer.addChild(fireball)

        let glow = SKShapeNode(circleOfRadius: 22)
        glow.fillColor = UIColor(red: 0.976, green: 0.451, blue: 0.086, alpha: 0.34)
        glow.strokeColor = .clear
        glow.position = fireball.position
        effectLayer.addChild(glow)

        let move = SKAction.move(to: CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY), duration: 0.54)
        move.timingMode = .easeIn
        let resize = SKAction.resize(toWidth: 96, height: 96, duration: 0.54)
        let rotate = SKAction.rotate(toAngle: 16 * (.pi / 180), duration: 0.54, shortestUnitArc: false)
        fireball.run(SKAction.group([move, resize, rotate])) { [weak self, weak fireball] in
            guard let self else { return }
            fireball?.removeFromParent()
            self.flashCharacter(.enemy)
            self.showImpactBurst(at: CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY), color: UIColor(red: 0.984, green: 0.573, blue: 0.235, alpha: 1.0), large: false)
            self.showEnemyDamageText(damage: command.damage, anchors: anchors.enemy)
            self.onEffectImpact?(command.id)
            self.knockEnemyAfterDamage(distance: 24, durationMs: 170)
        }
        glow.run(SKAction.sequence([
            SKAction.group([
                SKAction.move(to: CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY), duration: 0.54),
                SKAction.scale(to: 0.72, duration: 0.54),
            ]),
            SKAction.removeFromParent(),
        ]))
    }

    private func playCompleteEffect(_ command: EarTrainingBattleEffectCommand) {
        let label = command.label ?? "Good"
        let isSuperPerfect = label == "Perfect" && (command.phraseNoteCount ?? 0) >= 6
        let displayLabel = isSuperPerfect ? "Awesome!" : label
        let anchors = battleAnchors()
        showFloatingResultText(label: displayLabel, x: anchors.player.x, y: anchors.player.resultTextY, color: rankColor(label: displayLabel))

        if isSuperPerfect {
            playMeteorEffect(command, anchors: anchors)
            return
        }
        if label == "Perfect" {
            playLightningEffect(command, anchors: anchors)
            return
        }
        if label == "Great" {
            playSnowflakeEffect(command, anchors: anchors)
            return
        }
        playGoodCompleteEffect(command, anchors: anchors)
    }

    private func playEnemyAttackEffect(_ command: EarTrainingBattleEffectCommand, heavy: Bool) {
        let anchors = battleAnchors()
        if heavy {
            showFloatingResultText(label: command.label ?? "Fail", x: anchors.player.x, y: anchors.player.resultTextY, color: UIColor(red: 0.996, green: 0.792, blue: 0.792, alpha: 1.0))
        }
        knockCharacter(.enemy, distance: -18, durationMs: 170)

        let slashWidth: CGFloat = heavy ? 128 : 78
        let slashHeight: CGFloat = heavy ? 22 : 15
        let slash = SKShapeNode(rect: CGRect(x: -slashWidth / 2, y: -slashHeight / 2, width: slashWidth, height: slashHeight), cornerRadius: 4)
        slash.fillColor = UIColor(red: 0.984, green: 0.447, blue: 0.522, alpha: 1.0)
        slash.strokeColor = UIColor(red: 0.992, green: 0.949, blue: 0.969, alpha: 0.82)
        slash.lineWidth = 2
        slash.position = CGPoint(x: anchors.enemy.x - 28, y: anchors.enemy.bodyY)
        slash.zRotation = -0.18
        effectLayer.addChild(slash)

        let cameraShakeIntensity: CGFloat = heavy ? 12 : 7
        cameraShake(amplitude: cameraShakeIntensity, durationMs: heavy ? 240 : 150)

        let dx = anchors.player.x - slash.position.x
        let dy = anchors.player.bodyY - slash.position.y
        let move = SKAction.moveBy(x: dx, y: dy, duration: heavy ? 0.7 : 0.52)
        move.timingMode = .easeIn
        let scale = SKAction.scaleX(to: 1.6, duration: heavy ? 0.7 : 0.52)
        let fade = SKAction.fadeOut(withDuration: heavy ? 0.7 : 0.52)
        slash.run(SKAction.group([move, scale, fade])) { [weak self, weak slash] in
            guard let self else { return }
            slash?.removeFromParent()
            self.flashCharacter(.player)
            self.showImpactBurst(at: CGPoint(x: anchors.player.x, y: anchors.player.bodyY), color: UIColor(red: 0.984, green: 0.447, blue: 0.522, alpha: 1.0), large: heavy)
            self.onEffectImpact?(command.id)
            self.knockCharacter(.player, distance: heavy ? -52 : -32, durationMs: heavy ? 290 : 210)
        }
    }

    private func playGoodCompleteEffect(_ command: EarTrainingBattleEffectCommand, anchors: BattleAnchors) {
        createCastEffect(at: CGPoint(x: anchors.player.x, y: anchors.player.castY), power: 1.35)
        let ring = makeEffectSprite(name: "ear-training-effect-fire-ring", size: 64)
        ring.position = CGPoint(x: anchors.player.x + 42, y: anchors.player.castY)
        ring.alpha = 0.92
        effectLayer.addChild(ring)
        let move = SKAction.move(to: CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY), duration: 0.68)
        move.timingMode = .easeOut
        let rotate = SKAction.rotate(byAngle: 540 * (.pi / 180), duration: 0.68)
        let resize = SKAction.resize(toWidth: 176, height: 176, duration: 0.68)
        ring.run(SKAction.group([move, rotate, resize])) { [weak self, weak ring] in
            guard let self else { return }
            ring?.run(SKAction.group([
                SKAction.resize(toWidth: 226, height: 226, duration: 0.26),
                SKAction.fadeOut(withDuration: 0.26),
            ])) {
                ring?.removeFromParent()
            }
            self.applyCompletionImpact(
                anchors: anchors,
                color: UIColor(red: 0.980, green: 0.800, blue: 0.082, alpha: 1.0),
                knockbackDistance: 84,
                knockbackDurationMs: 330,
                tintColor: UIColor(red: 0.996, green: 0.941, blue: 0.522, alpha: 1.0),
                damage: command.damage
            ) {
                self.onEffectImpact?(command.id)
            }
        }
    }

    private func playSnowflakeEffect(_ command: EarTrainingBattleEffectCommand, anchors: BattleAnchors) {
        createCastEffect(at: CGPoint(x: anchors.player.x, y: anchors.player.castY), power: 1.6)
        let snowflake = makeEffectSprite(name: "ear-training-effect-snowflake", size: 72)
        snowflake.position = CGPoint(x: anchors.player.x + 42, y: anchors.player.castY)
        effectLayer.addChild(snowflake)
        let move = SKAction.move(to: CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY), duration: 0.86)
        move.timingMode = .easeInEaseOut
        let resize = SKAction.resize(toWidth: 154, height: 154, duration: 0.86)
        let rotate = SKAction.rotate(byAngle: 720 * (.pi / 180), duration: 0.86)
        snowflake.run(SKAction.group([move, resize, rotate])) { [weak self, weak snowflake] in
            guard let self else { return }
            snowflake?.removeFromParent()
            self.applyCompletionImpact(
                anchors: anchors,
                color: UIColor(red: 0.576, green: 0.773, blue: 0.992, alpha: 1.0),
                knockbackDistance: 106,
                knockbackDurationMs: 360,
                tintColor: UIColor(red: 0.490, green: 0.827, blue: 0.988, alpha: 1.0),
                damage: command.damage
            ) {
                self.onEffectImpact?(command.id)
            }
        }
    }

    private func playLightningEffect(_ command: EarTrainingBattleEffectCommand, anchors: BattleAnchors) {
        createCastEffect(at: CGPoint(x: anchors.player.x, y: anchors.player.castY), power: 1.9)
        let cloud = makeEffectSprite(name: "ear-training-effect-cloud", size: 148)
        cloud.position = CGPoint(x: anchors.enemy.x, y: anchors.enemy.headY + 32)
        cloud.alpha = 0.9
        effectLayer.addChild(cloud)
        cameraShake(amplitude: 6, durationMs: 200)

        let lightning = makeEffectSprite(name: "ear-training-effect-lightning", size: 190)
        lightning.position = CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY + 34)
        lightning.zRotation = 4 * (.pi / 180)
        lightning.alpha = 0
        effectLayer.addChild(lightning)

        // Web `playLightningEffect`: 470ms 後に落雷とダメージを同時に適用し、その後 delay 260ms → fade 420ms。
        let strike = SKAction.sequence([
            SKAction.wait(forDuration: 0.47),
            SKAction.group([
                SKAction.fadeIn(withDuration: 0.05),
                SKAction.run { [weak self] in
                    guard let self else { return }
                    self.applyCompletionImpact(
                        anchors: anchors,
                        color: UIColor(red: 0.996, green: 0.941, blue: 0.522, alpha: 1.0),
                        knockbackDistance: 122,
                        knockbackDurationMs: 390,
                        tintColor: UIColor(red: 0.996, green: 0.941, blue: 0.522, alpha: 1.0),
                        damage: command.damage
                    ) {
                        self.onEffectImpact?(command.id)
                    }
                },
            ]),
            SKAction.wait(forDuration: 0.26),
            SKAction.fadeOut(withDuration: 0.42),
            SKAction.removeFromParent(),
        ])
        lightning.run(strike)

        cloud.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.73),
            SKAction.fadeOut(withDuration: 0.42),
            SKAction.removeFromParent(),
        ]))
    }

    private func playMeteorEffect(_ command: EarTrainingBattleEffectCommand, anchors: BattleAnchors) {
        zoomToPlayer(anchors: anchors, holdMs: 1080) { [weak self] in
            self?.launchMeteor(command, anchors: anchors)
        }
        createMagicCircle(at: CGPoint(x: anchors.player.x, y: anchors.player.footY + 12), size: 190, color: UIColor(red: 0.976, green: 0.451, blue: 0.086, alpha: 1.0))
        createMagicCircle(at: CGPoint(x: anchors.player.x, y: anchors.player.footY + 12), size: 138, color: UIColor(red: 0.996, green: 0.941, blue: 0.522, alpha: 1.0))
        createCastEffect(at: CGPoint(x: anchors.player.x, y: anchors.player.castY), power: 2.65)
        showChantText(at: CGPoint(x: anchors.player.x, y: anchors.player.headY + 38), label: "Awesome!")
    }

    private func launchMeteor(_ command: EarTrainingBattleEffectCommand, anchors: BattleAnchors) {
        let meteor = makeEffectSprite(name: "ear-training-effect-meteor", size: 230)
        let start = CGPoint(x: anchors.enemy.x - 148, y: anchors.enemy.headY + 230)
        meteor.position = start
        meteor.zRotation = -8 * (.pi / 180)
        effectLayer.addChild(meteor)
        let move = SKAction.move(to: CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY), duration: 0.98)
        move.timingMode = .easeIn
        let resize = SKAction.resize(toWidth: 352, height: 352, duration: 0.98)
        let rotate = SKAction.rotate(toAngle: 10 * (.pi / 180), duration: 0.98, shortestUnitArc: false)
        meteor.run(SKAction.group([move, resize, rotate])) { [weak self, weak meteor] in
            guard let self else { return }
            meteor?.removeFromParent()
            self.applyCompletionImpact(
                anchors: anchors,
                color: UIColor(red: 0.976, green: 0.451, blue: 0.086, alpha: 1.0),
                knockbackDistance: 172,
                knockbackDurationMs: 460,
                tintColor: UIColor(red: 1.000, green: 0.929, blue: 0.835, alpha: 1.0),
                damage: command.damage
            ) {
                self.onEffectImpact?(command.id)
            }
        }
    }

    private func applyCompletionImpact(
        anchors: BattleAnchors,
        color: UIColor,
        knockbackDistance: CGFloat,
        knockbackDurationMs: TimeInterval,
        tintColor: UIColor,
        damage: Int?,
        onImpact: @escaping () -> Void
    ) {
        flashCharacter(.enemy)
        tintEnemy(color: tintColor, durationMs: knockbackDurationMs + 260)
        showImpactBurst(at: CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY), color: color, large: true)
        showScreenFlash(color: color, alpha: 0.16)
        showCompletionAura(at: CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY), color: color)
        showEnemyDamageText(damage: damage, anchors: anchors.enemy)
        onImpact()
        knockEnemyAfterDamage(distance: knockbackDistance, durationMs: knockbackDurationMs)
    }

    // MARK: - Effect helpers

    private func makeEffectSprite(name: String, size: CGFloat) -> SKSpriteNode {
        let texture: SKTexture
        if let image = UIImage(named: name) {
            texture = SKTexture(image: image)
        } else {
            texture = SKTexture()
        }
        let sprite = SKSpriteNode(texture: texture)
        sprite.size = CGSize(width: size, height: size)
        sprite.zPosition = 50
        return sprite
    }

    private func createCastEffect(at position: CGPoint, power: CGFloat) {
        let ring = SKShapeNode(circleOfRadius: 30 * power)
        ring.fillColor = UIColor(red: 0.220, green: 0.741, blue: 0.973, alpha: 0.12)
        ring.strokeColor = UIColor(red: 0.647, green: 0.953, blue: 0.992, alpha: 0.9)
        ring.lineWidth = 2 + power
        ring.position = position
        effectLayer.addChild(ring)
        ring.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 1.5, duration: 0.52),
                SKAction.fadeOut(withDuration: 0.52),
            ]),
            SKAction.removeFromParent(),
        ]))

        for index in 0..<8 {
            let angle = (Double.pi * 2 * Double(index)) / 8.0
            let spark = SKShapeNode(circleOfRadius: 3 + power)
            spark.fillColor = UIColor(red: 0.996, green: 0.953, blue: 0.780, alpha: 0.86)
            spark.strokeColor = .clear
            spark.position = position
            effectLayer.addChild(spark)
            let dx = cos(angle) * 44 * Double(power)
            let dy = sin(angle) * 30 * Double(power)
            spark.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: CGFloat(dx), y: CGFloat(dy), duration: 0.44),
                    SKAction.fadeOut(withDuration: 0.44),
                ]),
                SKAction.removeFromParent(),
            ]))
        }
    }

    private func createMagicCircle(at position: CGPoint, size: CGFloat, color: UIColor) {
        let circle = SKShapeNode(circleOfRadius: size / 2)
        circle.strokeColor = color
        circle.lineWidth = 3
        circle.fillColor = .clear
        circle.position = position
        circle.alpha = 0.86
        effectLayer.addChild(circle)
        circle.run(SKAction.sequence([
            SKAction.group([
                SKAction.rotate(byAngle: .pi, duration: 0.92),
                SKAction.scale(to: 1.18, duration: 0.92),
                SKAction.fadeOut(withDuration: 0.92),
            ]),
            SKAction.removeFromParent(),
        ]))
    }

    private func showChantText(at position: CGPoint, label: String) {
        let text = SKLabelNode(text: label)
        text.fontName = "AvenirNext-Heavy"
        text.fontSize = 18
        text.fontColor = UIColor(red: 0.996, green: 0.941, blue: 0.522, alpha: 1.0)
        text.position = position
        text.zPosition = 60
        effectLayer.addChild(text)
        text.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: 0, y: 34, duration: 1.38),
                SKAction.scale(to: 1.32, duration: 1.38),
                SKAction.fadeOut(withDuration: 1.38),
            ]),
            SKAction.removeFromParent(),
        ]))
    }

    private func showFloatingResultText(label: String, x: CGFloat, y: CGFloat, color: UIColor) {
        let text = SKLabelNode(text: label)
        text.fontName = "AvenirNext-Heavy"
        text.fontSize = 28
        text.fontColor = color
        text.position = CGPoint(x: x, y: y)
        text.zPosition = 70
        effectLayer.addChild(text)
        text.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: 0, y: 58, duration: 0.92),
                SKAction.fadeOut(withDuration: 0.92),
                SKAction.scale(to: 1.18, duration: 0.92),
            ]),
            SKAction.removeFromParent(),
        ]))
    }

    private func showEnemyDamageText(damage: Int?, anchors: CharacterAnchors) {
        guard let damage, abs(damage) > 0 else { return }
        let displayDamage = Int(round(Double(abs(damage))))
        let text = SKLabelNode(text: "\(displayDamage)")
        text.fontName = "AvenirNext-Heavy"
        text.fontSize = 18
        text.fontColor = UIColor(red: 0.996, green: 0.792, blue: 0.792, alpha: 1.0)
        text.position = CGPoint(x: anchors.x + 28, y: anchors.headY - 18)
        text.zPosition = 70
        effectLayer.addChild(text)
        text.run(SKAction.sequence([
            SKAction.group([
                SKAction.moveBy(x: 10, y: 36, duration: 0.72),
                SKAction.fadeOut(withDuration: 0.72),
                SKAction.scale(to: 1.08, duration: 0.72),
            ]),
            SKAction.removeFromParent(),
        ]))
    }

    private func showImpactBurst(at position: CGPoint, color: UIColor, large: Bool) {
        let radius: CGFloat = large ? 46 : 24
        let ring = SKShapeNode(circleOfRadius: radius)
        ring.fillColor = color.withAlphaComponent(0.16)
        ring.strokeColor = UIColor.white.withAlphaComponent(large ? 0.9 : 0.72)
        ring.lineWidth = large ? 7 : 3
        ring.position = position
        effectLayer.addChild(ring)
        ring.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: large ? 2.25 : 1.6, duration: large ? 0.74 : 0.42),
                SKAction.fadeOut(withDuration: large ? 0.74 : 0.42),
            ]),
            SKAction.removeFromParent(),
        ]))
        let sparkCount = large ? 22 : 9
        for index in 0..<sparkCount {
            let angle = (Double.pi * 2 * Double(index)) / Double(sparkCount)
            let spark = SKShapeNode(circleOfRadius: large ? 5 : 3)
            spark.fillColor = color.withAlphaComponent(0.9)
            spark.strokeColor = .clear
            spark.position = position
            effectLayer.addChild(spark)
            let dx = cos(angle) * (large ? 104 : 44)
            let dy = sin(angle) * (large ? 68 : 30)
            spark.run(SKAction.sequence([
                SKAction.group([
                    SKAction.moveBy(x: CGFloat(dx), y: CGFloat(dy), duration: large ? 0.68 : 0.36),
                    SKAction.fadeOut(withDuration: large ? 0.68 : 0.36),
                ]),
                SKAction.removeFromParent(),
            ]))
        }
    }

    private func showCompletionAura(at position: CGPoint, color: UIColor) {
        let aura = SKShapeNode(circleOfRadius: 60)
        aura.fillColor = color.withAlphaComponent(0.14)
        aura.strokeColor = color.withAlphaComponent(0.82)
        aura.lineWidth = 5
        aura.position = position
        effectLayer.addChild(aura)
        aura.run(SKAction.sequence([
            SKAction.group([
                SKAction.scale(to: 2.15, duration: 0.82),
                SKAction.fadeOut(withDuration: 0.82),
            ]),
            SKAction.removeFromParent(),
        ]))
    }

    private func showScreenFlash(color: UIColor, alpha: CGFloat) {
        let flash = SKSpriteNode(color: color.withAlphaComponent(alpha), size: size)
        flash.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        flash.position = CGPoint(x: size.width / 2, y: size.height / 2)
        flash.zPosition = 90
        effectLayer.addChild(flash)
        flash.run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.36),
            SKAction.removeFromParent(),
        ]))
    }

    // MARK: - Camera

    private func cameraShake(amplitude: CGFloat, durationMs: TimeInterval) {
        let center = CGPoint(x: size.width / 2, y: size.height / 2)
        if cameraNode.position == .zero {
            cameraNode.position = center
        }
        let totalDuration = durationMs / 1000
        let stepCount = max(4, Int(totalDuration / 0.04))
        var actions: [SKAction] = []
        for _ in 0..<stepCount {
            let dx = CGFloat.random(in: -amplitude...amplitude)
            let dy = CGFloat.random(in: -amplitude...amplitude)
            actions.append(SKAction.moveBy(x: dx, y: dy, duration: totalDuration / Double(stepCount)))
        }
        let returnAction = SKAction.move(to: center, duration: 0.04)
        cameraNode.removeAction(forKey: "camera-shake")
        cameraNode.run(SKAction.sequence(actions + [returnAction]), withKey: "camera-shake")
    }

    private func zoomToPlayer(anchors: BattleAnchors, holdMs: TimeInterval, onReturned: @escaping () -> Void) {
        if cameraNode.position == .zero {
            resetCameraToCenter()
        }
        let panTo = CGPoint(x: anchors.player.x, y: anchors.player.bodyY)
        let pan = SKAction.move(to: panTo, duration: 0.24)
        pan.timingMode = .easeInEaseOut
        let zoomIn = SKAction.scale(to: 1.0 / 1.98, duration: 0.28)
        zoomIn.timingMode = .easeOut
        cameraNode.run(SKAction.group([pan, zoomIn])) { [weak self] in
            guard let self else { return }
            let center = CGPoint(x: self.size.width / 2, y: self.size.height / 2)
            let returnPan = SKAction.move(to: center, duration: 0.34)
            returnPan.timingMode = .easeInEaseOut
            let zoomOut = SKAction.scale(to: 1.0, duration: 0.34)
            zoomOut.timingMode = .easeInEaseOut
            self.cameraNode.run(SKAction.sequence([
                SKAction.wait(forDuration: holdMs / 1000),
                SKAction.group([returnPan, zoomOut]),
            ])) {
                onReturned()
            }
        }
    }

    private func resetCameraToCenter() {
        guard size.width > 0, size.height > 0 else { return }
        cameraNode.removeAllActions()
        cameraNode.position = CGPoint(x: size.width / 2, y: size.height / 2)
        cameraNode.setScale(1.0)
    }

    // MARK: - Character feedback

    private enum CharacterSide { case player, enemy }

    private func flashCharacter(_ side: CharacterSide) {
        guard let view = side == .player ? playerNode : enemyNode else { return }
        let yoyo = SKAction.sequence([
            SKAction.fadeAlpha(to: 0.35, duration: 0.07),
            SKAction.fadeAlpha(to: 1.0, duration: 0.07),
        ])
        view.container.run(SKAction.repeat(yoyo, count: side == .player ? 3 : 2))
    }

    private func knockCharacter(_ side: CharacterSide, distance: CGFloat, durationMs: TimeInterval, completion: (() -> Void)? = nil) {
        guard let view = side == .player ? playerNode : enemyNode else {
            completion?()
            return
        }
        let anchors = battleAnchors()
        let homePosition = side == .player
            ? CGPoint(x: anchors.player.x, y: anchors.player.footY)
            : CGPoint(x: anchors.enemy.x, y: anchors.enemy.footY)
        let totalDuration = durationMs / 1000
        let pushDuration = max(0.08, totalDuration * 0.38)
        let returnDuration = max(0.12, totalDuration - pushDuration)
        let rotation: CGFloat = (distance >= 0 ? 4 : -4) * (.pi / 180)
        view.container.removeAction(forKey: "knockback")
        view.container.position = homePosition
        view.container.zRotation = 0
        let push = SKAction.group([
            SKAction.move(to: CGPoint(x: homePosition.x + distance, y: homePosition.y + 10), duration: pushDuration),
            SKAction.rotate(toAngle: rotation, duration: pushDuration, shortestUnitArc: true),
        ])
        push.timingMode = .easeOut
        let back = SKAction.group([
            SKAction.move(to: homePosition, duration: returnDuration),
            SKAction.rotate(toAngle: 0, duration: returnDuration, shortestUnitArc: true),
        ])
        back.timingMode = .easeOut
        let complete = SKAction.run {
            completion?()
        }
        view.container.run(SKAction.sequence([push, back, complete]), withKey: "knockback")
    }

    private func knockEnemyAfterDamage(distance: CGFloat, durationMs: TimeInterval) {
        let delay = SKAction.wait(forDuration: Self.enemyKnockbackDelaySec)
        let runKnock = SKAction.run { [weak self] in
            self?.knockCharacter(.enemy, distance: distance, durationMs: durationMs)
        }
        run(SKAction.sequence([delay, runKnock]))
    }

    private func tintEnemy(color: UIColor, durationMs: TimeInterval) {
        guard let view = enemyNode else { return }
        view.image?.color = color
        view.image?.colorBlendFactor = 0.6
        view.fallback.fontColor = color
        run(SKAction.sequence([
            SKAction.wait(forDuration: durationMs / 1000),
            SKAction.run {
                view.image?.colorBlendFactor = 0
                view.image?.color = .clear
                view.fallback.fontColor = .white
            },
        ]))
    }

    // MARK: - Anchors

    private struct CharacterAnchors {
        let x: CGFloat
        let footY: CGFloat
        let bodyY: CGFloat
        let headY: CGFloat
        let castY: CGFloat
        let resultTextY: CGFloat
    }

    private struct BattleAnchors {
        let player: CharacterAnchors
        let enemy: CharacterAnchors
    }

    private func battleAnchors() -> BattleAnchors {
        let height = max(320, size.height)
        let width = max(320, size.width)
        let floorY = floorYForHeight(height)
        // SpriteKit 座標系では Web の Y を反転させる。Web の `bodyY = floorY - charSize*0.52` は
        // 「画面上端から Y 軸下向き」の値だったので、ここでは「床より上のオフセット」として正方向に変換する。
        func make(x: CGFloat) -> CharacterAnchors {
            CharacterAnchors(
                x: x,
                footY: floorY,
                bodyY: floorY + Self.characterDisplaySize * 0.52,
                headY: floorY + Self.characterDisplaySize * 0.96,
                castY: floorY + Self.characterDisplaySize * 0.42,
                resultTextY: floorY + Self.characterDisplaySize * 1.12
            )
        }
        return BattleAnchors(
            player: make(x: width * 0.23),
            enemy: make(x: width * 0.77)
        )
    }

    private func floorYForHeight(_ height: CGFloat) -> CGFloat {
        let minimumFloorY = Self.pianoOverlayHeight + 34
        let preferredFloorY = max(
            Self.pianoOverlayHeight + Self.floorClearanceFromPiano,
            height * 0.32
        )
        let maximumFloorY = height - Self.hudHeight - Self.characterDisplaySize * 1.1
        return max(minimumFloorY, min(preferredFloorY, maximumFloorY))
    }

    private func rankColor(label: String) -> UIColor {
        if label == "Awesome!" || label == "Perfect" {
            return UIColor(red: 0.996, green: 0.941, blue: 0.522, alpha: 1.0)
        }
        if label == "Great" {
            return UIColor(red: 0.749, green: 0.859, blue: 0.996, alpha: 1.0)
        }
        if label == "Good" {
            return UIColor(red: 0.733, green: 0.969, blue: 0.816, alpha: 1.0)
        }
        return UIColor(red: 0.996, green: 0.792, blue: 0.792, alpha: 1.0)
    }

    // MARK: - Helpers

    private struct CharacterView {
        let container: SKNode
        let image: SKSpriteNode?
        let fallback: SKLabelNode
    }
}

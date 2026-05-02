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
    private static let correctPlayerPoseDurationMs: TimeInterval = 300
    private static let skillPlayerPoseFrameMs: TimeInterval = 80
    private static let awesomeMagicCircleAlpha: CGFloat = 0.68
    private static let generatedTextureCacheLimit = 16
    private static var generatedTextureCache: [String: SKTexture] = [:]

    private enum PlayerAvatarPoseAsset {
        static let correctName = "correct3"
        static let skillNames = ["Frame1", "Frame2", "Frame3", "Frame4", "Frame5"]
    }

    /// 耳コピバトル スポットライト（図解仕様: 薄い円錐・足元プール・リム・ヴィネット）。
    private enum SpotlightStageLayout {
        enum Z {
            /// `backdrop` より手前、`localVignette` より奥。
            static let backdrop: CGFloat = 0
            /// ステージ周辺をわずかに締める（乗算）。
            static let localVignette: CGFloat = 0.38
            /// 細い円錐（スクリーン合成）。
            static let cone: CGFloat = 0.92
            /// 足元の楕円プール。
            static let floorPool: CGFloat = 1.18
        }

        /// 円錐の頂点（光源）を UIKit 上端付近に置き、天井スポットのように見せる（pt、上＝0 に近いほど高い）。
        /// コード帯は SwiftUI で上に重なるため、ここを上げても HUD の可読性は基本維持される。
        static let coneApexInsetFromTopUIKit: CGFloat = 2
        /// 床プール・旧シャドウと同程度の水平半径（pt）。
        static let floorPoolRadiusX: CGFloat = 84
        static let floorPoolRadiusY: CGFloat = 14
        /// 図解: Cone Alpha 0.08–0.16
        static let coneAlphaPlayer: CGFloat = 0.11
        static let coneAlphaEnemy: CGFloat = 0.13
        /// 図解: Floor Alpha 0.10–0.18
        static let floorPoolAlphaPlayer: CGFloat = 0.13
        static let floorPoolAlphaEnemy: CGFloat = 0.15
        /// 円錐の床位置での半幅（シーン幅比）。
        static let coneHalfWidthBottomFrac: CGFloat = 0.072
        static let coneHalfWidthTopFrac: CGFloat = 0.014
        /// 円錐の頂点を足元中心より中央方向へずらす（シーン幅比）。頭〜足の軸を内向きに。
        static let coneApexShiftTowardCenterFrac: CGFloat = 0.02
        /// 2700K〜3200K 相当の暖色。
        static let warmTintPlayer = UIColor(red: 255 / 255, green: 210 / 255, blue: 155 / 255, alpha: 1)
        static let warmTintEnemy = UIColor(red: 255 / 255, green: 200 / 255, blue: 175 / 255, alpha: 1)
        /// 局所ヴィネット（乗算）最大不透明度。
        static let localVignetteStrength: CGFloat = 0.42
        /// 最終ヴィネット（キャラ・床の上に薄く）。
        static let finalVignetteAlpha: CGFloat = 0.38
        static let finalVignetteReachFrac: CGFloat = 0.62
        /// リムライト ~0.12
        static let rimAlpha: CGFloat = 0.12
        static let rimScale: CGFloat = 1.048
        static let rimTintPlayer = UIColor(red: 255 / 255, green: 195 / 255, blue: 130 / 255, alpha: 1)
        static let rimTintEnemy = UIColor(red: 255 / 255, green: 175 / 255, blue: 150 / 255, alpha: 1)
    }

    private static func jazzBackdropEdgeColor() -> UIColor {
        UIColor(red: 14 / 255, green: 7 / 255, blue: 5 / 255, alpha: 1)
    }

    /// `drawBackground` の楽器レイアウト調整はここの定数のみで行う。
    /// 正面舞台: ピアノ上ネオン／左端ベース／左後ろピアノ（プレイヤー側）／敵より右へドラム（床置き）。
    /// 上中央コード帯と中央レーンは背景オブジェクトで埋めない。
    private enum JazzStagePropLayout {
        enum Asset {
            static let neon = "ear-training-bg-jazz-neon"
            static let drumKit = "ear-training-bg-drum-kit"
            static let piano = "ear-training-bg-upright-piano"
            static let doubleBass = "ear-training-bg-double-bass"
        }

        enum Z {
            /// 背面から手前への重ね順（中央はコード UI のためオブジェクトなし）。
            static let doubleBass: CGFloat = 2
            static let piano: CGFloat = 2.5
            static let drumKit: CGFloat = 3
            static let neon: CGFloat = 4
            static let floorShadow: CGFloat = 6
        }

        /// 背景オブジェクト全体をキャラ/UI より低コントラストに（ティント）。
        enum Dim {
            static let instrumentTint = UIColor(red: 38 / 255, green: 30 / 255, blue: 28 / 255, alpha: 1)
            /// 強いほど背景に溶け込みやすくなる。
            static let instrumentBlendFactor: CGFloat = 0.68
            static let neonTint = UIColor(red: 74 / 255, green: 60 / 255, blue: 55 / 255, alpha: 1)
            static let neonBlendFactor: CGFloat = 0.48
        }

        enum Neon {
            /// 上部帯・ピアノ列の上へ合わせる（水平は `CenterXF.piano` にアンカー上中央で重ねる）。
            static let anchor = CGPoint(x: 0.5, y: 1)
            static let widthFrac: CGFloat = 0.085
            /// `CenterXF.piano` との水平オフセット（pt）。
            static let horizontalOffsetFromPianoCenterPt: CGFloat = 2
            /// 画面上端からの下げ幅（ステータス・タイマー行の直下付近）。
            static let insetFromSceneTopPt: CGFloat = 64
        }

        enum DrumFloor {
            static let anchor = CGPoint(x: 0.5, y: 0)
            static let widthFrac: CGFloat = 0.138
            /// 敵（X ~77%）の右側へオフセット。右はみ出しはクリップ前提で収める。
            static let centerXPreferredFrac: CGFloat = 0.91
            static let marginFromSceneRightPt: CGFloat = 16
        }

        enum WidthFrac {
            static let piano: CGFloat = 0.13
            static let doubleBass: CGFloat = 0.10
        }

        enum CenterXF {
            static let doubleBass: CGFloat = 0.075
            /// プレイヤーと被りにくいようやや右へ（ネオンはこの中心に追従）。
            static let piano: CGFloat = 0.352
        }
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
    /// キャラ・床の上に載せる仕上げヴィネット（演出レイヤーより手前ではない）。
    private let finalVignetteLayer = SKNode()
    private let effectLayer = SKNode()
    private let phraseLayer = SKNode()
    private let cameraNode = SKCameraNode()

    private var playerNode: CharacterView?
    private var enemyNode: CharacterView?
    private var phraseIntroLabel: SKLabelNode?
    private var demoBubbleNode: SKSpriteNode?
    private var lastBuildSize: CGSize = .zero
    private var playerPoseToken = 0

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
        backgroundLayer.zPosition = 0
        characterLayer.zPosition = 10
        finalVignetteLayer.zPosition = 14
        phraseLayer.zPosition = 20
        effectLayer.zPosition = 100
        // 背景 / キャラ / 仕上げヴィネット / フレーズ / 演出
        for node in [backgroundLayer, characterLayer, finalVignetteLayer, phraseLayer, effectLayer] where node.parent == nil {
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
        finalVignetteLayer.removeAllChildren()
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
        drawFinalStageVignette(width: width, height: height)
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
        backdrop.zPosition = SpotlightStageLayout.Z.backdrop
        backgroundLayer.addChild(backdrop)

        drawStageSpotlights(width: width, height: height, floorY: floorY)

        addJazzStagePropSprites(width: width, height: height, floorY: floorY)

        let shadowRadiusX: CGFloat = 84
        let shadowRadiusY: CGFloat = 14
        let leftShadow = SKShapeNode(ellipseOf: CGSize(width: shadowRadiusX * 2, height: shadowRadiusY * 2))
        leftShadow.fillColor = UIColor.black.withAlphaComponent(0.17)
        leftShadow.strokeColor = .clear
        leftShadow.lineWidth = 0
        leftShadow.position = CGPoint(x: width * 0.23, y: floorY - 6)
        leftShadow.zPosition = JazzStagePropLayout.Z.floorShadow
        backgroundLayer.addChild(leftShadow)
        let rightShadow = SKShapeNode(ellipseOf: CGSize(width: shadowRadiusX * 2, height: shadowRadiusY * 2))
        rightShadow.fillColor = UIColor.black.withAlphaComponent(0.17)
        rightShadow.strokeColor = .clear
        rightShadow.lineWidth = 0
        rightShadow.position = CGPoint(x: width * 0.77, y: floorY - 6)
        rightShadow.zPosition = JazzStagePropLayout.Z.floorShadow
        backgroundLayer.addChild(rightShadow)
    }

    /// 図解順: 局所ヴィネット → 円錐 → 足元プール（楽器プロップより手前）。
    private func drawStageSpotlights(width: CGFloat, height: CGFloat, floorY: CGFloat) {
        let localTex = makeLocalSpotlightVignetteTexture(width: width, height: height, floorY: floorY)
        let localNode = SKSpriteNode(texture: localTex)
        localNode.anchorPoint = CGPoint(x: 0.5, y: 0)
        localNode.position = CGPoint(x: width / 2, y: 0)
        localNode.size = CGSize(width: width, height: height)
        localNode.zPosition = SpotlightStageLayout.Z.localVignette
        localNode.blendMode = .multiply
        localNode.alpha = 1.0
        backgroundLayer.addChild(localNode)

        addSpotlightConeNode(
            width: width,
            height: height,
            floorY: floorY,
            centerX: width * 0.23,
            apexTowardCenterShift: width * SpotlightStageLayout.coneApexShiftTowardCenterFrac,
            warmTint: SpotlightStageLayout.warmTintPlayer,
            peakAlpha: SpotlightStageLayout.coneAlphaPlayer,
            zSlot: 0
        )
        addSpotlightConeNode(
            width: width,
            height: height,
            floorY: floorY,
            centerX: width * 0.77,
            apexTowardCenterShift: -width * SpotlightStageLayout.coneApexShiftTowardCenterFrac,
            warmTint: SpotlightStageLayout.warmTintEnemy,
            peakAlpha: SpotlightStageLayout.coneAlphaEnemy,
            zSlot: 1
        )

        addFloorLightPoolNode(
            width: width,
            height: height,
            floorY: floorY,
            centerX: width * 0.23,
            warmTint: SpotlightStageLayout.warmTintPlayer,
            poolAlpha: SpotlightStageLayout.floorPoolAlphaPlayer,
            zSlot: 0
        )
        addFloorLightPoolNode(
            width: width,
            height: height,
            floorY: floorY,
            centerX: width * 0.77,
            warmTint: SpotlightStageLayout.warmTintEnemy,
            poolAlpha: SpotlightStageLayout.floorPoolAlphaEnemy,
            zSlot: 1
        )
    }

    private func addSpotlightConeNode(
        width: CGFloat,
        height: CGFloat,
        floorY: CGFloat,
        centerX: CGFloat,
        apexTowardCenterShift: CGFloat,
        warmTint: UIColor,
        peakAlpha: CGFloat,
        zSlot: Int
    ) {
        let tex = makeSpotlightConeTexture(
            width: width,
            height: height,
            floorY: floorY,
            centerX: centerX,
            apexTowardCenterShift: apexTowardCenterShift,
            warmTint: warmTint,
            peakAlpha: peakAlpha
        )
        let node = SKSpriteNode(texture: tex)
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.position = CGPoint(x: width / 2, y: 0)
        node.size = CGSize(width: width, height: height)
        node.zPosition = SpotlightStageLayout.Z.cone + CGFloat(zSlot) * 0.001
        node.blendMode = .screen
        node.alpha = 1.0
        backgroundLayer.addChild(node)
    }

    private func addFloorLightPoolNode(
        width: CGFloat,
        height: CGFloat,
        floorY: CGFloat,
        centerX: CGFloat,
        warmTint: UIColor,
        poolAlpha: CGFloat,
        zSlot: Int
    ) {
        let tex = makeFloorLightPoolTexture(
            width: width,
            height: height,
            floorY: floorY,
            centerX: centerX,
            warmTint: warmTint,
            peakAlpha: poolAlpha
        )
        let node = SKSpriteNode(texture: tex)
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.position = CGPoint(x: width / 2, y: 0)
        node.size = CGSize(width: width, height: height)
        node.zPosition = SpotlightStageLayout.Z.floorPool + CGFloat(zSlot) * 0.001
        node.blendMode = .screen
        node.alpha = 1.0
        backgroundLayer.addChild(node)
    }

    private func drawFinalStageVignette(width: CGFloat, height: CGFloat) {
        let tex = makeFinalVignetteTexture(width: width, height: height)
        let node = SKSpriteNode(texture: tex)
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.position = CGPoint(x: width / 2, y: 0)
        node.size = CGSize(width: width, height: height)
        node.zPosition = 0
        node.alpha = 1.0
        finalVignetteLayer.addChild(node)
    }

    private static func generatedTextureCacheKey(_ parts: String...) -> String {
        parts.joined(separator: "|")
    }

    private static func textureCacheComponent(_ value: CGFloat) -> String {
        String(Int(value.rounded()))
    }

    private static func textureCachePreciseComponent(_ value: CGFloat) -> String {
        String(format: "%.3f", Double(value))
    }

    private static func cachedGeneratedTexture(key: String, makeTexture: () -> SKTexture) -> SKTexture {
        if let texture = generatedTextureCache[key] {
            return texture
        }

        if generatedTextureCache.count >= generatedTextureCacheLimit {
            generatedTextureCache.removeAll(keepingCapacity: true)
        }

        let texture = makeTexture()
        generatedTextureCache[key] = texture
        return texture
    }

    private func makeLocalSpotlightVignetteTexture(width: CGFloat, height: CGFloat, floorY: CGFloat) -> SKTexture {
        let key = Self.generatedTextureCacheKey(
            "localSpotlight",
            Self.textureCacheComponent(width),
            Self.textureCacheComponent(height),
            Self.textureCacheComponent(floorY)
        )
        return Self.cachedGeneratedTexture(key: key) {
            let textureSize = CGSize(width: max(1, width), height: max(1, height))
            let renderer = UIGraphicsImageRenderer(size: textureSize)
            let image = renderer.image { ctx in
                Self.paintLocalSpotlightVignette(
                    cgContext: ctx.cgContext,
                    size: textureSize,
                    floorY: floorY
                )
            }
            let texture = SKTexture(image: image)
            texture.filteringMode = .linear
            return texture
        }
    }

    private func makeSpotlightConeTexture(
        width: CGFloat,
        height: CGFloat,
        floorY: CGFloat,
        centerX: CGFloat,
        apexTowardCenterShift: CGFloat,
        warmTint: UIColor,
        peakAlpha: CGFloat
    ) -> SKTexture {
        let key = Self.generatedTextureCacheKey(
            "spotlightCone",
            Self.textureCacheComponent(width),
            Self.textureCacheComponent(height),
            Self.textureCacheComponent(floorY),
            Self.textureCacheComponent(centerX),
            Self.textureCacheComponent(apexTowardCenterShift),
            Self.textureCachePreciseComponent(peakAlpha)
        )
        return Self.cachedGeneratedTexture(key: key) {
            let textureSize = CGSize(width: max(1, width), height: max(1, height))
            let renderer = UIGraphicsImageRenderer(size: textureSize)
            let image = renderer.image { ctx in
                Self.paintSpotlightCone(
                    cgContext: ctx.cgContext,
                    size: textureSize,
                    floorY: floorY,
                    centerX: centerX,
                    apexTowardCenterShift: apexTowardCenterShift,
                    warmTint: warmTint,
                    peakAlpha: peakAlpha
                )
            }
            let texture = SKTexture(image: image)
            texture.filteringMode = .linear
            return texture
        }
    }

    private func makeFloorLightPoolTexture(
        width: CGFloat,
        height: CGFloat,
        floorY: CGFloat,
        centerX: CGFloat,
        warmTint: UIColor,
        peakAlpha: CGFloat
    ) -> SKTexture {
        let key = Self.generatedTextureCacheKey(
            "floorLightPool",
            Self.textureCacheComponent(width),
            Self.textureCacheComponent(height),
            Self.textureCacheComponent(floorY),
            Self.textureCacheComponent(centerX),
            Self.textureCachePreciseComponent(peakAlpha)
        )
        return Self.cachedGeneratedTexture(key: key) {
            let textureSize = CGSize(width: max(1, width), height: max(1, height))
            let renderer = UIGraphicsImageRenderer(size: textureSize)
            let image = renderer.image { ctx in
                Self.paintFloorLightPool(
                    cgContext: ctx.cgContext,
                    size: textureSize,
                    floorY: floorY,
                    centerX: centerX,
                    warmTint: warmTint,
                    peakAlpha: peakAlpha
                )
            }
            let texture = SKTexture(image: image)
            texture.filteringMode = .linear
            return texture
        }
    }

    private func makeFinalVignetteTexture(width: CGFloat, height: CGFloat) -> SKTexture {
        let key = Self.generatedTextureCacheKey(
            "finalVignette",
            Self.textureCacheComponent(width),
            Self.textureCacheComponent(height)
        )
        return Self.cachedGeneratedTexture(key: key) {
            let textureSize = CGSize(width: max(1, width), height: max(1, height))
            let renderer = UIGraphicsImageRenderer(size: textureSize)
            let image = renderer.image { ctx in
                Self.paintFinalStageVignette(cgContext: ctx.cgContext, size: textureSize)
            }
            let texture = SKTexture(image: image)
            texture.filteringMode = .linear
            return texture
        }
    }

    /// UIKit 上原点。ステージ左右・中央をわずかに締めてスポットを際立たせる。
    private static func paintLocalSpotlightVignette(cgContext cg: CGContext, size textureSize: CGSize, floorY: CGFloat) {
        let width = textureSize.width
        let height = textureSize.height
        let rgb = CGColorSpaceCreateDeviceRGB()
        cg.saveGState()
        defer { cg.restoreGState() }
        cg.setAllowsAntialiasing(true)

        let floorUIKitY = height - floorY
        let midTone = UIColor.white.withAlphaComponent(1.0 - SpotlightStageLayout.localVignetteStrength * 0.55).cgColor
        let clear = UIColor.white.cgColor

        // 左右外側をやや暗く（放射）。
        if let gSide = CGGradient(colorsSpace: rgb, colors: [midTone, clear] as CFArray, locations: [0, 1]) {
            let reach = width * 0.55
            cg.drawRadialGradient(
                gSide,
                startCenter: CGPoint(x: 0, y: floorUIKitY * 0.42),
                startRadius: 0,
                endCenter: CGPoint(x: 0, y: floorUIKitY * 0.42),
                endRadius: reach,
                options: [.drawsAfterEndLocation]
            )
            cg.drawRadialGradient(
                gSide,
                startCenter: CGPoint(x: width, y: floorUIKitY * 0.42),
                startRadius: 0,
                endCenter: CGPoint(x: width, y: floorUIKitY * 0.42),
                endRadius: reach,
                options: [.drawsAfterEndLocation]
            )
        }

        // ステージ中央（コードレーン）をわずかに締める — コード UI は SwiftUI のためシーンでは広めに。
        if let gMid = CGGradient(
            colorsSpace: rgb,
            colors: [
                UIColor.white.withAlphaComponent(1.0 - SpotlightStageLayout.localVignetteStrength * 0.35).cgColor,
                UIColor.white.cgColor,
            ] as CFArray,
            locations: [0, 1]
        ) {
            let cx = width * 0.5
            let cy = floorUIKitY * 0.36
            let rx = width * 0.22
            let ry = height * 0.28
            cg.drawRadialGradient(
                gMid,
                startCenter: CGPoint(x: cx, y: cy),
                startRadius: 0,
                endCenter: CGPoint(x: cx, y: cy),
                endRadius: max(rx, ry),
                options: [.drawsAfterEndLocation]
            )
        }
    }

    /// UIKit 上原点。細い円錐（光源は画面上端＝天井付近、足元へ降りる）。
    private static func paintSpotlightCone(
        cgContext cg: CGContext,
        size textureSize: CGSize,
        floorY: CGFloat,
        centerX: CGFloat,
        apexTowardCenterShift: CGFloat,
        warmTint: UIColor,
        peakAlpha: CGFloat
    ) {
        let width = textureSize.width
        let height = textureSize.height
        let rgb = CGColorSpaceCreateDeviceRGB()
        cg.saveGState()
        defer { cg.restoreGState() }
        cg.setAllowsAntialiasing(true)

        let floorUIKitY = height - floorY
        let floorLimitUIKitY = floorUIKitY - 36
        let desiredTop = SpotlightStageLayout.coneApexInsetFromTopUIKit
        var apexUIKitY = min(desiredTop, floorLimitUIKitY)
        if apexUIKitY < 1 {
            apexUIKitY = min(max(2, floorUIKitY * 0.06), floorLimitUIKitY)
        }
        apexUIKitY = max(0, apexUIKitY)

        let halfTop = width * SpotlightStageLayout.coneHalfWidthTopFrac
        let halfBot = width * SpotlightStageLayout.coneHalfWidthBottomFrac

        let apexCx = centerX + apexTowardCenterShift
        let tl = CGPoint(x: apexCx - halfTop, y: apexUIKitY)
        let tr = CGPoint(x: apexCx + halfTop, y: apexUIKitY)
        let br = CGPoint(x: centerX + halfBot, y: floorUIKitY + 4)
        let bl = CGPoint(x: centerX - halfBot, y: floorUIKitY + 4)

        cg.beginPath()
        cg.move(to: tl)
        cg.addLine(to: tr)
        cg.addLine(to: br)
        cg.addLine(to: bl)
        cg.closePath()
        cg.clip()

        let fade = warmTint.withAlphaComponent(peakAlpha * 0.18).cgColor
        let transparent = warmTint.withAlphaComponent(0).cgColor

        let midUIKitY = apexUIKitY + (floorUIKitY - apexUIKitY) * 0.38
        let bridgeOpaque = warmTint.withAlphaComponent(peakAlpha * 0.42)

        // 天井付近はごく弱く、床へ向かって粒子上げる（縦のつながり）。
        if let gUpper = CGGradient(
            colorsSpace: rgb,
            colors: [
                warmTint.withAlphaComponent(peakAlpha * 0.14).cgColor,
                bridgeOpaque.cgColor,
            ] as CFArray,
            locations: [0, 1]
        ) {
            cg.drawLinearGradient(
                gUpper,
                start: CGPoint(x: centerX, y: apexUIKitY),
                end: CGPoint(x: centerX, y: midUIKitY),
                options: [.drawsAfterEndLocation]
            )
        }

        // 頭〜足の主ボリューム。
        if let gVert = CGGradient(colorsSpace: rgb, colors: [bridgeOpaque.cgColor, fade] as CFArray, locations: [0, 1]) {
            cg.drawLinearGradient(
                gVert,
                start: CGPoint(x: centerX, y: midUIKitY),
                end: CGPoint(x: centerX, y: floorUIKitY + 24),
                options: [.drawsAfterEndLocation]
            )
        }

        // 横フェザー（大きく柔らかく）。
        if let gFeather = CGGradient(colorsSpace: rgb, colors: [transparent, warmTint.withAlphaComponent(peakAlpha * 0.55).cgColor, transparent] as CFArray, locations: [0, 0.5, 1]) {
            cg.setBlendMode(.plusLighter)
            let featherW = halfBot * 2.4
            cg.drawLinearGradient(
                gFeather,
                start: CGPoint(x: centerX - featherW, y: (apexUIKitY + floorUIKitY) * 0.5),
                end: CGPoint(x: centerX + featherW, y: (apexUIKitY + floorUIKitY) * 0.5),
                options: [.drawsAfterEndLocation]
            )
            cg.setBlendMode(.normal)
        }
    }

    private static func paintFloorLightPool(
        cgContext cg: CGContext,
        size textureSize: CGSize,
        floorY: CGFloat,
        centerX: CGFloat,
        warmTint: UIColor,
        peakAlpha: CGFloat
    ) {
        let height = textureSize.height
        let rgb = CGColorSpaceCreateDeviceRGB()
        cg.saveGState()
        defer { cg.restoreGState() }
        cg.setAllowsAntialiasing(true)

        let floorUIKitY = height - floorY
        let cx = centerX
        let cy = floorUIKitY - 6
        let rx = SpotlightStageLayout.floorPoolRadiusX * 1.05
        let ry = SpotlightStageLayout.floorPoolRadiusY * 1.2

        cg.addEllipse(in: CGRect(x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2))
        cg.clip()

        if let gPool = CGGradient(
            colorsSpace: rgb,
            colors: [
                warmTint.withAlphaComponent(peakAlpha).cgColor,
                warmTint.withAlphaComponent(peakAlpha * 0.22).cgColor,
                warmTint.withAlphaComponent(0).cgColor,
            ] as CFArray,
            locations: [0, 0.45, 1]
        ) {
            cg.drawRadialGradient(
                gPool,
                startCenter: CGPoint(x: cx, y: cy),
                startRadius: 0,
                endCenter: CGPoint(x: cx, y: cy),
                endRadius: max(rx, ry),
                options: [.drawsAfterEndLocation]
            )
        }
    }

    /// UIKit 上原点。端のみごく薄い仕上げ（アルファのみ）。
    private static func paintFinalStageVignette(cgContext cg: CGContext, size textureSize: CGSize) {
        let width = textureSize.width
        let height = textureSize.height
        let rgb = CGColorSpaceCreateDeviceRGB()
        cg.saveGState()
        defer { cg.restoreGState() }
        cg.setAllowsAntialiasing(true)

        let strength = SpotlightStageLayout.finalVignetteAlpha
        let edge = UIColor.black.withAlphaComponent(0.42 * strength).cgColor
        let clear = UIColor.clear.cgColor
        let reach = max(width, height) * SpotlightStageLayout.finalVignetteReachFrac

        if let g = CGGradient(colorsSpace: rgb, colors: [edge, clear] as CFArray, locations: [0, 1]) {
            for cx in [CGFloat(0), width] as [CGFloat] {
                for cy in [CGFloat(0), height] as [CGFloat] {
                    cg.drawRadialGradient(
                        g,
                        startCenter: CGPoint(x: cx, y: cy),
                        startRadius: 0,
                        endCenter: CGPoint(x: cx, y: cy),
                        endRadius: reach,
                        options: [.drawsAfterEndLocation]
                    )
                }
            }
        }

        if let gTop = CGGradient(colorsSpace: rgb, colors: [UIColor.black.withAlphaComponent(0.18 * strength).cgColor, clear] as CFArray, locations: [0, 1]) {
            cg.drawRadialGradient(
                gTop,
                startCenter: CGPoint(x: width * 0.5, y: 0),
                startRadius: 0,
                endCenter: CGPoint(x: width * 0.5, y: 0),
                endRadius: width * 0.72,
                options: [.drawsAfterEndLocation]
            )
        }
    }

    /// プロシージャル壁・床テクスチャの上に、透過ジャズ楽器レイヤーを重ねる。
    private func addJazzStagePropSprites(width: CGFloat, height: CGFloat, floorY: CGFloat) {
        let insTint = JazzStagePropLayout.Dim.instrumentTint
        let insBlend = JazzStagePropLayout.Dim.instrumentBlendFactor
        let neonTint = JazzStagePropLayout.Dim.neonTint
        let neonBlend = JazzStagePropLayout.Dim.neonBlendFactor

        let drumMaxW = max(1, floor(width * JazzStagePropLayout.DrumFloor.widthFrac))
        let drumHalfW = drumMaxW * 0.5
        let enemyApproxRightEdgeX = width * 0.77 + Self.characterDisplaySize * 0.48
        let drumMaxCenterX = width - JazzStagePropLayout.DrumFloor.marginFromSceneRightPt - drumHalfW
        let minimumCenterPastEnemy = enemyApproxRightEdgeX + drumHalfW * 0.32 + 10
        var drumCenterX = width * JazzStagePropLayout.DrumFloor.centerXPreferredFrac
        drumCenterX = max(drumCenterX, min(minimumCenterPastEnemy, drumMaxCenterX))
        drumCenterX = min(drumCenterX, drumMaxCenterX)

        /// 背面から順に積む（コード帯直上のセンターはオブジェクト無し）。
        addStageBackgroundSpriteIfAvailable(
            assetName: JazzStagePropLayout.Asset.doubleBass,
            maxWidth: width * JazzStagePropLayout.WidthFrac.doubleBass,
            anchor: CGPoint(x: 0.5, y: 0),
            position: CGPoint(x: width * JazzStagePropLayout.CenterXF.doubleBass, y: floorY),
            zPosition: JazzStagePropLayout.Z.doubleBass,
            tintColor: insTint,
            tintBlendFactor: insBlend
        )
        addStageBackgroundSpriteIfAvailable(
            assetName: JazzStagePropLayout.Asset.piano,
            maxWidth: width * JazzStagePropLayout.WidthFrac.piano,
            anchor: CGPoint(x: 0.5, y: 0),
            position: CGPoint(x: width * JazzStagePropLayout.CenterXF.piano, y: floorY),
            zPosition: JazzStagePropLayout.Z.piano,
            tintColor: insTint,
            tintBlendFactor: insBlend
        )
        addStageBackgroundSpriteIfAvailable(
            assetName: JazzStagePropLayout.Asset.drumKit,
            maxWidth: CGFloat(drumMaxW),
            anchor: JazzStagePropLayout.DrumFloor.anchor,
            position: CGPoint(x: drumCenterX, y: floorY),
            zPosition: JazzStagePropLayout.Z.drumKit,
            tintColor: insTint,
            tintBlendFactor: insBlend
        )
        let neonPivotX = width * JazzStagePropLayout.CenterXF.piano + JazzStagePropLayout.Neon.horizontalOffsetFromPianoCenterPt
        let neonTopY = height - JazzStagePropLayout.Neon.insetFromSceneTopPt
        addStageBackgroundSpriteIfAvailable(
            assetName: JazzStagePropLayout.Asset.neon,
            maxWidth: width * JazzStagePropLayout.Neon.widthFrac,
            anchor: JazzStagePropLayout.Neon.anchor,
            position: CGPoint(x: neonPivotX, y: neonTopY),
            zPosition: JazzStagePropLayout.Z.neon,
            tintColor: neonTint,
            tintBlendFactor: neonBlend
        )
    }

    private func addStageBackgroundSpriteIfAvailable(
        assetName: String,
        maxWidth: CGFloat,
        anchor: CGPoint,
        position: CGPoint,
        zPosition: CGFloat,
        tintColor: UIColor,
        tintBlendFactor: CGFloat
    ) {
        guard let image = UIImage(named: assetName), image.size.width > 1, image.size.height > 1 else { return }
        let texture = SKTexture(image: image)
        texture.filteringMode = .nearest
        let sprite = SKSpriteNode(texture: texture)
        sprite.anchorPoint = anchor
        sprite.position = position
        sprite.zPosition = zPosition
        sprite.color = tintColor
        sprite.colorBlendFactor = tintBlendFactor
        let w = max(1, floor(maxWidth))
        let aspectRatio = image.size.height / image.size.width
        sprite.size = CGSize(width: w, height: max(1, w * aspectRatio))
        backgroundLayer.addChild(sprite)
    }

    private func makeBackdropTexture(width: CGFloat, height: CGFloat, floorY: CGFloat) -> SKTexture {
        let key = Self.generatedTextureCacheKey(
            "jazzBackdrop",
            Self.textureCacheComponent(width),
            Self.textureCacheComponent(height),
            Self.textureCacheComponent(floorY)
        )
        return Self.cachedGeneratedTexture(key: key) {
            let textureSize = CGSize(width: max(1, width), height: max(1, height))
            let renderer = UIGraphicsImageRenderer(size: textureSize)
            let image = renderer.image { ctx in
                Self.paintJazzBarBackdrop(cgContext: ctx.cgContext, size: textureSize, floorY: floorY)
            }
            let texture = SKTexture(image: image)
            texture.filteringMode = .linear
            return texture
        }
    }

    /// 画像アセット無しでジャズバー風の背景を描く（UIKit・上原点）。暗さ設計優先／コードUI背後には明るい面を置かない。
    private static func paintJazzBarBackdrop(cgContext cg: CGContext, size textureSize: CGSize, floorY: CGFloat) {
        let width = textureSize.width
        let height = textureSize.height
        let fyMax = height - Self.hudHeight - 48
        let fyMin = Self.pianoOverlayHeight + 24
        let fyClamped = min(max(floorY, fyMin), fyMax)
        let wallHeightUi = height - fyClamped

        let rgb = CGColorSpaceCreateDeviceRGB()
        let lipInsetTrim = max(18.0, width * 0.018)

        let paletteTop = UIColor(red: 22 / 255, green: 11 / 255, blue: 8 / 255, alpha: 1).cgColor // #160B08
        let paletteMid = UIColor(red: 42 / 255, green: 22 / 255, blue: 14 / 255, alpha: 1).cgColor // #2A160E
        let paletteBot = UIColor(red: 14 / 255, green: 7 / 255, blue: 5 / 255, alpha: 1).cgColor // #0E0705
        let woodDarkFill = UIColor(red: 36 / 255, green: 18 / 255, blue: 11 / 255, alpha: 1) // #24120B
        let woodMidFill = UIColor(red: 58 / 255, green: 33 / 255, blue: 20 / 255, alpha: 1) // #3A2114

        cg.saveGState()
        defer { cg.restoreGState() }

        Self.jazzBackdropEdgeColor().setFill()
        cg.fill(CGRect(origin: .zero, size: textureSize))
        if let baseAll = CGGradient(colorsSpace: rgb, colors: [paletteMid, paletteBot] as CFArray, locations: [0, 1]) {
            cg.drawLinearGradient(
                baseAll,
                start: CGPoint(x: width * 0.5, y: 0),
                end: CGPoint(x: width * 0.5, y: height),
                options: [.drawsAfterEndLocation]
            )
        }

        if wallHeightUi > 44, let wallG = CGGradient(colorsSpace: rgb, colors: [paletteTop, paletteMid, paletteBot] as CFArray, locations: [0, 0.42, 1]) {
            cg.saveGState()
            cg.clip(to: CGRect(x: 0, y: 0, width: width, height: wallHeightUi))
            cg.drawLinearGradient(
                wallG,
                start: CGPoint(x: width * 0.5, y: 0),
                end: CGPoint(x: width * 0.5, y: wallHeightUi),
                options: [.drawsAfterEndLocation]
            )
            cg.restoreGState()
        }

        func drawWeakBrickWall() {
            guard wallHeightUi > 56 else { return }
            let sidePad = width * 0.045
            let topPad = wallHeightUi * 0.048
            let botPad = wallHeightUi * 0.088
            let wallR = CGRect(x: sidePad, y: topPad, width: width - sidePad * 2, height: wallHeightUi - topPad - botPad)
            guard wallR.width > 50, wallR.height > 30 else { return }

            cg.saveGState()
            cg.clip(to: wallR)
            cg.setAllowsAntialiasing(false)
            let brickH = max(21, wallR.height / 15)
            let brickW = max(72, brickH * 2.85)
            var rowY = wallR.minY
            var row = 0
            while rowY < wallR.maxY {
                let stagger = CGFloat(row % 2) * (brickW * 0.5)
                var colX = wallR.minX - brickW + stagger
                while colX < wallR.maxX + brickW {
                    let br = CGRect(x: colX, y: rowY, width: brickW - 6, height: brickH - 5).integral
                    cg.setAlpha(0.15)
                    cg.setFillColor(UIColor(red: 0.35, green: 0.18, blue: 0.09, alpha: 1).cgColor)
                    cg.fill(br)
                    cg.setAlpha(0.11)
                    cg.setStrokeColor(UIColor(red: 0.08, green: 0.05, blue: 0.035, alpha: 1).cgColor)
                    cg.setLineWidth(0.75)
                    cg.beginPath()
                    cg.addRect(br)
                    cg.strokePath()
                    cg.setAlpha(1)
                    colX += brickW
                }
                rowY += brickH + 5
                row += 1
            }
            cg.restoreGState()

            cg.saveGState()
            cg.clip(to: CGRect(x: 0, y: 0, width: width, height: wallHeightUi))
            cg.setAllowsAntialiasing(true)
            cg.setBlendMode(.multiply)
            if let gTop = CGGradient(colorsSpace: rgb, colors: [UIColor.black.withAlphaComponent(0.58).cgColor, UIColor.clear.cgColor] as CFArray, locations: [0, 1]) {
                cg.drawLinearGradient(gTop, start: CGPoint(x: width * 0.5, y: 0), end: CGPoint(x: width * 0.5, y: wallHeightUi * 0.52), options: [.drawsAfterEndLocation])
            }
            let sideTone = UIColor.black.withAlphaComponent(0.42).cgColor
            if let gSide = CGGradient(colorsSpace: rgb, colors: [sideTone, UIColor.clear.cgColor] as CFArray, locations: [0, 1]) {
                cg.drawLinearGradient(gSide, start: CGPoint(x: 0, y: wallHeightUi * 0.5), end: CGPoint(x: width * 0.42, y: wallHeightUi * 0.5), options: [.drawsAfterEndLocation])
                cg.drawLinearGradient(gSide, start: CGPoint(x: width, y: wallHeightUi * 0.5), end: CGPoint(x: width * 0.58, y: wallHeightUi * 0.5), options: [.drawsAfterEndLocation])
            }

            // コード帯〜足元側だけ中央を締める（奥の棚は上側に残す。全面にかけない）
            let chordBandMinY = wallHeightUi * 0.38
            cg.saveGState()
            cg.clip(to: CGRect(x: 0, y: chordBandMinY, width: width, height: max(1, wallHeightUi - chordBandMinY)))
            if let cen = CGGradient(colorsSpace: rgb, colors: [UIColor.black.withAlphaComponent(0.48).cgColor, UIColor.clear.cgColor] as CFArray, locations: [0, 1]) {
                let cx = width * 0.5
                let cy = wallHeightUi * 0.62
                let rx = width * 0.28
                let ry = (wallHeightUi - chordBandMinY) * 0.72
                cg.drawRadialGradient(cen, startCenter: CGPoint(x: cx, y: cy), startRadius: 0, endCenter: CGPoint(x: cx, y: cy), endRadius: max(rx, ry), options: [.drawsAfterEndLocation])
            }
            cg.restoreGState()
            cg.setBlendMode(.normal)
            cg.restoreGState()
        }

        drawWeakBrickWall()

        cg.saveGState()
        cg.setBlendMode(.multiply)
        if let smoky = CGGradient(
            colorsSpace: rgb,
            colors: [
                UIColor(red: 0.11, green: 0.09, blue: 0.074, alpha: 0.07).cgColor,
                UIColor.clear.cgColor,
            ] as CFArray,
            locations: [0, 1]
        ) {
            cg.drawRadialGradient(
                smoky,
                startCenter: CGPoint(x: width * 0.24, y: wallHeightUi * 0.32),
                startRadius: 0,
                endCenter: CGPoint(x: width * 0.24, y: wallHeightUi * 0.32),
                endRadius: width * 0.33,
                options: [.drawsAfterEndLocation]
            )
            cg.drawRadialGradient(
                smoky,
                startCenter: CGPoint(x: width * 0.76, y: wallHeightUi * 0.30),
                startRadius: 0,
                endCenter: CGPoint(x: width * 0.76, y: wallHeightUi * 0.30),
                endRadius: width * 0.30,
                options: [.drawsAfterEndLocation]
            )
        }
        cg.restoreGState()

        let barSkCapDesired = min(Self.pianoOverlayHeight + 56, max(12, fyClamped - 10))

        let parquetH = fyClamped - barSkCapDesired
        if parquetH > 12 {
            let pqRectUIKit = CGRect(x: 0, y: height - fyClamped, width: width, height: parquetH)
            cg.setAllowsAntialiasing(true)
            cg.setFillColor(woodDarkFill.withAlphaComponent(0.97).cgColor)
            cg.fill(pqRectUIKit)
            cg.setBlendMode(.normal)
            cg.setAllowsAntialiasing(false)
            for lineIndex in 1..<7 {
                let lineY = pqRectUIKit.minY + parquetH * CGFloat(lineIndex) / 7 + 10
                cg.setStrokeColor(UIColor(red: 0.22, green: 0.14, blue: 0.10, alpha: 0.11).cgColor)
                cg.setLineWidth(1)
                cg.beginPath()
                cg.move(to: CGPoint(x: pqRectUIKit.minX, y: lineY))
                cg.addLine(to: CGPoint(x: pqRectUIKit.maxX, y: lineY))
                cg.strokePath()
            }
        }

        if barSkCapDesired > 8 {
            let barRectUIKit = CGRect(x: 0, y: height - barSkCapDesired, width: width, height: barSkCapDesired)
            cg.setFillColor(woodDarkFill.cgColor)
            cg.fill(barRectUIKit)
            if let band = CGGradient(colorsSpace: rgb, colors: [woodMidFill.cgColor, woodDarkFill.cgColor] as CFArray, locations: [0, 1]) {
                cg.drawLinearGradient(
                    band,
                    start: CGPoint(x: 0, y: barRectUIKit.maxY - 10),
                    end: CGPoint(x: 0, y: barRectUIKit.minY + 6),
                    options: [.drawsAfterEndLocation]
                )
            }
            let goldTrim = UIColor(red: 213 / 255, green: 138 / 255, blue: 42 / 255, alpha: 0.28).cgColor
            cg.setStrokeColor(goldTrim)
            cg.setLineWidth(1.5)
            let trimY = barRectUIKit.minY + 2
            cg.beginPath()
            cg.move(to: CGPoint(x: lipInsetTrim, y: trimY))
            cg.addLine(to: CGPoint(x: width - lipInsetTrim, y: trimY))
            cg.strokePath()
        }

        let lipStrong = UIColor(red: 213 / 255, green: 138 / 255, blue: 42 / 255, alpha: 0.22).cgColor
        let lipSoft = UIColor(red: 180 / 255, green: 105 / 255, blue: 40 / 255, alpha: 0.15).cgColor
        cg.setLineWidth(1.5)
        cg.setStrokeColor(lipStrong)
        cg.beginPath()
        cg.move(to: CGPoint(x: lipInsetTrim + 10, y: wallHeightUi - 3))
        cg.addLine(to: CGPoint(x: width - lipInsetTrim - 10, y: wallHeightUi - 3))
        cg.strokePath()
        cg.setLineWidth(2)
        cg.setStrokeColor(lipSoft)
        cg.beginPath()
        cg.move(to: CGPoint(x: lipInsetTrim + 10, y: wallHeightUi + 1))
        cg.addLine(to: CGPoint(x: width - lipInsetTrim - 10, y: wallHeightUi + 1))
        cg.strokePath()

        cg.setBlendMode(.multiply)
        cg.setAllowsAntialiasing(true)
        let cornerAlphas: CGFloat = 0.54
        if let cornerGrad = CGGradient(
            colorsSpace: rgb,
            colors: [UIColor.black.withAlphaComponent(cornerAlphas).cgColor, UIColor.clear.cgColor] as CFArray,
            locations: [0, 1]
        ) {
            let reach = max(width, height) * 0.5
            for cx in [CGFloat(0), width] as [CGFloat] {
                for cy in [CGFloat(0), height] as [CGFloat] {
                    cg.drawRadialGradient(
                        cornerGrad,
                        startCenter: CGPoint(x: cx, y: cy),
                        startRadius: 0,
                        endCenter: CGPoint(x: cx, y: cy),
                        endRadius: reach,
                        options: [.drawsAfterEndLocation]
                    )
                }
            }
        }
        if let rimTop = CGGradient(colorsSpace: rgb, colors: [UIColor.black.withAlphaComponent(0.30).cgColor, UIColor.clear.cgColor] as CFArray, locations: [0, 1]) {
            cg.drawRadialGradient(
                rimTop,
                startCenter: CGPoint(x: width * 0.5, y: 6),
                startRadius: 0,
                endCenter: CGPoint(x: width * 0.5, y: 6),
                endRadius: max(width, wallHeightUi) * 1.06,
                options: [.drawsAfterEndLocation]
            )
        }
        cg.setBlendMode(.normal)

        // ヴィネットの後に奥行きを描く（端で消えないよう、手掛かりは最後）
        func drawBackBarSilhouetteLate() {
            guard wallHeightUi > 72 else { return }
            cg.saveGState()
            cg.clip(to: CGRect(x: 0, y: 0, width: width, height: wallHeightUi))
            cg.setAllowsAntialiasing(false)
            cg.setAlpha(0.38)
            cg.setFillColor(UIColor(red: 0.12, green: 0.065, blue: 0.04, alpha: 1).cgColor)
            let shelfW = width * 0.46
            let shelfX = width * 0.5 - shelfW * 0.5
            let shelfUpperY = wallHeightUi * 0.278
            let shelfLowerY = shelfUpperY + 56
            let boardH: CGFloat = 8
            cg.fill(CGRect(x: shelfX, y: shelfUpperY, width: shelfW, height: boardH))
            cg.fill(CGRect(x: shelfX, y: shelfLowerY, width: shelfW, height: boardH))
            let bottleHeights: [CGFloat] = [38, 46, 33, 50, 40, 36, 48, 34, 44, 37, 45, 34]
            let slot = shelfW / CGFloat(bottleHeights.count)
            for bottleIdx in 0..<bottleHeights.count {
                let bx = shelfX + CGFloat(bottleIdx) * slot + 7
                let bottleH = bottleHeights[bottleIdx]
                let bw: CGFloat = 10
                let topY = shelfLowerY - bottleH
                cg.fill(CGRect(x: bx, y: topY, width: bw, height: bottleH))
            }
            cg.setAlpha(1)
            cg.restoreGState()
        }

        drawBackBarSilhouetteLate()

        if wallHeightUi > 26 {
            cg.saveGState()
            cg.clip(to: CGRect(x: 0, y: 0, width: width, height: wallHeightUi * 0.1))
            if let bleed = CGGradient(
                colorsSpace: rgb,
                colors: [
                    UIColor(red: 240 / 255, green: 180 / 255, blue: 90 / 255, alpha: 0.085).cgColor,
                    UIColor.clear.cgColor,
                ] as CFArray,
                locations: [0, 1]
            ) {
                cg.drawLinearGradient(bleed, start: CGPoint(x: width * 0.5, y: 0), end: CGPoint(x: width * 0.5, y: wallHeightUi * 0.105), options: [.drawsAfterEndLocation])
            }
            cg.restoreGState()
        }

        func drawWallSconceLate(centerXUIKit: CGFloat) {
            guard wallHeightUi > 48 else { return }
            let y = wallHeightUi * 0.225
            let radius = min(128, wallHeightUi * 0.52)
            cg.saveGState()
            cg.clip(to: CGRect(x: 0, y: 0, width: width, height: wallHeightUi))
            if let glow = CGGradient(
                colorsSpace: rgb,
                colors: [
                    UIColor(red: 240 / 255, green: 180 / 255, blue: 90 / 255, alpha: 0.125).cgColor,
                    UIColor(red: 213 / 255, green: 138 / 255, blue: 42 / 255, alpha: 0.045).cgColor,
                    UIColor.clear.cgColor,
                ] as CFArray,
                locations: [0, 0.43, 1]
            ) {
                cg.setBlendMode(.screen)
                cg.drawRadialGradient(
                    glow,
                    startCenter: CGPoint(x: centerXUIKit, y: y),
                    startRadius: 0,
                    endCenter: CGPoint(x: centerXUIKit, y: y),
                    endRadius: radius,
                    options: [.drawsAfterEndLocation]
                )
                cg.setBlendMode(.normal)
            }
            cg.setFillColor(UIColor(red: 0.09, green: 0.05, blue: 0.035, alpha: 0.98).cgColor)
            cg.beginPath()
            cg.addEllipse(in: CGRect(x: centerXUIKit - 4, y: y - 4, width: 8, height: 8))
            cg.fillPath()
            cg.restoreGState()
        }

        if wallHeightUi > 52 {
            drawWallSconceLate(centerXUIKit: width * 0.18)
            drawWallSconceLate(centerXUIKit: width * 0.82)
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
        shadow.lineWidth = 0
        shadow.position = CGPoint(x: 0, y: -4)
        shadow.zPosition = -4
        container.addChild(shadow)

        var imageNode: SKSpriteNode?
        var rimNode: SKSpriteNode?
        if let image = UIImage(named: avatarAssetName) {
            let texture = SKTexture(image: image)

            let rim = SKSpriteNode(texture: texture)
            rim.anchorPoint = CGPoint(x: 0.5, y: 0)
            rim.size = CGSize(
                width: Self.characterDisplaySize * SpotlightStageLayout.rimScale,
                height: Self.characterDisplaySize * SpotlightStageLayout.rimScale
            )
            rim.position = .zero
            rim.xScale = flipX ? -1 : 1
            rim.color = isPlayer ? SpotlightStageLayout.rimTintPlayer : SpotlightStageLayout.rimTintEnemy
            rim.colorBlendFactor = 1.0
            rim.alpha = SpotlightStageLayout.rimAlpha
            rim.blendMode = .add
            rim.zPosition = -1
            container.addChild(rim)
            rimNode = rim

            let sprite = SKSpriteNode(texture: texture)
            sprite.anchorPoint = CGPoint(x: 0.5, y: 0)
            sprite.size = CGSize(width: Self.characterDisplaySize, height: Self.characterDisplaySize)
            sprite.position = .zero
            sprite.zPosition = 0
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
        fallback.zPosition = 0
        container.addChild(fallback)

        characterLayer.addChild(container)
        return CharacterView(container: container, image: imageNode, rim: rimNode, fallback: fallback)
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
        showCorrectPlayerPose()
        let anchors = battleAnchors()
        let start = CGPoint(x: anchors.player.x + 44, y: anchors.player.castY)
        let target = CGPoint(x: anchors.enemy.x, y: anchors.enemy.bodyY)

        let fireball = makeEffectSprite(name: "ear-training-effect-fireball", size: 78)
        fireball.position = start
        fireball.zRotation = -24 * (.pi / 180)
        effectLayer.addChild(fireball)

        let move = SKAction.move(to: target, duration: 0.54)
        move.timingMode = .easeIn
        let endScale: CGFloat = 96 / 78
        let scale = SKAction.scale(to: endScale, duration: 0.54)
        let rotate = SKAction.rotate(toAngle: 16 * (.pi / 180), duration: 0.54, shortestUnitArc: false)
        fireball.run(SKAction.group([move, scale, rotate])) { [weak self, weak fireball] in
            guard let self else { return }
            fireball?.removeFromParent()
            self.flashCharacter(.enemy)
            self.showImpactBurst(at: target, color: UIColor(red: 0.984, green: 0.573, blue: 0.235, alpha: 1.0), large: false)
            self.showEnemyDamageText(damage: command.damage, anchors: anchors.enemy)
            self.onEffectImpact?(command.id)
            self.knockEnemyAfterDamage(distance: 24, durationMs: 170)
        }
    }

    private func playCompleteEffect(_ command: EarTrainingBattleEffectCommand) {
        let label = command.label ?? "Good"
        let isAwesome = label == "Awesome!" || (label == "Perfect" && (command.phraseNoteCount ?? 0) >= 6)
        let displayLabel = isAwesome ? "Awesome!" : label
        let anchors = battleAnchors()
        showFloatingResultText(label: displayLabel, x: anchors.player.x, y: anchors.player.resultTextY, color: rankColor(label: displayLabel))

        if isAwesome {
            playMeteorEffect(command, anchors: anchors)
            return
        }
        showPlayerPoseSequence(
            assetNames: PlayerAvatarPoseAsset.skillNames,
            frameDurationMs: Self.skillPlayerPoseFrameMs,
            restoreOnCompletion: false
        )
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
        zoomToPlayer(
            anchors: anchors,
            holdMs: 1080,
            onZoomedIn: { [weak self] in
                self?.showPlayerPoseSequence(
                    assetNames: PlayerAvatarPoseAsset.skillNames,
                    frameDurationMs: Self.skillPlayerPoseFrameMs,
                    restoreOnCompletion: false
                )
            },
            onReturned: { [weak self] in
                self?.launchMeteor(command, anchors: anchors)
            }
        )
        showMagicCircle(at: CGPoint(x: anchors.player.x, y: anchors.player.footY + 12), size: 190)
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
        showEnemyDamageText(damage: damage, anchors: anchors.enemy)
        onImpact()
        restorePlayerPose()
        knockEnemyAfterDamage(distance: knockbackDistance, durationMs: knockbackDurationMs)
    }

    // MARK: - Effect helpers

    private func showMagicCircle(at position: CGPoint, size: CGFloat) {
        let circle = makeEffectSprite(name: "ear-training-effect-magic-circle", size: size)
        circle.position = position
        circle.alpha = Self.awesomeMagicCircleAlpha
        circle.blendMode = .add
        effectLayer.addChild(circle)
        circle.run(SKAction.sequence([
            SKAction.group([
                SKAction.rotate(byAngle: .pi, duration: 1.08),
                SKAction.scale(to: 1.14, duration: 1.08),
                SKAction.fadeOut(withDuration: 1.08),
            ]),
            SKAction.removeFromParent(),
        ]))
    }

    private func makeEffectSprite(name: String, size: CGFloat) -> SKSpriteNode {
        let texture: SKTexture
        if let image = UIImage(named: name) {
            texture = SKTexture(image: image)
            texture.filteringMode = .nearest
        } else {
            texture = Self.makeFallbackPixelArtTexture(side: max(8, size * 0.5))
        }
        let sprite = SKSpriteNode(texture: texture)
        sprite.size = CGSize(width: size, height: size)
        sprite.zPosition = 50
        sprite.color = .white
        sprite.colorBlendFactor = 0
        return sprite
    }

    /// アセット欠落時も透明ではなく単色シルエットにし、欠損テクスチャの異色スプライト化を防ぐ。
    private static func makeFallbackPixelArtTexture(side: CGFloat) -> SKTexture {
        let s = max(8, min(side, 128))
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: s, height: s))
        let image = renderer.image { ctx in
            UIColor(red: 1, green: 0.52, blue: 0.12, alpha: 1).setFill()
            ctx.cgContext.fillEllipse(in: CGRect(x: s * 0.08, y: s * 0.08, width: s * 0.84, height: s * 0.84))
        }
        let tex = SKTexture(image: image)
        tex.filteringMode = .nearest
        return tex
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
            spark.lineWidth = 0
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

    private func zoomToPlayer(
        anchors: BattleAnchors,
        holdMs: TimeInterval,
        onZoomedIn: @escaping () -> Void,
        onReturned: @escaping () -> Void
    ) {
        if cameraNode.position == .zero {
            resetCameraToCenter()
        }
        let panTo = CGPoint(x: anchors.player.x, y: anchors.player.bodyY)
        let pan = SKAction.move(to: panTo, duration: 0.18)
        pan.timingMode = .easeInEaseOut
        let zoomIn = SKAction.scale(to: 1.0 / 1.98, duration: 0.18)
        zoomIn.timingMode = .easeOut
        cameraNode.run(SKAction.group([pan, zoomIn])) { [weak self] in
            guard let self else { return }
            onZoomedIn()
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

    private func showCorrectPlayerPose() {
        showPlayerPose(assetName: PlayerAvatarPoseAsset.correctName, durationMs: Self.correctPlayerPoseDurationMs)
    }

    private func showPlayerPose(assetName: String, durationMs: TimeInterval) {
        guard let token = setPlayerPose(assetName: assetName) else { return }
        let restore = SKAction.run { [weak self] in
            self?.restorePlayerPose(token: token)
        }
        run(SKAction.sequence([
            SKAction.wait(forDuration: durationMs / 1000),
            restore,
        ]))
    }

    private func showPlayerPoseSequence(assetNames: [String], frameDurationMs: TimeInterval, restoreOnCompletion: Bool) {
        guard let firstAssetName = assetNames.first, let token = setPlayerPose(assetName: firstAssetName) else { return }
        for (index, assetName) in assetNames.dropFirst().enumerated() {
            let switchFrame = SKAction.run { [weak self] in
                guard let self, self.playerPoseToken == token else { return }
                _ = self.applyPlayerPose(assetName: assetName)
            }
            run(SKAction.sequence([
                SKAction.wait(forDuration: (frameDurationMs * TimeInterval(index + 1)) / 1000),
                switchFrame,
            ]))
        }
        guard restoreOnCompletion else { return }
        let restoreFrame = SKAction.run { [weak self] in
            self?.restorePlayerPose(token: token)
        }
        run(SKAction.sequence([
            SKAction.wait(forDuration: (frameDurationMs * TimeInterval(assetNames.count)) / 1000),
            restoreFrame,
        ]))
    }

    private func setPlayerPose(assetName: String) -> Int? {
        guard applyPlayerPose(assetName: assetName) else { return nil }
        let token = playerPoseToken + 1
        playerPoseToken = token
        return token
    }

    private func applyPlayerPose(assetName: String) -> Bool {
        guard let view = playerNode, let image = UIImage(named: assetName) else { return false }
        let texture = SKTexture(image: image)
        view.image?.texture = texture
        view.image?.size = CGSize(width: Self.characterDisplaySize, height: Self.characterDisplaySize)
        view.image?.xScale = 1
        view.rim?.texture = texture
        view.rim?.size = CGSize(
            width: Self.characterDisplaySize * SpotlightStageLayout.rimScale,
            height: Self.characterDisplaySize * SpotlightStageLayout.rimScale
        )
        view.rim?.xScale = 1
        view.fallback.isHidden = true
        return true
    }

    private func restorePlayerPose(token: Int? = nil) {
        if let token, token != playerPoseToken {
            return
        }
        guard
            let view = playerNode,
            let avatarAssetName = snapshot?.playerAvatarName,
            let image = UIImage(named: avatarAssetName)
        else {
            return
        }
        let texture = SKTexture(image: image)
        playerPoseToken = 0
        view.image?.texture = texture
        view.image?.size = CGSize(width: Self.characterDisplaySize, height: Self.characterDisplaySize)
        view.image?.xScale = 1
        view.rim?.texture = texture
        view.rim?.size = CGSize(
            width: Self.characterDisplaySize * SpotlightStageLayout.rimScale,
            height: Self.characterDisplaySize * SpotlightStageLayout.rimScale
        )
        view.rim?.xScale = 1
        view.fallback.isHidden = true
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
        let rim: SKSpriteNode?
        let fallback: SKLabelNode
    }
}

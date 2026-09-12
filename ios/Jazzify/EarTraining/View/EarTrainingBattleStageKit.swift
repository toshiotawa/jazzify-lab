import SpriteKit
import UIKit

/// Shared jazz-bar battle stage visuals for Ear Training, Defense, and Training modes.
enum EarTrainingBattleStageKit {
    static let hudHeight: CGFloat = 104
    static let pianoVisualTopFromBottom: CGFloat = 80
    static let floorAirAboveKeyboard: CGFloat = 6
    /// SurvivalChordPad 等 88pt 鍵盤向け（WEB `PIANO_OVERLAY_HEIGHT` と揃える）。
    static let chordPadKeyboardHeight: CGFloat = 88
    /// 88pt 鍵盤上の床余白（耳コピ `floorAirAboveKeyboard` と同じ）。
    static let chordPadFloorClearance: CGFloat = floorAirAboveKeyboard
    static let battleCharacterVisualScale: CGFloat = 2.0 / 3.0

    static var characterDisplaySize: CGFloat { battleLayoutPt(88) }
    static var characterShadowWidth: CGFloat { battleLayoutPt(82) }
    static var characterShadowHeight: CGFloat { battleLayoutPt(18) }

    static let jazzBackdropEdgeColor = UIColor(red: 14 / 255, green: 7 / 255, blue: 5 / 255, alpha: 1)

    static func battleLayoutPt(_ base: CGFloat) -> CGFloat {
        base * battleCharacterVisualScale
    }

    static func battleFloorY(
        sceneHeight: CGFloat,
        keyboardHeight: CGFloat = pianoVisualTopFromBottom,
        clearanceFromKeyboard: CGFloat = floorAirAboveKeyboard
    ) -> CGFloat {
        let baselineFootY = keyboardHeight + clearanceFromKeyboard
        let preferredFloorY = max(baselineFootY, sceneHeight * 0.15)
        let maximumFloorY = sceneHeight - hudHeight - characterDisplaySize * 1.1
        return min(preferredFloorY, maximumFloorY)
    }

    static func installBattleBackdrop(
        into layer: SKNode,
        size: CGSize,
        keyboardHeight: CGFloat = pianoVisualTopFromBottom,
        clearanceFromKeyboard: CGFloat = floorAirAboveKeyboard
    ) {
        layer.removeAllChildren()
        guard size.width > 0, size.height > 0 else { return }

        let floorY = battleFloorY(
            sceneHeight: size.height,
            keyboardHeight: keyboardHeight,
            clearanceFromKeyboard: clearanceFromKeyboard
        )

        addProceduralBackdrop(
            into: layer,
            size: size,
            floorY: floorY,
            keyboardHeight: keyboardHeight,
            clearanceFromKeyboard: clearanceFromKeyboard
        )
        addStageSpotlights(into: layer, size: size, floorY: floorY)
        addStageProps(into: layer, width: size.width, floorY: floorY)
        addFloorShadows(into: layer, width: size.width, floorY: floorY)
        addFinalVignette(into: layer, size: size)
    }

    static func makeAvatarContainer(
        assetName: String,
        position: CGPoint,
        flipX: Bool = false,
        isPlayer: Bool = true
    ) -> SKNode {
        let container = SKNode()
        container.position = position
        container.zPosition = 10

        let shadow = SKShapeNode(ellipseOf: CGSize(width: characterShadowWidth, height: characterShadowHeight))
        shadow.fillColor = UIColor.black.withAlphaComponent(0.34)
        shadow.strokeColor = .clear
        shadow.position = CGPoint(x: 0, y: -4)
        shadow.zPosition = -4
        container.addChild(shadow)

        if let image = UIImage(named: assetName) {
            let texture = SKTexture(image: image)
            let rim = SKSpriteNode(texture: texture)
            rim.anchorPoint = CGPoint(x: 0.5, y: 0)
            rim.size = CGSize(
                width: characterDisplaySize * SpotlightLayout.rimScale,
                height: characterDisplaySize * SpotlightLayout.rimScale
            )
            rim.xScale = flipX ? -1 : 1
            rim.color = isPlayer ? SpotlightLayout.rimTintPlayer : SpotlightLayout.rimTintEnemy
            rim.colorBlendFactor = 1
            rim.alpha = SpotlightLayout.rimAlpha
            rim.blendMode = .add
            rim.zPosition = -1
            container.addChild(rim)

            let sprite = SKSpriteNode(texture: texture)
            sprite.anchorPoint = CGPoint(x: 0.5, y: 0)
            sprite.size = CGSize(width: characterDisplaySize, height: characterDisplaySize)
            sprite.xScale = flipX ? -1 : 1
            sprite.zPosition = 0
            container.addChild(sprite)
        } else {
            let fallback = SKLabelNode(text: isPlayer ? "P" : "E")
            fallback.fontName = "AvenirNext-Heavy"
            fallback.fontSize = battleLayoutPt(34)
            fallback.fontColor = .white
            fallback.verticalAlignmentMode = .baseline
            fallback.position = CGPoint(x: 0, y: 6)
            container.addChild(fallback)
        }

        return container
    }

    private enum SpotlightLayout {
        enum Z {
            static let backdrop: CGFloat = 0
            static let localVignette: CGFloat = 0.38
            static let cone: CGFloat = 0.92
            static let floorPool: CGFloat = 1.18
            static let doubleBass: CGFloat = 2
            static let piano: CGFloat = 2.5
            static let drumKit: CGFloat = 3
            static let floorShadow: CGFloat = 6
            static let finalVignette: CGFloat = 7
        }

        static let coneApexInsetFromTopUIKit: CGFloat = 2
        static let coneAlphaPlayer: CGFloat = 0.11
        static let coneAlphaEnemy: CGFloat = 0.13
        static let floorPoolAlphaPlayer: CGFloat = 0.13
        static let floorPoolAlphaEnemy: CGFloat = 0.15
        static let coneHalfWidthBottomFrac: CGFloat = 0.072
        static let coneHalfWidthTopFrac: CGFloat = 0.014
        static let coneApexShiftTowardCenterFrac: CGFloat = 0.02
        static let warmTintPlayer = UIColor(red: 255 / 255, green: 210 / 255, blue: 155 / 255, alpha: 1)
        static let warmTintEnemy = UIColor(red: 255 / 255, green: 200 / 255, blue: 175 / 255, alpha: 1)
        static let localVignetteStrength: CGFloat = 0.42
        static let finalVignetteAlpha: CGFloat = 0.38
        static let finalVignetteReachFrac: CGFloat = 0.62
        static let rimAlpha: CGFloat = 0.12
        static let rimScale: CGFloat = 1.048
        static let rimTintPlayer = UIColor(red: 255 / 255, green: 195 / 255, blue: 130 / 255, alpha: 1)
        static let rimTintEnemy = UIColor(red: 255 / 255, green: 175 / 255, blue: 150 / 255, alpha: 1)
    }

    private static let generatedTextureCacheLimit = 16
    private static var generatedTextureCache: [String: SKTexture] = [:]
    private static var spotlightFloorPoolRadiusX: CGFloat { battleLayoutPt(84) }
    private static var spotlightFloorPoolRadiusY: CGFloat { battleLayoutPt(14) }

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

    private static func makePaintedTexture(
        key: String,
        size: CGSize,
        paint: (CGContext, CGSize) -> Void
    ) -> SKTexture {
        cachedGeneratedTexture(key: key) {
            let textureSize = CGSize(width: max(1, size.width), height: max(1, size.height))
            let renderer = UIGraphicsImageRenderer(size: textureSize)
            let image = renderer.image { ctx in
                paint(ctx.cgContext, textureSize)
            }
            let texture = SKTexture(image: image)
            texture.filteringMode = .linear
            return texture
        }
    }

    private enum JazzStagePropLayout {
        static let doubleBassWidthFrac: CGFloat = 0.10
        static let pianoWidthFrac: CGFloat = 0.13
        static let drumWidthFrac: CGFloat = 0.138
        static let drumCenterXPreferredFrac: CGFloat = 0.91
        static let drumMarginFromSceneRightPt: CGFloat = 16
        static let instrumentTint = UIColor(red: 38 / 255, green: 30 / 255, blue: 28 / 255, alpha: 1)
        static let instrumentBlendFactor: CGFloat = 0.68
    }

    private static func addProceduralBackdrop(
        into layer: SKNode,
        size: CGSize,
        floorY: CGFloat,
        keyboardHeight: CGFloat,
        clearanceFromKeyboard: CGFloat
    ) {
        let key = generatedTextureCacheKey(
            "jazzBackdrop",
            textureCacheComponent(size.width),
            textureCacheComponent(size.height),
            textureCacheComponent(floorY),
            textureCacheComponent(keyboardHeight),
            textureCacheComponent(clearanceFromKeyboard)
        )
        let texture = makePaintedTexture(key: key, size: size) { cg, textureSize in
            paintJazzBarBackdrop(
                cgContext: cg,
                size: textureSize,
                floorY: floorY,
                keyboardHeight: keyboardHeight,
                clearanceFromKeyboard: clearanceFromKeyboard
            )
        }
        let backdrop = SKSpriteNode(texture: texture)
        backdrop.anchorPoint = CGPoint(x: 0.5, y: 0)
        backdrop.position = CGPoint(x: size.width / 2, y: 0)
        backdrop.size = size
        backdrop.zPosition = SpotlightLayout.Z.backdrop
        layer.addChild(backdrop)
    }

    private static func addStageSpotlights(into layer: SKNode, size: CGSize, floorY: CGFloat) {
        let localKey = generatedTextureCacheKey(
            "localSpotlight",
            textureCacheComponent(size.width),
            textureCacheComponent(size.height),
            textureCacheComponent(floorY)
        )
        let localTex = makePaintedTexture(key: localKey, size: size) { cg, textureSize in
            paintLocalSpotlightVignette(cgContext: cg, size: textureSize, floorY: floorY)
        }
        let localNode = SKSpriteNode(texture: localTex)
        localNode.anchorPoint = CGPoint(x: 0.5, y: 0)
        localNode.position = CGPoint(x: size.width / 2, y: 0)
        localNode.size = size
        localNode.zPosition = SpotlightLayout.Z.localVignette
        localNode.blendMode = .multiply
        layer.addChild(localNode)

        addSpotlightConeNode(
            into: layer,
            size: size,
            floorY: floorY,
            centerX: size.width * 0.23,
            apexTowardCenterShift: size.width * SpotlightLayout.coneApexShiftTowardCenterFrac,
            warmTint: SpotlightLayout.warmTintPlayer,
            peakAlpha: SpotlightLayout.coneAlphaPlayer,
            zSlot: 0
        )
        addSpotlightConeNode(
            into: layer,
            size: size,
            floorY: floorY,
            centerX: size.width * 0.77,
            apexTowardCenterShift: -size.width * SpotlightLayout.coneApexShiftTowardCenterFrac,
            warmTint: SpotlightLayout.warmTintEnemy,
            peakAlpha: SpotlightLayout.coneAlphaEnemy,
            zSlot: 1
        )
        addFloorLightPoolNode(
            into: layer,
            size: size,
            floorY: floorY,
            centerX: size.width * 0.23,
            warmTint: SpotlightLayout.warmTintPlayer,
            poolAlpha: SpotlightLayout.floorPoolAlphaPlayer,
            zSlot: 0
        )
        addFloorLightPoolNode(
            into: layer,
            size: size,
            floorY: floorY,
            centerX: size.width * 0.77,
            warmTint: SpotlightLayout.warmTintEnemy,
            poolAlpha: SpotlightLayout.floorPoolAlphaEnemy,
            zSlot: 1
        )
    }

    private static func addSpotlightConeNode(
        into layer: SKNode,
        size: CGSize,
        floorY: CGFloat,
        centerX: CGFloat,
        apexTowardCenterShift: CGFloat,
        warmTint: UIColor,
        peakAlpha: CGFloat,
        zSlot: Int
    ) {
        let key = generatedTextureCacheKey(
            "spotlightCone",
            textureCacheComponent(size.width),
            textureCacheComponent(size.height),
            textureCacheComponent(floorY),
            textureCacheComponent(centerX),
            textureCacheComponent(apexTowardCenterShift),
            textureCachePreciseComponent(peakAlpha)
        )
        let tex = makePaintedTexture(key: key, size: size) { cg, textureSize in
            paintSpotlightCone(
                cgContext: cg,
                size: textureSize,
                floorY: floorY,
                centerX: centerX,
                apexTowardCenterShift: apexTowardCenterShift,
                warmTint: warmTint,
                peakAlpha: peakAlpha
            )
        }
        let node = SKSpriteNode(texture: tex)
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.position = CGPoint(x: size.width / 2, y: 0)
        node.size = size
        node.zPosition = SpotlightLayout.Z.cone + CGFloat(zSlot) * 0.001
        node.blendMode = .screen
        layer.addChild(node)
    }

    private static func addFloorLightPoolNode(
        into layer: SKNode,
        size: CGSize,
        floorY: CGFloat,
        centerX: CGFloat,
        warmTint: UIColor,
        poolAlpha: CGFloat,
        zSlot: Int
    ) {
        let key = generatedTextureCacheKey(
            "floorLightPool",
            textureCacheComponent(size.width),
            textureCacheComponent(size.height),
            textureCacheComponent(floorY),
            textureCacheComponent(centerX),
            textureCachePreciseComponent(poolAlpha)
        )
        let tex = makePaintedTexture(key: key, size: size) { cg, textureSize in
            paintFloorLightPool(
                cgContext: cg,
                size: textureSize,
                floorY: floorY,
                centerX: centerX,
                warmTint: warmTint,
                peakAlpha: poolAlpha
            )
        }
        let node = SKSpriteNode(texture: tex)
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.position = CGPoint(x: size.width / 2, y: 0)
        node.size = size
        node.zPosition = SpotlightLayout.Z.floorPool + CGFloat(zSlot) * 0.001
        node.blendMode = .screen
        layer.addChild(node)
    }

    private static func addFinalVignette(into layer: SKNode, size: CGSize) {
        let key = generatedTextureCacheKey(
            "finalVignette",
            textureCacheComponent(size.width),
            textureCacheComponent(size.height)
        )
        let tex = makePaintedTexture(key: key, size: size) { cg, textureSize in
            paintFinalStageVignette(cgContext: cg, size: textureSize)
        }
        let node = SKSpriteNode(texture: tex)
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.position = CGPoint(x: size.width / 2, y: 0)
        node.size = size
        node.zPosition = SpotlightLayout.Z.finalVignette
        layer.addChild(node)
    }

    private static func addStageProps(into layer: SKNode, width: CGFloat, floorY: CGFloat) {
        addPropIfAvailable(
            assetName: "ear-training-bg-double-bass",
            centerX: width * 0.075,
            floorY: floorY,
            maxWidth: width * JazzStagePropLayout.doubleBassWidthFrac,
            alpha: 0.82,
            z: SpotlightLayout.Z.doubleBass,
            tintColor: JazzStagePropLayout.instrumentTint,
            tintBlendFactor: JazzStagePropLayout.instrumentBlendFactor,
            layer: layer
        )
        addPropIfAvailable(
            assetName: "ear-training-bg-upright-piano",
            centerX: width * 0.352,
            floorY: floorY,
            maxWidth: width * JazzStagePropLayout.pianoWidthFrac,
            alpha: 0.82,
            z: SpotlightLayout.Z.piano,
            tintColor: JazzStagePropLayout.instrumentTint,
            tintBlendFactor: JazzStagePropLayout.instrumentBlendFactor,
            layer: layer
        )

        let drumMaxW = max(1, floor(width * JazzStagePropLayout.drumWidthFrac))
        let drumHalfW = drumMaxW * 0.5
        let enemyApproxRightEdgeX = width * 0.77 + characterDisplaySize * 0.48
        let drumMaxCenterX = width - JazzStagePropLayout.drumMarginFromSceneRightPt - drumHalfW
        let minimumCenterPastEnemy = enemyApproxRightEdgeX + drumHalfW * 0.32 + 10
        var drumCenterX = width * JazzStagePropLayout.drumCenterXPreferredFrac
        drumCenterX = max(drumCenterX, min(minimumCenterPastEnemy, drumMaxCenterX))
        drumCenterX = min(drumCenterX, drumMaxCenterX)
        addPropIfAvailable(
            assetName: "ear-training-bg-drum-kit",
            centerX: drumCenterX,
            floorY: floorY,
            maxWidth: drumMaxW,
            alpha: 0.84,
            z: SpotlightLayout.Z.drumKit,
            tintColor: JazzStagePropLayout.instrumentTint,
            tintBlendFactor: JazzStagePropLayout.instrumentBlendFactor,
            layer: layer
        )
    }

    private static func addFloorShadows(into layer: SKNode, width: CGFloat, floorY: CGFloat) {
        for centerX in [width * 0.23, width * 0.77] {
            let shadow = SKShapeNode(ellipseOf: CGSize(width: 168, height: 28))
            shadow.fillColor = UIColor.black.withAlphaComponent(0.17)
            shadow.strokeColor = .clear
            shadow.position = CGPoint(x: centerX, y: floorY - 6)
            shadow.zPosition = SpotlightLayout.Z.floorShadow
            layer.addChild(shadow)
        }
    }

    private static func addPropIfAvailable(
        assetName: String,
        centerX: CGFloat,
        floorY: CGFloat,
        maxWidth: CGFloat,
        alpha: CGFloat,
        z: CGFloat,
        tintColor: UIColor? = nil,
        tintBlendFactor: CGFloat = 0,
        layer: SKNode
    ) {
        guard let image = UIImage(named: assetName), image.size.width > 1 else { return }
        let texture = SKTexture(image: image)
        let drawWidth = max(1, floor(maxWidth))
        let drawHeight = max(1, floor(drawWidth * (image.size.height / image.size.width)))
        let sprite = SKSpriteNode(texture: texture)
        sprite.anchorPoint = CGPoint(x: 0.5, y: 0)
        sprite.size = CGSize(width: drawWidth, height: drawHeight)
        sprite.position = CGPoint(x: centerX, y: floorY)
        sprite.alpha = alpha
        sprite.zPosition = z
        if let tintColor, tintBlendFactor > 0 {
            sprite.color = tintColor
            sprite.colorBlendFactor = tintBlendFactor
        }
        layer.addChild(sprite)
    }

    private static func paintLocalSpotlightVignette(cgContext cg: CGContext, size textureSize: CGSize, floorY: CGFloat) {
        let width = textureSize.width
        let height = textureSize.height
        let rgb = CGColorSpaceCreateDeviceRGB()
        cg.saveGState()
        defer { cg.restoreGState() }
        cg.setAllowsAntialiasing(true)

        let floorUIKitY = height - floorY
        let midTone = UIColor.white.withAlphaComponent(1.0 - SpotlightLayout.localVignetteStrength * 0.55).cgColor
        let clear = UIColor.white.cgColor

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

        if let gMid = CGGradient(
            colorsSpace: rgb,
            colors: [
                UIColor.white.withAlphaComponent(1.0 - SpotlightLayout.localVignetteStrength * 0.35).cgColor,
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
        let desiredTop = SpotlightLayout.coneApexInsetFromTopUIKit
        var apexUIKitY = min(desiredTop, floorLimitUIKitY)
        if apexUIKitY < 1 {
            apexUIKitY = min(max(2, floorUIKitY * 0.06), floorLimitUIKitY)
        }
        apexUIKitY = max(0, apexUIKitY)

        let halfTop = width * SpotlightLayout.coneHalfWidthTopFrac
        let halfBot = width * SpotlightLayout.coneHalfWidthBottomFrac
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

        if let gVert = CGGradient(colorsSpace: rgb, colors: [bridgeOpaque.cgColor, fade] as CFArray, locations: [0, 1]) {
            cg.drawLinearGradient(
                gVert,
                start: CGPoint(x: centerX, y: midUIKitY),
                end: CGPoint(x: centerX, y: floorUIKitY + 24),
                options: [.drawsAfterEndLocation]
            )
        }

        if let gFeather = CGGradient(
            colorsSpace: rgb,
            colors: [transparent, warmTint.withAlphaComponent(peakAlpha * 0.55).cgColor, transparent] as CFArray,
            locations: [0, 0.5, 1]
        ) {
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
        let rx = spotlightFloorPoolRadiusX * 1.05
        let ry = spotlightFloorPoolRadiusY * 1.2

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

    private static func paintFinalStageVignette(cgContext cg: CGContext, size textureSize: CGSize) {
        let width = textureSize.width
        let height = textureSize.height
        let rgb = CGColorSpaceCreateDeviceRGB()
        cg.saveGState()
        defer { cg.restoreGState() }
        cg.setAllowsAntialiasing(true)

        let strength = SpotlightLayout.finalVignetteAlpha
        let edge = UIColor.black.withAlphaComponent(0.42 * strength).cgColor
        let clear = UIColor.clear.cgColor
        let reach = max(width, height) * SpotlightLayout.finalVignetteReachFrac

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

        if let gTop = CGGradient(
            colorsSpace: rgb,
            colors: [UIColor.black.withAlphaComponent(0.18 * strength).cgColor, clear] as CFArray,
            locations: [0, 1]
        ) {
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

    /// 画像アセット無しでジャズバー風の背景を描く（UIKit・上原点）。
    private static func paintJazzBarBackdrop(
        cgContext cg: CGContext,
        size textureSize: CGSize,
        floorY: CGFloat,
        keyboardHeight: CGFloat,
        clearanceFromKeyboard: CGFloat
    ) {
        let width = textureSize.width
        let height = textureSize.height
        let floorUIKitY = height - floorY
        let fyMax = height - 20
        let fyMin = height * 0.08
        let fyClamped = min(max(floorUIKitY, fyMin), fyMax)
        let wallHeightUi = height - fyClamped

        let rgb = CGColorSpaceCreateDeviceRGB()
        let lipInsetTrim = max(18.0, width * 0.018)

        let paletteTop = UIColor(red: 22 / 255, green: 11 / 255, blue: 8 / 255, alpha: 1).cgColor
        let paletteMid = UIColor(red: 42 / 255, green: 22 / 255, blue: 14 / 255, alpha: 1).cgColor
        let paletteBot = UIColor(red: 14 / 255, green: 7 / 255, blue: 5 / 255, alpha: 1).cgColor
        let woodDarkFill = UIColor(red: 36 / 255, green: 18 / 255, blue: 11 / 255, alpha: 1)
        let woodMidFill = UIColor(red: 58 / 255, green: 33 / 255, blue: 20 / 255, alpha: 1)

        cg.saveGState()
        defer { cg.restoreGState() }

        jazzBackdropEdgeColor.setFill()
        cg.fill(CGRect(origin: .zero, size: textureSize))
        if let baseAll = CGGradient(colorsSpace: rgb, colors: [paletteMid, paletteBot] as CFArray, locations: [0, 1]) {
            cg.drawLinearGradient(
                baseAll,
                start: CGPoint(x: width * 0.5, y: 0),
                end: CGPoint(x: width * 0.5, y: height),
                options: [.drawsAfterEndLocation]
            )
        }

        if wallHeightUi > 44, let wallG = CGGradient(
            colorsSpace: rgb,
            colors: [paletteTop, paletteMid, paletteBot] as CFArray,
            locations: [0, 0.42, 1]
        ) {
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
            let wallR = CGRect(
                x: sidePad,
                y: topPad,
                width: width - sidePad * 2,
                height: wallHeightUi - topPad - botPad
            )
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
            if let gTop = CGGradient(
                colorsSpace: rgb,
                colors: [UIColor.black.withAlphaComponent(0.58).cgColor, UIColor.clear.cgColor] as CFArray,
                locations: [0, 1]
            ) {
                cg.drawLinearGradient(
                    gTop,
                    start: CGPoint(x: width * 0.5, y: 0),
                    end: CGPoint(x: width * 0.5, y: wallHeightUi * 0.52),
                    options: [.drawsAfterEndLocation]
                )
            }
            let sideTone = UIColor.black.withAlphaComponent(0.42).cgColor
            if let gSide = CGGradient(
                colorsSpace: rgb,
                colors: [sideTone, UIColor.clear.cgColor] as CFArray,
                locations: [0, 1]
            ) {
                cg.drawLinearGradient(
                    gSide,
                    start: CGPoint(x: 0, y: wallHeightUi * 0.5),
                    end: CGPoint(x: width * 0.42, y: wallHeightUi * 0.5),
                    options: [.drawsAfterEndLocation]
                )
                cg.drawLinearGradient(
                    gSide,
                    start: CGPoint(x: width, y: wallHeightUi * 0.5),
                    end: CGPoint(x: width * 0.58, y: wallHeightUi * 0.5),
                    options: [.drawsAfterEndLocation]
                )
            }

            let chordBandMinY = wallHeightUi * 0.38
            cg.saveGState()
            cg.clip(to: CGRect(x: 0, y: chordBandMinY, width: width, height: max(1, wallHeightUi - chordBandMinY)))
            if let cen = CGGradient(
                colorsSpace: rgb,
                colors: [UIColor.black.withAlphaComponent(0.48).cgColor, UIColor.clear.cgColor] as CFArray,
                locations: [0, 1]
            ) {
                let cx = width * 0.5
                let cy = wallHeightUi * 0.62
                let rx = width * 0.28
                let ry = (wallHeightUi - chordBandMinY) * 0.72
                cg.drawRadialGradient(
                    cen,
                    startCenter: CGPoint(x: cx, y: cy),
                    startRadius: 0,
                    endCenter: CGPoint(x: cx, y: cy),
                    endRadius: max(rx, ry),
                    options: [.drawsAfterEndLocation]
                )
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

        let barSkCapDesired = min(keyboardHeight + clearanceFromKeyboard, max(12, fyClamped - 10))
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
            if let band = CGGradient(
                colorsSpace: rgb,
                colors: [woodMidFill.cgColor, woodDarkFill.cgColor] as CFArray,
                locations: [0, 1]
            ) {
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
        if let rimTop = CGGradient(
            colorsSpace: rgb,
            colors: [UIColor.black.withAlphaComponent(0.30).cgColor, UIColor.clear.cgColor] as CFArray,
            locations: [0, 1]
        ) {
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
                cg.drawLinearGradient(
                    bleed,
                    start: CGPoint(x: width * 0.5, y: 0),
                    end: CGPoint(x: width * 0.5, y: wallHeightUi * 0.105),
                    options: [.drawsAfterEndLocation]
                )
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
}

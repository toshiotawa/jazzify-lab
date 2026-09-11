import SpriteKit
import UIKit

/// Shared jazz-bar battle stage visuals for Ear Training, Defense, and Training modes.
enum EarTrainingBattleStageKit {
    static let hudHeight: CGFloat = 104
    static let pianoVisualTopFromBottom: CGFloat = 80
    static let floorAirAboveKeyboard: CGFloat = 6
    static let battleCharacterVisualScale: CGFloat = 2.0 / 3.0

    static var characterDisplaySize: CGFloat { battleLayoutPt(88) }
    static var characterShadowWidth: CGFloat { battleLayoutPt(82) }
    static var characterShadowHeight: CGFloat { battleLayoutPt(18) }

    static func battleLayoutPt(_ base: CGFloat) -> CGFloat {
        base * battleCharacterVisualScale
    }

    static func battleFloorY(sceneHeight: CGFloat) -> CGFloat {
        let baselineFootY = pianoVisualTopFromBottom + floorAirAboveKeyboard
        let preferredFloorY = max(baselineFootY, sceneHeight * 0.15)
        let maximumFloorY = sceneHeight - hudHeight - characterDisplaySize * 1.1
        return min(preferredFloorY, maximumFloorY)
    }

    static func installBattleBackdrop(into layer: SKNode, size: CGSize) {
        layer.removeAllChildren()
        guard size.width > 0, size.height > 0 else { return }

        let floorY = battleFloorY(sceneHeight: size.height)

        if let interior = UIImage(named: "ear-training-bg-jazz-club-interior") {
            let backdrop = SKSpriteNode(texture: SKTexture(image: interior))
            backdrop.anchorPoint = CGPoint(x: 0.5, y: 0)
            backdrop.position = CGPoint(x: size.width / 2, y: 0)
            backdrop.size = size
            backdrop.zPosition = 0
            layer.addChild(backdrop)
        } else {
            let fill = SKSpriteNode(color: UIColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1), size: size)
            fill.anchorPoint = .zero
            fill.position = .zero
            fill.zPosition = 0
            layer.addChild(fill)
        }

        addPropIfAvailable(
            assetName: "ear-training-bg-double-bass",
            centerX: size.width * 0.075,
            floorY: floorY,
            maxWidth: size.width * 0.10,
            z: 2,
            layer: layer
        )
        addPropIfAvailable(
            assetName: "ear-training-bg-upright-piano",
            centerX: size.width * 0.352,
            floorY: floorY,
            maxWidth: size.width * 0.13,
            z: 2.5,
            layer: layer
        )
        addPropIfAvailable(
            assetName: "ear-training-bg-drum-kit",
            centerX: size.width * 0.91,
            floorY: floorY,
            maxWidth: size.width * 0.138,
            z: 3,
            layer: layer
        )

        for centerX in [size.width * 0.23, size.width * 0.77] {
            let shadow = SKShapeNode(ellipseOf: CGSize(width: 168, height: 28))
            shadow.fillColor = UIColor.black.withAlphaComponent(0.17)
            shadow.strokeColor = .clear
            shadow.position = CGPoint(x: centerX, y: floorY - 6)
            shadow.zPosition = 6
            layer.addChild(shadow)
        }
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
                width: characterDisplaySize * 1.048,
                height: characterDisplaySize * 1.048
            )
            rim.xScale = flipX ? -1 : 1
            rim.color = isPlayer
                ? UIColor(red: 255 / 255, green: 195 / 255, blue: 130 / 255, alpha: 1)
                : UIColor(red: 255 / 255, green: 175 / 255, blue: 150 / 255, alpha: 1)
            rim.colorBlendFactor = 1
            rim.alpha = 0.12
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

    private static func addPropIfAvailable(
        assetName: String,
        centerX: CGFloat,
        floorY: CGFloat,
        maxWidth: CGFloat,
        z: CGFloat,
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
        sprite.alpha = 0.82
        sprite.zPosition = z
        layer.addChild(sprite)
    }
}

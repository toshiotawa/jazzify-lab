import SpriteKit

final class TrainingScene: SKScene {
    private static let stageKeyboardHeight = EarTrainingBattleStageKit.chordPadKeyboardHeight
    private static let stageFloorClearance = EarTrainingBattleStageKit.chordPadFloorClearance
    private static let slashScaleUpSec: TimeInterval = 0.14
    private static let slashRotationRad: CGFloat = -4 * .pi / 180

    weak var session: TrainingGameSession?

    private var enemyNode = SKSpriteNode()
    private var dyingEnemyNode = SKSpriteNode()
    private var enemyFrameKey = ""
    private var dyingEnemyFrameKey = ""
    private var dyingEnemyFlashing = false
    private var playerNode: SKNode?
    private var playerSpriteNode: SKSpriteNode?
    private var playerRimNode: SKSpriteNode?
    private var lastPlayerPoseKey = ""
    private let backgroundLayer = SKNode()
    private let characterLayer = SKNode()
    private let effectLayer = SKNode()
    private let slashNode = SKSpriteNode()
    private var textures: [String: SKTexture] = [:]
    private var playerTextures: [String: SKTexture] = [:]
    private var lastBuiltSize: CGSize = .zero

    private static let enemyXRatio: CGFloat = 0.77
    private static let playerXRatio: CGFloat = 0.23

    override func didMove(to view: SKView) {
        backgroundColor = EarTrainingBattleStageKit.jazzBackdropEdgeColor
        scaleMode = .resizeFill

        backgroundLayer.zPosition = 0
        characterLayer.zPosition = 10
        effectLayer.zPosition = 100
        for node in [backgroundLayer, characterLayer, effectLayer] where node.parent == nil {
            addChild(node)
        }

        preloadTextures()
        setupSlashEffect()
        rebuildStage()
    }

    override func didChangeSize(_ oldSize: CGSize) {
        super.didChangeSize(oldSize)
        if size != lastBuiltSize {
            rebuildStage()
        }
    }

    override func update(_ currentTime: TimeInterval) {
        guard let session else { return }
        session.advanceFrame(currentTime: currentTime)
        render(runtime: session.runtime)
    }

    private func rebuildStage() {
        guard size.width > 0, size.height > 0 else { return }
        lastBuiltSize = size
        EarTrainingBattleStageKit.installBattleBackdrop(
            into: backgroundLayer,
            size: size,
            keyboardHeight: Self.stageKeyboardHeight,
            clearanceFromKeyboard: Self.stageFloorClearance
        )

        characterLayer.removeAllChildren()
        enemyFrameKey = ""
        dyingEnemyFrameKey = ""
        dyingEnemyFlashing = false
        enemyNode = makeEnemySprite(for: .slime)
        dyingEnemyNode = makeEnemySprite(for: .slime)
        characterLayer.addChild(dyingEnemyNode)
        characterLayer.addChild(enemyNode)
        playerNode = nil
        playerSpriteNode = nil
        playerRimNode = nil
        lastPlayerPoseKey = ""

        let floorY = EarTrainingBattleStageKit.battleFloorY(
            sceneHeight: size.height,
            keyboardHeight: Self.stageKeyboardHeight,
            clearanceFromKeyboard: Self.stageFloorClearance
        )
        let player = EarTrainingBattleStageKit.makeAvatarContainer(
            assetName: DefensePlayerPose.idleAssetNames[0],
            position: CGPoint(x: size.width * Self.playerXRatio, y: floorY),
            isPlayer: true
        )
        characterLayer.addChild(player)
        playerNode = player
        lastPlayerPoseKey = DefensePlayerPose.idleAssetNames[0]

        for child in player.children {
            guard let sprite = child as? SKSpriteNode else { continue }
            if sprite.blendMode == .add {
                playerRimNode = sprite
            } else {
                playerSpriteNode = sprite
            }
        }
    }

    private func preloadTextures() {
        guard textures.isEmpty else { return }
        for type in DefenseEnemyType.allCases {
            for frame in [DefenseEnemyFrame.idle, .move] {
                let name = type.assetName(frame: frame)
                guard let image = UIImage(named: name) else { continue }
                let texture = SKTexture(image: image)
                texture.filteringMode = .nearest
                textures[name] = texture
            }
        }
        for name in DefensePlayerPose.sceneAssetNames {
            guard let image = UIImage(named: name) else { continue }
            let texture = SKTexture(image: image)
            texture.filteringMode = .nearest
            playerTextures[name] = texture
        }
        SKTexture.preload(Array(textures.values) + Array(playerTextures.values)) {}
    }

    private func setupSlashEffect() {
        guard slashNode.parent == nil else { return }
        slashNode.texture = Self.makeSlashTexture()
        slashNode.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        slashNode.zPosition = 150
        slashNode.isHidden = true
        effectLayer.addChild(slashNode)
    }

    private static func makeSlashTexture() -> SKTexture {
        let width: CGFloat = 256
        let height: CGFloat = 8
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height))
        let image = renderer.image { rendererContext in
            let cg = rendererContext.cgContext
            let rgb = CGColorSpaceCreateDeviceRGB()
            let colors = [
                UIColor.white.withAlphaComponent(0).cgColor,
                UIColor.white.withAlphaComponent(0.88).cgColor,
                UIColor.white.withAlphaComponent(0.95).cgColor,
                UIColor.white.withAlphaComponent(0.88).cgColor,
                UIColor.white.withAlphaComponent(0).cgColor,
            ] as CFArray
            let locations: [CGFloat] = [0, 0.04, 0.5, 0.96, 1]
            if let gradient = CGGradient(colorsSpace: rgb, colors: colors, locations: locations) {
                cg.drawLinearGradient(
                    gradient,
                    start: CGPoint(x: 0, y: height / 2),
                    end: CGPoint(x: width, y: height / 2),
                    options: []
                )
            }
            cg.setFillColor(UIColor.white.withAlphaComponent(0.9).cgColor)
            cg.fill(CGRect(x: width * 0.08, y: height / 2 - 1, width: width * 0.84, height: 2))
        }
        let texture = SKTexture(image: image)
        texture.filteringMode = .linear
        return texture
    }

    private static func easeInOut(_ t: TimeInterval) -> CGFloat {
        let value = CGFloat(t)
        return value < 0.5 ? 2 * value * value : 1 - pow(-2 * value + 2, 2) / 2
    }

    private static func easeOut(_ t: TimeInterval) -> CGFloat {
        let value = CGFloat(t)
        return 1 - pow(1 - value, 2)
    }

    private static func isSlashActive(elapsedSec: TimeInterval, slashUntilSec: TimeInterval) -> Bool {
        guard slashUntilSec > 0 else { return false }
        let remaining = slashUntilSec - elapsedSec
        return remaining > 0 && remaining <= DefenseEnemyConfig.slashSec
    }

    private static func isHitFlashActive(elapsedSec: TimeInterval, slashUntilSec: TimeInterval) -> Bool {
        guard slashUntilSec > 0 else { return false }
        let slashStart = slashUntilSec - DefenseEnemyConfig.slashSec
        let age = elapsedSec - slashStart
        return age >= 0 && age < DefenseEnemyConfig.hitFlashSec
    }

    private func render(runtime: TrainingRuntime) {
        let floorY = EarTrainingBattleStageKit.battleFloorY(
            sceneHeight: size.height,
            keyboardHeight: Self.stageKeyboardHeight,
            clearanceFromKeyboard: Self.stageFloorClearance
        )
        let avatarSize = EarTrainingBattleStageKit.characterDisplaySize
        playerNode?.position = CGPoint(x: size.width * Self.playerXRatio, y: floorY)

        let poseKey = DefensePlayerPose.trainingAssetName(
            elapsedSec: runtime.elapsedSec,
            slashUntilSec: runtime.dyingEnemy.slashUntilSec,
            guardPoseUntilSec: runtime.guardPoseUntilSec
        )
        if poseKey != lastPlayerPoseKey, let texture = playerTextures[poseKey] {
            lastPlayerPoseKey = poseKey
            playerSpriteNode?.texture = texture
            playerRimNode?.texture = texture
        }

        if runtime.dyingEnemy.active {
            let hitFlashActive = Self.isHitFlashActive(
                elapsedSec: runtime.elapsedSec,
                slashUntilSec: runtime.dyingEnemy.slashUntilSec
            )
            renderEnemyNode(
                node: dyingEnemyNode,
                frameKey: &dyingEnemyFrameKey,
                typeIndex: runtime.dyingEnemy.typeIndex,
                alpha: runtime.dyingEnemy.alpha,
                offsetX: runtime.dyingEnemy.offsetX,
                elapsedSec: runtime.elapsedSec,
                floorY: floorY,
                moving: false,
                attacking: false
            )
            if hitFlashActive != dyingEnemyFlashing {
                dyingEnemyFlashing = hitFlashActive
                dyingEnemyNode.color = .red
                dyingEnemyNode.colorBlendFactor = hitFlashActive ? 0.55 : 0
            }
        } else {
            dyingEnemyNode.isHidden = true
            if dyingEnemyFlashing {
                dyingEnemyFlashing = false
                dyingEnemyNode.colorBlendFactor = 0
            }
        }

        renderEnemyNode(
            node: enemyNode,
            frameKey: &enemyFrameKey,
            typeIndex: runtime.enemy.typeIndex,
            alpha: runtime.enemy.fadeAlpha,
            offsetX: 0,
            elapsedSec: runtime.elapsedSec,
            floorY: floorY,
            moving: false,
            attacking: false
        )

        renderSlash(runtime: runtime, floorY: floorY, avatarSize: avatarSize)
    }

    private func renderEnemyNode(
        node: SKSpriteNode,
        frameKey: inout String,
        typeIndex: Int,
        alpha: CGFloat,
        offsetX: CGFloat,
        elapsedSec: TimeInterval,
        floorY: CGFloat,
        moving: Bool,
        attacking: Bool
    ) {
        let enemyTypes = DefenseEnemyType.allCases
        let type = enemyTypes[typeIndex % enemyTypes.count]
        let frame = DefenseEnemyConfig.pickFrame(
            elapsedSec: elapsedSec,
            slotIndex: typeIndex,
            moving: moving,
            flying: type.isFlying,
            attacking: attacking
        )
        let textureKey = type.assetName(frame: frame)
        if frameKey != textureKey, let texture = textures[textureKey] {
            node.texture = texture
            frameKey = textureKey
        }

        var footOffset: CGFloat = 0
        if type.isFlying {
            footOffset -= DefenseEnemyConfig.displayFlyingYOffset
            footOffset += DefenseEnemyConfig.displayFlyingBobOffset(elapsedSec: elapsedSec, slotIndex: typeIndex)
        }

        node.isHidden = false
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.position = CGPoint(x: size.width * Self.enemyXRatio + offsetX, y: floorY + footOffset)
        node.alpha = alpha
        node.size = CGSize(
            width: DefenseEnemyConfig.displaySpriteWidth(for: type),
            height: DefenseEnemyConfig.displaySpriteHeight(for: type)
        )
        node.zPosition = type.zDepth
    }

    private func renderSlash(runtime: TrainingRuntime, floorY: CGFloat, avatarSize: CGFloat) {
        let slashUntilSec = runtime.dyingEnemy.slashUntilSec
        guard runtime.dyingEnemy.active, slashUntilSec > 0 else {
            slashNode.isHidden = true
            return
        }
        let remaining = slashUntilSec - runtime.elapsedSec
        guard remaining > 0, remaining <= DefenseEnemyConfig.slashSec else {
            slashNode.isHidden = true
            return
        }

        let age = DefenseEnemyConfig.slashSec - remaining
        let fromX = size.width * Self.playerXRatio + avatarSize * 0.45
        let fromY = floorY - avatarSize * 0.55
        let toX = size.width * Self.enemyXRatio
        let toY = fromY

        let dx = toX - fromX
        let dy = toY - fromY
        let scale = DefenseEnemyConfig.battleDisplayScale
        let span = hypot(dx, dy) + DefenseEnemyConfig.displayLayoutPt(48)
        let slashHeight = max(DefenseEnemyConfig.displayLayoutPt(4), scale * 0.36)
        let scaleT = min(1, age / Self.slashScaleUpSec)
        let xScale = 0.5 + 0.5 * Self.easeInOut(scaleT)
        let fadeT = age / DefenseEnemyConfig.slashSec
        let alpha = 1 - Self.easeOut(fadeT)

        slashNode.isHidden = false
        slashNode.size = CGSize(width: span, height: slashHeight)
        slashNode.position = CGPoint(x: (fromX + toX) / 2, y: (fromY + toY) / 2)
        slashNode.zRotation = atan2(dy, dx) + Self.slashRotationRad
        slashNode.xScale = xScale
        slashNode.yScale = 1
        slashNode.alpha = alpha
    }

    private func makeEnemySprite(for type: DefenseEnemyType) -> SKSpriteNode {
        let textureKey = type.assetName(frame: .idle)
        let node = SKSpriteNode(texture: textures[textureKey])
        node.size = CGSize(
            width: DefenseEnemyConfig.displaySpriteWidth(for: type),
            height: DefenseEnemyConfig.displaySpriteHeight(for: type)
        )
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.zPosition = type.zDepth
        return node
    }
}

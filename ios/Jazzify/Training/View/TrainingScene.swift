import SpriteKit

final class TrainingScene: SKScene {
    weak var session: TrainingGameSession?

    private var enemyNode = SKSpriteNode()
    private var dyingEnemyNode = SKSpriteNode()
    private var enemyFrameKey = ""
    private var dyingEnemyFrameKey = ""
    private var playerNode: SKNode?
    private var playerSpriteNode: SKSpriteNode?
    private var playerRimNode: SKSpriteNode?
    private var defaultPlayerTexture: SKTexture?
    private var guardPlayerTexture: SKTexture?
    private var isShowingGuardPose = false
    private let backgroundLayer = SKNode()
    private let characterLayer = SKNode()
    private let effectLayer = SKNode()
    private let slashGlow = SKShapeNode()
    private let slashCore = SKShapeNode()
    private var textures: [String: SKTexture] = [:]
    private var lastBuiltSize: CGSize = .zero

    private static let enemyXRatio: CGFloat = 0.77
    private static let playerXRatio: CGFloat = 0.23

    override func didMove(to view: SKView) {
        backgroundColor = .clear
        scaleMode = .resizeFill

        backgroundLayer.zPosition = 0
        characterLayer.zPosition = 10
        effectLayer.zPosition = 100
        for node in [backgroundLayer, characterLayer, effectLayer] where node.parent == nil {
            addChild(node)
        }

        preloadTextures()
        setupSlashEffect()
        characterLayer.addChild(dyingEnemyNode)
        characterLayer.addChild(enemyNode)
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
        EarTrainingBattleStageKit.installBattleBackdrop(into: backgroundLayer, size: size)

        characterLayer.removeAllChildren()
        characterLayer.addChild(dyingEnemyNode)
        characterLayer.addChild(enemyNode)
        playerNode = nil
        playerSpriteNode = nil
        playerRimNode = nil
        isShowingGuardPose = false

        let floorY = EarTrainingBattleStageKit.battleFloorY(sceneHeight: size.height)
        let player = EarTrainingBattleStageKit.makeAvatarContainer(
            assetName: EarTrainingBattleController.playerAvatarAssetName,
            position: CGPoint(x: size.width * Self.playerXRatio, y: floorY),
            isPlayer: true
        )
        characterLayer.addChild(player)
        playerNode = player

        defaultPlayerTexture = SKTexture(imageNamed: EarTrainingBattleController.playerAvatarAssetName)
        if let guardImage = UIImage(named: "GuardD") {
            guardPlayerTexture = SKTexture(image: guardImage)
        }

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
        for type in DefenseEnemyType.allCases {
            for frame in [DefenseEnemyFrame.idle, .move] {
                let name = type.assetName(frame: frame)
                let texture = SKTexture(imageNamed: name)
                texture.filteringMode = .nearest
                textures[name] = texture
            }
        }
        SKTexture.preload(Array(textures.values)) {}
    }

    private func setupSlashEffect() {
        slashGlow.path = Self.makeTaperedSlashUnitPath(halfWidth: 10)
        slashGlow.fillColor = SKColor(red: 0.13, green: 0.83, blue: 0.93, alpha: 0.55)
        slashGlow.strokeColor = .clear
        slashGlow.zPosition = 150
        slashGlow.isHidden = true
        effectLayer.addChild(slashGlow)

        slashCore.path = Self.makeTaperedSlashUnitPath(halfWidth: 4)
        slashCore.fillColor = SKColor(red: 0.97, green: 0.98, blue: 0.99, alpha: 0.95)
        slashCore.strokeColor = .clear
        slashCore.zPosition = 151
        slashCore.isHidden = true
        effectLayer.addChild(slashCore)
    }

    private static func makeTaperedSlashUnitPath(halfWidth: CGFloat) -> CGPath {
        let path = CGMutablePath()
        path.move(to: CGPoint(x: 0, y: halfWidth * 0.15))
        path.addQuadCurve(
            to: CGPoint(x: 1, y: 0),
            control: CGPoint(x: 0.5, y: halfWidth * 1.15)
        )
        path.addQuadCurve(
            to: CGPoint(x: 0, y: -halfWidth * 0.15),
            control: CGPoint(x: 0.5, y: -halfWidth * 1.15)
        )
        path.closeSubpath()
        return path
    }

    private func render(runtime: TrainingRuntime) {
        let floorY = EarTrainingBattleStageKit.battleFloorY(sceneHeight: size.height)
        let avatarSize = EarTrainingBattleStageKit.characterDisplaySize
        playerNode?.position = CGPoint(x: size.width * Self.playerXRatio, y: floorY)

        let showGuardPose = runtime.guardPoseUntilSec > 0 && runtime.elapsedSec < runtime.guardPoseUntilSec
        if showGuardPose != isShowingGuardPose {
            isShowingGuardPose = showGuardPose
            let texture = showGuardPose ? guardPlayerTexture : defaultPlayerTexture
            if let texture {
                playerSpriteNode?.texture = texture
                playerRimNode?.texture = texture
            }
        }

        if runtime.dyingEnemy.active {
            renderEnemyNode(
                node: dyingEnemyNode,
                frameKey: &dyingEnemyFrameKey,
                typeIndex: runtime.dyingEnemy.typeIndex,
                alpha: runtime.dyingEnemy.alpha,
                offsetX: runtime.dyingEnemy.offsetX,
                elapsedSec: runtime.elapsedSec,
                floorY: floorY
            )
        } else {
            dyingEnemyNode.isHidden = true
        }

        renderEnemyNode(
            node: enemyNode,
            frameKey: &enemyFrameKey,
            typeIndex: runtime.enemy.typeIndex,
            alpha: runtime.enemy.fadeAlpha,
            offsetX: 0,
            elapsedSec: runtime.elapsedSec,
            floorY: floorY
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
        floorY: CGFloat
    ) {
        let enemyTypes = DefenseEnemyType.allCases
        let type = enemyTypes[typeIndex % enemyTypes.count]
        let frame = DefenseEnemyConfig.pickFrame(
            elapsedSec: elapsedSec,
            slotIndex: typeIndex,
            moving: false,
            flying: type.isFlying,
            attacking: false
        )
        let textureKey = type.assetName(frame: frame)
        if frameKey != textureKey, let texture = textures[textureKey] {
            node.texture = texture
            frameKey = textureKey
        }

        var footOffset: CGFloat = 0
        if type.isFlying {
            footOffset -= DefenseEnemyConfig.flyingYOffset
            footOffset += DefenseEnemyConfig.flyingBobOffset(elapsedSec: elapsedSec, slotIndex: typeIndex)
        }

        node.isHidden = false
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.position = CGPoint(x: size.width * Self.enemyXRatio + offsetX, y: floorY + footOffset)
        node.alpha = alpha
        node.size = CGSize(width: DefenseEnemyConfig.spriteWidth(for: type), height: type.spriteHeight)
        node.zPosition = type.zDepth
    }

    private func renderSlash(runtime: TrainingRuntime, floorY: CGFloat, avatarSize: CGFloat) {
        let slashUntilSec = runtime.dyingEnemy.slashUntilSec
        guard runtime.dyingEnemy.active, slashUntilSec > 0 else {
            slashGlow.isHidden = true
            slashCore.isHidden = true
            return
        }
        let remaining = slashUntilSec - runtime.elapsedSec
        guard remaining > 0, remaining <= DefenseEnemyConfig.slashSec else {
            slashGlow.isHidden = true
            slashCore.isHidden = true
            return
        }

        let progress = 1 - remaining / DefenseEnemyConfig.slashSec
        let growPhase: TimeInterval = 0.4
        let growT = min(1, progress / growPhase)
        let lengthScale = CGFloat(1 - pow(1 - growT, 3))
        let alpha = progress < growPhase
            ? 1
            : CGFloat(1 - ((progress - growPhase) / (1 - growPhase)))

        let fromX = size.width * Self.playerXRatio + avatarSize * 0.45
        let fromY = floorY - avatarSize * 0.55
        let toX = size.width * Self.enemyXRatio + runtime.dyingEnemy.offsetX
        let toY = fromY
        let endX = fromX + (toX - fromX) * lengthScale
        let endY = fromY + (toY - fromY) * lengthScale
        let dx = endX - fromX
        let dy = endY - fromY
        let length = max(1, hypot(dx, dy))
        let angle = atan2(dy, dx)

        slashGlow.isHidden = false
        slashCore.isHidden = false
        slashGlow.position = CGPoint(x: fromX, y: fromY)
        slashGlow.zRotation = angle
        slashGlow.xScale = length
        slashGlow.yScale = 1
        slashGlow.alpha = alpha
        slashCore.position = CGPoint(x: fromX, y: fromY)
        slashCore.zRotation = angle
        slashCore.xScale = length
        slashCore.yScale = 1
        slashCore.alpha = alpha
    }
}

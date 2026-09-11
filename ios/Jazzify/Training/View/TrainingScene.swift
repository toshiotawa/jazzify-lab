import SpriteKit

final class TrainingScene: SKScene {
    weak var session: TrainingGameSession?

    private var enemyNode = SKSpriteNode()
    private var enemyFrameKey = ""
    private var playerNode: SKNode?
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
        characterLayer.addChild(enemyNode)

        let floorY = EarTrainingBattleStageKit.battleFloorY(sceneHeight: size.height)
        let player = EarTrainingBattleStageKit.makeAvatarContainer(
            assetName: EarTrainingBattleController.playerAvatarAssetName,
            position: CGPoint(x: size.width * Self.playerXRatio, y: floorY),
            isPlayer: true
        )
        characterLayer.addChild(player)
        playerNode = player
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
        let unitPath = CGMutablePath()
        unitPath.move(to: .zero)
        unitPath.addLine(to: CGPoint(x: 1, y: 0))

        slashGlow.path = unitPath
        slashGlow.strokeColor = SKColor(red: 0.13, green: 0.83, blue: 0.93, alpha: 0.55)
        slashGlow.lineWidth = 6
        slashGlow.lineCap = .butt
        slashGlow.zPosition = 150
        slashGlow.isHidden = true
        effectLayer.addChild(slashGlow)

        slashCore.path = unitPath
        slashCore.strokeColor = SKColor(red: 0.97, green: 0.98, blue: 0.99, alpha: 1)
        slashCore.lineWidth = 2
        slashCore.lineCap = .butt
        slashCore.zPosition = 151
        slashCore.isHidden = true
        effectLayer.addChild(slashCore)
    }

    private func render(runtime: TrainingRuntime) {
        let floorY = EarTrainingBattleStageKit.battleFloorY(sceneHeight: size.height)
        playerNode?.position = CGPoint(x: size.width * Self.playerXRatio, y: floorY)

        let enemyTypes = DefenseEnemyType.allCases
        let type = enemyTypes[runtime.enemy.typeIndex % enemyTypes.count]
        let frame = DefenseEnemyConfig.pickFrame(
            elapsedSec: runtime.elapsedSec,
            slotIndex: 0,
            moving: false,
            flying: type.isFlying,
            attacking: false
        )
        let textureKey = type.assetName(frame: frame)
        if enemyFrameKey != textureKey, let texture = textures[textureKey] {
            enemyNode.texture = texture
            enemyFrameKey = textureKey
        }

        var footOffset: CGFloat = 0
        if type.isFlying {
            footOffset -= DefenseEnemyConfig.flyingYOffset
            footOffset += DefenseEnemyConfig.flyingBobOffset(elapsedSec: runtime.elapsedSec, slotIndex: 0)
        }

        enemyNode.anchorPoint = CGPoint(x: 0.5, y: 0)
        enemyNode.position = CGPoint(x: size.width * Self.enemyXRatio, y: floorY + footOffset)
        enemyNode.alpha = CGFloat(runtime.enemy.fadeAlpha)
        enemyNode.size = CGSize(width: DefenseEnemyConfig.spriteWidth(for: type), height: type.spriteHeight)
        enemyNode.zPosition = type.zDepth

        renderSlash(runtime: runtime, floorY: floorY)
    }

    private func renderSlash(runtime: TrainingRuntime, floorY: CGFloat) {
        guard runtime.enemy.slashUntilSec > 0 else {
            slashGlow.isHidden = true
            slashCore.isHidden = true
            return
        }
        let remaining = runtime.enemy.slashUntilSec - runtime.elapsedSec
        guard remaining > 0, remaining <= DefenseEnemyConfig.slashSec else {
            slashGlow.isHidden = true
            slashCore.isHidden = true
            return
        }

        let progress = 1 - remaining / DefenseEnemyConfig.slashSec
        let y = floorY - 40
        let x1 = size.width * Self.playerXRatio + 40
        let x2 = size.width * Self.enemyXRatio - 20
        let length = max(1, x2 - x1)

        slashGlow.isHidden = false
        slashCore.isHidden = false
        slashGlow.alpha = CGFloat(1 - progress * 0.6)
        slashCore.alpha = slashGlow.alpha
        slashGlow.position = CGPoint(x: x1, y: y)
        slashCore.position = CGPoint(x: x1, y: y)
        slashGlow.xScale = length
        slashCore.xScale = length
    }
}

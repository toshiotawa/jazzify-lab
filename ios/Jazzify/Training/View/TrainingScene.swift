import SpriteKit

final class TrainingScene: SKScene {
    weak var session: TrainingGameSession?

    private var enemyNode = SKSpriteNode()
    private var enemyFrameKey = ""
    private let playerNode = SKLabelNode(text: "🎹")
    private let slashGlow = SKShapeNode()
    private let slashCore = SKShapeNode()
    private var textures: [String: SKTexture] = [:]

    private static let enemyXRatio: CGFloat = 0.72
    private static let playerXRatio: CGFloat = 0.18
    private static let groundYRatio: CGFloat = 320 / 400

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1)
        scaleMode = .resizeFill

        playerNode.fontSize = 32
        playerNode.verticalAlignmentMode = .center
        playerNode.horizontalAlignmentMode = .center
        playerNode.zPosition = 100
        addChild(playerNode)

        preloadTextures()
        setupSlashEffect()
        addChild(enemyNode)
    }

    override func update(_ currentTime: TimeInterval) {
        guard let session else { return }
        session.advanceFrame(currentTime: currentTime)
        render(runtime: session.runtime)
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
        addChild(slashGlow)

        slashCore.path = unitPath
        slashCore.strokeColor = SKColor(red: 0.97, green: 0.98, blue: 0.99, alpha: 1)
        slashCore.lineWidth = 2
        slashCore.lineCap = .butt
        slashCore.zPosition = 151
        slashCore.isHidden = true
        addChild(slashCore)
    }

    private func render(runtime: TrainingRuntime) {
        let groundY = size.height * Self.groundYRatio
        playerNode.position = CGPoint(x: size.width * Self.playerXRatio, y: groundY - 10)

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

        var enemyY = groundY - type.spriteHeight * 0.5
        if type.isFlying {
            enemyY += DefenseEnemyConfig.flyingBobOffset(elapsedSec: runtime.elapsedSec, slotIndex: 0)
        }
        enemyNode.position = CGPoint(x: size.width * Self.enemyXRatio, y: enemyY)
        enemyNode.alpha = CGFloat(runtime.enemy.fadeAlpha)
        enemyNode.size = CGSize(width: DefenseEnemyConfig.spriteWidth(for: type), height: type.spriteHeight)

        renderSlash(runtime: runtime, groundY: groundY)
    }

    private func renderSlash(runtime: TrainingRuntime, groundY: CGFloat) {
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
        let y = groundY * 0.55
        let x1 = size.width * Self.playerXRatio + 40
        let x2 = size.width * Self.enemyXRatio - 20
        let length = max(1, x2 - x1)
        let angle = atan2(0, length)

        slashGlow.isHidden = false
        slashCore.isHidden = false
        slashGlow.alpha = CGFloat(1 - progress * 0.6)
        slashCore.alpha = slashGlow.alpha
        slashGlow.position = CGPoint(x: x1, y: y)
        slashCore.position = CGPoint(x: x1, y: y)
        slashGlow.xScale = length
        slashCore.xScale = length
        slashGlow.zRotation = angle
        slashCore.zRotation = angle
    }
}

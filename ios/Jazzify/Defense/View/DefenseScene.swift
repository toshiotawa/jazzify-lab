import SpriteKit
import SwiftUI

final class DefenseScene: SKScene {
    weak var session: DefenseGameSession?

    private var enemyNodes: [UUID: SKSpriteNode] = [:]
    private var enemyFrameKeys: [UUID: String] = [:]
    private let playerNode = SKLabelNode(text: "🧙")
    private let impactRing = SKShapeNode(circleOfRadius: 10)
    private var impactSparks: [SKShapeNode] = []
    private let slashGlow = SKShapeNode()
    private let slashCore = SKShapeNode()
    private var textures: [String: SKTexture] = [:]

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1)
        scaleMode = .resizeFill

        playerNode.fontSize = 32
        playerNode.verticalAlignmentMode = .center
        playerNode.horizontalAlignmentMode = .center
        playerNode.zPosition = 100
        addChild(playerNode)

        preloadTextures()
        setupImpactEffect()
        setupSlashEffect()
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

    private func setupImpactEffect() {
        impactRing.strokeColor = SKColor(red: 0.98, green: 0.75, blue: 0.14, alpha: 1)
        impactRing.fillColor = .clear
        impactRing.lineWidth = 2
        impactRing.zPosition = 200
        impactRing.isHidden = true
        addChild(impactRing)

        // Unit-length spark along +x; per frame only position / xScale / zRotation change.
        let unitPath = CGMutablePath()
        unitPath.move(to: .zero)
        unitPath.addLine(to: CGPoint(x: 1, y: 0))
        for angle in DefenseEnemyConfig.sparkAngles {
            let spark = SKShapeNode(path: unitPath)
            spark.strokeColor = SKColor(red: 1, green: 0.94, blue: 0.54, alpha: 1)
            spark.lineWidth = 1.5
            spark.zRotation = angle
            spark.zPosition = 201
            spark.isHidden = true
            addChild(spark)
            impactSparks.append(spark)
        }
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

    private func render(runtime: DefenseRuntimeState) {
        var playerX = runtime.playerX
        if runtime.impactAt != DefenseEnemyConfig.noImpact {
            let impactAge = runtime.elapsedSec - runtime.impactAt
            if impactAge >= 0 && impactAge < DefenseEnemyConfig.impactHitbackSec {
                playerX -= 3
            }
        }
        playerNode.position = CGPoint(x: playerX, y: size.height - runtime.playerY)

        var activeEnemyIds = Set<UUID>()
        for enemy in runtime.enemies where enemy.isActive {
            activeEnemyIds.insert(enemy.id)
            let node = enemyNodes[enemy.id] ?? makeEnemySprite(for: enemy.type)

            let attacking = DefenseEnemyConfig.isAttacking(
                attackHitPending: enemy.attackHitPending,
                elapsedSec: runtime.elapsedSec,
                attackStartedAt: enemy.lastAttackAt
            )
            let frame = DefenseEnemyConfig.pickFrame(
                elapsedSec: runtime.elapsedSec,
                slotIndex: enemy.slotIndex,
                moving: enemy.isMoving,
                flying: enemy.type.isFlying,
                attacking: attacking
            )
            let textureKey = enemy.type.assetName(frame: frame)
            if enemyFrameKeys[enemy.id] != textureKey, let texture = textures[textureKey] {
                node.texture = texture
                enemyFrameKeys[enemy.id] = textureKey
            }

            var drawX = enemy.x
            var drawY = enemy.y
            if attacking {
                let offset = DefenseEnemyConfig.attackOffset(
                    attackElapsed: runtime.elapsedSec - enemy.lastAttackAt,
                    flying: enemy.type.isFlying
                )
                drawX += offset.x
                drawY += offset.y
            }
            if enemy.type.isFlying {
                drawY += DefenseEnemyConfig.flyingBobOffset(
                    elapsedSec: runtime.elapsedSec,
                    slotIndex: enemy.slotIndex
                )
            }

            node.position = CGPoint(x: drawX, y: size.height - drawY)
            if node.parent == nil { addChild(node) }
            enemyNodes[enemy.id] = node
        }

        for (id, node) in enemyNodes where !activeEnemyIds.contains(id) {
            node.removeFromParent()
            enemyNodes[id] = nil
            enemyFrameKeys[id] = nil
        }

        renderImpact(runtime: runtime)
        renderSlash(runtime: runtime)
    }

    private func renderImpact(runtime: DefenseRuntimeState) {
        let age = runtime.elapsedSec - runtime.impactAt
        let visible = runtime.impactAt != DefenseEnemyConfig.noImpact
            && age >= 0
            && age <= DefenseEnemyConfig.impactSec
        impactRing.isHidden = !visible
        for spark in impactSparks { spark.isHidden = !visible }
        guard visible else { return }

        let progress = age / DefenseEnemyConfig.impactSec
        let alpha = CGFloat(1 - progress)
        let ringRadius = CGFloat(10 + progress * 30)
        let sparkInner = ringRadius * 0.5
        let sparkLen = CGFloat(8 + progress * 20)
        let cx = runtime.impactX
        let cy = size.height - runtime.impactY

        impactRing.position = CGPoint(x: cx, y: cy)
        impactRing.xScale = ringRadius / 10
        impactRing.yScale = ringRadius / 10
        impactRing.alpha = alpha

        for (index, spark) in impactSparks.enumerated() {
            let angle = DefenseEnemyConfig.sparkAngles[index]
            spark.position = CGPoint(x: cx + cos(angle) * sparkInner, y: cy + sin(angle) * sparkInner)
            spark.xScale = sparkLen
            spark.alpha = alpha
        }
    }

    private func renderSlash(runtime: DefenseRuntimeState) {
        let age = runtime.elapsedSec - runtime.slashAt
        let visible = runtime.slashAt != DefenseEnemyConfig.noSlash
            && age >= 0
            && age <= DefenseEnemyConfig.slashSec
        slashGlow.isHidden = !visible
        slashCore.isHidden = !visible
        guard visible else { return }

        let alpha = CGFloat(1 - age / DefenseEnemyConfig.slashSec)
        let fromX = runtime.slashFromX
        let toX = runtime.slashToX
        let length = max(1, toX - fromX)
        let y = size.height - runtime.slashY

        slashGlow.position = CGPoint(x: fromX, y: y)
        slashGlow.xScale = length
        slashGlow.alpha = alpha

        slashCore.position = CGPoint(x: fromX, y: y)
        slashCore.xScale = length
        slashCore.alpha = alpha
    }

    private func makeEnemySprite(for type: DefenseEnemyType) -> SKSpriteNode {
        let node = SKSpriteNode(texture: textures[type.assetName(frame: .idle)])
        node.size = CGSize(width: DefenseEnemyConfig.spriteWidth(for: type), height: type.spriteHeight)
        node.zPosition = type.zDepth
        return node
    }
}

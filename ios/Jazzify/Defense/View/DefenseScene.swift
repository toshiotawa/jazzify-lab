import SpriteKit
import SwiftUI

final class DefenseScene: SKScene {
    weak var session: DefenseGameSession?

    private var enemyNodes: [UUID: SKSpriteNode] = [:]
    private var enemyFrameKeys: [UUID: String] = [:]
    private var fireballNodes: [UUID: SKLabelNode] = [:]
    private let playerNode = SKLabelNode(text: "🧙")
    private let impactRing = SKShapeNode(circleOfRadius: 10)
    private var impactSparks: [SKShapeNode] = []
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

        var activeBallIds = Set<UUID>()
        for ball in runtime.fireballs where ball.isActive {
            activeBallIds.insert(ball.id)
            let node = fireballNodes[ball.id] ?? makeEmojiNode("🔥")
            node.fontSize = 18
            node.zPosition = 150
            node.position = CGPoint(x: ball.x, y: size.height - ball.y)
            if node.parent == nil { addChild(node) }
            fireballNodes[ball.id] = node
        }
        for (id, node) in fireballNodes where !activeBallIds.contains(id) {
            node.removeFromParent()
            fireballNodes[id] = nil
        }
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

    private func makeEnemySprite(for type: DefenseEnemyType) -> SKSpriteNode {
        let node = SKSpriteNode(texture: textures[type.assetName(frame: .idle)])
        node.size = CGSize(width: DefenseEnemyConfig.spriteWidth(for: type), height: type.spriteHeight)
        node.zPosition = type.zDepth
        return node
    }

    private func makeEmojiNode(_ text: String) -> SKLabelNode {
        let node = SKLabelNode(text: text)
        node.verticalAlignmentMode = .center
        node.horizontalAlignmentMode = .center
        return node
    }
}

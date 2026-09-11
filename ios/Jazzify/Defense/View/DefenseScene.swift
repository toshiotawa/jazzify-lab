import SpriteKit
import SwiftUI

final class DefenseScene: SKScene {
    weak var session: DefenseGameSession?

    private var enemyNodes: [UUID: SKSpriteNode] = [:]
    private var enemyFrameKeys: [UUID: String] = [:]
    private var playerNode: SKNode?
    private let backgroundLayer = SKNode()
    private let characterLayer = SKNode()
    private let effectLayer = SKNode()
    private let impactRing = SKShapeNode(circleOfRadius: 10)
    private var impactSparks: [SKShapeNode] = []
    private let slashGlow = SKShapeNode()
    private let slashCore = SKShapeNode()
    private let impactFlash = SKSpriteNode(color: .clear, size: .zero)
    private var textures: [String: SKTexture] = [:]
    private var lastBuiltSize: CGSize = .zero

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
        setupImpactEffect()
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
        EarTrainingBattleStageKit.installBattleBackdrop(into: backgroundLayer, size: size)

        characterLayer.removeAllChildren()
        playerNode = nil

        let floorY = EarTrainingBattleStageKit.battleFloorY(sceneHeight: size.height)
        let player = EarTrainingBattleStageKit.makeAvatarContainer(
            assetName: EarTrainingBattleController.playerAvatarAssetName,
            position: CGPoint(x: size.width * 0.23, y: floorY),
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

    private func setupImpactEffect() {
        impactRing.strokeColor = SKColor(red: 0.98, green: 0.75, blue: 0.14, alpha: 1)
        impactRing.fillColor = .clear
        impactRing.lineWidth = 2
        impactRing.zPosition = 200
        impactRing.isHidden = true
        effectLayer.addChild(impactRing)

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
            effectLayer.addChild(spark)
            impactSparks.append(spark)
        }

        impactFlash.color = UIColor(red: 239 / 255, green: 68 / 255, blue: 68 / 255, alpha: 1)
        impactFlash.alpha = 0
        impactFlash.zPosition = 300
        effectLayer.addChild(impactFlash)
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

    private func render(runtime: DefenseRuntimeState) {
        let floorY = EarTrainingBattleStageKit.battleFloorY(sceneHeight: size.height)
        let scaleX = size.width / 800

        var playerX = size.width * 0.23
        if runtime.impactAt != DefenseEnemyConfig.noImpact {
            let impactAge = runtime.elapsedSec - runtime.impactAt
            if impactAge >= 0 && impactAge < DefenseEnemyConfig.impactHitbackSec {
                playerX -= 8
            }
        }
        playerNode?.position = CGPoint(x: playerX, y: floorY)

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

            var drawX = enemy.x * scaleX
            var footOffset: CGFloat = 0
            if attacking {
                let offset = DefenseEnemyConfig.attackOffset(
                    attackElapsed: runtime.elapsedSec - enemy.lastAttackAt,
                    flying: enemy.type.isFlying
                )
                drawX += offset.x * scaleX
                footOffset += offset.y
            }
            if enemy.type.isFlying {
                footOffset -= 90
                footOffset += DefenseEnemyConfig.flyingBobOffset(
                    elapsedSec: runtime.elapsedSec,
                    slotIndex: enemy.slotIndex
                )
            }

            node.position = CGPoint(x: drawX, y: floorY + footOffset)
            if node.parent == nil { characterLayer.addChild(node) }
            enemyNodes[enemy.id] = node
        }

        for (id, node) in enemyNodes where !activeEnemyIds.contains(id) {
            node.removeFromParent()
            enemyNodes[id] = nil
            enemyFrameKeys[id] = nil
        }

        renderImpact(runtime: runtime, floorY: floorY, scaleX: scaleX)
        renderSlash(runtime: runtime, floorY: floorY, scaleX: scaleX)
    }

    private func renderImpact(runtime: DefenseRuntimeState, floorY: CGFloat, scaleX: CGFloat) {
        let age = runtime.elapsedSec - runtime.impactAt
        let visible = runtime.impactAt != DefenseEnemyConfig.noImpact
            && age >= 0
            && age <= DefenseEnemyConfig.impactSec
        impactRing.isHidden = !visible
        for spark in impactSparks { spark.isHidden = !visible }
        impactFlash.size = size
        impactFlash.position = CGPoint(x: size.width / 2, y: size.height / 2)
        impactFlash.alpha = visible ? CGFloat(0.18 * (1 - age / DefenseEnemyConfig.impactSec)) : 0
        guard visible else { return }

        let progress = age / DefenseEnemyConfig.impactSec
        let alpha = CGFloat(1 - progress)
        let ringRadius = CGFloat(10 + progress * 30)
        let sparkInner = ringRadius * 0.5
        let sparkLen = CGFloat(8 + progress * 20)
        let cx = runtime.impactX * scaleX
        let cy = floorY - (DefenseEnemyConfig.groundY - runtime.impactY)

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

    private func renderSlash(runtime: DefenseRuntimeState, floorY: CGFloat, scaleX: CGFloat) {
        let age = runtime.elapsedSec - runtime.slashAt
        let visible = runtime.slashAt != DefenseEnemyConfig.noSlash
            && age >= 0
            && age <= DefenseEnemyConfig.slashSec
        slashGlow.isHidden = !visible
        slashCore.isHidden = !visible
        guard visible else { return }

        let alpha = CGFloat(1 - age / DefenseEnemyConfig.slashSec)
        let fromX = runtime.slashFromX * scaleX
        let toX = runtime.slashToX * scaleX
        let length = max(1, toX - fromX)
        let y = floorY - 40

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
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.zPosition = type.zDepth
        return node
    }
}

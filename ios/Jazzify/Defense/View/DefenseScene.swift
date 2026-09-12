import SpriteKit
import SwiftUI

final class DefenseScene: SKScene {
    private static let stageKeyboardHeight = EarTrainingBattleStageKit.chordPadKeyboardHeight
    private static let stageFloorClearance = EarTrainingBattleStageKit.chordPadFloorClearance

    weak var session: DefenseGameSession?

    private var enemyNodes: [UUID: SKSpriteNode] = [:]
    private var enemyFrameKeys: [UUID: String] = [:]
    private var playerNode: SKNode?
    private var playerSpriteNode: SKSpriteNode?
    private var playerRimNode: SKSpriteNode?
    private var defaultPlayerTexture: SKTexture?
    private var guardPlayerTexture: SKTexture?
    private var isShowingGuardPose = false
    private let backgroundLayer = SKNode()
    private let characterLayer = SKNode()
    private let effectLayer = SKNode()
    private let impactRing = SKShapeNode(circleOfRadius: 10)
    private var impactSparks: [SKShapeNode] = []
    private let slashGlow = SKShapeNode()
    private let slashCore = SKShapeNode()
    private var slashSparks: [SKShapeNode] = []
    private let impactFlash = SKSpriteNode(color: .clear, size: .zero)
    private static let slashGrowPhase: TimeInterval = 0.4
    private static let slashSparkAngles: [CGFloat] = [-0.35, -0.12, 0.12, 0.35]
    private var textures: [String: SKTexture] = [:]
    private var lastBuiltSize: CGSize = .zero

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
        EarTrainingBattleStageKit.installBattleBackdrop(
            into: backgroundLayer,
            size: size,
            keyboardHeight: Self.stageKeyboardHeight,
            clearanceFromKeyboard: Self.stageFloorClearance
        )

        characterLayer.removeAllChildren()
        playerNode = nil
        playerSpriteNode = nil
        playerRimNode = nil
        isShowingGuardPose = false

        let floorY = EarTrainingBattleStageKit.battleFloorY(
            sceneHeight: size.height,
            keyboardHeight: Self.stageKeyboardHeight,
            clearanceFromKeyboard: Self.stageFloorClearance
        )
        let playerX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: 80)
        let player = EarTrainingBattleStageKit.makeAvatarContainer(
            assetName: EarTrainingBattleController.playerAvatarAssetName,
            position: CGPoint(x: playerX, y: floorY),
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
        guard textures.isEmpty else { return }
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
        guard impactRing.parent == nil else { return }
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
        guard slashGlow.parent == nil else { return }
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

        let sparkPath = CGMutablePath()
        sparkPath.move(to: .zero)
        sparkPath.addLine(to: CGPoint(x: 1, y: 0))
        for angle in Self.slashSparkAngles {
            let spark = SKShapeNode(path: sparkPath)
            spark.strokeColor = SKColor(red: 0.73, green: 0.90, blue: 0.99, alpha: 0.9)
            spark.lineWidth = 1.5
            spark.lineCap = .round
            spark.zRotation = angle
            spark.zPosition = 152
            spark.isHidden = true
            effectLayer.addChild(spark)
            slashSparks.append(spark)
        }
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

    private func render(runtime: DefenseRuntimeState) {
        let floorY = EarTrainingBattleStageKit.battleFloorY(
            sceneHeight: size.height,
            keyboardHeight: Self.stageKeyboardHeight,
            clearanceFromKeyboard: Self.stageFloorClearance
        )
        let avatarSize = EarTrainingBattleStageKit.characterDisplaySize

        var playerX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: runtime.playerX)
        if runtime.impactAt != DefenseEnemyConfig.noImpact {
            let impactAge = runtime.elapsedSec - runtime.impactAt
            if impactAge >= 0 && impactAge < DefenseEnemyConfig.impactHitbackSec {
                playerX -= 8
            }
        }
        playerNode?.position = CGPoint(x: playerX, y: floorY)

        let showGuardPose = runtime.guardPoseUntilSec > 0 && runtime.elapsedSec < runtime.guardPoseUntilSec
        if showGuardPose != isShowingGuardPose {
            isShowingGuardPose = showGuardPose
            let texture = showGuardPose ? guardPlayerTexture : defaultPlayerTexture
            if let texture {
                playerSpriteNode?.texture = texture
                playerRimNode?.texture = texture
            }
        }

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

            var logicalX = enemy.x
            if attacking {
                let offset = DefenseEnemyConfig.attackOffset(
                    attackElapsed: runtime.elapsedSec - enemy.lastAttackAt,
                    flying: enemy.type.isFlying
                )
                logicalX += offset.x
            }
            var drawX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: logicalX)
            var footOffset: CGFloat = 0
            if attacking {
                let offset = DefenseEnemyConfig.attackOffset(
                    attackElapsed: runtime.elapsedSec - enemy.lastAttackAt,
                    flying: enemy.type.isFlying
                )
                footOffset += offset.y
            }
            if enemy.type.isFlying {
                footOffset -= DefenseEnemyConfig.flyingYOffset
                footOffset += DefenseEnemyConfig.flyingBobOffset(
                    elapsedSec: runtime.elapsedSec,
                    slotIndex: enemy.slotIndex
                )
            }

            node.position = CGPoint(
                x: drawX,
                y: DefenseSceneLayout.screenY(floorY: floorY, canvasDeltaFromFloor: footOffset)
            )
            if node.parent == nil { characterLayer.addChild(node) }
            enemyNodes[enemy.id] = node
        }

        for (id, node) in enemyNodes where !activeEnemyIds.contains(id) {
            node.removeFromParent()
            enemyNodes[id] = nil
            enemyFrameKeys[id] = nil
        }

        renderImpact(runtime: runtime, floorY: floorY)
        renderSlash(runtime: runtime, floorY: floorY, avatarSize: avatarSize)
    }

    private func renderImpact(runtime: DefenseRuntimeState, floorY: CGFloat) {
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
        let cx = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: runtime.impactX)
        let cy = DefenseSceneLayout.screenY(
            floorY: floorY,
            canvasDeltaFromFloor: -(DefenseEnemyConfig.groundY - runtime.impactY)
        )

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

    private func renderSlash(runtime: DefenseRuntimeState, floorY: CGFloat, avatarSize: CGFloat) {
        let age = runtime.elapsedSec - runtime.slashAt
        let visible = runtime.slashAt != DefenseEnemyConfig.noSlash
            && age >= 0
            && age <= DefenseEnemyConfig.slashSec
        slashGlow.isHidden = !visible
        slashCore.isHidden = !visible
        for spark in slashSparks { spark.isHidden = !visible }
        guard visible else { return }

        let progress = age / DefenseEnemyConfig.slashSec
        let growT = min(1, progress / Self.slashGrowPhase)
        let lengthScale = CGFloat(1 - pow(1 - growT, 3))
        let alpha = progress < Self.slashGrowPhase
            ? 1
            : CGFloat(1 - ((progress - Self.slashGrowPhase) / (1 - Self.slashGrowPhase)))

        let playerScreenX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: runtime.playerX)
        let fromX = playerScreenX + avatarSize * 0.45
        let fromY = DefenseSceneLayout.screenY(
            floorY: floorY,
            canvasDeltaFromFloor: -avatarSize * 0.55
        )
        let toX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: runtime.slashToX)
        let toY = DefenseSceneLayout.screenY(
            floorY: floorY,
            canvasDeltaFromFloor: -(DefenseEnemyConfig.groundY - runtime.slashY)
        )

        let endX = fromX + (toX - fromX) * lengthScale
        let endY = fromY + (toY - fromY) * lengthScale
        let dx = endX - fromX
        let dy = endY - fromY
        let length = max(1, hypot(dx, dy))
        let angle = atan2(dy, dx)

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

        let showSparks = lengthScale > 0.85
        let sparkLen = CGFloat(14 * alpha)
        for (index, spark) in slashSparks.enumerated() {
            spark.isHidden = !showSparks
            guard showSparks else { continue }
            let sparkAngle = Self.slashSparkAngles[index]
            spark.position = CGPoint(x: endX, y: endY)
            spark.zRotation = sparkAngle
            spark.xScale = sparkLen
            spark.alpha = alpha
        }
    }

    private func makeEnemySprite(for type: DefenseEnemyType) -> SKSpriteNode {
        let node = SKSpriteNode(texture: textures[type.assetName(frame: .idle)])
        node.size = CGSize(width: DefenseEnemyConfig.spriteWidth(for: type), height: type.spriteHeight)
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.zPosition = type.zDepth
        return node
    }
}

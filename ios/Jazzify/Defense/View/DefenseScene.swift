import SpriteKit
import SwiftUI

final class DefenseScene: SKScene {
    private static let stageKeyboardHeight = EarTrainingBattleStageKit.chordPadKeyboardHeight
    private static let stageFloorClearance = EarTrainingBattleStageKit.chordPadFloorClearance

    weak var session: DefenseGameSession?

    private var enemyNodes: [UUID: SKSpriteNode] = [:]
    private var enemyFrameKeys: [UUID: String] = [:]
    private var enemyFlashing: [UUID: Bool] = [:]
    private var enemyHpBarFill: [UUID: SKSpriteNode] = [:]
    private var playerNode: SKNode?
    private var playerSpriteNode: SKSpriteNode?
    private var playerRimNode: SKSpriteNode?
    private var spGaugeHost: SKNode?
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
    private var damagePopupNodes: [SKLabelNode] = []
    private var fireballNodes: [SKSpriteNode] = []
    private var fireballTexture: SKTexture?
    private var lastSpGauge = -1
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
        setupDamagePopups()
        setupFireballs()
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
        enemyNodes.removeAll()
        enemyFrameKeys.removeAll()
        enemyFlashing.removeAll()
        enemyHpBarFill.removeAll()
        playerNode = nil
        playerSpriteNode = nil
        playerRimNode = nil
        spGaugeHost = nil
        isShowingGuardPose = false
        lastSpGauge = -1

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
        setupSpGauge(on: player)
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

    private func setupSpGauge(on player: SKNode) {
        let host = SKNode()
        host.zPosition = 6
        let barW: CGFloat = 10
        let barH: CGFloat = 6
        let gap: CGFloat = 3
        let maxG = DefenseEnemyConfig.spMax
        let totalW = CGFloat(maxG) * barW + CGFloat(maxG - 1) * gap
        let left = -totalW / 2

        let label = SKLabelNode(text: "SP")
        label.fontName = "AvenirNext-Heavy"
        label.fontSize = 10
        label.fontColor = UIColor(red: 0.98, green: 0.75, blue: 0.14, alpha: 1)
        label.horizontalAlignmentMode = .right
        label.verticalAlignmentMode = .center
        label.position = CGPoint(x: left - 6, y: 3)
        host.addChild(label)

        for i in 0..<maxG {
            let rect = SKShapeNode(rectOf: CGSize(width: barW, height: barH), cornerRadius: 1)
            rect.name = "sp\(i)"
            rect.position = CGPoint(x: left + CGFloat(i) * (barW + gap) + barW / 2, y: 3)
            rect.fillColor = UIColor(white: 0.45, alpha: 0.7)
            rect.strokeColor = .clear
            host.addChild(rect)
        }

        let avatarSize = EarTrainingBattleStageKit.characterDisplaySize
        host.position = CGPoint(x: 0, y: avatarSize + 14)
        player.addChild(host)
        spGaugeHost = host
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
        let fbTexture = SKTexture(imageNamed: "ear-training-effect-fireball")
        fbTexture.filteringMode = .linear
        fireballTexture = fbTexture
        SKTexture.preload(Array(textures.values) + [fbTexture]) {}
    }

    private func setupDamagePopups() {
        guard damagePopupNodes.isEmpty else { return }
        for _ in 0..<DefenseEnemyConfig.damagePopupPoolSize {
            let label = SKLabelNode(text: "")
            label.fontName = "AvenirNext-Heavy"
            label.fontSize = 16
            label.fontColor = UIColor(red: 0.996, green: 0.941, blue: 0.541, alpha: 1)
            label.zPosition = 250
            label.isHidden = true
            effectLayer.addChild(label)
            damagePopupNodes.append(label)
        }
    }

    private func setupFireballs() {
        guard fireballNodes.isEmpty else { return }
        for _ in 0..<DefenseEnemyConfig.fireballPoolSize {
            let node = SKSpriteNode(texture: fireballTexture)
            node.size = CGSize(width: 64, height: 64)
            node.zPosition = 180
            node.isHidden = true
            effectLayer.addChild(node)
            fireballNodes.append(node)
        }
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
        let slashHalfGlow = DefenseEnemyConfig.displayLayoutPt(10)
        let slashHalfCore = DefenseEnemyConfig.displayLayoutPt(4)
        slashGlow.path = Self.makeTaperedSlashUnitPath(halfWidth: slashHalfGlow)
        slashGlow.fillColor = SKColor(red: 0.13, green: 0.83, blue: 0.93, alpha: 0.55)
        slashGlow.strokeColor = .clear
        slashGlow.zPosition = 150
        slashGlow.isHidden = true
        effectLayer.addChild(slashGlow)

        slashCore.path = Self.makeTaperedSlashUnitPath(halfWidth: slashHalfCore)
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
        let showPhraseUi = runtime.attackTrigger == .note

        var playerX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: runtime.playerX)
        if runtime.impactAt != DefenseEnemyConfig.noImpact {
            let impactAge = runtime.elapsedSec - runtime.impactAt
            if impactAge >= 0 && impactAge < DefenseEnemyConfig.impactHitbackSec {
                playerX -= DefenseEnemyConfig.displayLayoutPt(DefenseEnemyConfig.playerImpactHitbackPt)
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

        if showPhraseUi {
            renderSpGauge(runtime: runtime)
        } else {
            spGaugeHost?.isHidden = true
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
            let drawX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: logicalX)
            var footOffset: CGFloat = 0
            if attacking {
                footOffset += DefenseEnemyConfig.displayAttackFootOffset(
                    attackElapsed: runtime.elapsedSec - enemy.lastAttackAt,
                    flying: enemy.type.isFlying
                )
            }
            if enemy.type.isFlying {
                footOffset -= DefenseEnemyConfig.displayFlyingYOffset
                footOffset += DefenseEnemyConfig.displayFlyingBobOffset(
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

            let hitFlashActive = enemy.hitFlashAt != DefenseEnemyConfig.noHitFlash
                && runtime.elapsedSec - enemy.hitFlashAt < DefenseEnemyConfig.hitFlashSec
            let wasFlashing = enemyFlashing[enemy.id] ?? false
            if hitFlashActive != wasFlashing {
                enemyFlashing[enemy.id] = hitFlashActive
                node.color = .red
                node.colorBlendFactor = hitFlashActive ? 0.55 : 0
            }

            if showPhraseUi {
                updateEnemyHpBar(enemy: enemy, node: node)
            } else if let fill = enemyHpBarFill[enemy.id] {
                fill.isHidden = true
            }
        }

        for (id, node) in enemyNodes where !activeEnemyIds.contains(id) {
            node.removeFromParent()
            enemyNodes[id] = nil
            enemyFrameKeys[id] = nil
            enemyFlashing[id] = nil
            enemyHpBarFill[id]?.removeFromParent()
            enemyHpBarFill[id] = nil
        }

        if showPhraseUi {
            renderDamagePopups(runtime: runtime, floorY: floorY)
            renderFireballs(runtime: runtime, floorY: floorY)
        } else {
            for label in damagePopupNodes { label.isHidden = true }
            for node in fireballNodes { node.isHidden = true }
        }

        renderImpact(runtime: runtime, floorY: floorY)
        renderSlash(runtime: runtime, floorY: floorY, avatarSize: avatarSize)
    }

    private func updateEnemyHpBar(enemy: DefenseEnemyState, node: SKSpriteNode) {
        let barWidth = node.size.width * 0.8
        let barHeight: CGFloat = 4
        let barY = node.size.height + 6

        if enemyHpBarFill[enemy.id] == nil {
            let bg = SKSpriteNode(color: UIColor(white: 0, alpha: 0.55), size: CGSize(width: barWidth, height: barHeight))
            bg.anchorPoint = CGPoint(x: 0.5, y: 0)
            bg.position = CGPoint(x: 0, y: barY)
            bg.zPosition = 5
            node.addChild(bg)

            let fill = SKSpriteNode(color: UIColor(red: 0.98, green: 0.44, blue: 0.52, alpha: 1), size: CGSize(width: barWidth, height: barHeight))
            fill.anchorPoint = CGPoint(x: 0, y: 0)
            fill.position = CGPoint(x: -barWidth / 2, y: barY)
            fill.zPosition = 6
            node.addChild(fill)
            enemyHpBarFill[enemy.id] = fill
        }

        guard let fill = enemyHpBarFill[enemy.id] else { return }
        fill.isHidden = false
        let percent = enemy.maxHp > 0 ? CGFloat(enemy.hp) / CGFloat(enemy.maxHp) : 0
        fill.xScale = max(0, min(1, percent))
    }

    private func renderSpGauge(runtime: DefenseRuntimeState) {
        guard let host = spGaugeHost else { return }
        host.isHidden = false
        guard runtime.spGauge != lastSpGauge else { return }
        lastSpGauge = runtime.spGauge
        let maxG = DefenseEnemyConfig.spMax
        for i in 0..<maxG {
            guard let bar = host.childNode(withName: "sp\(i)") as? SKShapeNode else { continue }
            bar.fillColor = i < runtime.spGauge
                ? UIColor(red: 0.98, green: 0.75, blue: 0.14, alpha: 1)
                : UIColor(white: 0.45, alpha: 0.7)
        }
    }

    private func renderDamagePopups(runtime: DefenseRuntimeState, floorY: CGFloat) {
        for (index, popup) in runtime.damagePopups.enumerated() {
            guard damagePopupNodes.indices.contains(index) else { continue }
            let label = damagePopupNodes[index]
            guard popup.isActive else {
                label.isHidden = true
                continue
            }
            let age = runtime.elapsedSec - popup.spawnedAt
            guard age >= 0, age <= DefenseEnemyConfig.damagePopupSec else {
                label.isHidden = true
                continue
            }
            let progress = age / DefenseEnemyConfig.damagePopupSec
            let screenX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: popup.x)
            let screenY = DefenseSceneLayout.screenY(
                floorY: floorY,
                canvasDeltaFromFloor: DefenseEnemyConfig.displayCanvasDeltaFromFloor(
                    -(DefenseEnemyConfig.groundY - popup.y) - progress * 28
                )
            )
            label.text = "\(popup.value)"
            label.position = CGPoint(x: screenX, y: screenY)
            label.alpha = CGFloat(1 - progress)
            label.isHidden = false
        }
    }

    private func renderFireballs(runtime: DefenseRuntimeState, floorY: CGFloat) {
        for (index, fb) in runtime.fireballs.enumerated() {
            guard fireballNodes.indices.contains(index) else { continue }
            let node = fireballNodes[index]
            guard fb.isActive else {
                node.isHidden = true
                continue
            }
            let screenX = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: fb.x)
            let screenY = DefenseSceneLayout.screenY(
                floorY: floorY,
                canvasDeltaFromFloor: DefenseEnemyConfig.displayCanvasDeltaFromFloor(
                    -(DefenseEnemyConfig.groundY - fb.y)
                )
            )
            let scale = DefenseEnemyConfig.battleDisplayScale
            node.size = CGSize(width: 64 * scale, height: 64 * scale)
            node.position = CGPoint(x: screenX, y: screenY)
            node.isHidden = false
        }
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
        let scale = DefenseEnemyConfig.battleDisplayScale
        let ringRadius = CGFloat(10 + progress * 30) * scale
        let sparkInner = ringRadius * 0.5
        let sparkLen = CGFloat(8 + progress * 20) * scale
        let cx = DefenseSceneLayout.logicalToScreenX(width: size.width, logicalX: runtime.impactX)
        let cy = DefenseSceneLayout.screenY(
            floorY: floorY,
            canvasDeltaFromFloor: DefenseEnemyConfig.displayCanvasDeltaFromFloor(
                -(DefenseEnemyConfig.groundY - runtime.impactY)
            )
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
            canvasDeltaFromFloor: DefenseEnemyConfig.displayCanvasDeltaFromFloor(
                -(DefenseEnemyConfig.groundY - runtime.slashY)
            )
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
        let sparkLen = DefenseEnemyConfig.displayLayoutPt(14 * alpha)
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
        node.size = CGSize(
            width: DefenseEnemyConfig.displaySpriteWidth(for: type),
            height: DefenseEnemyConfig.displaySpriteHeight(for: type)
        )
        node.anchorPoint = CGPoint(x: 0.5, y: 0)
        node.zPosition = type.zDepth
        return node
    }
}

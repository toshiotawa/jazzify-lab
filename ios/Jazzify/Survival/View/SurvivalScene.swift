import SpriteKit
import CoreGraphics
import UIKit
import QuartzCore

/// サバイバル ゲーム世界描画用の SKScene。
/// - プレイヤー (SKSpriteNode `default-avater`) / 敵・弾・アイテム・コイン (絵文字 SKLabelNode)
/// - ボスは `SurvivalMap/boss_a|b|c` スプライトで描画
/// - ハザード (扇 / 直線 / リング / 十字 / 引力) は SKShapeNode 群
/// - `update(_:)` で `SurvivalGameController.tick` を呼び出し、そこで更新された状態を反映
final class SurvivalScene: SKScene {
    /// SwiftUI 側 (`@State`) が先に解放された場合に参照先が無効化されないよう weak 保持。
    /// `update(_:)` が 1 フレームだけ余分に呼ばれる可能性があるため、nil チェックで安全に無視する。
    private weak var controller: SurvivalGameController?

    private let worldNode = SKNode()
    private let backgroundNode = SKNode()
    private let effectsNode = SKNode()
    private let entitiesNode = SKNode()
    private let hazardsNode = SKNode()
    private let telegraphsNode = SKNode()

    private var playerNode: SKNode?
    private var playerSprite: SKSpriteNode?
    private var enemyNodes: [UUID: SKNode] = [:]
    private var projectileNodes: [UUID: SKNode] = [:]
    private var enemyProjectileNodes: [UUID: SKNode] = [:]
    private var shockwaveNodes: [UUID: SKNode] = [:]
    private var magicEffectNodes: [UUID: SKNode] = [:]
    private var itemNodes: [UUID: SKNode] = [:]
    private var coinNodes: [UUID: SKNode] = [:]
    private var floatingTextNodes: [UUID: SKNode] = [:]
    private var hazardNodes: [UUID: SKNode] = [:]
    private var minionNodes: [UUID: SKNode] = [:]
    private var bossNode: SKSpriteNode?
    private var bossHpRing: SKShapeNode?
    private var bossProjectileNodes: [UUID: SKNode] = [:]

    init(size: CGSize, controller: SurvivalGameController) {
        self.controller = controller
        super.init(size: size)
        scaleMode = .resizeFill
        backgroundColor = UIColor(red: 0.03, green: 0.02, blue: 0.06, alpha: 1.0)
        setup()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setup() {
        addChild(worldNode)
        worldNode.addChild(backgroundNode)
        worldNode.addChild(telegraphsNode)
        worldNode.addChild(hazardsNode)
        worldNode.addChild(effectsNode)
        worldNode.addChild(entitiesNode)
        drawBackground()
        addParticleStars()
        buildPlayer()

        let camera = SKCameraNode()
        self.camera = camera
        addChild(camera)
    }

    private func buildPlayer() {
        let container = SKNode()
        container.zPosition = 100
        let size = CGSize(
            width: SurvivalConstants.playerSize * 1.6,
            height: SurvivalConstants.playerSize * 1.6
        )
        let sprite: SKSpriteNode
        if UIImage(named: "default-avater") != nil {
            sprite = SKSpriteNode(imageNamed: "default-avater")
        } else {
            sprite = SKSpriteNode(color: UIColor(red: 0.4, green: 0.85, blue: 1.0, alpha: 1.0), size: size)
        }
        sprite.size = size
        container.addChild(sprite)
        entitiesNode.addChild(container)
        playerNode = container
        playerSprite = sprite
    }

    private func drawBackground() {
        let tileSize: CGFloat = 200
        let colors: [UIColor] = [
            UIColor(red: 0.08, green: 0.05, blue: 0.14, alpha: 1),
            UIColor(red: 0.06, green: 0.04, blue: 0.10, alpha: 1)
        ]
        let cols = Int(SurvivalMap.width / tileSize) + 1
        let rows = Int(SurvivalMap.height / tileSize) + 1
        for r in 0..<rows {
            for c in 0..<cols {
                let rect = SKShapeNode(rect: CGRect(x: 0, y: 0, width: tileSize, height: tileSize))
                rect.fillColor = colors[(r + c) % 2]
                rect.strokeColor = .clear
                rect.position = toScenePoint(
                    x: CGFloat(c) * tileSize + tileSize / 2,
                    y: CGFloat(r) * tileSize + tileSize / 2
                )
                rect.position.x -= tileSize / 2
                rect.position.y -= tileSize / 2
                rect.zPosition = -100
                backgroundNode.addChild(rect)
            }
        }
    }

    /// 背景に ほんの薄い星 (小さな白い点) を散りばめる
    private func addParticleStars() {
        let starCount = 60
        for _ in 0..<starCount {
            let star = SKShapeNode(circleOfRadius: CGFloat.random(in: 1...2.2))
            star.fillColor = UIColor(white: 1.0, alpha: CGFloat.random(in: 0.1...0.3))
            star.strokeColor = .clear
            let x = CGFloat.random(in: 0...SurvivalMap.width)
            let y = CGFloat.random(in: 0...SurvivalMap.height)
            star.position = toScenePoint(x: x, y: y)
            star.zPosition = -90
            backgroundNode.addChild(star)
            let twinkle = SKAction.sequence([
                SKAction.fadeAlpha(to: 0.05, duration: Double.random(in: 1.4...2.6)),
                SKAction.fadeAlpha(to: 0.3, duration: Double.random(in: 1.4...2.6))
            ])
            star.run(SKAction.repeatForever(twinkle))
        }
    }

    // MARK: - 座標変換 (Web 側 y=下向き → SpriteKit y=上向き)

    private func toScenePoint(x: CGFloat, y: CGFloat) -> CGPoint {
        CGPoint(x: x, y: SurvivalMap.height - y)
    }

    // MARK: - フレーム更新

    override func update(_ currentTime: TimeInterval) {
        guard let controller = controller else { return }
        controller.tick(currentTime: currentTime)
        renderState(controller: controller)
        updateCamera(controller: controller)
    }

    private func updateCamera(controller: SurvivalGameController) {
        guard let camera else { return }
        let target = toScenePoint(x: controller.cameraTargetX, y: controller.cameraTargetY)
        let lerp: CGFloat = 0.18
        camera.position.x += (target.x - camera.position.x) * lerp
        camera.position.y += (target.y - camera.position.y) * lerp
    }

    private func renderState(controller: SurvivalGameController) {
        let runtime = controller.runtime
        let now = CACurrentMediaTime()

        // プレイヤー
        if let playerNode, let sprite = playerSprite {
            playerNode.position = toScenePoint(x: runtime.player.x, y: runtime.player.y)
            // 向きによる水平反転 (進行方向 left なら -1)
            let facingLeft = runtime.player.direction == .left
                || runtime.player.direction == .upLeft
                || runtime.player.direction == .downLeft
            sprite.xScale = facingLeft ? -1 : 1
            // 無敵中 は点滅
            let blink = now < runtime.player.iFramesUntil ? 0.55 : 1.0
            sprite.alpha = CGFloat(blink)
            // 被弾フラッシュ (0.18s 以内は色を赤味付け)
            if now < runtime.player.damageFlashUntil {
                sprite.color = UIColor(red: 1, green: 0.25, blue: 0.25, alpha: 1)
                sprite.colorBlendFactor = 0.6
            } else {
                sprite.colorBlendFactor = 0.0
            }
        }

        // 敵 (絵文字 + HP リング)
        syncNodes(
            nodeMap: &enemyNodes,
            ids: runtime.enemies.map { $0.id },
            create: { [entitiesNode] _ in
                let node = Self.makeEnemyNode()
                entitiesNode.addChild(node)
                return node
            },
            update: { id, node in
                guard let enemy = runtime.enemies.first(where: { $0.id == id }) else { return }
                node.position = self.toScenePoint(x: enemy.x, y: enemy.y)
                Self.updateEnemyNode(node: node, enemy: enemy)
            }
        )

        // プレイヤー弾 (✨)
        syncNodes(
            nodeMap: &projectileNodes,
            ids: runtime.projectiles.map { $0.id },
            create: { [effectsNode] _ in
                let label = SKLabelNode(text: "✨")
                label.fontSize = 22
                label.verticalAlignmentMode = .center
                label.horizontalAlignmentMode = .center
                label.zPosition = 60
                effectsNode.addChild(label)
                return label
            },
            update: { id, node in
                guard let proj = runtime.projectiles.first(where: { $0.id == id }) else { return }
                node.position = self.toScenePoint(x: proj.x, y: proj.y)
            }
        )

        // 敵弾 (🔴)
        syncNodes(
            nodeMap: &enemyProjectileNodes,
            ids: runtime.enemyProjectiles.map { $0.id },
            create: { [effectsNode] _ in
                let node = SKShapeNode(circleOfRadius: SurvivalConstants.enemyProjectileSize / 2)
                node.fillColor = UIColor(red: 1, green: 0.35, blue: 0.35, alpha: 1)
                node.strokeColor = UIColor(white: 1, alpha: 0.9)
                node.lineWidth = 1.5
                node.zPosition = 58
                effectsNode.addChild(node)
                return node
            },
            update: { id, node in
                guard let proj = runtime.enemyProjectiles.first(where: { $0.id == id }) else { return }
                node.position = self.toScenePoint(x: proj.x, y: proj.y)
            }
        )

        // 衝撃波 (ダメージ毎に色変化)
        syncNodes(
            nodeMap: &shockwaveNodes,
            ids: runtime.shockwaves.map { $0.id },
            create: { [effectsNode] _ in
                let node = SKShapeNode(circleOfRadius: 10)
                node.strokeColor = UIColor(red: 0.7, green: 0.95, blue: 1, alpha: 0.9)
                node.lineWidth = 3
                node.zPosition = 55
                effectsNode.addChild(node)
                return node
            },
            update: { id, node in
                guard let wave = runtime.shockwaves.first(where: { $0.id == id }), let shape = node as? SKShapeNode else { return }
                shape.position = self.toScenePoint(x: wave.x, y: wave.y)
                let scale = wave.radius / 10
                shape.setScale(scale)
                let progress = (now - wave.createdAt) / wave.lifetime
                shape.alpha = max(0, 1 - progress)
                shape.fillColor = Self.shockwaveFillColor(level: wave.colorLevel).withAlphaComponent(0.3)
                shape.strokeColor = Self.shockwaveFillColor(level: wave.colorLevel)
            }
        )

        // 魔法視覚効果
        syncNodes(
            nodeMap: &magicEffectNodes,
            ids: runtime.magicEffects.map { $0.id },
            create: { [effectsNode] _ in
                let label = SKLabelNode(text: "")
                label.fontSize = 60
                label.verticalAlignmentMode = .center
                label.horizontalAlignmentMode = .center
                label.zPosition = 140
                effectsNode.addChild(label)
                return label
            },
            update: { id, node in
                guard let fx = runtime.magicEffects.first(where: { $0.id == id }), let label = node as? SKLabelNode else { return }
                label.text = Self.magicEmoji(kind: fx.kind)
                label.position = self.toScenePoint(x: fx.x, y: fx.y)
                let age = now - fx.createdAt
                label.alpha = max(0, 1 - age / fx.lifetime)
            }
        )

        // アイテム
        syncNodes(
            nodeMap: &itemNodes,
            ids: runtime.droppedItems.map { $0.id },
            create: { [effectsNode] _ in
                let label = SKLabelNode(text: "")
                label.fontSize = 28
                label.verticalAlignmentMode = .center
                label.horizontalAlignmentMode = .center
                label.zPosition = 70
                effectsNode.addChild(label)
                return label
            },
            update: { id, node in
                guard let item = runtime.droppedItems.first(where: { $0.id == id }), let label = node as? SKLabelNode else { return }
                label.text = item.kind.emoji
                label.position = self.toScenePoint(x: item.x, y: item.y)
            }
        )

        // コイン
        syncNodes(
            nodeMap: &coinNodes,
            ids: runtime.coins.map { $0.id },
            create: { [effectsNode] _ in
                let label = SKLabelNode(text: "🪙")
                label.fontSize = 22
                label.verticalAlignmentMode = .center
                label.horizontalAlignmentMode = .center
                label.zPosition = 65
                effectsNode.addChild(label)
                return label
            },
            update: { id, node in
                guard let coin = runtime.coins.first(where: { $0.id == id }) else { return }
                node.position = self.toScenePoint(x: coin.x, y: coin.y)
            }
        )

        // フローティング テキスト (与ダメージ / 被ダメ / 回復 / EXP)
        syncNodes(
            nodeMap: &floatingTextNodes,
            ids: runtime.floatingTexts.map { $0.id },
            create: { [effectsNode] _ in
                let label = SKLabelNode(text: "")
                label.fontName = "HelveticaNeue-Bold"
                // 与ダメ視認性を上げるため拡大 (18 → 26)
                label.fontSize = 26
                label.fontColor = .yellow
                label.zPosition = 150
                // 黒ストロークで背景に埋もれないようにする
                let stroke = SKLabelNode(text: "")
                stroke.name = "stroke"
                stroke.fontName = "HelveticaNeue-Bold"
                stroke.fontSize = 26
                stroke.fontColor = UIColor(white: 0, alpha: 0.85)
                stroke.zPosition = 149
                label.addChild(stroke)
                effectsNode.addChild(label)
                return label
            },
            update: { id, node in
                guard let ft = runtime.floatingTexts.first(where: { $0.id == id }), let label = node as? SKLabelNode else { return }
                label.text = ft.text
                let age = now - ft.createdAt
                label.position = self.toScenePoint(x: ft.x, y: ft.y - CGFloat(age) * 40)
                label.alpha = max(0, 1 - age / ft.lifetime)
                label.fontColor = Self.floatingColor(ft.color)
                if let stroke = label.childNode(withName: "stroke") as? SKLabelNode {
                    stroke.text = ft.text
                    stroke.position = CGPoint(x: 1.5, y: -1.5)
                    stroke.alpha = label.alpha * 0.6
                }
            }
        )

        if let boss = controller.bossBattle {
            renderBoss(state: boss)
        } else {
            removeBossNodesIfAny()
        }
    }

    // MARK: - ボス描画

    /// ボス戦が終了した (`controller.bossBattle == nil`) タイミングで残留ノードを破棄。
    private func removeBossNodesIfAny() {
        bossNode?.removeFromParent()
        bossNode = nil
        bossHpRing?.removeFromParent()
        bossHpRing = nil
        for (_, node) in bossProjectileNodes { node.removeFromParent() }
        bossProjectileNodes.removeAll()
        for (_, node) in minionNodes { node.removeFromParent() }
        minionNodes.removeAll()
        for (_, node) in hazardNodes { node.removeFromParent() }
        hazardNodes.removeAll()
    }

    private func renderBoss(state: SurvivalBossBattleState) {
        if bossNode == nil {
            let imageName = Self.bossImageName(type: state.boss.bossType)
            let sprite: SKSpriteNode
            if UIImage(named: imageName) != nil {
                sprite = SKSpriteNode(imageNamed: imageName)
                sprite.size = CGSize(
                    width: SurvivalConstants.bossHitboxRadius * 3,
                    height: SurvivalConstants.bossHitboxRadius * 3
                )
            } else {
                sprite = SKSpriteNode(
                    color: Self.bossFallbackColor(type: state.boss.bossType),
                    size: CGSize(
                        width: SurvivalConstants.bossHitboxRadius * 2,
                        height: SurvivalConstants.bossHitboxRadius * 2
                    )
                )
            }
            sprite.zPosition = 120
            entitiesNode.addChild(sprite)
            bossNode = sprite

            let ring = SKShapeNode(circleOfRadius: SurvivalConstants.bossHitboxRadius * 1.3)
            ring.fillColor = .clear
            ring.strokeColor = UIColor(red: 1, green: 0.2, blue: 0.2, alpha: 0.7)
            ring.lineWidth = 4
            ring.zPosition = 119
            entitiesNode.addChild(ring)
            bossHpRing = ring
        }
        bossNode?.position = toScenePoint(x: state.boss.x, y: state.boss.y)
        bossHpRing?.position = toScenePoint(x: state.boss.x, y: state.boss.y)
        let hpRatio = CGFloat(state.boss.hp) / CGFloat(max(1, state.boss.maxHp))
        bossHpRing?.alpha = hpRatio
        bossNode?.alpha = 0.6 + hpRatio * 0.4

        syncNodes(
            nodeMap: &minionNodes,
            ids: state.minions.map { $0.id },
            create: { [entitiesNode] _ in
                let label = SKLabelNode(text: "🐛")
                label.fontSize = 36
                label.verticalAlignmentMode = .center
                label.horizontalAlignmentMode = .center
                label.zPosition = 95
                entitiesNode.addChild(label)
                return label
            },
            update: { id, node in
                guard let minion = state.minions.first(where: { $0.id == id }), let label = node as? SKLabelNode else { return }
                label.position = self.toScenePoint(x: minion.x, y: minion.y)
                label.fontSize = minion.isExploding ? 46 : 36
                label.alpha = minion.isExploding ? 0.85 : 1.0
            }
        )

        syncNodes(
            nodeMap: &hazardNodes,
            ids: state.hazards.map { $0.id },
            create: { [telegraphsNode] _ in
                let node = SKNode()
                telegraphsNode.addChild(node)
                return node
            },
            update: { id, node in
                guard let hazard = state.hazards.first(where: { $0.id == id }) else { return }
                node.removeAllChildren()
                node.position = self.toScenePoint(x: hazard.x, y: hazard.y)
                self.addHazardShape(to: node, kind: hazard.kind)
            }
        )

        syncNodes(
            nodeMap: &bossProjectileNodes,
            ids: state.projectiles.map { $0.id },
            create: { [effectsNode] _ in
                let node = SKShapeNode(circleOfRadius: 12)
                node.fillColor = UIColor(red: 0.5, green: 1, blue: 0.4, alpha: 1)
                node.strokeColor = .black
                node.zPosition = 80
                effectsNode.addChild(node)
                return node
            },
            update: { id, node in
                guard let proj = state.projectiles.first(where: { $0.id == id }) else { return }
                node.position = self.toScenePoint(x: proj.x, y: proj.y)
            }
        )
    }

    private func addHazardShape(to node: SKNode, kind: SurvivalBossHazard.Kind) {
        switch kind {
        case .fanTelegraph(let angle, let spread, let radius):
            node.addChild(makeFanShape(angle: angle, spread: spread, radius: radius, color: UIColor.red.withAlphaComponent(0.22), stroke: UIColor.red.withAlphaComponent(0.8)))
        case .fanActive(let angle, let spread, let radius, _):
            node.addChild(makeFanShape(angle: angle, spread: spread, radius: radius, color: UIColor.red.withAlphaComponent(0.55), stroke: .red))
        case .lineTelegraph(let angle, let length, let thickness):
            node.addChild(makeLineShape(angle: angle, length: length, thickness: thickness, color: UIColor.orange.withAlphaComponent(0.25), stroke: UIColor.orange.withAlphaComponent(0.8)))
        case .lineActive(let angle, let length, let thickness, _):
            node.addChild(makeLineShape(angle: angle, length: length, thickness: thickness, color: UIColor.orange.withAlphaComponent(0.65), stroke: UIColor.orange))
        case .bloodPool(let radius, _):
            let pool = SKShapeNode(circleOfRadius: radius)
            pool.fillColor = UIColor(red: 0.6, green: 0, blue: 0.1, alpha: 0.5)
            pool.strokeColor = UIColor(red: 0.8, green: 0, blue: 0.2, alpha: 0.9)
            node.addChild(pool)
        case .acidPool(let radius, _):
            let pool = SKShapeNode(circleOfRadius: radius)
            pool.fillColor = UIColor(red: 0.3, green: 0.9, blue: 0.3, alpha: 0.45)
            pool.strokeColor = .green
            node.addChild(pool)
        case .eggTelegraph(let radius):
            let egg = SKShapeNode(circleOfRadius: radius)
            egg.fillColor = UIColor(red: 0.7, green: 0.8, blue: 0.3, alpha: 0.4)
            egg.strokeColor = UIColor.yellow
            node.addChild(egg)
        case .ringTelegraph(let inner, let outer):
            node.addChild(makeRingShape(innerRadius: inner, outerRadius: outer, color: UIColor.cyan.withAlphaComponent(0.25), stroke: UIColor.cyan.withAlphaComponent(0.8)))
        case .ringActive(let inner, let outer, _):
            node.addChild(makeRingShape(innerRadius: inner, outerRadius: outer, color: UIColor.cyan.withAlphaComponent(0.6), stroke: UIColor.cyan))
        case .crossTelegraph(let length, let thickness):
            node.addChild(makeCrossShape(length: length, thickness: thickness, color: UIColor.magenta.withAlphaComponent(0.25), stroke: UIColor.magenta.withAlphaComponent(0.8)))
        case .crossActive(let length, let thickness, _):
            node.addChild(makeCrossShape(length: length, thickness: thickness, color: UIColor.magenta.withAlphaComponent(0.65), stroke: UIColor.magenta))
        case .pullField(let range, _):
            let field = SKShapeNode(circleOfRadius: range)
            field.fillColor = UIColor(white: 1, alpha: 0.05)
            field.strokeColor = UIColor(white: 0.8, alpha: 0.5)
            field.lineWidth = 2
            node.addChild(field)
        }
    }

    // MARK: - Shape helpers

    private func makeFanShape(angle: CGFloat, spread: CGFloat, radius: CGFloat, color: UIColor, stroke: UIColor) -> SKShapeNode {
        let path = CGMutablePath()
        path.move(to: .zero)
        path.addArc(center: .zero, radius: radius, startAngle: -angle - spread / 2, endAngle: -angle + spread / 2, clockwise: false)
        path.closeSubpath()
        let shape = SKShapeNode(path: path)
        shape.fillColor = color
        shape.strokeColor = stroke
        shape.lineWidth = 2
        return shape
    }

    private func makeLineShape(angle: CGFloat, length: CGFloat, thickness: CGFloat, color: UIColor, stroke: UIColor) -> SKShapeNode {
        let rect = CGRect(x: 0, y: -thickness, width: length, height: thickness * 2)
        let path = CGPath(rect: rect, transform: nil)
        let shape = SKShapeNode(path: path)
        shape.fillColor = color
        shape.strokeColor = stroke
        shape.lineWidth = 2
        shape.zRotation = -angle
        return shape
    }

    private func makeRingShape(innerRadius: CGFloat, outerRadius: CGFloat, color: UIColor, stroke: UIColor) -> SKNode {
        let container = SKNode()
        let outer = SKShapeNode(circleOfRadius: outerRadius)
        outer.fillColor = color
        outer.strokeColor = stroke
        outer.lineWidth = 2
        container.addChild(outer)
        let inner = SKShapeNode(circleOfRadius: innerRadius)
        inner.fillColor = .black
        inner.strokeColor = stroke
        inner.lineWidth = 2
        container.addChild(inner)
        return container
    }

    private func makeCrossShape(length: CGFloat, thickness: CGFloat, color: UIColor, stroke: UIColor) -> SKNode {
        let container = SKNode()
        let horiz = SKShapeNode(rect: CGRect(x: -length / 2, y: -thickness, width: length, height: thickness * 2))
        horiz.fillColor = color
        horiz.strokeColor = stroke
        horiz.lineWidth = 2
        container.addChild(horiz)
        let vert = SKShapeNode(rect: CGRect(x: -thickness, y: -length / 2, width: thickness * 2, height: length))
        vert.fillColor = color
        vert.strokeColor = stroke
        vert.lineWidth = 2
        container.addChild(vert)
        return container
    }

    // MARK: - Node synchronization helper

    private func syncNodes<Node: SKNode>(
        nodeMap: inout [UUID: Node],
        ids: [UUID],
        create: (UUID) -> Node,
        update: (UUID, Node) -> Void
    ) {
        let desired = Set(ids)
        for (id, node) in nodeMap where !desired.contains(id) {
            node.removeFromParent()
            nodeMap.removeValue(forKey: id)
        }
        for id in ids {
            let node: Node
            if let existing = nodeMap[id] {
                node = existing
            } else {
                node = create(id)
                nodeMap[id] = node
            }
            update(id, node)
        }
    }

    // MARK: - ノード ファクトリ

    private static func makeEnemyNode() -> SKNode {
        let container = SKNode()
        container.zPosition = 90

        let label = SKLabelNode(text: "🫠")
        label.fontSize = 32
        label.verticalAlignmentMode = .center
        label.horizontalAlignmentMode = .center
        label.name = "emoji"
        container.addChild(label)

        let hpRing = SKShapeNode(circleOfRadius: SurvivalConstants.enemySize / 2 + 4)
        hpRing.fillColor = .clear
        hpRing.strokeColor = UIColor.red.withAlphaComponent(0.75)
        hpRing.lineWidth = 2
        hpRing.name = "hpRing"
        container.addChild(hpRing)
        return container
    }

    private static func updateEnemyNode(node: SKNode, enemy: SurvivalEnemy) {
        if let label = node.childNode(withName: "emoji") as? SKLabelNode {
            label.text = enemy.type.emoji
        }
        if let ring = node.childNode(withName: "hpRing") as? SKShapeNode {
            let ratio = CGFloat(enemy.stats.hp) / CGFloat(max(1, enemy.stats.maxHp))
            ring.alpha = max(0.2, ratio)
            ring.strokeColor = ratio > 0.5
                ? UIColor(red: 1, green: 0.9, blue: 0.3, alpha: 0.8)
                : UIColor(red: 1, green: 0.3, blue: 0.3, alpha: 0.9)
        }
    }

    private static func shockwaveFillColor(level: Int) -> UIColor {
        switch level {
        case 0: return UIColor(red: 0.6, green: 0.9, blue: 1, alpha: 1)
        case 1: return UIColor(red: 0.9, green: 0.7, blue: 1, alpha: 1)
        case 2: return UIColor(red: 1.0, green: 0.6, blue: 0.8, alpha: 1)
        default: return UIColor(red: 1.0, green: 0.4, blue: 0.4, alpha: 1)
        }
    }

    private static func magicEmoji(kind: SurvivalMagicKind) -> String {
        switch kind {
        case .thunder: return "⚡️"
        case .ice: return "❄️"
        case .fire: return "🔥"
        case .heal: return "💚"
        case .buffer: return "✨"
        case .hint: return "💡"
        }
    }

    private static func bossImageName(type: SurvivalBossType) -> String {
        switch type {
        case .A: return "SurvivalMap/boss_a"
        case .B: return "SurvivalMap/boss_b"
        case .C: return "SurvivalMap/boss_c"
        }
    }

    private static func bossFallbackColor(type: SurvivalBossType) -> UIColor {
        switch type {
        case .A: return UIColor(red: 0.8, green: 0.1, blue: 0.15, alpha: 1)
        case .B: return UIColor(red: 0.25, green: 0.75, blue: 0.3, alpha: 1)
        case .C: return UIColor(red: 0.3, green: 0.4, blue: 0.9, alpha: 1)
        }
    }

    private static func floatingColor(_ kind: SurvivalFloatingTextColor) -> UIColor {
        switch kind {
        case .damage: return .yellow
        case .heal: return .green
        case .warn: return .red
        case .exp: return UIColor(red: 0.6, green: 0.9, blue: 1, alpha: 1)
        }
    }
}

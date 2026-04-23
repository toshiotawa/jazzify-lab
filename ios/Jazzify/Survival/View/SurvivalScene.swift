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
    private var hazardNodes: [UUID: SKSpriteNode] = [:]
    private var minionNodes: [UUID: SKNode] = [:]
    private var bossNode: SKSpriteNode?
    private var bossHpBarNode: SKSpriteNode?
    private var bossWindupNode: SKSpriteNode?
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
        bossHpBarNode?.removeFromParent()
        bossHpBarNode = nil
        bossWindupNode?.removeFromParent()
        bossWindupNode = nil
        for (_, node) in bossProjectileNodes { node.removeFromParent() }
        bossProjectileNodes.removeAll()
        for (_, node) in minionNodes { node.removeFromParent() }
        minionNodes.removeAll()
        for (_, node) in hazardNodes { node.removeFromParent() }
        hazardNodes.removeAll()
    }

    private func renderBoss(state: SurvivalBossBattleState) {
        let nowMs = CACurrentMediaTime() * 1000.0

        // MARK: ボス本体 スプライト
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
        }
        let bossPos = toScenePoint(x: state.boss.x, y: state.boss.y)
        bossNode?.position = bossPos
        let hpRatio = CGFloat(state.boss.hp) / CGFloat(max(1, state.boss.maxHp))
        bossNode?.alpha = 0.6 + hpRatio * 0.4

        // MARK: ボス頭上 HP バー
        if bossHpBarNode == nil {
            let n = SKSpriteNode()
            n.zPosition = 125
            entitiesNode.addChild(n)
            bossHpBarNode = n
        }
        if let barNode = bossHpBarNode {
            let img = SurvivalBossEffectRenderer.renderBossHpBar(ratio: hpRatio)
            let tex = SKTexture(image: img)
            tex.filteringMode = .linear
            barNode.texture = tex
            barNode.size = img.size
            // ボススプライト上端の少し上に配置
            let bossTop = bossPos.y + SurvivalConstants.bossHitboxRadius * 1.5
            barNode.position = CGPoint(x: bossPos.x, y: bossTop + 16)
        }

        // MARK: ボス予備動作 警告 (⚠️ + ゲージ)
        if case .windup(_, let startAt, let durationMs) = state.boss.action {
            let progress = min(1, max(0, (CACurrentMediaTime() - startAt) / (durationMs / 1000.0)))
            if bossWindupNode == nil {
                let n = SKSpriteNode()
                n.zPosition = 135
                entitiesNode.addChild(n)
                bossWindupNode = n
            }
            if let n = bossWindupNode {
                let img = SurvivalBossEffectRenderer.renderBossWindupWarning(progress: progress, nowMs: nowMs)
                n.texture = SKTexture(image: img)
                n.size = img.size
                let bossTop = bossPos.y + SurvivalConstants.bossHitboxRadius * 1.5
                n.position = CGPoint(x: bossPos.x, y: bossTop + 48)
            }
        } else {
            bossWindupNode?.removeFromParent()
            bossWindupNode = nil
        }

        // MARK: 雑魚 (自爆ボム) 💣 + HP バー + 接近点滅
        syncNodes(
            nodeMap: &minionNodes,
            ids: state.minions.map { $0.id },
            create: { [entitiesNode] _ in
                let container = SKNode()
                container.zPosition = 95

                let ring = SKShapeNode(circleOfRadius: 26)
                ring.name = "fuseRing"
                ring.fillColor = UIColor(red: 1, green: 0.3, blue: 0.3, alpha: 0.55)
                ring.strokeColor = .clear
                ring.alpha = 0
                container.addChild(ring)

                let label = SKLabelNode(text: "💣")
                label.name = "emoji"
                label.fontSize = 32
                label.verticalAlignmentMode = .center
                label.horizontalAlignmentMode = .center
                container.addChild(label)

                let hpBg = SKShapeNode(rect: CGRect(x: -16, y: 22, width: 32, height: 3))
                hpBg.name = "hpBg"
                hpBg.fillColor = UIColor(white: 0.1, alpha: 1)
                hpBg.strokeColor = .clear
                container.addChild(hpBg)

                let hpFill = SKShapeNode(rect: CGRect(x: -16, y: 22, width: 32, height: 3))
                hpFill.name = "hpFill"
                hpFill.fillColor = UIColor(red: 248.0/255, green: 113.0/255, blue: 113.0/255, alpha: 1)
                hpFill.strokeColor = .clear
                container.addChild(hpFill)

                entitiesNode.addChild(container)
                return container
            },
            update: { id, node in
                guard let minion = state.minions.first(where: { $0.id == id }) else { return }
                node.position = self.toScenePoint(x: minion.x, y: minion.y)
                // プレイヤー距離から導火線点滅を推定 (トリガー距離の 1.6 倍以内で点滅開始)
                let dx = self.controller?.runtime.player.x ?? minion.x
                let dy = self.controller?.runtime.player.y ?? minion.y
                let dist = hypot(minion.x - dx, minion.y - dy)
                let fused = dist <= minion.triggerRange * 1.6 || minion.isExploding
                if let ring = node.childNode(withName: "fuseRing") {
                    if fused {
                        let blink = Int(nowMs / 100) % 2 == 0
                        ring.alpha = blink ? 0.55 : 0.0
                    } else {
                        ring.alpha = 0
                    }
                }
                if let label = node.childNode(withName: "emoji") as? SKLabelNode {
                    label.fontSize = minion.isExploding ? 46 : 32
                }
                // HP バー (spores ミニオンの maxHp は BossBParams.minionHp 固定)
                let maxHp: CGFloat = CGFloat(max(1, 35))
                let ratio = max(0, min(1, CGFloat(minion.hp) / maxHp))
                if let hpFill = node.childNode(withName: "hpFill") as? SKShapeNode {
                    hpFill.xScale = ratio
                    hpFill.alpha = ratio < 1 ? 1 : 0
                }
                if let hpBg = node.childNode(withName: "hpBg") {
                    hpBg.alpha = ratio < 1 ? 1 : 0
                }
            }
        )

        // MARK: ハザード (Web 版相当のリッチエフェクト)
        syncNodes(
            nodeMap: &hazardNodes,
            ids: state.hazards.map { $0.id },
            create: { [telegraphsNode] _ in
                let sprite = SKSpriteNode()
                sprite.zPosition = 90
                telegraphsNode.addChild(sprite)
                return sprite
            },
            update: { id, sprite in
                guard let hazard = state.hazards.first(where: { $0.id == id }) else { return }
                let idHash = id.hashValue
                guard let output = SurvivalBossEffectRenderer.renderHazard(
                    kind: hazard.kind,
                    startAt: hazard.startAt,
                    endAt: hazard.endAt,
                    nowMs: nowMs,
                    idHash: idHash
                ) else {
                    return
                }
                let tex = SKTexture(image: output.image)
                tex.filteringMode = .linear
                sprite.texture = tex
                sprite.size = output.image.size
                sprite.anchorPoint = output.anchorPoint
                sprite.zRotation = output.rotation
                sprite.position = self.toScenePoint(x: hazard.x, y: hazard.y)
            }
        )

        // MARK: ボス弾 (毒弾 or 通常弾)
        syncNodes(
            nodeMap: &bossProjectileNodes,
            ids: state.projectiles.map { $0.id },
            create: { [effectsNode] _ in
                let sprite = SKSpriteNode()
                sprite.zPosition = 80
                effectsNode.addChild(sprite)
                return sprite
            },
            update: { id, node in
                guard let proj = state.projectiles.first(where: { $0.id == id }),
                      let sprite = node as? SKSpriteNode else { return }
                sprite.position = self.toScenePoint(x: proj.x, y: proj.y)
                // 現仕様では全て毒弾 (spawnsPoolOnLand=true)
                // レンダラ内は CG y-down 基準で軌跡を描くため、engine の vy をそのまま渡す。
                // SKTexture 適用時の y-flip が自動で表示方向 (画面 y-up) へ補正してくれる。
                let img = SurvivalBossEffectRenderer.renderAcidProjectile(
                    radius: 14,
                    dx: proj.vx,
                    dy: proj.vy,
                    nowMs: nowMs,
                    idHash: id.hashValue
                )
                let tex = SKTexture(image: img)
                tex.filteringMode = .linear
                sprite.texture = tex
                sprite.size = img.size
            }
        )
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
        case .chord: return UIColor(red: 0.85, green: 0.95, blue: 1, alpha: 1)
        }
    }
}

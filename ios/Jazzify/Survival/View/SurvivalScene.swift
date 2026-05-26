import SpriteKit
import CoreGraphics
import UIKit
import QuartzCore

/// サバイバル ゲーム世界描画用の SKScene。
/// - プレイヤー (5 方向 `survival_muki_*` スプライト、左向きは右向き素材を水平反転) / 敵・弾・アイテム・コイン (絵文字 SKLabelNode)
/// - ボスは `boss_a|b|c` スプライト (Assets.xcassets の SurvivalMap 配下) で描画
/// - ハザード (扇 / 直線 / リング / 十字 / 引力) は SKShapeNode 群
/// - `update(_:)` は `SurvivalSceneDriver` でシミュレーションを 1 ステップ進め、受け取ったスナップショットを描画するのみとする。
final class SurvivalScene: SKScene {
    private weak var driver: SurvivalSceneDriver?

    private let worldNode = SKNode()
    private let backgroundNode = SKNode()
    private let effectsNode = SKNode()
    private let entitiesNode = SKNode()
    private let hazardsNode = SKNode()
    private let telegraphsNode = SKNode()

    private var playerNode: SKNode?
    private var playerSprite: SKSpriteNode?
    private var jajiiSpriteNode: SKSpriteNode?
    private var playerQuoteText: String = ""
    private var playerQuoteTextLaidOut: String = ""
    private var playerQuoteBubbleRoot: SKNode?
    private var jajiiQuoteText: String = ""
    private var jajiiQuoteTextLaidOut: String = ""
    private var jajiiQuoteBubbleRoot: SKNode?
    private var playerBubbleAnchorNode: SKNode?
    private var jajiiBubbleAnchorNode: SKNode?
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

    /// B ボス戦で UIImage/SKTexture 再生成を抑えるための差分更新キャッシュ。
    /// 毎フレーム CoreGraphics 描画していたのが B ボス戦で特に重い原因だったため、
    /// 「前回との差が閾値未満なら描き直さない」節約を入れる。
    private var bossHpBarLastRatio: CGFloat = -1
    /// `renderBossWindupWarning` を progress の 0.05 刻みバケット単位でだけ更新する。
    private var bossWindupLastBucket: Int = -1
    /// ハザード毎の最終描画 progress (0.0〜1.0)。閾値以上変化したときだけ再描画する。
    private var hazardLastProgress: [UUID: Double] = [:]
    /// ボス弾テクスチャの共有キャッシュ。進行方向を 8 分割して同方向の弾で
    /// SKTexture を共有する。全弾で毎フレーム UIImage を生成していた旧実装より
    /// CoreGraphics/メモリ負荷が ~1/(同時弾数) に減る。
    private var bossProjectileTextureCache: [Int: SKTexture] = [:]
    /// 上記キャッシュ方向バケットの最終更新時刻 (ms)。
    /// この時刻を過ぎたら同バケットを次フレームで 1 度だけ再生成する。
    private var bossProjectileTextureUpdatedAt: [Int: Double] = [:]
    /// 各弾の現在割当て済み方向バケット。初期化 / 方向変更時のみテクスチャ適用する。
    private var bossProjectileBucketById: [UUID: Int] = [:]
    /// キャッシュ辞書 (hazardLastProgress / bossProjectileBucketById) の次回掃除予定 ms。
    /// 毎フレームの `Set(…).filter` は無駄が多いので ~500ms 毎にまとめて実行する。
    private var nextCacheSweepAtMs: Double = 0

    /// 衝撃波発動時のカメラ シェイク管理。
    /// 前フレームで加えた offset を記録しておき、次フレームで差し引いてから
    /// lerp を適用し、新しい offset を足すことで shake を確実に表示する。
    private var cameraShakeStartAt: TimeInterval = 0
    private var cameraShakeDuration: TimeInterval = 0.22
    private var cameraShakeAmplitude: CGFloat = 4.0
    private var cameraPreviousShakeOffset: CGPoint = .zero

    /// 初回フレームでカメラをプレイヤー位置に即時スナップするためのフラグ。
    /// 放置すると SKCameraNode.position = (0, 0) から時間ベース追従するため、
    /// プレイヤー初期位置 (マップ中央 1600, 1200) に到達するまで遅れて
    /// プレイヤーが画面外 (左下相当) に描画されて「左隅ポップ・移動できない」様に見える。
    /// 初回だけ追従をスキップしてマップ中央をキャプチャする。
    private var hasInitializedCameraPosition: Bool = false

    /// `SKScene.update` の `currentTime` 差分。カメラ追従を `tick` の `deltaTime` と同様に上限付きで揃える。
    private var lastSceneUpdateTimeForCamera: TimeInterval?

    /// ボス撃破演出を既に発火済みか (カメラシェイク + 爆散エフェクトを 1 回だけトリガーするため)。
    private var hasTriggeredBossDefeatFx: Bool = false

    func setPlayerQuoteText(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed != playerQuoteText else { return }
        playerQuoteText = trimmed
        if trimmed.isEmpty {
            playerQuoteTextLaidOut = ""
        }
    }

    func setJajiiQuoteText(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed != jajiiQuoteText else { return }
        jajiiQuoteText = trimmed
        if trimmed.isEmpty {
            jajiiQuoteTextLaidOut = ""
        }
    }

    /// `SKScene.update` が最後に走ったホスト時刻。`UIViewRepresentable.Coordinator` の watchdog がゲームループ停止を検出するために使う。
    private(set) var lastUpdateWallTime: TimeInterval = CACurrentMediaTime()

    init(
        size: CGSize,
        driver: SurvivalSceneDriver
    ) {
        self.driver = driver
        super.init(size: size)
        scaleMode = .resizeFill
        backgroundColor = UIColor(red: 0.03, green: 0.02, blue: 0.06, alpha: 1.0)
        setup()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    /// `restartSameStage()` で `SKScene` を再生成せず、動的ノードとボス関連キャッシュだけ初期化する。
    func resetForRestart() {
        removeBossNodesIfAny()
        purgeNodeMap(&enemyNodes)
        purgeNodeMap(&projectileNodes)
        purgeNodeMap(&enemyProjectileNodes)
        purgeNodeMap(&shockwaveNodes)
        purgeNodeMap(&magicEffectNodes)
        purgeNodeMap(&itemNodes)
        purgeNodeMap(&coinNodes)
        purgeNodeMap(&floatingTextNodes)
        for (_, node) in hazardNodes {
            node.removeFromParent()
        }
        hazardNodes.removeAll()
        hazardLastProgress.removeAll()

        bossWindupLastBucket = -1
        hasInitializedCameraPosition = false
        lastSceneUpdateTimeForCamera = nil
        cameraShakeStartAt = 0
        cameraPreviousShakeOffset = .zero
        nextCacheSweepAtMs = 0
        lastUpdateWallTime = CACurrentMediaTime()
    }

    private func purgeNodeMap<Node: SKNode>(_ map: inout [UUID: Node]) {
        for (_, node) in map {
            node.removeFromParent()
        }
        map.removeAll()
    }

    /// SKView の autoresize でシーン サイズが確定するタイミングでカメラ スナップを再実行する。
    /// `SKView(frame: .zero).presentScene(scene)` → SwiftUI のレイアウト完了後に view.frame が変化
    /// し、`scaleMode = .resizeFill` により scene.size も後から更新される。
    /// その最初の update() 時に `hasInitializedCameraPosition` が true に確定してしまうと、
    /// 以後の lerp 追従で「プレイヤーが左下隅にしか見えない」状態が数百 ms 残ってしまう。
    /// `didChangeSize` で明示的にフラグをリセットすることで、確定後のサイズでスナップし直す。
    override func didChangeSize(_ oldSize: CGSize) {
        super.didChangeSize(oldSize)
        hasInitializedCameraPosition = false
        lastSceneUpdateTimeForCamera = nil
    }

    private func setup() {
        addChild(worldNode)
        worldNode.addChild(backgroundNode)
        worldNode.addChild(telegraphsNode)
        worldNode.addChild(hazardsNode)
        worldNode.addChild(effectsNode)
        worldNode.addChild(entitiesNode)
        drawBackground()
        drawMapBoundary()
        buildPlayer()
        buildSpeechBubbleOverlay()

        let camera = SKCameraNode()
        self.camera = camera
        addChild(camera)
    }

    /// プレイヤー向きに応じたテクスチャ名を Web 版 `getSurvivalDefaultSpriteForDirection` と同一マッピングにする。
    private static func playerTextureAssetName(for dir: SurvivalDirection8) -> String {
        switch dir {
        case .right, .left:
            return "survival_muki_migi"
        case .downRight, .downLeft:
            return "survival_muki_naname_shita"
        case .upRight, .upLeft:
            return "survival_muki_naname_ue"
        case .down:
            return "survival_muki_shita"
        case .up:
            return "survival_muki_ue"
        }
    }

    /// 前フレームと同一テクスチャなら `SKTexture` の差し替えをスキップする。
    private var playerLastTextureAssetName: String?

    private func buildPlayer() {
        let container = SKNode()
        container.zPosition = 100
        let size = CGSize(
            width: SurvivalConstants.playerSize * 1.6,
            height: SurvivalConstants.playerSize * 1.6
        )
        let initialName = Self.playerTextureAssetName(for: .down)
        let sprite: SKSpriteNode
        if UIImage(named: initialName) != nil {
            sprite = SKSpriteNode(imageNamed: initialName)
            playerLastTextureAssetName = initialName
        } else if UIImage(named: "default-avater") != nil {
            sprite = SKSpriteNode(imageNamed: "default-avater")
            playerLastTextureAssetName = nil
        } else {
            sprite = SKSpriteNode(color: UIColor(red: 0.4, green: 0.85, blue: 1.0, alpha: 1.0), size: size)
            playerLastTextureAssetName = nil
        }
        sprite.size = size
        container.addChild(sprite)
        Self.addComboGauge(to: container)
        entitiesNode.addChild(container)
        playerNode = container
        playerSprite = sprite
    }

    /// ボス (z≈120) より前面に吹き出しだけ載せるオーバーレイ。
    private func buildSpeechBubbleOverlay() {
        let overlay = SKNode()
        overlay.zPosition = 200
        let playerAnchor = SKNode()
        let jajiiAnchor = SKNode()
        overlay.addChild(playerAnchor)
        overlay.addChild(jajiiAnchor)
        entitiesNode.addChild(overlay)
        playerBubbleAnchorNode = playerAnchor
        jajiiBubbleAnchorNode = jajiiAnchor
    }

    /// A/B コンボ用ゲージ（5 本）をプレイヤースプライト上端に載せる。
    private static func addComboGauge(to container: SKNode) {
        let host = SKNode()
        host.name = "comboGaugeHost"
        host.zPosition = 6
        let barW: CGFloat = 6
        let barH: CGFloat = 3
        let gap: CGFloat = 2
        let maxG = SurvivalConstants.comboGaugeMax
        let totalW = CGFloat(maxG) * barW + CGFloat(maxG - 1) * gap
        let left = -totalW / 2 + barW / 2
        for i in 0..<maxG {
            let rect = SKShapeNode(rectOf: CGSize(width: barW, height: barH), cornerRadius: 1)
            rect.name = "g\(i)"
            rect.position = CGPoint(x: left + CGFloat(i) * (barW + gap), y: 0)
            rect.fillColor = UIColor(white: 0.3, alpha: 0.75)
            rect.strokeColor = UIColor(white: 0.85, alpha: 0.35)
            rect.lineWidth = 0.5
            host.addChild(rect)
        }
        host.position = CGPoint(x: 0, y: SurvivalConstants.playerSize * 0.85 + 10)
        container.addChild(host)
    }

    /// 暗い木床（Web 版と同一見た目）。テクスチャ本体は `SurvivalBackgroundCache` でプロセス共有。
    private func drawBackground() {
        let mapSize = CGSize(width: SurvivalMap.width, height: SurvivalMap.height)
        let floorTexture = SurvivalBackgroundCache.sharedFloorTexture()
        let node = SKSpriteNode(texture: floorTexture, size: mapSize)
        node.anchorPoint = CGPoint(x: 0, y: 0)
        node.position = toScenePoint(x: 0, y: mapSize.height)
        node.zPosition = -100
        backgroundNode.addChild(node)
    }

    /// マップ境界を視覚的に分かりやすく描画する。
    /// - マップ外側に赤黒い「立入禁止帯」を敷いて進入不可領域を明示
    /// - マップ枠 (3200 × 2400) に二重のネオン風ラインを引く
    private func drawMapBoundary() {
        let mapWidth = SurvivalMap.width
        let mapHeight = SurvivalMap.height
        let boundary = SKNode()
        boundary.zPosition = -50
        backgroundNode.addChild(boundary)

        // 1. 外側の「立入禁止帯」(マップ外) を 4 辺ぶんの矩形で赤黒く塗る。
        //    SKShapeNode は `fillRule` を持たないため、`evenOdd` 抜き型ではなく
        //    4 面を個別に配置する。
        let outerMargin: CGFloat = 240
        let danger = UIColor(red: 0.14, green: 0.04, blue: 0.06, alpha: 0.9)
        let outsideRects: [CGRect] = [
            CGRect(x: -outerMargin, y: -outerMargin, width: mapWidth + outerMargin * 2, height: outerMargin),
            CGRect(x: -outerMargin, y: mapHeight, width: mapWidth + outerMargin * 2, height: outerMargin),
            CGRect(x: -outerMargin, y: 0, width: outerMargin, height: mapHeight),
            CGRect(x: mapWidth, y: 0, width: outerMargin, height: mapHeight)
        ]
        for rect in outsideRects {
            let node = SKShapeNode(rect: rect)
            node.fillColor = danger
            node.strokeColor = .clear
            node.position = toScenePoint(x: 0, y: mapHeight)
            boundary.addChild(node)
        }

        // 2. マップ全体を囲む太めのネオンフレーム (外側)
        let outerFrame = SKShapeNode(rect: CGRect(x: 0, y: 0, width: mapWidth, height: mapHeight))
        outerFrame.fillColor = .clear
        outerFrame.strokeColor = UIColor(red: 1.0, green: 0.35, blue: 0.45, alpha: 0.95)
        outerFrame.lineWidth = 14
        outerFrame.glowWidth = 10
        outerFrame.position = toScenePoint(x: 0, y: mapHeight)
        boundary.addChild(outerFrame)

        // 3. 少し内側に白い細線を引いて二重線感を出す
        let innerFrameInset: CGFloat = 10
        let innerFrame = SKShapeNode(
            rect: CGRect(
                x: innerFrameInset,
                y: innerFrameInset,
                width: mapWidth - innerFrameInset * 2,
                height: mapHeight - innerFrameInset * 2
            )
        )
        innerFrame.fillColor = .clear
        innerFrame.strokeColor = UIColor(white: 1.0, alpha: 0.55)
        innerFrame.lineWidth = 2
        innerFrame.glowWidth = 0
        innerFrame.position = toScenePoint(x: 0, y: mapHeight)
        boundary.addChild(innerFrame)
    }

    // MARK: - 座標変換 (Web 側 y=下向き → SpriteKit y=上向き)

    private func toScenePoint(x: CGFloat, y: CGFloat) -> CGPoint {
        CGPoint(x: x, y: SurvivalMap.height - y)
    }

    // MARK: - フレーム更新

    override func update(_ currentTime: TimeInterval) {
        lastUpdateWallTime = CACurrentMediaTime()
        guard let driver else { return }
        let rawDt = lastSceneUpdateTimeForCamera.map { currentTime - $0 } ?? 0
        lastSceneUpdateTimeForCamera = currentTime
        // `SurvivalGameLoop.tick` の dt 上限 (0.05s) に合わせ、長フレームでカメラだけ飛ばないようにする。
        let cameraDeltaTime = CGFloat(max(0, min(0.05, rawDt)))

        let snapshot = driver.advanceSceneFrame(currentTime: currentTime)
        let runtime = snapshot.runtime
        renderState(runtime: runtime, bossBattle: snapshot.bossBattle)
        updateCamera(runtime: runtime, deltaTime: cameraDeltaTime)
    }

    private func updateCamera(runtime: SurvivalStageRuntime, deltaTime: CGFloat) {
        guard let camera else { return }
        let target = toScenePoint(x: runtime.player.x, y: runtime.player.y)

        // 初回のみプレイヤー位置へ即時スナップ (追従による画面端からの遅延描画を防ぐ)。
        // scene サイズ未確定 (SwiftUI layout 完了前) でスナップすると、以後の画面サイズ変化で
        // 再スナップが効かずプレイヤーが画面外 (= 左隅ポップのように見える) 状態が残る。
        // サイズ確定前 (100px 未満) は初回スナップを見送り、`didChangeSize` 後のフレームで再実行する。
        if !hasInitializedCameraPosition {
            guard size.width > 100, size.height > 100 else { return }
            camera.position = target
            cameraPreviousShakeOffset = .zero
            hasInitializedCameraPosition = true
            return
        }

        // フレーム固定 lerp ではなく `deltaTime` ベースの指数追従にし、プレイヤー移動 (`tick` の dt 積分) と
        // カメラの時間応答を揃える（可変 dt での画面上のカクつき低減）。
        // λ=12 → 60fps・dt≈1/60 のとき 1-exp(-λdt) ≈ 0.18（旧固定 lerp に近い追従感）。
        let followLambda: Double = 12
        let alpha = CGFloat(1 - exp(-followLambda * Double(deltaTime)))

        // 前フレームの shake offset を取り除き、「本来の追従ベース位置」で追従計算する。
        let basePosX = camera.position.x - cameraPreviousShakeOffset.x
        let basePosY = camera.position.y - cameraPreviousShakeOffset.y
        let newBaseX = basePosX + (target.x - basePosX) * alpha
        let newBaseY = basePosY + (target.y - basePosY) * alpha

        // 新しい shake offset を計算 (高周波ノイズ + 線形減衰)。
        let now = CACurrentMediaTime()
        let elapsed = now - cameraShakeStartAt
        var shakeOffset: CGPoint = .zero
        if cameraShakeStartAt > 0, elapsed < cameraShakeDuration {
            let decay = 1 - CGFloat(elapsed / cameraShakeDuration)
            let amp: CGFloat = cameraShakeAmplitude * decay
            let t = CGFloat(elapsed)
            shakeOffset = CGPoint(
                x: sin(t * 85) * amp + sin(t * 143) * amp * 0.4,
                y: cos(t * 97) * amp * 0.9 + sin(t * 181) * amp * 0.5
            )
        }

        camera.position = CGPoint(x: newBaseX + shakeOffset.x, y: newBaseY + shakeOffset.y)
        cameraPreviousShakeOffset = shakeOffset
    }

    /// 近接攻撃 (衝撃波) 発動時やボス撃破時に呼び出してカメラを揺らす。
    /// - Parameters:
    ///   - intensity: 最大振幅 (デフォルト 4.0)
    ///   - duration: 減衰時間 (デフォルト 0.22 秒)
    private func triggerCameraShake(intensity: CGFloat = 4.0, duration: TimeInterval = 0.22) {
        cameraShakeStartAt = CACurrentMediaTime()
        cameraShakeAmplitude = intensity
        cameraShakeDuration = duration
    }

    /// ボス撃破時の爆散エフェクト。
    /// 大型 💥 が一瞬拡大しながらフェードアウト、放射状に複数の小さな炎片が飛び散る。
    /// `entitiesNode` にアタッチして、カメラ追従 & エンティティ z-order に乗せる。
    private func spawnBossDefeatBurst(at position: CGPoint) {
        let center = SKLabelNode(text: "💥")
        center.fontSize = 64
        center.verticalAlignmentMode = .center
        center.horizontalAlignmentMode = .center
        center.position = position
        center.zPosition = 140
        entitiesNode.addChild(center)
        center.run(.sequence([
            .group([
                .scale(to: 2.8, duration: 0.6),
                .fadeOut(withDuration: 0.6)
            ]),
            .removeFromParent()
        ]))

        // 放射状の小さな炎片 (8 方向)
        let sparkCount = 8
        for i in 0..<sparkCount {
            let angle = (CGFloat(i) / CGFloat(sparkCount)) * .pi * 2
            let spark = SKLabelNode(text: "🔥")
            spark.fontSize = 28
            spark.verticalAlignmentMode = .center
            spark.horizontalAlignmentMode = .center
            spark.position = position
            spark.zPosition = 139
            entitiesNode.addChild(spark)
            let distance: CGFloat = 120
            let destination = CGPoint(
                x: position.x + cos(angle) * distance,
                y: position.y + sin(angle) * distance
            )
            spark.run(.sequence([
                .group([
                    .move(to: destination, duration: 0.7),
                    .fadeOut(withDuration: 0.7),
                    .scale(to: 0.2, duration: 0.7)
                ]),
                .removeFromParent()
            ]))
        }
    }

    private func renderState(runtime: SurvivalStageRuntime, bossBattle: SurvivalBossBattleState?) {
        let now = CACurrentMediaTime()

        // O(n^2) 検索を避けるため、この 1 フレームで参照するエンティティは
        // 事前に id -> 本体 の辞書に展開してから syncNodes に渡す。
        // `Dictionary(uniqueKeysWithValues:)` は都度 Array を生成してハッシュを計算するため、
        // capacity 予約した Dictionary へ直接入れる形に変えてアロケーションを削減する。
        let enemyById = Self.indexed(runtime.enemies, key: \.id)
        let projectileById = Self.indexed(runtime.projectiles, key: \.id)
        let enemyProjectileById = Self.indexed(runtime.enemyProjectiles, key: \.id)
        let shockwaveById = Self.indexed(runtime.shockwaves, key: \.id)
        let magicEffectById = Self.indexed(runtime.magicEffects, key: \.id)
        let droppedItemById = Self.indexed(runtime.droppedItems, key: \.id)
        let coinById = Self.indexed(runtime.coins, key: \.id)
        let floatingTextById = Self.indexed(runtime.floatingTexts, key: \.id)

        // プレイヤー
        if let playerNode, let sprite = playerSprite {
            playerNode.position = toScenePoint(x: runtime.player.x, y: runtime.player.y)
            let texName = Self.playerTextureAssetName(for: runtime.player.direction)
            if texName != playerLastTextureAssetName, UIImage(named: texName) != nil {
                sprite.texture = SKTexture(imageNamed: texName)
                playerLastTextureAssetName = texName
            }
            // 向きによる水平反転 (進行方向が left / upLeft / downLeft なら -1)
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

            if let host = playerNode.childNode(withName: "comboGaugeHost") {
                let hideGauge = (driver as? SurvivalGameSession)?.gameLoop.isPhraseMode == true
                let gauge = runtime.comboGauge
                let ready = runtime.comboReady
                let maxG = SurvivalConstants.comboGaugeMax
                if hideGauge {
                    host.isHidden = true
                } else if gauge == 0, !ready {
                    host.isHidden = true
                } else {
                    host.isHidden = false
                    if ready, gauge >= maxG {
                        host.alpha = CGFloat(0.8 + 0.2 * sin(now * 4))
                    } else {
                        host.alpha = 1
                    }
                    for i in 0..<maxG {
                        guard let bar = host.childNode(withName: "g\(i)") as? SKShapeNode else { continue }
                        let filled = i < gauge
                        bar.fillColor = filled
                            ? UIColor(red: 1, green: 0.85, blue: 0.15, alpha: 1)
                            : UIColor(white: 0.3, alpha: 0.75)
                    }
                }
            }

            layoutPlayerQuoteBubble(spriteHeight: sprite.size.height)
        } else {
            playerQuoteBubbleRoot?.removeFromParent()
            playerQuoteBubbleRoot = nil
            playerQuoteTextLaidOut = ""
        }

        // ジャ爺サポート（scenario / lesson 無効時のみ runtime.jajii が存在）
        if let jajiiState = runtime.jajii {
            let texName = "survival_jajii"
            if jajiiSpriteNode == nil, UIImage(named: texName) != nil {
                let node = SKSpriteNode(imageNamed: texName)
                node.zPosition = 99
                node.size = CGSize(width: 48, height: 48)
                entitiesNode.addChild(node)
                jajiiSpriteNode = node
            }
            if let node = jajiiSpriteNode {
                let wp = SurvivalJajiiEngine.worldPosition(state: jajiiState)
                node.position = toScenePoint(x: wp.x, y: wp.y)
                node.isHidden = false
                jajiiBubbleAnchorNode?.position = node.position
                layoutJajiiQuoteBubble(on: jajiiBubbleAnchorNode)
            }
        } else {
            jajiiSpriteNode?.isHidden = true
            jajiiQuoteBubbleRoot?.removeFromParent()
            jajiiQuoteBubbleRoot = nil
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
                guard let enemy = enemyById[id] else { return }
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
                guard let proj = projectileById[id] else { return }
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
                guard let proj = enemyProjectileById[id] else { return }
                node.position = self.toScenePoint(x: proj.x, y: proj.y)
            }
        )

        // 衝撃波: 通常は前方 144° 扇形。必殺技 (`isSpecial`) は 360° 円形・強シェイク。
        syncNodes(
            nodeMap: &shockwaveNodes,
            ids: runtime.shockwaves.map { $0.id },
            create: { [effectsNode, weak self] id in
                let waveMeta = shockwaveById[id]
                let isSpecial = waveMeta?.isSpecial ?? false
                let sparkCount = isSpecial ? 10 : 5

                let container = SKNode()
                container.zPosition = 130

                let fan = SKShapeNode()
                fan.strokeColor = .clear
                fan.name = "fan"
                fan.zPosition = 0
                container.addChild(fan)

                let arc = SKShapeNode()
                arc.fillColor = .clear
                arc.lineWidth = isSpecial ? 7 : 8
                arc.lineCap = .round
                arc.name = "arc"
                arc.zPosition = 1
                container.addChild(arc)

                let impact = SKLabelNode(text: "💥")
                impact.fontSize = isSpecial ? 28 : 36
                impact.verticalAlignmentMode = .center
                impact.horizontalAlignmentMode = .center
                impact.name = "impact"
                impact.zPosition = 3
                container.addChild(impact)

                for i in 0..<sparkCount {
                    if isSpecial {
                        let spark = SKLabelNode(text: "✨")
                        spark.fontSize = 14
                        spark.verticalAlignmentMode = .center
                        spark.horizontalAlignmentMode = .center
                        spark.name = "spark_\(i)"
                        spark.zPosition = 2
                        container.addChild(spark)
                    } else {
                        let spark = SKShapeNode(circleOfRadius: 3)
                        spark.strokeColor = .white.withAlphaComponent(0.8)
                        spark.fillColor = .white
                        spark.lineWidth = 1
                        spark.name = "spark_\(i)"
                        spark.zPosition = 2
                        container.addChild(spark)
                    }
                }

                effectsNode.addChild(container)

                if isSpecial {
                    let suppressShake = waveMeta?.suppressCameraShake ?? false
                    if !suppressShake {
                        self?.triggerCameraShake(
                            intensity: SurvivalConstants.specialCameraShakeIntensity,
                            duration: SurvivalConstants.specialCameraShakeDuration
                        )
                    }
                } else {
                    self?.triggerCameraShake()
                }

                return container
            },
            update: { id, node in
                guard let wave = shockwaveById[id] else { return }
                node.position = self.toScenePoint(x: wave.x, y: wave.y)

                let rawProgress = CGFloat((now - wave.createdAt) / wave.lifetime)
                let progress = min(max(rawProgress, 0), 1)
                let expandProgress = min(1, progress / 0.15)
                let currentRadius = max(1, wave.maxRadius * expandProgress)

                let gameVec = wave.direction.vector
                let baseAngle = atan2(-gameVec.dy, gameVec.dx)
                let isSpecial = wave.isSpecial
                let arcSpread = isSpecial ? CGFloat.pi * 2 : CGFloat.pi * 0.8
                let color = isSpecial
                    ? UIColor(red: 0.976, green: 0.827, blue: 0.196, alpha: 1)
                    : Self.shockwaveFillColor(level: wave.colorLevel)

                let arcStart = isSpecial ? baseAngle - .pi / 2 : baseAngle - arcSpread / 2
                let arcEnd = isSpecial ? baseAngle + .pi * 3 / 2 : baseAngle + arcSpread / 2

                if let arc = node.childNode(withName: "arc") as? SKShapeNode {
                    let path = CGMutablePath()
                    path.addArc(
                        center: .zero,
                        radius: currentRadius,
                        startAngle: arcStart,
                        endAngle: arcEnd,
                        clockwise: false
                    )
                    arc.path = path
                    arc.strokeColor = color
                    let lw = isSpecial ? max(2, 7 * (1 - progress * 0.85)) : max(1, 10 * (1 - progress))
                    arc.lineWidth = lw
                    arc.alpha = max(0, 1 - progress) * (isSpecial ? 0.65 : 0.95)
                }

                if let fan = node.childNode(withName: "fan") as? SKShapeNode {
                    if isSpecial {
                        fan.path = nil
                        fan.alpha = 0
                    } else {
                        let path = CGMutablePath()
                        path.move(to: .zero)
                        path.addArc(
                            center: .zero,
                            radius: currentRadius,
                            startAngle: arcStart,
                            endAngle: arcEnd,
                            clockwise: false
                        )
                        path.closeSubpath()
                        fan.path = path
                        fan.fillColor = color.withAlphaComponent(0.32)
                        fan.alpha = max(0, 1 - progress * 1.05) * 0.85
                    }
                }

                if let impact = node.childNode(withName: "impact") as? SKLabelNode {
                    let impactProgress = min(1, progress / 0.25)
                    let scale = 0.6 + impactProgress * (isSpecial ? 1.0 : 1.3)
                    impact.setScale(scale)
                    impact.alpha = max(0, 1 - impactProgress)
                    let forward: CGFloat = isSpecial ? 0 : 14
                    impact.position = CGPoint(
                        x: cos(baseAngle) * forward,
                        y: sin(baseAngle) * forward
                    )
                }

                let sparkCount = isSpecial ? 10 : 5
                let nowMs = now * 1000.0
                for i in 0..<sparkCount {
                    let fade = max(0, 1 - progress * 1.3)
                    if isSpecial {
                        guard let spark = node.childNode(withName: "spark_\(i)") as? SKLabelNode else { continue }
                        let sparkAngle = (CGFloat(i) / CGFloat(sparkCount)) * 2 * .pi + CGFloat(nowMs / 1000.0) * 8
                        let fly = currentRadius * (0.88 + 0.08 * sin(CGFloat(nowMs / 60.0) + CGFloat(i)))
                        spark.position = CGPoint(
                            x: cos(sparkAngle) * fly,
                            y: sin(sparkAngle) * fly
                        )
                        spark.alpha = fade
                    } else {
                        guard let spark = node.childNode(withName: "spark_\(i)") as? SKShapeNode else { continue }
                        let angleOffset = (CGFloat(i) - 2) * (arcSpread * 0.33)
                        let sparkAngle = baseAngle + angleOffset
                        let fly = currentRadius * (0.82 + CGFloat(i % 3) * 0.08 + progress * 0.35)
                        spark.position = CGPoint(
                            x: cos(sparkAngle) * fly,
                            y: sin(sparkAngle) * fly
                        )
                        spark.fillColor = color
                        spark.alpha = fade * 0.95
                        spark.setScale(max(0.35, 1 - progress * 0.7))
                    }
                }
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
                guard let fx = magicEffectById[id], let label = node as? SKLabelNode else { return }
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
                guard let item = droppedItemById[id], let label = node as? SKLabelNode else { return }
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
                guard let coin = coinById[id] else { return }
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
                guard let ft = floatingTextById[id], let label = node as? SKLabelNode else { return }
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

        if let boss = bossBattle {
            renderBoss(state: boss, runtime: runtime)
        } else {
            removeBossNodesIfAny()
        }
    }

    // MARK: - ボス描画

    /// ボス戦が終了した (`bossBattle == nil`) タイミングで残留ノードを破棄。
    private func removeBossNodesIfAny() {
        bossNode?.removeFromParent()
        bossNode = nil
        bossHpBarNode?.removeFromParent()
        bossHpBarNode = nil
        bossHpBarLastRatio = -1
        bossWindupLastBucket = -1
        bossWindupNode?.removeFromParent()
        bossWindupNode = nil
        for (_, node) in bossProjectileNodes { node.removeFromParent() }
        bossProjectileNodes.removeAll()
        bossProjectileBucketById.removeAll()
        bossProjectileTextureCache.removeAll()
        bossProjectileTextureUpdatedAt.removeAll()
        for (_, node) in minionNodes { node.removeFromParent() }
        minionNodes.removeAll()
        for (_, node) in hazardNodes { node.removeFromParent() }
        hazardLastProgress.removeAll()
        hazardNodes.removeAll()
        // 次のボス戦で再度演出を発火させるためリセット。
        hasTriggeredBossDefeatFx = false
    }

    private func renderBoss(state: SurvivalBossBattleState, runtime: SurvivalStageRuntime) {
        let nowMs = CACurrentMediaTime() * 1000.0

        // O(n^2) 検索を避ける辞書化 (renderState と同じ狙い)。
        // capacity 予約付きの `Self.indexed` を使ってアロケーションを削減する。
        let minionById = Self.indexed(state.minions, key: \.id)
        let hazardById = Self.indexed(state.hazards, key: \.id)
        let bossProjectileById = Self.indexed(state.projectiles, key: \.id)

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

        // MARK: 撃破演出 (defeatedAt が立っている間の専用レンダ)
        //   - ボススプライトを alpha / scale でフェードアウト & 縮小
        //   - HP バー / windup は非表示 (途中でスキル挙動は止まっているのでロジック側も発動しない)
        //   - 1 度だけカメラシェイク + 💥 爆散エフェクトを発火
        if let defeatedAt = state.defeatedAt {
            let elapsed = max(0, CACurrentMediaTime() - defeatedAt)
            let progress = min(1, elapsed / SurvivalBossEngine.defeatAnimationSec)
            bossNode?.alpha = max(0, 1 - progress)
            bossNode?.setScale(max(0.05, 1 - progress * 0.6))
            bossHpBarNode?.removeFromParent()
            bossHpBarNode = nil
            bossHpBarLastRatio = -1
            bossWindupLastBucket = -1
            bossWindupNode?.removeFromParent()
            bossWindupNode = nil
            if !hasTriggeredBossDefeatFx {
                hasTriggeredBossDefeatFx = true
                triggerCameraShake(intensity: 18, duration: 0.45)
                spawnBossDefeatBurst(at: bossPos)
            }
            return
        }

        bossNode?.alpha = 0.6 + hpRatio * 0.4

        // MARK: ボス頭上 HP バー
        if bossHpBarNode == nil {
            let n = SKSpriteNode()
            n.zPosition = 125
            entitiesNode.addChild(n)
            bossHpBarNode = n
        }
        if let barNode = bossHpBarNode {
            // HP が変化したときだけ UIImage/SKTexture を作り直す (毎フレーム再生成は CPU 負担大)。
            // 1/64 以上の差があれば再描画（細かい変化による CG 負荷をさらに抑える）。
            if abs(hpRatio - bossHpBarLastRatio) > 1.0 / 64.0 {
                let img = SurvivalBossEffectRenderer.renderBossHpBar(ratio: hpRatio)
                let tex = SKTexture(image: img)
                tex.filteringMode = .linear
                barNode.texture = tex
                barNode.size = img.size
                bossHpBarLastRatio = hpRatio
            }
            // ボススプライト上端の少し上に配置 (位置のみは毎フレーム追随)
            let bossTop = bossPos.y + SurvivalConstants.bossHitboxRadius * 1.5
            barNode.position = CGPoint(x: bossPos.x, y: bossTop + 16)
        }

        // MARK: ボス予備動作 警告 (⚠️ + ゲージ)
        if case .windup(_, let startAt, let durationMs) = state.boss.action {
            let progress = min(1, max(0, (CACurrentMediaTime() - startAt) / (durationMs / 1000.0)))
            let bucket = min(20, Int(floor(progress * 20.0)))
            if bossWindupNode == nil {
                let n = SKSpriteNode()
                n.zPosition = 135
                entitiesNode.addChild(n)
                bossWindupNode = n
                bossWindupLastBucket = -1
            }
            if let n = bossWindupNode {
                let bossTop = bossPos.y + SurvivalConstants.bossHitboxRadius * 1.5
                n.position = CGPoint(x: bossPos.x, y: bossTop + 48)
                if bucket != bossWindupLastBucket || n.texture == nil {
                    let img = SurvivalBossEffectRenderer.renderBossWindupWarning(progress: progress, nowMs: nowMs)
                    n.texture = SKTexture(image: img)
                    n.size = img.size
                    bossWindupLastBucket = bucket
                }
            }
        } else {
            bossWindupLastBucket = -1
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
                guard let minion = minionById[id] else { return }
                node.position = self.toScenePoint(x: minion.x, y: minion.y)
                // プレイヤー距離から導火線点滅を推定 (トリガー距離の 1.6 倍以内で点滅開始)
                let dx = runtime.player.x
                let dy = runtime.player.y
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
        //   - 持続ハザード (acidPool = 2.5s, bloodPool = 3s) が複数同時に出ると、
        //     毎フレーム CoreGraphics → UIImage → SKTexture の再生成で CPU が跳ねる。
        //   - progress が 2% 以上変化したときだけテクスチャを差し替える差分更新を導入。
        syncNodes(
            nodeMap: &hazardNodes,
            ids: state.hazards.map { $0.id },
            create: { [telegraphsNode] _ in
                let sprite = SKSpriteNode()
                sprite.zPosition = 90
                telegraphsNode.addChild(sprite)
                return sprite
            },
            update: { [weak self] id, sprite in
                guard let self = self else { return }
                guard let hazard = hazardById[id] else { return }
                // 位置は毎フレーム追随 (安い操作)。
                sprite.position = self.toScenePoint(x: hazard.x, y: hazard.y)
                // progress (= 0〜1) を算出し、前回との差が十分あるときだけテクスチャ再生成。
                let duration = max(0.001, hazard.endAt - hazard.startAt)
                let progress = min(1.0, max(0.0, (nowMs / 1000.0 - hazard.startAt) / duration))
                let last = self.hazardLastProgress[id]
                if let last, abs(progress - last) < 0.02, sprite.texture != nil {
                    return
                }
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
                self.hazardLastProgress[id] = progress
            }
        )
        // 消えたハザードのキャッシュエントリを掃除は毎フレームではなく `sweepCachesIfDue()` でまとめて行う。

        // MARK: ボス弾 (毒弾)
        //   進行方向を 8 バケットに量子化して SKTexture を共有する。
        //   同じ方向の弾は同じ SKTexture を参照するため GPU テクスチャも 1 枚で済む。
        //   バケット毎のテクスチャは ~160ms 周期で「アニメ更新のために」再生成するが、
        //   画面上に 8 方向以上同時に出ないケースが多く、実質 1〜3 枚のリフレッシュに収束する。
        syncNodes(
            nodeMap: &bossProjectileNodes,
            ids: state.projectiles.map { $0.id },
            create: { [effectsNode] _ in
                let sprite = SKSpriteNode()
                sprite.zPosition = 80
                effectsNode.addChild(sprite)
                return sprite
            },
            update: { [weak self] id, node in
                guard let self = self else { return }
                guard let proj = bossProjectileById[id],
                      let sprite = node as? SKSpriteNode else { return }
                sprite.position = self.toScenePoint(x: proj.x, y: proj.y)
                let bucket = Self.bossProjectileBucket(dx: proj.vx, dy: proj.vy)
                let tex = self.bossProjectileTexture(bucket: bucket, nowMs: nowMs)
                // バケット / 方向が変わったとき、もしくはテクスチャが更新されたときだけ差し替え。
                // SpriteKit は同 SKTexture の再代入を検知してスキップするが、
                // 念のためポインタ比較を入れておく (SKTexture は class なので !== で十分)。
                if sprite.texture !== tex {
                    sprite.texture = tex
                    sprite.size = tex.size()
                    self.bossProjectileBucketById[id] = bucket
                }
            }
        )
        // 消えた弾/ハザードのキャッシュ掃除を 500ms 毎にまとめて実行。
        sweepCachesIfDue(nowMs: nowMs)
    }

    /// 毎フレームの Set 構築 + filter は無駄が多いので、一定間隔おきにまとめて掃除する。
    /// 掃除対象: `hazardLastProgress`, `bossProjectileBucketById`.
    private func sweepCachesIfDue(nowMs: Double) {
        guard nowMs >= nextCacheSweepAtMs else { return }
        nextCacheSweepAtMs = nowMs + 500
        if hazardLastProgress.count > hazardNodes.count {
            let liveIds = Set(hazardNodes.keys)
            hazardLastProgress = hazardLastProgress.filter { liveIds.contains($0.key) }
        }
        if bossProjectileBucketById.count > bossProjectileNodes.count {
            let liveIds = Set(bossProjectileNodes.keys)
            bossProjectileBucketById = bossProjectileBucketById.filter { liveIds.contains($0.key) }
        }
    }

    // MARK: - ボス弾テクスチャ共有

    /// 進行ベクトルを 8 方向バケット (0..<8) に量子化する。
    @inline(__always)
    private static func bossProjectileBucket(dx: CGFloat, dy: CGFloat) -> Int {
        let angle = atan2(Double(dy), Double(dx))
        let normalized = (angle / (2 * .pi)) + 0.5
        let bucket = Int(floor(normalized * 8)) % 8
        return bucket < 0 ? bucket + 8 : bucket
    }

    /// バケット毎の共有テクスチャ。`refreshIntervalMs` ごとに再生成する。
    private func bossProjectileTexture(bucket: Int, nowMs: Double) -> SKTexture {
        let refreshIntervalMs: Double = 160
        if let cached = bossProjectileTextureCache[bucket],
           let updatedAt = bossProjectileTextureUpdatedAt[bucket],
           nowMs - updatedAt < refreshIntervalMs {
            return cached
        }
        let bucketAngle = (Double(bucket) / 8.0) * 2 * .pi - .pi
        let bdx = CGFloat(cos(bucketAngle))
        let bdy = CGFloat(sin(bucketAngle))
        let img = SurvivalBossEffectRenderer.renderAcidProjectile(
            radius: 14,
            dx: bdx,
            dy: bdy,
            nowMs: nowMs,
            idHash: bucket
        )
        let tex = SKTexture(image: img)
        tex.filteringMode = .linear
        bossProjectileTextureCache[bucket] = tex
        bossProjectileTextureUpdatedAt[bucket] = nowMs
        return tex
    }

    // MARK: - Indexing helper

    /// `Dictionary(uniqueKeysWithValues:)` 相当だが、中間配列を作らず
    /// capacity 予約した辞書へ直接挿入するため、毎フレーム 8+ 回呼ばれても
    /// アロケーションコストを抑えられる。
    /// - Note: `Value.id` が重複した場合は **後勝ち** になる (ランタイム側が
    ///   UUID を生成しているので通常は重複しない)。
    @inline(__always)
    private static func indexed<Value, Key: Hashable>(
        _ values: [Value],
        key keyPath: KeyPath<Value, Key>
    ) -> [Key: Value] {
        var dict: [Key: Value] = [:]
        dict.reserveCapacity(values.count)
        for value in values {
            dict[value[keyPath: keyPath]] = value
        }
        return dict
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
        return container
    }

    private static func updateEnemyNode(node: SKNode, enemy: SurvivalEnemy) {
        if let label = node.childNode(withName: "emoji") as? SKLabelNode {
            label.text = enemy.type.emoji
        }
    }

    /// Web 版 `B_HIT_COLORS` (SurvivalGameScreen.tsx) と揃えた衝撃波色。
    /// 多段ヒット回数 (0 始まり) ごとに色相が変わる。
    private static func shockwaveFillColor(level: Int) -> UIColor {
        switch level {
        case 0: return UIColor(red: 0.976, green: 0.451, blue: 0.086, alpha: 1) // #f97316 orange
        case 1: return UIColor(red: 0.937, green: 0.267, blue: 0.267, alpha: 1) // #ef4444 red
        case 2: return UIColor(red: 0.925, green: 0.282, blue: 0.600, alpha: 1) // #ec4899 magenta
        case 3: return UIColor(red: 0.659, green: 0.333, blue: 0.969, alpha: 1) // #a855f7 purple
        case 4: return UIColor(red: 0.231, green: 0.510, blue: 0.965, alpha: 1) // #3b82f6 blue
        case 5: return UIColor(red: 0.024, green: 0.714, blue: 0.831, alpha: 1) // #06b6d4 cyan
        case 6: return UIColor(red: 0.133, green: 0.773, blue: 0.369, alpha: 1) // #22c55e green
        default: return UIColor(red: 0.918, green: 0.702, blue: 0.031, alpha: 1) // #eab308 gold
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
        // Assets.xcassets/SurvivalMap/Contents.json は provides-namespace: false のため
        // SurvivalMap は asset namespace を提供するため、フォルダ名を含めて参照する。
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

    private func layoutQuoteBubble(
        on host: SKNode,
        anchorOffsetY: CGFloat,
        text: String,
        laidOutText: inout String,
        bubbleRoot: inout SKNode?,
        maxOuterWidth: CGFloat
    ) {
        if text.isEmpty {
            bubbleRoot?.removeFromParent()
            bubbleRoot = nil
            laidOutText = ""
            return
        }
        if text == laidOutText, bubbleRoot?.parent === host {
            return
        }
        laidOutText = text
        bubbleRoot?.removeFromParent()
        bubbleRoot = nil
        guard let root = SurvivalSpeechBubbleBuilder.makeRoot(
            text: text,
            maxOuterWidth: maxOuterWidth
        ) else { return }
        root.position = CGPoint(x: 0, y: anchorOffsetY)
        host.addChild(root)
        bubbleRoot = root
    }

    /// プレイヤー向き反転 (`sprite.xScale`) の影響を受けないよう、反転しないアンカーに載せる。
    private func layoutPlayerQuoteBubble(spriteHeight: CGFloat) {
        guard let anchor = playerBubbleAnchorNode, let player = playerNode else { return }
        anchor.position = player.position
        layoutQuoteBubble(
            on: anchor,
            anchorOffsetY: spriteHeight / 2 + 14,
            text: playerQuoteText,
            laidOutText: &playerQuoteTextLaidOut,
            bubbleRoot: &playerQuoteBubbleRoot,
            maxOuterWidth: SurvivalSpeechBubbleLayout.faiMaxBubbleWidth
        )
    }

    private func layoutJajiiQuoteBubble(on anchor: SKNode?) {
        guard let host = anchor else { return }
        layoutQuoteBubble(
            on: host,
            anchorOffsetY: 48 / 2 + 14,
            text: jajiiQuoteText,
            laidOutText: &jajiiQuoteTextLaidOut,
            bubbleRoot: &jajiiQuoteBubbleRoot,
            maxOuterWidth: SurvivalSpeechBubbleLayout.jajiiMaxBubbleWidth
        )
    }
}

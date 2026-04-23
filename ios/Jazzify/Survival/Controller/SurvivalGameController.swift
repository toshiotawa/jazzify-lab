import Foundation
import Combine
import CoreGraphics
import QuartzCore

/// サバイバル ゲーム画面のメイン状態ハブ。SwiftUI + SpriteKit の間で参照される。
/// - 通常ステージ / ボス戦 の両モード対応
/// - MIDI 入力 と 画面タップ の両方からノート ON/OFF を受け付ける
/// - Supabase への書込みは終了時に 1 回だけ呼ぶ
/// - `SurvivalCharacterProfile` + `SurvivalStageConfig` を注入して WEB 版と一致する挙動へ
@MainActor
final class SurvivalGameController: ObservableObject {
    // MARK: - 公開状態 (SwiftUI 反映用)

    @Published private(set) var runtime: SurvivalStageRuntime
    @Published private(set) var bossBattle: SurvivalBossBattleState?
    @Published private(set) var isBossStage: Bool
    @Published private(set) var cameraTargetX: CGFloat = SurvivalMap.width / 2
    @Published private(set) var cameraTargetY: CGFloat = SurvivalMap.height / 2
    @Published private(set) var isPaused: Bool = false
    @Published private(set) var clearReportInFlight: Bool = false
    @Published private(set) var clearReportError: String?

    /// アナログ入力 (仮想スティック) x,y は [-1, 1] 正規化
    var analogInput: CGVector = .zero

    // MARK: - 設定

    private let stage: SurvivalStageDefinition
    private let hintMode: Bool
    private let characterId: String
    private let profile: SurvivalCharacterProfile
    private let config: SurvivalStageConfig
    private let onExit: (_ isCleared: Bool) -> Void
    /// ログイン前デモ中は Supabase への書込みを完全にスキップするために true になる。
    private let isDemo: Bool
    private let supabase = SupabaseService.shared

    // MARK: - 内部

    private var activePressedPitchClasses: Set<Int> = []
    private var lastNow: TimeInterval = CACurrentMediaTime()
    private var bgmPhaseEven: Bool = false
    private var hpRegenAccumulator: Double = 0
    private var fireDotAccumulator: Double = 0
    /// WEB 版は接触 DOT を小数 HP として減算。整数 HP との整合のため端数を蓄積する。
    private var contactDamageAccumulator: Double = 0

    // MARK: - Init

    init(
        stage: SurvivalStageDefinition,
        hintMode: Bool,
        characterId: String,
        profile: SurvivalCharacterProfile = .defaultFai,
        config: SurvivalStageConfig = .default,
        onExit: @escaping (_ isCleared: Bool) -> Void,
        isDemo: Bool = false
    ) {
        self.stage = stage
        self.hintMode = hintMode
        self.characterId = characterId
        self.profile = profile
        self.config = config
        self.onExit = onExit
        self.isDemo = isDemo
        let isBoss = SurvivalBossEngine.isBlockLastStage(stageNumber: stage.stageNumber)
        self.isBossStage = isBoss

        let slots = SurvivalGameEngine.createStageInitialSlots(
            allowedChords: stage.allowedChords,
            isBossStage: isBoss
        )
        let player = SurvivalGameEngine.createStageInitialPlayer(
            profile: profile,
            hintMode: hintMode,
            isBossStage: isBoss
        )

        self.runtime = SurvivalStageRuntime(
            stage: stage,
            hintMode: hintMode,
            player: player,
            slots: slots
        )

        if isBoss {
            let bossType = SurvivalBossEngine.bossType(for: stage.blockKey)
            self.bossBattle = SurvivalBossEngine.createBossBattleState(
                bossType: bossType,
                now: CACurrentMediaTime()
            )
        }
    }

    // MARK: - ライフサイクル

    func start() {
        let audio = SurvivalGameAudio.shared
        audio.setBgmUrls(odd: config.bgmOddWaveUrl, even: config.bgmEvenWaveUrl)
        audio.start()
        lastNow = CACurrentMediaTime()
    }

    func stopAudio() {
        SurvivalGameAudio.shared.stop()
    }

    func requestExit() {
        stopAudio()
        onExit(runtime.phase == .cleared)
    }

    // MARK: - 入力

    /// ピアノ鍵盤タップ or MIDI Note On
    func handleNoteOn(_ note: Int) {
        let pc = ((note % 12) + 12) % 12
        activePressedPitchClasses.insert(pc)
        evaluateSlots(for: note)
    }

    func handleNoteOff(_ note: Int) {
        let pc = ((note % 12) + 12) % 12
        activePressedPitchClasses.remove(pc)
    }

    private func evaluateSlots(for note: Int) {
        let pc = ((note % 12) + 12) % 12
        for idx in runtime.slots.indices {
            guard runtime.slots[idx].isEnabled else { continue }
            if !runtime.slots[idx].inputPitchClasses.contains(pc) {
                runtime.slots[idx].inputPitchClasses.append(pc)
            }
            guard let target = runtime.slots[idx].chord else { continue }
            if SurvivalChordResolver.isMatch(
                inputPitchClasses: runtime.slots[idx].inputPitchClasses,
                target: target
            ) {
                triggerSlot(atIndex: idx, chord: target)
            }
        }
        // 鍵盤タップのフィードバック音（軽め）
        SurvivalGameAudio.shared.playNote(note, velocity: 70, duration: 0.18)
    }

    private func triggerSlot(atIndex slotIndex: Int, chord: SurvivalResolvedChord) {
        let now = CACurrentMediaTime()
        let effectiveStats = SurvivalStatusEffectEngine.effectiveStats(
            base: runtime.player.stats,
            effects: runtime.statusEffects
        )

        switch SurvivalSlotIndex(rawValue: slotIndex) {
        case .A?:
            let projectiles = SurvivalGameEngine.createAProjectiles(
                from: runtime.player,
                effectiveAAtk: effectiveStats.aAtk
            )
            runtime.projectiles.append(contentsOf: projectiles)
        case .B?:
            let initialWave = SurvivalGameEngine.createShockwave(
                from: runtime.player,
                effectiveBAtk: effectiveStats.bAtk,
                now: now,
                colorLevel: 0
            )
            runtime.shockwaves.append(initialWave)
            // 多段ヒット: Web 版と同様に 200ms 間隔で追加衝撃波をスケジュール
            let multiHitLevel = max(0, runtime.player.skills.multiHitLevel)
            if multiHitLevel > 0 {
                let baseDamage = SurvivalGameEngine.calculateBMeleeDamage(bAtk: effectiveStats.bAtk)
                for hit in 1...multiHitLevel {
                    runtime.pendingShockwaves.append(
                        SurvivalPendingShockwave(
                            fireAt: now + SurvivalConstants.meleeMultiHitIntervalSec * Double(hit),
                            damage: baseDamage,
                            colorLevel: min(3, hit)
                        )
                    )
                }
            }
        case .C?, .D?:
            if !profile.noMagic {
                let kind: SurvivalMagicKind = slotIndex == SurvivalSlotIndex.C.rawValue
                    ? .thunder : .buffer
                let outcome = SurvivalMagicEngine.castMagic(
                    kind: kind,
                    player: runtime.player,
                    enemies: runtime.enemies,
                    cAtk: effectiveStats.cAtk,
                    now: now
                )
                applyMagicOutcome(outcome, now: now)
            }
        default:
            break
        }

        // WEB 版準拠: 正解時はルート音 (C2 = 36 起点) を鳴らす
        let rootMidi = 36 + chord.rootPitchClass
        SurvivalGameAudio.shared.playNote(rootMidi, velocity: 100, duration: 0.45)

        // 現在コードは次コード (プリロード済) に入れ替え、新しい次コードを抽選する (WEB 版 `nextSlots` 準拠)
        let upcomingChord = runtime.slots[slotIndex].nextChord ?? chord
        let newNextChord = SurvivalChordResolver.resolve(
            id: stage.allowedChords.randomElement() ?? chord.id
        ) ?? upcomingChord
        runtime.slots[slotIndex].chord = upcomingChord
        runtime.slots[slotIndex].nextChord = newNextChord
        runtime.slots[slotIndex].timer = SurvivalConstants.slotTimeoutSec
        runtime.slots[slotIndex].inputPitchClasses = []
    }

    private func applyMagicOutcome(_ outcome: SurvivalMagicEngine.MagicOutcome, now: TimeInterval) {
        if !outcome.enemyDamage.isEmpty {
            applyDamageToEnemies(hits: outcome.enemyDamage, now: now)
        }
        if outcome.playerHealAmount > 0 {
            let healed = min(runtime.player.maxHp, runtime.player.hp + outcome.playerHealAmount)
            runtime.player.hp = healed
            runtime.floatingTexts.append(
                SurvivalFloatingText(
                    text: "+\(outcome.playerHealAmount)",
                    x: runtime.player.x,
                    y: runtime.player.y - SurvivalConstants.playerSize,
                    createdAt: now,
                    color: .heal
                )
            )
        }
        if !outcome.playerStatusEffects.isEmpty {
            runtime.statusEffects = SurvivalStatusEffectEngine.merge(
                existing: runtime.statusEffects,
                with: outcome.playerStatusEffects
            )
        }
        if let effect = outcome.visualEffect {
            runtime.magicEffects.append(effect)
        }
    }

    // MARK: - 毎フレーム更新 (SKScene から呼ばれる)

    func tick(currentTime: TimeInterval) {
        let dt = max(0, min(0.05, currentTime - lastNow))
        lastNow = currentTime
        guard !isPaused else { return }
        guard runtime.phase == .playing else { return }

        if isBossStage {
            tickBoss(deltaTime: dt, now: currentTime)
        } else {
            tickNormal(deltaTime: dt, now: currentTime)
        }
        cameraTargetX = runtime.player.x
        cameraTargetY = runtime.player.y
    }

    // MARK: - 通常ステージ 1 フレーム

    private func tickNormal(deltaTime: TimeInterval, now: TimeInterval) {
        runtime.statusEffects = SurvivalStatusEffectEngine.prune(effects: runtime.statusEffects, now: now)
        let effectiveStats = SurvivalStatusEffectEngine.effectiveStats(
            base: runtime.player.stats,
            effects: runtime.statusEffects
        )
        let speedMul = SurvivalStatusEffectEngine.effectiveSpeedMultiplier(effects: runtime.statusEffects)
        let iceMulForEnemies: CGFloat = SurvivalStatusEffectEngine.contains(runtime.statusEffects, kind: .ice) ? 0.7 : 1.0

        runtime.player = SurvivalGameEngine.updatePlayerPosition(
            player: runtime.player,
            analog: analogInput,
            deltaTime: deltaTime,
            now: now,
            speedMultiplier: speedMul
        )

        tickSlotsTimer(deltaTime: deltaTime)

        // 敵スポーン
        runtime.spawnAccumulator += deltaTime
        let cfg = SurvivalGameEngine.stageSpawnConfig(elapsed: runtime.elapsedSeconds, config: config)
        while runtime.spawnAccumulator >= cfg.rate {
            runtime.spawnAccumulator -= cfg.rate
            for _ in 0..<cfg.count {
                let enemy = SurvivalGameEngine.spawnStageEnemy(
                    playerX: runtime.player.x,
                    playerY: runtime.player.y,
                    elapsed: runtime.elapsedSeconds,
                    isFirstSpawn: !runtime.hasSpawnedAny,
                    config: config
                )
                runtime.enemies.append(enemy)
                runtime.hasSpawnedAny = true
            }
        }

        runtime.enemies = SurvivalGameEngine.updateEnemies(
            enemies: runtime.enemies,
            playerX: runtime.player.x,
            playerY: runtime.player.y,
            deltaTime: deltaTime,
            iceMultiplier: iceMulForEnemies
        )

        // 敵弾の発射 + 更新
        let newEnemyProjectiles = SurvivalGameEngine.shootEnemyProjectiles(
            enemies: &runtime.enemies,
            playerX: runtime.player.x,
            playerY: runtime.player.y,
            now: now
        )
        runtime.enemyProjectiles.append(contentsOf: newEnemyProjectiles)
        runtime.enemyProjectiles = SurvivalGameEngine.updateEnemyProjectiles(
            projectiles: runtime.enemyProjectiles,
            deltaTime: deltaTime,
            now: now
        )

        runtime.projectiles = SurvivalGameEngine.updateProjectiles(
            projectiles: runtime.projectiles,
            deltaTime: deltaTime
        )
        runtime.shockwaves = SurvivalGameEngine.updateShockwaves(shockwaves: runtime.shockwaves, now: now)

        // 多段ヒット: 予約済みの衝撃波を発火時刻になったら生成
        flushPendingShockwaves(effectiveBAtk: effectiveStats.bAtk, now: now)

        // プレイヤー弾 × 敵
        let offensiveMul = SurvivalGameEngine.offensiveMultiplier(player: runtime.player)
        let projHits = SurvivalGameEngine.resolveProjectileHits(
            projectiles: &runtime.projectiles,
            enemies: runtime.enemies,
            haisuiMultiplier: offensiveMul
        )
        applyDamageToEnemies(hits: projHits.map { ($0.enemyId, $0.damage) }, now: now)

        let removedProjectileIds = Set(projHits.filter { $0.shouldRemoveProjectile }.map { $0.projectileId })
        if !removedProjectileIds.isEmpty {
            runtime.projectiles.removeAll { removedProjectileIds.contains($0.id) }
        }

        // 衝撃波 × 敵 (Web 版と同じく 1 発 1 敵 1 回 / isInFront 判定付き)
        let waveHits = SurvivalGameEngine.resolveShockwaveHits(
            shockwaves: &runtime.shockwaves,
            enemies: runtime.enemies,
            player: runtime.player,
            knockbackBonusLevel: runtime.player.skills.bKnockbackBonusLevel,
            haisuiMultiplier: offensiveMul
        )
        applyDamageToEnemies(hits: waveHits.map { ($0.enemyId, $0.damage) }, now: now)
        applyKnockbackToEnemies(hits: waveHits)

        // bDeflect で敵弾消去
        SurvivalGameEngine.resolveEnemyProjectileDeflect(
            shockwaves: runtime.shockwaves,
            enemyProjectiles: &runtime.enemyProjectiles,
            bDeflect: runtime.player.skills.bDeflect
        )

        // プレイヤー接触ダメ (WEB 版準拠: 無敵時間 / ノックバック無し / DOT 型)
        contactDamageAccumulator += SurvivalGameEngine.enemyContactDamageDOT(
            runtime.player,
            enemies: runtime.enemies,
            defenderDef: effectiveStats.def,
            deltaTime: deltaTime
        )
        while contactDamageAccumulator >= 1 {
            let dmg = Int(contactDamageAccumulator)
            contactDamageAccumulator -= Double(dmg)
            runtime.player.hp = max(0, runtime.player.hp - dmg)
        }

        // 敵弾 × プレイヤー (WEB 版準拠: 無敵時間 / ノックバック無し)
        var _ephemeralPlayer = runtime.player
        var _ephemeralEnemyProjectiles = runtime.enemyProjectiles
        let enemyProjDmg = SurvivalGameEngine.resolveEnemyProjectileHits(
            player: &_ephemeralPlayer,
            projectiles: &_ephemeralEnemyProjectiles,
            defenderDef: effectiveStats.def,
            now: now
        )
        runtime.player = _ephemeralPlayer
        runtime.enemyProjectiles = _ephemeralEnemyProjectiles
        if enemyProjDmg > 0 {
            runtime.floatingTexts.append(
                SurvivalFloatingText(
                    text: "-\(enemyProjDmg)",
                    x: runtime.player.x,
                    y: runtime.player.y - SurvivalConstants.playerSize,
                    createdAt: now,
                    color: .warn
                )
            )
        }

        // HP 回復 (hpRegenPerSecond)
        if profile.hpRegenPerSecond > 0, runtime.player.hp > 0 {
            hpRegenAccumulator += deltaTime * profile.hpRegenPerSecond
            if hpRegenAccumulator >= 1 {
                let heal = Int(hpRegenAccumulator)
                hpRegenAccumulator -= Double(heal)
                runtime.player.hp = min(runtime.player.maxHp, runtime.player.hp + heal)
            }
        }

        // fire DOT (WEB 版 status effect)
        let fireDot = SurvivalStatusEffectEngine.fireDotPerSecond(
            effects: runtime.statusEffects,
            maxHp: runtime.player.maxHp
        )
        if fireDot > 0 {
            fireDotAccumulator += deltaTime * Double(fireDot)
            if fireDotAccumulator >= 1 {
                let dmg = Int(fireDotAccumulator)
                fireDotAccumulator -= Double(dmg)
                runtime.player.hp = max(0, runtime.player.hp - dmg)
            }
        }

        // アイテム / コイン ピックアップ
        let (remainingItems, remainingCoins) = SurvivalItemEngine.pruneExpired(
            items: runtime.droppedItems,
            coins: runtime.coins,
            now: now
        )
        runtime.droppedItems = remainingItems
        runtime.coins = remainingCoins

        let pickup = SurvivalItemEngine.applyPickups(
            player: runtime.player,
            items: runtime.droppedItems,
            coins: runtime.coins,
            autoCollectExp: profile.autoCollectExp,
            now: now
        )
        if !pickup.pickedItemIds.isEmpty || !pickup.pickedCoinIds.isEmpty {
            runtime.droppedItems.removeAll { pickup.pickedItemIds.contains($0.id) }
            runtime.coins.removeAll { pickup.pickedCoinIds.contains($0.id) }
            if pickup.healAmount > 0 {
                let healed = min(runtime.player.maxHp, runtime.player.hp + pickup.healAmount)
                runtime.player.hp = healed
                runtime.floatingTexts.append(
                    SurvivalFloatingText(
                        text: "+\(pickup.healAmount)",
                        x: runtime.player.x,
                        y: runtime.player.y - SurvivalConstants.playerSize,
                        createdAt: now,
                        color: .heal
                    )
                )
            }
            if !pickup.newStatusEffects.isEmpty {
                runtime.statusEffects = SurvivalStatusEffectEngine.merge(
                    existing: runtime.statusEffects,
                    with: pickup.newStatusEffects
                )
            }
            // EXP 獲得は行わない (iOS ステージモードでは経験値システム自体を非有効化)
            if !pickup.pickedItemIds.isEmpty {
                SurvivalGameAudio.shared.playEffect(.itemPickup)
            }
        }

        // HP 0 判定
        if runtime.player.hp <= 0 {
            runtime.phase = .gameOver
            SurvivalGameAudio.shared.playEffect(.stageGameOver)
            finalizeStage(cleared: false)
            return
        }

        // 経過時間 + BGM 切替
        runtime.elapsedSeconds += deltaTime
        runtime.remainingSeconds = max(0, SurvivalConstants.stageTimeLimitSec - runtime.elapsedSeconds)
        if !bgmPhaseEven && runtime.remainingSeconds <= SurvivalConstants.bgmPhaseSwitchThresholdSec {
            bgmPhaseEven = true
            SurvivalGameAudio.shared.switchWavePhase(useEven: true)
        }

        // クリア判定
        if runtime.enemiesDefeated >= SurvivalConstants.stageEnemyQuota {
            runtime.phase = .cleared
            SurvivalGameAudio.shared.playEffect(.stageClear)
            finalizeStage(cleared: true)
            return
        }
        if runtime.remainingSeconds <= 0 {
            // 時間切れはクリアとせずゲームオーバー (撃破ノルマ未達)
            runtime.phase = .gameOver
            SurvivalGameAudio.shared.playEffect(.stageGameOver)
            finalizeStage(cleared: false)
            return
        }

        // 魔法視覚効果 / フローティング テキストの寿命
        runtime.magicEffects.removeAll { now - $0.createdAt > $0.lifetime }
        runtime.floatingTexts.removeAll { now - $0.createdAt > $0.lifetime }
    }

    private func applyDamageToEnemies(hits: [(UUID, Int)], now: TimeInterval) {
        guard !hits.isEmpty else { return }
        var damageMap: [UUID: Int] = [:]
        for (id, dmg) in hits {
            damageMap[id, default: 0] += dmg
        }
        var updated: [SurvivalEnemy] = []
        updated.reserveCapacity(runtime.enemies.count)
        var defeatedEnemies: [SurvivalEnemy] = []
        for enemy in runtime.enemies {
            var modified = enemy
            if let dmg = damageMap[enemy.id] {
                modified.stats.hp = max(0, modified.stats.hp - dmg)
                runtime.floatingTexts.append(
                    SurvivalFloatingText(
                        text: "\(dmg)",
                        x: modified.x,
                        y: modified.y - SurvivalConstants.enemySize,
                        createdAt: now,
                        color: .damage
                    )
                )
            }
            if modified.stats.hp > 0 {
                updated.append(modified)
            } else {
                defeatedEnemies.append(modified)
                runtime.enemiesDefeated += 1
            }
        }
        runtime.enemies = updated

        // ドロップ処理
        // iOS ステージモード (デモ含む) では EXP 獲得を行わないため、コイン (EXP) は生成しない。
        for enemy in defeatedEnemies {
            let drop = SurvivalItemEngine.rollDrop(
                enemy: enemy,
                itemDropRate: config.itemDropRate,
                expMultiplier: config.expMultiplier,
                now: now
            )
            if let item = drop.item { runtime.droppedItems.append(item) }
        }
    }

    /// `triggerSlot(.B)` で積まれた多段ヒット用の予約衝撃波を、発火時刻を過ぎたぶん生成する。
    /// Web 版と同じく各ウェーブは「発火時点のプレイヤー座標 / 向き」でダメージを計算する。
    private func flushPendingShockwaves(effectiveBAtk: Int, now: TimeInterval) {
        guard !runtime.pendingShockwaves.isEmpty else { return }
        var remaining: [SurvivalPendingShockwave] = []
        remaining.reserveCapacity(runtime.pendingShockwaves.count)
        for pending in runtime.pendingShockwaves {
            if now >= pending.fireAt {
                let wave = SurvivalGameEngine.createShockwave(
                    from: runtime.player,
                    effectiveBAtk: effectiveBAtk,
                    now: now,
                    colorLevel: pending.colorLevel
                )
                runtime.shockwaves.append(wave)
            } else {
                remaining.append(pending)
            }
        }
        runtime.pendingShockwaves = remaining
    }

    private func applyKnockbackToEnemies(hits: [SurvivalGameEngine.ShockwaveHit]) {
        guard !hits.isEmpty else { return }
        let kbByEnemy = Dictionary(grouping: hits, by: { $0.enemyId })
        runtime.enemies = runtime.enemies.map { enemy in
            var updated = enemy
            if let events = kbByEnemy[enemy.id], let latest = events.last {
                updated.knockbackVx = latest.knockbackVx
                updated.knockbackVy = latest.knockbackVy
            }
            return updated
        }
    }

    private func tickSlotsTimer(deltaTime: TimeInterval) {
        for idx in runtime.slots.indices where runtime.slots[idx].isEnabled {
            runtime.slots[idx].timer -= deltaTime
            if runtime.slots[idx].timer <= 0 {
                let upcoming = runtime.slots[idx].nextChord
                    ?? SurvivalChordResolver.resolve(id: stage.allowedChords.randomElement() ?? "")
                let newNext = SurvivalChordResolver.resolve(
                    id: stage.allowedChords.randomElement() ?? ""
                )
                runtime.slots[idx].chord = upcoming ?? runtime.slots[idx].chord
                runtime.slots[idx].nextChord = newNext ?? upcoming
                runtime.slots[idx].timer = SurvivalConstants.slotTimeoutSec
                runtime.slots[idx].inputPitchClasses = []
            }
        }
    }

    // MARK: - ボスステージ 1 フレーム

    private func tickBoss(deltaTime: TimeInterval, now: TimeInterval) {
        runtime.statusEffects = SurvivalStatusEffectEngine.prune(effects: runtime.statusEffects, now: now)
        let effectiveStats = SurvivalStatusEffectEngine.effectiveStats(
            base: runtime.player.stats,
            effects: runtime.statusEffects
        )
        let speedMul = SurvivalStatusEffectEngine.effectiveSpeedMultiplier(effects: runtime.statusEffects)

        runtime.player = SurvivalGameEngine.updatePlayerPosition(
            player: runtime.player,
            analog: analogInput,
            deltaTime: deltaTime,
            now: now,
            speedMultiplier: speedMul
        )

        tickSlotsTimer(deltaTime: deltaTime)

        runtime.projectiles = SurvivalGameEngine.updateProjectiles(
            projectiles: runtime.projectiles,
            deltaTime: deltaTime
        )
        runtime.shockwaves = SurvivalGameEngine.updateShockwaves(shockwaves: runtime.shockwaves, now: now)

        // 多段ヒット: 予約済みの衝撃波を発火時刻になったら生成 (ボス戦でも同仕様)
        flushPendingShockwaves(effectiveBAtk: effectiveStats.bAtk, now: now)

        guard var boss = bossBattle else { return }
        _ = SurvivalBossEngine.tick(
            state: &boss,
            player: &runtime.player,
            deltaTime: deltaTime,
            now: now
        )

        // プレイヤー弾 × ボス / ミニオン
        // - 貫通弾 (`aPenetration`) は 1 発で複数エンティティを同時に貫ける一方、
        //   同一エンティティに対しては 1 回しかダメージを与えない (WEB 版 `applyPlayerProjectileToBoss`
        //   の `alreadyHitIds` 準拠)。そのため弾ごとの `hitEnemyIds` でデデュープする。
        // - 非貫通弾 (貫通 false) は初ヒット時に消滅する。
        var consumedProjectileIds: Set<UUID> = []
        for idx in runtime.projectiles.indices {
            var proj = runtime.projectiles[idx]
            let res = SurvivalBossEngine.applyPlayerAttack(
                state: &boss,
                damage: proj.damage,
                atPoint: CGPoint(x: proj.x, y: proj.y),
                radius: SurvivalConstants.projectileSize / 2,
                alreadyHitIds: proj.hitEnemyIds
            )
            if res.bossHitDamage > 0, let p = res.bossHitPoint {
                runtime.floatingTexts.append(
                    SurvivalFloatingText(
                        text: "\(res.bossHitDamage)",
                        x: p.x,
                        y: p.y - SurvivalConstants.bossHitboxRadius,
                        createdAt: now,
                        color: .damage
                    )
                )
                proj.hitEnemyIds.insert(boss.boss.id)
                if !proj.penetrating {
                    consumedProjectileIds.insert(proj.id)
                }
            }
            for m in res.minionHits {
                runtime.floatingTexts.append(
                    SurvivalFloatingText(
                        text: "\(m.damage)",
                        x: m.point.x,
                        y: m.point.y - SurvivalConstants.bossMinionRadius,
                        createdAt: now,
                        color: .damage
                    )
                )
                proj.hitEnemyIds.insert(m.id)
                if !proj.penetrating {
                    consumedProjectileIds.insert(proj.id)
                }
            }
            runtime.projectiles[idx] = proj
        }
        if !consumedProjectileIds.isEmpty {
            runtime.projectiles.removeAll { consumedProjectileIds.contains($0.id) }
        }
        // 衝撃波 × ボス / ミニオン
        // WEB 版は `applyPlayerMeleeToBossBattle` を衝撃波生成時に 1 度だけ呼んでダメージを確定させる。
        // iOS では視覚表示のためライフタイム中 shockwaves 配列に残す必要があるが、ダメージは 1 回きり。
        // `wave.hitEnemyIds` で「この衝撃波で既にヒット済み」なボス/ミニオンをスキップし、多段ヒットを防ぐ。
        for idx in runtime.shockwaves.indices {
            var wave = runtime.shockwaves[idx]
            let res = SurvivalBossEngine.applyPlayerAttack(
                state: &boss,
                damage: Int(Double(wave.damage) * 0.6),
                atPoint: CGPoint(x: wave.x, y: wave.y),
                radius: wave.maxRadius,
                alreadyHitIds: wave.hitEnemyIds
            )
            if res.bossHitDamage > 0, let p = res.bossHitPoint {
                runtime.floatingTexts.append(
                    SurvivalFloatingText(
                        text: "\(res.bossHitDamage)",
                        x: p.x,
                        y: p.y - SurvivalConstants.bossHitboxRadius,
                        createdAt: now,
                        color: .damage
                    )
                )
                wave.hitEnemyIds.insert(boss.boss.id)
            }
            for m in res.minionHits {
                runtime.floatingTexts.append(
                    SurvivalFloatingText(
                        text: "\(m.damage)",
                        x: m.point.x,
                        y: m.point.y - SurvivalConstants.bossMinionRadius,
                        createdAt: now,
                        color: .damage
                    )
                )
                wave.hitEnemyIds.insert(m.id)
            }
            runtime.shockwaves[idx] = wave
        }

        bossBattle = boss

        switch boss.result {
        case .win:
            runtime.phase = .cleared
            SurvivalGameAudio.shared.playEffect(.stageClear)
            finalizeStage(cleared: true)
        case .lose:
            runtime.phase = .gameOver
            SurvivalGameAudio.shared.playEffect(.stageGameOver)
            finalizeStage(cleared: false)
        case .ongoing:
            break
        }

        runtime.elapsedSeconds += deltaTime
        runtime.remainingSeconds = max(0, 999 - runtime.elapsedSeconds)
        runtime.magicEffects.removeAll { now - $0.createdAt > $0.lifetime }
        runtime.floatingTexts.removeAll { now - $0.createdAt > $0.lifetime }

        _ = effectiveStats // 現時点ではボス戦で基礎スタッツを直接使わない
    }

    // MARK: - クリア処理 (Supabase 書込み)

    private func finalizeStage(cleared: Bool) {
        // HINT モード / デモ (未ログイン) 中はクリア記録を Supabase に送らない。
        guard cleared, !hintMode, !isDemo else { return }
        guard !clearReportInFlight else { return }
        clearReportInFlight = true
        let stageNumber = stage.stageNumber
        let elapsed = runtime.elapsedSeconds
        let defeated = runtime.enemiesDefeated
        let character = characterId
        Task { [weak self] in
            guard let self else { return }
            do {
                let userId = try await self.supabase.currentUserId()
                try await self.supabase.upsertSurvivalStageClear(
                    userId: userId,
                    stageNumber: stageNumber,
                    survivalTimeSeconds: Int(elapsed.rounded()),
                    finalLevel: 1,
                    enemiesDefeated: defeated,
                    characterId: character,
                    totalStages: SurvivalStageCatalog.totalStages
                )
                await MainActor.run { self.clearReportInFlight = false }
            } catch {
                await MainActor.run {
                    self.clearReportError = error.localizedDescription
                    self.clearReportInFlight = false
                }
            }
        }
    }

    // MARK: - 一時停止

    func togglePause() {
        isPaused.toggle()
    }
}

import Foundation
import CoreGraphics
import QuartzCore

/// 毎フレームのシミュレーション本体。SwiftUI / `ObservableObject` を持たない。
@MainActor
final class SurvivalGameLoop {
    private(set) var runtime: SurvivalStageRuntime
    private(set) var bossBattle: SurvivalBossBattleState?
    private(set) var mode: SurvivalMode
    private(set) var currentHintSlotIndex: Int?

    /// `SurvivalViewModel` / HUD 互換。
    var isBossStage: Bool { mode.isBossStage }

    private var lastFrameAnalog: CGVector = .zero
    private var smoothedAnalogInput: CGVector = .zero

    // MARK: - 設定

    private let stage: SurvivalStageDefinition
    private let profile: SurvivalCharacterProfile
    private let config: SurvivalStageConfig

    var stageConfig: SurvivalStageConfig { config }

    // MARK: - Progression（コード進行）ステージ用

    /// Progression ステージで使用するコード配列（DB の `chord_progression` から構築）。Random ステージでは空。
    private var progressionChords: [SurvivalResolvedChord] = []
    /// 現在出題中の Progression 配列インデックス。完成のたびに +1 され、配列長で循環。
    private var progressionIndex: Int = 0

    /// DB の `chord_progression` から `SurvivalResolvedChord` 配列を構築する。
    /// - `pitchClasses` が空のエントリは `SurvivalChordResolver.isMatch` が常に false を返すため
    ///   B スロットの入力が永久に通らず「動けない」状態を引き起こす。空エントリはフィルタする。
    /// - フィルタ後に空になった (= データ不正) 場合は `allowedChords` からの解決へフォールバックし、
    ///   最低限ゲームが進行できる状態を保つ。
    /// `SurvivalMode.resolve` と初期化で共通のコード進行配列構築。
    /// `SurvivalMode` は非隔離のため `nonisolated`（ステージ定義のみ参照する純関数）。
    nonisolated static func buildProgressionChords(for stage: SurvivalStageDefinition) -> [SurvivalResolvedChord] {
        guard stage.stageType == .progression, let entries = stage.chordProgression else { return [] }
        let resolved = entries.enumerated().map { index, entry in
            SurvivalResolvedChord.fromProgressionEntry(entry, index: index)
        }
        let valid = resolved.filter { !$0.pitchClasses.isEmpty }
        if !valid.isEmpty { return valid }
        return stage.allowedChords.compactMap { SurvivalChordResolver.resolve(id: $0) }
    }

    /// ヒント鍵盤ハイライトの初期対象スロット（有効な A/B のうち最も若い index）。
    /// Progression は B のみ有効のため `0` 固定だとハイライトが永遠に空になる。
    private static func initialHintSlotIndex(slots: [SurvivalCodeSlot], hintMode: Bool) -> Int? {
        guard hintMode else { return nil }
        if slots.indices.contains(0), slots[0].isEnabled { return 0 }
        if slots.indices.contains(1), slots[1].isEnabled { return 1 }
        return nil
    }

    // MARK: - 内部

    private var activePressedPitchClasses: Set<Int> = []
    private var lastNow: TimeInterval = CACurrentMediaTime()
    /// 最初の SKScene.update で `lastNow` とボス戦 `startedAt` を SKScene の currentTime に
    /// 揃え直すためのフラグ。CACurrentMediaTime() と SKScene currentTime は通常ほぼ同一だが、
    /// init → presentScene → 初回 update の間に UIKit アニメーションが走ると
    /// 数百 ms のズレが生じ得るため、ここで強制的に整合させてボス戦 openingGrace の
    /// 誤作動 (= 開幕即ダメージ or 永遠に開幕しない) を防ぐ。
    private var hasSyncedSceneClock: Bool = false
    private var hpRegenAccumulator: Double = 0
    private var fireDotAccumulator: Double = 0
    /// WEB 版は接触 DOT を小数 HP として減算。整数 HP との整合のため端数を蓄積する。
    private var contactDamageAccumulator: Double = 0

    convenience init(
        stage: SurvivalStageDefinition,
        hintMode: Bool,
        profile: SurvivalCharacterProfile = .defaultFai,
        config: SurvivalStageConfig = .default
    ) {
        let mode = SurvivalMode.resolve(stage: stage, hintMode: hintMode)
        self.init(mode: mode, stage: stage, profile: profile, config: config)
    }

    init(
        mode: SurvivalMode,
        stage: SurvivalStageDefinition,
        profile: SurvivalCharacterProfile = .defaultFai,
        config: SurvivalStageConfig = .default
    ) {
        self.mode = mode
        self.stage = stage
        self.profile = profile
        self.config = config

        let isBoss = mode.isBossStage

        let slots: [SurvivalCodeSlot]
        switch mode.stageKind {
        case let .progression(chords):
            self.progressionChords = chords
            self.progressionIndex = 0
            slots = SurvivalGameEngine.createProgressionInitialSlots(progressionChords: chords)
        case let .random(allowedChords):
            self.progressionChords = []
            self.progressionIndex = 0
            slots = SurvivalGameEngine.createStageInitialSlots(
                allowedChords: allowedChords,
                isBossStage: isBoss
            )
        }
        let player = SurvivalGameEngine.createStageInitialPlayer(
            profile: profile,
            hintMode: mode.hintMode,
            isBossStage: isBoss
        )

        self.runtime = SurvivalStageRuntime(
            stage: stage,
            hintMode: mode.hintMode,
            player: player,
            slots: slots
        )

        self.currentHintSlotIndex = Self.initialHintSlotIndex(slots: slots, hintMode: mode.hintMode)

        let bossNow = CACurrentMediaTime()
        let initialBoss: SurvivalBossBattleState?
        if isBoss {
            let bossType = SurvivalBossEngine.bossType(for: stage.blockKey, in: stage.mapCategory)
            initialBoss = SurvivalBossEngine.createBossBattleState(
                bossType: bossType,
                now: bossNow
            )
        } else {
            initialBoss = nil
        }
        self.bossBattle = initialBoss
    }

    func markAudioClockStarted() {
        lastNow = CACurrentMediaTime()
    }

    func resetForSameStage() {
        smoothedAnalogInput = .zero
        lastFrameAnalog = .zero
        activePressedPitchClasses.removeAll()

        mode = SurvivalMode.resolve(stage: stage, hintMode: mode.hintMode)
        let isBoss = mode.isBossStage

        let slots: [SurvivalCodeSlot]
        switch mode.stageKind {
        case let .progression(chords):
            progressionChords = chords
            progressionIndex = 0
            slots = SurvivalGameEngine.createProgressionInitialSlots(progressionChords: chords)
        case let .random(allowedChords):
            progressionChords = []
            progressionIndex = 0
            slots = SurvivalGameEngine.createStageInitialSlots(
                allowedChords: allowedChords,
                isBossStage: isBoss
            )
        }
        let player = SurvivalGameEngine.createStageInitialPlayer(
            profile: profile,
            hintMode: mode.hintMode,
            isBossStage: isBoss
        )
        runtime = SurvivalStageRuntime(
            stage: stage,
            hintMode: mode.hintMode,
            player: player,
            slots: slots
        )
        setHintSlotIndexIfChanged(Self.initialHintSlotIndex(slots: slots, hintMode: mode.hintMode))

        if isBoss {
            let bossType = SurvivalBossEngine.bossType(for: stage.blockKey, in: stage.mapCategory)
            bossBattle = SurvivalBossEngine.createBossBattleState(
                bossType: bossType,
                now: CACurrentMediaTime()
            )
        } else {
            bossBattle = nil
        }

        lastNow = CACurrentMediaTime()
        hasSyncedSceneClock = false
        hpRegenAccumulator = 0
        fireDotAccumulator = 0
        contactDamageAccumulator = 0
    }

    /// 仮想スティックの生入力をスムージングする。
    /// - デッドゾーン正規化は `SurvivalJoystickHostView` 側で済ませているため、ここでは
    ///   数値ノイズ除去用の極小閾値のみとし、二重デッドゾーンによるモタつきを避ける。
    private func filteredAnalogForMovement(deltaTime: TimeInterval) -> CGVector {
        let raw = lastFrameAnalog
        let noiseFloor: CGFloat = 0.004
        let smoothSpeed: CGFloat = 14.0
        let len = hypot(raw.dx, raw.dy)
        var target = CGVector.zero
        if len > noiseFloor {
            let ndx = raw.dx / len
            let ndy = raw.dy / len
            let strength = min(CGFloat(1), (len - noiseFloor) / (CGFloat(1) - noiseFloor))
            target = CGVector(dx: ndx * strength, dy: ndy * strength)
        }
        let t = min(CGFloat(1), smoothSpeed * CGFloat(deltaTime))
        smoothedAnalogInput.dx += (target.dx - smoothedAnalogInput.dx) * t
        smoothedAnalogInput.dy += (target.dy - smoothedAnalogInput.dy) * t
        if abs(smoothedAnalogInput.dx) < 0.01 { smoothedAnalogInput.dx = 0 }
        if abs(smoothedAnalogInput.dy) < 0.01 { smoothedAnalogInput.dy = 0 }
        return smoothedAnalogInput
    }

    // MARK: - ヒント

    private func currentHintTargetSlot() -> (index: Int, chord: SurvivalResolvedChord)? {
        guard runtime.hintMode,
              let idx = currentHintSlotIndex,
              runtime.slots.indices.contains(idx),
              runtime.slots[idx].isEnabled,
              let chord = runtime.slots[idx].chord else {
            return nil
        }
        return (idx, chord)
    }

    /// Web 版 HINT と同様に単一オクターブへ展開したハイライト MIDI。
    private static func hintHighlightMidis(from chord: SurvivalResolvedChord) -> Set<Int> {
        let baseOctave = 4
        var seen = Set<Int>()
        var uniquePitchClasses: [Int] = []
        for pc in chord.pitchClasses {
            let norm = ((pc % 12) + 12) % 12
            if seen.insert(norm).inserted {
                uniquePitchClasses.append(norm)
            }
        }
        var result = Set<Int>()
        var lastMidi = 0
        for pc in uniquePitchClasses {
            var midi = pc + baseOctave * 12
            while midi <= lastMidi { midi += 12 }
            result.insert(midi)
            lastMidi = midi
        }
        return result
    }

    /// 現在のヒント対象スロットのコード構成音を、Web 版と同じアルゴリズムで
    /// C4 (MIDI 60) 起点の昇順の MIDI 番号に展開したもの。
    /// 全オクターブではなく単一オクターブ内（1 つの pitch class あたり 1 鍵）のみをハイライトするため、
    /// 鍵盤ビューは MIDI 完全一致で判定する。
    /// 参考: Web 版 `SurvivalGameScreen.tsx` の HINT ハイライト (`baseOctave = 4`)。
    func currentHintHighlightMidis() -> Set<Int> {
        guard let target = currentHintTargetSlot() else { return [] }
        return Self.hintHighlightMidis(from: target.chord)
    }

    /// 構成音として対象スロットに入力済み（pitch class が一致）のハイライト MIDI。
    /// オクターブ違いの演奏でも、この集合は「元々のヒント MIDI」側に載せる。
    func currentHintCompletedHighlightMidis() -> Set<Int> {
        guard let target = currentHintTargetSlot() else { return [] }
        let highlights = Self.hintHighlightMidis(from: target.chord)
        let inputPCs = Set(
            runtime.slots[target.index].inputPitchClasses.map { (($0 % 12) + 12) % 12 }
        )
        var completed = Set<Int>()
        for midi in highlights {
            let pc = ((midi % 12) + 12) % 12
            if inputPCs.contains(pc) {
                completed.insert(midi)
            }
        }
        return completed
    }

    /// 値が変わったときだけ更新する（Progression+HINT で同一スロット固定時の無駄な再計算を避ける）。
    private func setHintSlotIndexIfChanged(_ newValue: Int?) {
        guard currentHintSlotIndex != newValue else { return }
        currentHintSlotIndex = newValue
    }

    /// ヒント対象を「A/B のうち有効かつ反対側」へ切り替える。
    /// Progression（B のみ有効）では反対側が無効のため、トリガした側に固定する（Web 版のフォールバック相当）。
    private func advanceHintSlotIndex(triggeredIndex: Int) {
        guard runtime.hintMode else { return }
        guard triggeredIndex == 0 || triggeredIndex == 1 else { return }
        let preferred = triggeredIndex == 0 ? 1 : 0
        if runtime.slots.indices.contains(preferred), runtime.slots[preferred].isEnabled {
            setHintSlotIndexIfChanged(preferred)
            return
        }
        if runtime.slots.indices.contains(triggeredIndex), runtime.slots[triggeredIndex].isEnabled {
            setHintSlotIndexIfChanged(triggeredIndex)
        }
    }

    // MARK: - 入力（フレーム単位）

    private func applyFrameInput(_ frameInput: SurvivalFrameInput) -> [SurvivalFrameEvent] {
        var events: [SurvivalFrameEvent] = []
        lastFrameAnalog = frameInput.analog
        for midi in frameInput.noteOffs {
            let pc = ((midi % 12) + 12) % 12
            activePressedPitchClasses.remove(pc)
        }
        for on in frameInput.noteOns {
            let pc = ((on.midi % 12) + 12) % 12
            activePressedPitchClasses.insert(pc)
            events.append(contentsOf: evaluateSlots(for: on.midi))
        }
        return events
    }

    private func evaluateSlots(for note: Int) -> [SurvivalFrameEvent] {
        var events: [SurvivalFrameEvent] = []
        let pc = ((note % 12) + 12) % 12
        for idx in runtime.slots.indices {
            guard runtime.slots[idx].isEnabled else { continue }
            if !runtime.slots[idx].inputPitchClasses.contains(pc) {
                runtime.slots[idx].inputPitchClasses.append(pc)
            }
        }

        var completedIndices: [Int] = []
        for idx in runtime.slots.indices {
            guard runtime.slots[idx].isEnabled else { continue }
            guard let target = runtime.slots[idx].chord else { continue }
            if SurvivalChordResolver.isMatch(
                inputPitchClasses: runtime.slots[idx].inputPitchClasses,
                target: target
            ) {
                completedIndices.append(idx)
            }
        }

        guard !completedIndices.isEmpty else { return events }

        for idx in completedIndices {
            guard let target = runtime.slots[idx].chord else { continue }
            events.append(contentsOf: triggerSlot(atIndex: idx, chord: target))
        }

        let completedSet = Set(completedIndices)
        for idx in runtime.slots.indices {
            guard runtime.slots[idx].isEnabled else { continue }
            if completedSet.contains(idx) { continue }
            runtime.slots[idx].inputPitchClasses.removeAll()
        }

        return events
    }

    private func triggerSlot(atIndex slotIndex: Int, chord: SurvivalResolvedChord) -> [SurvivalFrameEvent] {
        var events: [SurvivalFrameEvent] = []
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

        let rootMidi = 36 + chord.rootPitchClass
        events.append(.playSynthBassRoot(midi: rootMidi))

        let upcomingChord: SurvivalResolvedChord
        let newNextChord: SurvivalResolvedChord
        if mode.isProgressionStage {
            if !progressionChords.isEmpty {
                progressionIndex = (progressionIndex + 1) % progressionChords.count
                let curIdx = progressionIndex
                let nextIdx = (progressionIndex + 1) % progressionChords.count
                upcomingChord = progressionChords[curIdx]
                newNextChord = progressionChords[nextIdx]
            } else {
                upcomingChord = chord
                newNextChord = chord
            }
        } else {
            upcomingChord = runtime.slots[slotIndex].nextChord ?? chord
            newNextChord = SurvivalChordResolver.resolve(
                id: stage.allowedChords.randomElement() ?? chord.id
            ) ?? upcomingChord
        }
        var slotUpdate = runtime.slots[slotIndex]
        slotUpdate.chord = upcomingChord
        slotUpdate.nextChord = newNextChord
        slotUpdate.timer = SurvivalConstants.slotTimeoutSec
        slotUpdate.inputPitchClasses = []
        slotUpdate.triggerPulse &+= 1

        let showChordFloat = slotIndex == SurvivalSlotIndex.A.rawValue
            || slotIndex == SurvivalSlotIndex.B.rawValue
        if showChordFloat {
            runtime.floatingTexts.append(
                SurvivalFloatingText(
                    text: chord.displayName,
                    x: runtime.player.x,
                    y: runtime.player.y - SurvivalConstants.playerSize - 12,
                    createdAt: now,
                    lifetime: 1.0,
                    color: .chord
                )
            )
        }
        runtime.slots[slotIndex] = slotUpdate

        advanceHintSlotIndex(triggeredIndex: slotIndex)
        return events
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

    func tick(currentTime: TimeInterval, frameInput: SurvivalFrameInput, isPaused: Bool) -> [SurvivalFrameEvent] {
        var events: [SurvivalFrameEvent] = []
        events.append(contentsOf: applyFrameInput(frameInput))

        if !hasSyncedSceneClock {
            hasSyncedSceneClock = true
            lastNow = currentTime
            if var boss = bossBattle {
                boss.startedAt = currentTime
                bossBattle = boss
            }
            guard !isPaused else { return events }
            guard runtime.phase == .playing else { return events }
            switch mode.encounter {
            case .boss:
                tickBoss(deltaTime: 0, now: currentTime, events: &events)
            case .regular:
                tickNormal(deltaTime: 0, now: currentTime, events: &events)
            }
            return events
        }

        let dt = max(0, min(0.05, currentTime - lastNow))
        lastNow = currentTime
        guard !isPaused else { return events }
        guard runtime.phase == .playing else { return events }

        switch mode.encounter {
        case .boss:
            tickBoss(deltaTime: dt, now: currentTime, events: &events)
        case .regular:
            tickNormal(deltaTime: dt, now: currentTime, events: &events)
        }
        return events
    }


    // MARK: - 通常ステージ 1 フレーム

    private func tickNormal(deltaTime: TimeInterval, now: TimeInterval, events: inout [SurvivalFrameEvent]) {
        runtime.statusEffects = SurvivalStatusEffectEngine.prune(effects: runtime.statusEffects, now: now)
        let effectiveStats = SurvivalStatusEffectEngine.effectiveStats(
            base: runtime.player.stats,
            effects: runtime.statusEffects
        )
        let speedMul = SurvivalStatusEffectEngine.effectiveSpeedMultiplier(effects: runtime.statusEffects)
        let iceMulForEnemies: CGFloat = SurvivalStatusEffectEngine.contains(runtime.statusEffects, kind: .ice) ? 0.7 : 1.0

        runtime.player = SurvivalGameEngine.updatePlayerPosition(
            player: runtime.player,
            analog: filteredAnalogForMovement(deltaTime: deltaTime),
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
        let contactContribution = SurvivalGameEngine.enemyContactDamageDOT(
            runtime.player,
            enemies: runtime.enemies,
            defenderDef: effectiveStats.def,
            deltaTime: deltaTime
        )
        contactDamageAccumulator += contactContribution
        if contactContribution > 0 {
            runtime.player.damageFlashUntil = now + SurvivalConstants.playerDamageFlashSec
        }
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
                events.append(.playEffect(.itemPickup))
            }
        }

        // HP 0 判定
        if runtime.player.hp <= 0 {
            runtime.phase = .gameOver
            events.append(.playEffect(.stageGameOver))
            events.append(.stageEnded(cleared: false))
            return
        }

        // 経過時間
        runtime.elapsedSeconds += deltaTime
        runtime.remainingSeconds = max(0, SurvivalConstants.stageTimeLimitSec - runtime.elapsedSeconds)

        // クリア判定 (Web 版 `SurvivalGameScreen` と同じく 90 秒経過時にのみ判定)
        // - 撃破数が 150 に達してもゲームは止めず、残り時間まで継続させる。
        // - これにより HUD / リザルトの撃破数分子が 150 で打ち止めにならず、
        //   151 匹以上倒した場合は実際の撃破数がそのまま表示される。
        if runtime.remainingSeconds <= 0 {
            let cleared = runtime.enemiesDefeated >= SurvivalConstants.stageEnemyQuota
            runtime.phase = cleared ? .cleared : .gameOver
            events.append(.playEffect(cleared ? .stageClear : .stageGameOver))
            events.append(.stageEnded(cleared: cleared))
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
                runtime.enemiesDefeated += 1
            }
        }
        runtime.enemies = updated

        // 通常敵からのアイテム / コイン ドロップは廃止。
        // プレイヤーが拾えるドロップはボス戦のミニオンからのハートのみとする。
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
        // コードの時間切れ自動切替えは撤廃。
        // プレイヤーがコードを完成させてスキル発動するまでスロットを保持する。
        // (`triggerSlot` 内で `timer` を再セットする記述は残っているが、
        //  このメソッドがデクリメントしないため事実上未使用となる。)
        _ = deltaTime
    }

    // MARK: - ボスステージ 1 フレーム

    private func tickBoss(deltaTime: TimeInterval, now: TimeInterval, events: inout [SurvivalFrameEvent]) {
        runtime.statusEffects = SurvivalStatusEffectEngine.prune(effects: runtime.statusEffects, now: now)
        let effectiveStats = SurvivalStatusEffectEngine.effectiveStats(
            base: runtime.player.stats,
            effects: runtime.statusEffects
        )
        let speedMul = SurvivalStatusEffectEngine.effectiveSpeedMultiplier(effects: runtime.statusEffects)

        runtime.player = SurvivalGameEngine.updatePlayerPosition(
            player: runtime.player,
            analog: filteredAnalogForMovement(deltaTime: deltaTime),
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
            // プレイヤー弾で撃破したミニオンからハートをドロップ。
            for killed in res.killedMinions {
                runtime.droppedItems.append(
                    SurvivalItemEngine.makeHeartDrop(at: killed.point, now: now)
                )
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
            let dirVec = wave.direction.vector
            let originX = wave.x - dirVec.dx * SurvivalConstants.meleeAttackForwardOffset
            let originY = wave.y - dirVec.dy * SurvivalConstants.meleeAttackForwardOffset
            let meleeForwardFilter = SurvivalBossEngine.ForwardFilter(
                origin: CGPoint(x: originX, y: originY),
                direction: dirVec
            )
            let res = SurvivalBossEngine.applyPlayerAttack(
                state: &boss,
                damage: Int(Double(wave.damage) * 0.6),
                atPoint: CGPoint(x: wave.x, y: wave.y),
                radius: wave.maxRadius,
                alreadyHitIds: wave.hitEnemyIds,
                forwardFilter: meleeForwardFilter
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
            // 衝撃波で撃破したミニオンからもハートをドロップ。
            for killed in res.killedMinions {
                runtime.droppedItems.append(
                    SurvivalItemEngine.makeHeartDrop(at: killed.point, now: now)
                )
            }
            runtime.shockwaves[idx] = wave
        }

        // C ボス自己回復スキルの "+N" テキストを floatingTexts に変換。
        // heal 発動時に積まれたイベントを drain し、緑色で表示する。
        if !boss.pendingBossHealEvents.isEmpty {
            for ev in boss.pendingBossHealEvents {
                runtime.floatingTexts.append(
                    SurvivalFloatingText(
                        text: "+\(ev.amount)",
                        x: ev.x,
                        y: ev.y - SurvivalConstants.bossHitboxRadius,
                        createdAt: now,
                        color: .heal
                    )
                )
            }
            boss.pendingBossHealEvents.removeAll()
        }

        bossBattle = boss

        // ドロップ ハート × プレイヤーの接触ピックアップ + 期限切れ除去
        // (通常ステージでは tickNormal 内で同等の処理を行っているが、ボス戦では
        //  ミニオン ハートを導入するためここでも同じ流れを実行する)
        let (remainingItems, _) = SurvivalItemEngine.pruneExpired(
            items: runtime.droppedItems,
            coins: runtime.coins,
            now: now
        )
        runtime.droppedItems = remainingItems
        let pickup = SurvivalItemEngine.applyPickups(
            player: runtime.player,
            items: runtime.droppedItems,
            coins: [],
            autoCollectExp: profile.autoCollectExp,
            now: now
        )
        if !pickup.pickedItemIds.isEmpty {
            runtime.droppedItems.removeAll { pickup.pickedItemIds.contains($0.id) }
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
            events.append(.playEffect(.itemPickup))
        }

        switch boss.result {
        case .win:
            runtime.phase = .cleared
            events.append(.playEffect(.stageClear))
            events.append(.stageEnded(cleared: true))
        case .lose:
            runtime.phase = .gameOver
            events.append(.playEffect(.stageGameOver))
            events.append(.stageEnded(cleared: false))
        case .ongoing:
            break
        }

        runtime.elapsedSeconds += deltaTime
        runtime.remainingSeconds = max(0, 999 - runtime.elapsedSeconds)
        runtime.magicEffects.removeAll { now - $0.createdAt > $0.lifetime }
        runtime.floatingTexts.removeAll { now - $0.createdAt > $0.lifetime }

        _ = effectiveStats // 現時点ではボス戦で基礎スタッツを直接使わない
    }
}

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

    /// SpriteKit / ゲームロジックが毎フレーム参照。SwiftUI は `uiSnapshot` を購読する。
    private(set) var runtime: SurvivalStageRuntime
    @Published private(set) var uiSnapshot: SurvivalUISnapshot
    @Published private(set) var bossBattle: SurvivalBossBattleState?
    @Published private(set) var isBossStage: Bool
    /// SKScene からのみ参照されるカメラ追従先。SwiftUI のビュー更新に使われないため
    /// `@Published` にはしない。毎フレーム更新される値を `objectWillChange.send()` で
    /// 流すと、HUD / コードスロット / 鍵盤など 60Hz で body 評価が走りメインスレッドが
    /// 飽和してしまい、最悪ボス戦で SKScene.update が間引かれる (= ゲームが進まない) 原因となる。
    private(set) var cameraTargetX: CGFloat = SurvivalMap.width / 2
    private(set) var cameraTargetY: CGFloat = SurvivalMap.height / 2
    @Published private(set) var isPaused: Bool = false
    @Published private(set) var clearReportInFlight: Bool = false
    @Published private(set) var clearReportError: String?
    /// ヒントモード中にピアノ鍵盤をハイライトする対象スロットの index (A=0, B=1)。
    /// Web 版 `SurvivalGameScreen.getHintSlotIndex` と同様 A↔B を交互に切り替える。
    /// `runtime.hintMode` が false の場合は nil。
    @Published private(set) var currentHintSlotIndex: Int? = 0
    /// MIDI 入力で押下中の鍵（SwiftUI 鍵盤ハイライト用）。タッチ押下は各鍵のローカル状態と合成する。
    @Published private(set) var midiHeldKeys: Set<Int> = []

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

    // MARK: - Progression（コード進行）ステージ用

    /// Progression ステージで使用するコード配列（DB の `chord_progression` から構築）。Random ステージでは空。
    private var progressionChords: [SurvivalResolvedChord] = []
    /// 現在出題中の Progression 配列インデックス。完成のたびに +1 され、配列長で循環。
    private var progressionIndex: Int = 0

    /// Progression ステージかどうか（`stage.stageType == .progression`）
    private var isProgressionStage: Bool { stage.stageType == .progression }

    /// DB の `chord_progression` から `SurvivalResolvedChord` 配列を構築する。空の場合は空配列。
    private static func buildProgressionChords(for stage: SurvivalStageDefinition) -> [SurvivalResolvedChord] {
        guard stage.stageType == .progression, let entries = stage.chordProgression else { return [] }
        return entries.enumerated().map { index, entry in
            SurvivalResolvedChord.fromProgressionEntry(entry, index: index)
        }
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
        // Progression（コード進行）ステージはボス戦化しない（B 列のみで完結する仕様のため）
        let isBoss = stage.stageType != .progression
            && SurvivalBossEngine.isBlockLastStage(stageNumber: stage.stageNumber)
        self.isBossStage = isBoss

        let slots: [SurvivalCodeSlot]
        if stage.stageType == .progression {
            // Progression ステージは DB の chord_progression から事前構築済みコード列を使う。
            let chords = Self.buildProgressionChords(for: stage)
            self.progressionChords = chords
            self.progressionIndex = 0
            slots = SurvivalGameEngine.createProgressionInitialSlots(progressionChords: chords)
        } else {
            slots = SurvivalGameEngine.createStageInitialSlots(
                allowedChords: stage.allowedChords,
                isBossStage: isBoss
            )
        }
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

        // ヒントモード時のみ鍵盤ハイライト対象スロットを設定 (最初は A 列)
        self.currentHintSlotIndex = hintMode ? 0 : nil

        if isBoss {
            let bossType = SurvivalBossEngine.bossType(for: stage.blockKey)
            self.bossBattle = SurvivalBossEngine.createBossBattleState(
                bossType: bossType,
                now: CACurrentMediaTime()
            )
        }

        self._uiSnapshot = Published(initialValue: SurvivalUISnapshot.make(from: self.runtime))
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
        midiHeldKeys.removeAll()
    }

    func registerMidiKeyDown(_ midi: Int) {
        midiHeldKeys.insert(midi)
    }

    func registerMidiKeyUp(_ midi: Int) {
        midiHeldKeys.remove(midi)
    }

    func requestExit() {
        stopAudio()
        onExit(runtime.phase == .cleared)
    }

    // MARK: - ヒント

    /// 現在のヒント対象スロットのコード構成音を、Web 版と同じアルゴリズムで
    /// C4 (MIDI 60) 起点の昇順の MIDI 番号に展開したもの。
    /// 全オクターブではなく単一オクターブ内（1 つの pitch class あたり 1 鍵）のみをハイライトするため、
    /// 鍵盤ビューは MIDI 完全一致で判定する。
    /// 参考: Web 版 `SurvivalGameScreen.tsx` の HINT ハイライト (`baseOctave = 4`)。
    var currentHintHighlightMidis: Set<Int> {
        guard runtime.hintMode,
              let idx = currentHintSlotIndex,
              runtime.slots.indices.contains(idx),
              runtime.slots[idx].isEnabled,
              let chord = runtime.slots[idx].chord else {
            return []
        }
        let baseOctave = 4
        // 入力順を維持したまま pitch class をユニーク化
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

    /// ヒント対象を「A/B のうち有効かつ反対側」へ切り替える。
    /// 次の候補も無効/未割当なら現状維持する。
    private func advanceHintSlotIndex(triggeredIndex: Int) {
        guard runtime.hintMode else { return }
        guard triggeredIndex == 0 || triggeredIndex == 1 else { return }
        let next = triggeredIndex == 0 ? 1 : 0
        guard runtime.slots.indices.contains(next), runtime.slots[next].isEnabled else { return }
        currentHintSlotIndex = next
    }

    // MARK: - 入力

    /// ピアノ鍵盤タップ or MIDI Note On。
    /// - Parameters:
    ///   - note: MIDI ノート番号
    ///   - velocity: 0〜127。MIDI 入力からは打鍵強度をそのまま渡す (Web 版 MIDI コントローラー同等)。
    ///     タップ入力の場合はデフォルト 100。
    ///   - playAudio: `true` の場合はこのメソッド内でピアノ発音する (デフォルト)。
    ///     MIDI 入力経路で既に `SurvivalGameAudio.pianoNoteOnRealtime` を呼んで
    ///     低レイテンシ再生している場合は `false` を渡して二重発音を避ける。
    func handleNoteOn(_ note: Int, velocity: Int = 100, playAudio: Bool = true) {
        let pc = ((note % 12) + 12) % 12
        activePressedPitchClasses.insert(pc)
        if playAudio {
            SurvivalGameAudio.shared.pianoNoteOn(midi: note, velocity: velocity)
        }
        evaluateSlots(for: note)
    }

    /// ピアノ鍵盤離し or MIDI Note Off。
    /// `playAudio` を `false` にすると発音停止の処理をスキップする (MIDI 経路で先に
    /// `pianoNoteOffRealtime` を呼んだ場合の二重停止を避ける用途)。
    func handleNoteOff(_ note: Int, playAudio: Bool = true) {
        let pc = ((note % 12) + 12) % 12
        activePressedPitchClasses.remove(pc)
        if playAudio {
            SurvivalGameAudio.shared.pianoNoteOff(midi: note)
        }
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
        // 鍵盤タップのフィードバック音は `handleNoteOn` 側で既に発音済み。
        // ここで追加の `playNote` は呼ばない (重複発音防止)。
        rebuildUISnapshotIfChanged()
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

        // WEB 版準拠: 正解時はシンセのベース ルート音 (C2 起点 / 三角波) を鳴らす。
        // Web 版 `FantasySoundManager._playRootNote` と同じく、ピアノ鍵盤とは
        // 音色を明確に区別するため低音のシンセ音を使用する。
        let rootMidi = 36 + chord.rootPitchClass
        SurvivalGameAudio.shared.playSynthBassRoot(midi: rootMidi)

        // 完成コード名をプレイヤー頭上にフローティング表示 + スロット入れ替えを
        // 1 回の struct mutation にまとめ、`rebuildUISnapshotIfChanged` で SwiftUI 更新を集約する。
        // (Shot / Punch の表示、次コード抽選、進捗リセット、triggerPulse 更新を一括適用)
        let upcomingChord: SurvivalResolvedChord
        let newNextChord: SurvivalResolvedChord
        if isProgressionStage {
            // Progression: B 列だけが進行を進める。A/C/D 列は無効なのでここに来ない。
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

        // ヒント対象スロットを A↔B 交互に切り替える (Web 版と同挙動)
        advanceHintSlotIndex(triggeredIndex: slotIndex)
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
        rebuildUISnapshotIfChanged()
    }

    /// SwiftUI 向けスナップショットを再計算し、前回と異なるときだけ `@Published` を更新する。
    private func rebuildUISnapshotIfChanged() {
        let next = SurvivalUISnapshot.make(from: runtime)
        if next != uiSnapshot {
            uiSnapshot = next
        }
    }

    // MARK: - 毎フレーム更新 (SKScene から呼ばれる)

    func tick(currentTime: TimeInterval) {
        // 初回 tick では `lastNow` (start() 時刻 = CACurrentMediaTime) と SKScene currentTime の
        // 時間軸を揃え直し、ボス戦 openingGrace / スローン関連の時刻計算を SKScene 時計に統一する。
        // これにより init → presentScene → 初回 update の間に遅延が発生しても
        // 「開幕いきなりボスが動く」「openingGrace が永遠に抜けない」などを防げる。
        if !hasSyncedSceneClock {
            hasSyncedSceneClock = true
            lastNow = currentTime
            if var boss = bossBattle {
                boss.startedAt = currentTime
                bossBattle = boss
            }
            // 初回フレームは dt = 0 相当とし、これ以降のフレームから通常進行させる。
            guard !isPaused else {
                rebuildUISnapshotIfChanged()
                return
            }
            guard runtime.phase == .playing else {
                rebuildUISnapshotIfChanged()
                return
            }
            if isBossStage {
                tickBoss(deltaTime: 0, now: currentTime)
            } else {
                tickNormal(deltaTime: 0, now: currentTime)
            }
            cameraTargetX = runtime.player.x
            cameraTargetY = runtime.player.y
            rebuildUISnapshotIfChanged()
            return
        }

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
        rebuildUISnapshotIfChanged()
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

        // クリア判定 (Web 版 `SurvivalGameScreen` と同じく 90 秒経過時にのみ判定)
        // - 撃破数が 150 に達してもゲームは止めず、残り時間まで継続させる。
        // - これにより HUD / リザルトの撃破数分子が 150 で打ち止めにならず、
        //   151 匹以上倒した場合は実際の撃破数がそのまま表示される。
        if runtime.remainingSeconds <= 0 {
            let cleared = runtime.enemiesDefeated >= SurvivalConstants.stageEnemyQuota
            runtime.phase = cleared ? .cleared : .gameOver
            SurvivalGameAudio.shared.playEffect(cleared ? .stageClear : .stageGameOver)
            finalizeStage(cleared: cleared)
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
            SurvivalGameAudio.shared.playEffect(.itemPickup)
        }

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

import CoreGraphics
import Foundation
import QuartzCore

/// 風船ラッシュ専用シミュレーション（敵・HP・A/C/D なし、B 列のみ）。
@MainActor
final class BalloonRushGameLoop {
    let stage: BalloonRushStageDefinition
    let hintMode: Bool

    private(set) var player: SurvivalPlayerState
    private(set) var slots: [SurvivalCodeSlot]
    private(set) var balloons: [BalloonRushBalloon] = []
    private(set) var poppedCount = 0
    private(set) var respawnDue: [TimeInterval] = []
    private(set) var shockwaves: [BalloonRushVisualShockwave] = []
    private(set) var jajii: SurvivalJajiiEngine.State?
    private(set) var phase: BalloonRushPhase = .playing
    private(set) var elapsedSeconds: TimeInterval = 0

    private var knockVx: CGFloat = 0
    private var knockVy: CGFloat = 0
    private var progressionChords: [SurvivalResolvedChord] = []
    private var progressionIndex = 0
    private var activePressedPitchClasses: Set<Int> = []
    private var rngState: UInt64 = 0xDEAD_BEEF_CAFE_BABE

    private let allowedChordIds: [String]
    private let isProgression: Bool

    init(stage: BalloonRushStageDefinition, hintMode: Bool, profile: SurvivalCharacterProfile = .defaultFai) {
        self.stage = stage
        self.hintMode = hintMode
        allowedChordIds = stage.resolvedAllowedChordIds()
        progressionChords = stage.buildProgressionChords()
        isProgression = stage.stageType == .progression && !progressionChords.isEmpty

        player = SurvivalGameEngine.createStageInitialPlayer(
            profile: profile,
            hintMode: hintMode,
            isBossStage: false
        )

        if isProgression {
            slots = SurvivalGameEngine.createProgressionInitialSlots(progressionChords: progressionChords)
        } else {
            let ids = allowedChordIds.isEmpty ? ["Dm7"] : allowedChordIds
            slots = SurvivalGameEngine.createStageInitialSlots(
                allowedChords: ids,
                punchOnlyForRandomHint: true
            )
        }

        resetBalloons()
        jajii = SurvivalJajiiEngine.makeInitial(playerX: player.x, playerY: player.y)
    }

    var currentHintSlotIndex: Int? {
        guard hintMode, slots.indices.contains(1), slots[1].isEnabled else { return nil }
        return 1
    }

    func currentHintHighlightMidis() -> Set<Int> {
        guard let idx = currentHintSlotIndex, let chord = slots[idx].chord else { return [] }
        return Set(chord.midiNotes)
    }

    func currentHintCompletedHighlightMidis() -> Set<Int> {
        guard let idx = currentHintSlotIndex, let chord = slots[idx].chord else { return [] }
        let pcs = SurvivalChordResolver.correctNotes(
            inputPitchClasses: slots[idx].inputPitchClasses,
            target: chord
        )
        return Set(chord.midiNotes.filter { pcs.contains(((($0 % 12) + 12) % 12)) })
    }

    func keyboardHintPendingOpacity() -> CGFloat {
        let survivalPhase: SurvivalStagePhase = {
            switch phase {
            case .playing: return .playing
            case .cleared: return .cleared
            case .failed: return .gameOver
            }
        }()
        return SurvivalStaffHintOpacity.computeKeyboardHintOpacity(
            elapsed: elapsedSeconds,
            hintMode: hintMode,
            hintBuffActive: false,
            beginnerAssistActive: false,
            phase: survivalPhase
        )
    }

    func makeUISnapshot() -> BalloonRushUISnapshot {
        BalloonRushUISnapshot(
            phase: phase,
            hintMode: hintMode,
            timeLeftSec: max(0, stage.timeLimitSec - Int(elapsedSeconds.rounded())),
            remainPop: max(0, stage.popQuota - poppedCount),
            slots: slots,
            hintSlotIndex: currentHintSlotIndex,
            unpressedNoteOpacity: keyboardHintPendingOpacity()
        )
    }

    func makeDrawSnapshot(now: TimeInterval) -> BalloonRushDrawSnapshot {
        let jx = jajii?.worldX
        let jy = jajii?.worldY
        let live = balloons.filter { !$0.popped }.map { b -> (id: String, x: CGFloat, y: CGFloat, visible: Bool) in
            (b.id, b.x, b.y, BalloonRushEngine.blinkVisible(b, nowGameSec: elapsedSeconds))
        }
        return BalloonRushDrawSnapshot(
            playerX: player.x,
            playerY: player.y,
            playerDirection: player.direction,
            balloons: live,
            jajiiX: jx,
            jajiiY: jy,
            shockwaves: shockwaves,
            nowPerfMs: now * 1000
        )
    }

    func applyFrameInput(_ input: SurvivalFrameInput, deltaTime: TimeInterval, now: TimeInterval) -> Bool {
        guard phase == .playing else { return false }
        var cleared = false

        for midi in input.noteOffs {
            activePressedPitchClasses.remove(((midi % 12) + 12) % 12)
        }
        for on in input.noteOns {
            if handleNoteOn(on.midi) {
                cleared = true
            }
        }

        let dt = min(0.1, max(0, deltaTime))
        advanceSimulation(deltaTime: dt, analog: input.analog, now: now)
        return cleared
    }

    private func advanceSimulation(deltaTime: TimeInterval, analog: CGVector, now: TimeInterval) {
        elapsedSeconds += deltaTime

        var pl = SurvivalGameEngine.updatePlayerPosition(
            player: player,
            analog: analog,
            deltaTime: deltaTime,
            now: now,
            speedMultiplier: 1
        )
        pl.x += knockVx * CGFloat(deltaTime)
        pl.y += knockVy * CGFloat(deltaTime)
        knockVx *= 0.9
        knockVy *= 0.9
        pl.x = min(SurvivalMap.width - 16, max(16, pl.x))
        pl.y = min(SurvivalMap.height - 16, max(16, pl.y))
        player = pl

        processExpiredBalloons(now: now)
        processRespawnQueue()

        if var j = jajii {
            SurvivalJajiiEngine.updateMovementInPlace(
                &j,
                playerX: pl.x,
                playerY: pl.y,
                deltaSec: deltaTime
            )
            jajii = j
        }

        let shockLifetime = SurvivalConstants.meleeShockwaveLifetime
        shockwaves = shockwaves.filter { now - ($0.startPerfMs / 1000) < shockLifetime }

        if elapsedSeconds >= TimeInterval(stage.timeLimitSec), poppedCount < stage.popQuota {
            phase = .failed
        }
    }

    private func processExpiredBalloons(now: TimeInterval) {
        let kbForce = SurvivalConstants.meleeKnockbackBase
            + CGFloat(player.skills.bKnockbackBonusLevel) * SurvivalConstants.meleeKnockbackPerLevel
        var next: [BalloonRushBalloon] = []
        for var b in balloons {
            if b.popped {
                next.append(b)
                continue
            }
            if !BalloonRushEngine.isExpired(b, nowGameSec: elapsedSeconds) {
                next.append(b)
                continue
            }
            let vel = BalloonRushMelee.knockVelocityFromBurst(
                balloon: BalloonRushSpawn.Point(x: b.x, y: b.y),
                player: BalloonRushSpawn.Point(x: player.x, y: player.y),
                force: kbForce
            )
            knockVx += vel.vx
            knockVy += vel.vy
            enqueueRespawn(at: elapsedSeconds + stage.respawnDelaySec)
            shockwaves.append(BalloonRushVisualShockwave(
                id: "ex_\(b.id)",
                x: b.x,
                y: b.y,
                maxRadius: 90,
                startPerfMs: now * 1000
            ))
            b.popped = true
            next.append(b)
        }
        balloons = next
    }

    private func processRespawnQueue() {
        var due = respawnDue.sorted()
        while let first = due.first, first <= elapsedSeconds {
            let liveCount = balloons.filter { !$0.popped }.count
            if liveCount >= stage.maxConcurrent { break }
            due.removeFirst()
            let existing = balloons.filter { !$0.popped }.map { BalloonRushSpawn.Point(x: $0.x, y: $0.y) }
            if let spot = BalloonRushSpawn.pickRespawnPosition(
                player: BalloonRushSpawn.Point(x: player.x, y: player.y),
                existing: existing,
                margin: BalloonRushSpawn.mapMarginPx,
                rng: { self.randomUnit() }
            ) {
                balloons.append(BalloonRushBalloon(
                    id: "nr_\(CACurrentMediaTime())_\(Int.random(in: 0..<999_999))",
                    x: spot.x,
                    y: spot.y,
                    spawnedAtSec: elapsedSeconds,
                    lifetimeSec: stage.balloonLifetimeSec,
                    popped: false
                ))
            } else {
                due.append(elapsedSeconds + 0.12)
                due.sort()
                break
            }
        }
        respawnDue = due
    }

    private func enqueueRespawn(at time: TimeInterval) {
        respawnDue.append(time)
    }

    private func handleNoteOn(_ note: Int) -> Bool {
        guard phase == .playing else { return false }
        let pc = ((note % 12) + 12) % 12
        for idx in slots.indices where slots[idx].isEnabled {
            if !slots[idx].inputPitchClasses.contains(pc) {
                slots[idx].inputPitchClasses.append(pc)
            }
        }

        var completed: [Int] = []
        for idx in slots.indices where slots[idx].isEnabled {
            guard let chord = slots[idx].chord else { continue }
            if SurvivalChordResolver.isMatch(inputPitchClasses: slots[idx].inputPitchClasses, target: chord) {
                completed.append(idx)
            }
        }
        guard !completed.isEmpty else { return false }

        var won = false
        for idx in completed {
            guard idx == SurvivalSlotIndex.B.rawValue else { continue }
            won = completePunchSlot() || won
        }

        let completedSet = Set(completed)
        for idx in slots.indices where slots[idx].isEnabled && !completedSet.contains(idx) {
            slots[idx].inputPitchClasses.removeAll()
        }
        return won
    }

    @discardableResult
    private func completePunchSlot() -> Bool {
        let hits = BalloonRushMelee.findBalloonsHitByMelee(player: player, balloons: balloons)
        guard !hits.isEmpty else { return false }

        shockwaves.append(BalloonRushMelee.createMeleeShockwave(player: player, now: CACurrentMediaTime()))
        for id in hits {
            if let i = balloons.firstIndex(where: { $0.id == id }) {
                balloons[i].popped = true
            }
        }
        poppedCount += hits.count
        for _ in hits {
            enqueueRespawn(at: elapsedSeconds + stage.respawnDelaySec)
        }

        advanceChordAfterPunch()

        if poppedCount >= stage.popQuota {
            phase = .cleared
            return true
        }
        return false
    }

    private func advanceChordAfterPunch() {
        guard slots.indices.contains(1) else { return }
        if isProgression {
            progressionIndex = (progressionIndex + 1) % max(1, progressionChords.count)
            let cur = SurvivalGameEngine.selectProgressionChord(progressionChords, index: progressionIndex)
            let nxt = SurvivalGameEngine.selectProgressionChord(progressionChords, index: progressionIndex + 1)
            slots[1].chord = cur
            slots[1].nextChord = nxt
        } else {
            let ids = allowedChordIds.isEmpty ? ["Dm7"] : allowedChordIds
            let used = slots[1].chord?.id
            let next = SurvivalGameEngine.pickRandomResolvedChord(allowedChordIds: ids, excludingId: used)
            let nextNext = SurvivalGameEngine.pickRandomResolvedChord(allowedChordIds: ids, excludingId: next?.id)
            slots[1].chord = next
            slots[1].nextChord = nextNext
        }
        slots[1].inputPitchClasses.removeAll()
        slots[1].triggerPulse &+= 1
    }

    private func resetBalloons() {
        let positions = BalloonRushSpawn.pickInitialFivePositions(
            player: BalloonRushSpawn.Point(x: player.x, y: player.y),
            margin: BalloonRushSpawn.mapMarginPx,
            rng: { self.randomUnit() }
        )
        balloons = positions.enumerated().map { i, p in
            BalloonRushBalloon(
                id: "b_\(i)_\(Int(CACurrentMediaTime() * 1000))",
                x: p.x,
                y: p.y,
                spawnedAtSec: 0,
                lifetimeSec: stage.balloonLifetimeSec,
                popped: false
            )
        }
        poppedCount = 0
        respawnDue = []
    }

    private func randomUnit() -> CGFloat {
        rngState = rngState &* 6364136223846793005 &+ 1
        return CGFloat(rngState % 10_000) / 10_000
    }
}

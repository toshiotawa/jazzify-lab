import Combine
import CoreGraphics
import Foundation

/// DB v2 台本 `steps[]` を解釈してサバイバル上で進行する。
@MainActor
final class TutorialScriptInterpreter: ObservableObject {
    let locale: AppLocale
    let payload: TutorialScriptPayload

    @Published var characterText: String = ""
    @Published var narrationText: String = ""
    @Published var connectedDeviceLine: String?
    @Published var showCta: Bool = false
    @Published var pillarCaption: String?
    @Published var pillarSystemImage: String?
    @Published var pillarImageAsset: String?
    @Published var showPillarCard: Bool = false

    private weak var session: SurvivalGameSession?
    private weak var controller: SurvivalScenarioController?
    private var onFinish: (() -> Void)?
    private var started = false
    private var cancelled = false

    init(locale: AppLocale, payload: TutorialScriptPayload) {
        self.locale = locale
        self.payload = payload
    }

    private var isJa: Bool { locale == .ja }

    func attach(
        session: SurvivalGameSession,
        controller: SurvivalScenarioController,
        onFinish: @escaping () -> Void
    ) {
        self.session = session
        self.controller = controller
        self.onFinish = onFinish
        guard !started else { return }
        started = true
        Task { await run() }
    }

    func cancel() {
        cancelled = true
    }

    func userFinishedCta() {
        Task { await finishExperience() }
    }

    func skipTapped() {
        Task { await finishExperience() }
    }

    private func sleep(_ s: TimeInterval) async {
        guard !cancelled else { return }
        let ns = UInt64(max(0, s) * 1_000_000_000)
        try? await Task.sleep(nanoseconds: ns)
    }

    private func waitForBTriggerPulseOrTimeout(startPulse: Int, seconds: TimeInterval) async -> Bool {
        let deadline = Date().addingTimeInterval(seconds)
        while Date() < deadline {
            if cancelled { return false }
            await sleep(0.04)
            guard let s = session else { return false }
            let p = s.gameLoop.runtime.slots[1].triggerPulse
            if p != startPulse { return true }
        }
        return false
    }

    private func runSpawn(_ spawn: TutorialSpawnStep) {
        guard let controller else { return }
        switch spawn.kind {
        case "front":
            controller.spawnEnemyInFront(distance: spawn.distance ?? 88)
        case "ring":
            controller.spawnStationaryRing(
                count: spawn.count ?? 12,
                radius: spawn.radius ?? 180
            )
        case "perpOffsets":
            controller.spawnTutorialPerpendicularOffsets(
                distanceForward: spawn.distanceForward ?? 95,
                perpOffsets: spawn.offsets ?? []
            )
        case "at":
            controller.spawnStationaryEnemy(
                atX: spawn.x ?? 0,
                y: spawn.y ?? 0
            )
        default:
            break
        }
    }

    private func runAttack(_ attack: TutorialAttackStep) {
        guard let controller else { return }
        if attack.special == true {
            controller.emitSpecialShockwaveOnly()
            return
        }
        if attack.slot == "A" {
            controller.emitAttackOnly(.A)
        } else if attack.slot == "B" {
            controller.emitAttackOnly(.B)
        }
    }

    private func applyCompletionAttack(_ attack: TutorialAttackStep?, useSpecial: Bool) {
        guard let controller else { return }
        controller.applyMutation {
            if useSpecial {
                $0.bChordCompletionAttackOverride = nil
                $0.bChordCompletionUseSpecial = true
            } else if let slot = attack?.slot {
                $0.bChordCompletionAttackOverride = slot == "A" ? .A : .B
                $0.bChordCompletionUseSpecial = false
            } else {
                $0.bChordCompletionAttackOverride = nil
                $0.bChordCompletionUseSpecial = false
            }
        }
    }

    private func playDemoOneChord(
        chord: SurvivalResolvedChord,
        spawn: TutorialSpawnStep,
        attack: TutorialAttackStep
    ) async {
        guard let session, let controller else { return }
        controller.clearEnemies()
        controller.setSlotBChord(chord)
        await sleep(0.35)
        runSpawn(spawn)
        await sleep(0.55)
        session.playOnboardingChord(midis: chord.midiNotes)
        session.playOnboardingRoot(for: chord)
        await sleep(0.25)
        controller.emitChordNameText(chord.displayName)
        runAttack(attack)
        await sleep(0.60)
        controller.clearEnemies()
    }

    private func runChordFight(_ step: TutorialScriptStep) async {
        guard let controller,
              let chordRef = step.chord,
              let chord = TutorialStageBuilder.resolveChord(payload, ref: chordRef),
              let spawn = step.spawn,
              let assist = step.assistAttack
        else { return }

        let timeout = step.timeoutSeconds ?? 5

        if let intro = step.introCharacter {
            characterText = intro.localized(locale)
            await sleep(step.introDelaySeconds ?? 0.8)
        }

        controller.clearEnemies()
        controller.setSlotBEnabled(true)
        controller.applyMutation {
            $0.hideStaff = true
            $0.blockSlotEvaluation = false
            $0.useChordMidiNotesForHintHighlights = true
        }
        controller.setSlotBChord(chord)
        applyCompletionAttack(step.completionAttack, useSpecial: step.useSpecial == true)
        controller.applyMutation { $0.hideStaff = false }
        runSpawn(spawn)

        guard let session else { return }
        let startPulse = session.gameLoop.runtime.slots[1].triggerPulse
        let completed = await waitForBTriggerPulseOrTimeout(startPulse: startPulse, seconds: timeout)

        if completed {
            controller.setSlotBEnabled(false)
            controller.setSlotBChord(chord)
            controller.applyMutation {
                $0.blockSlotEvaluation = true
                $0.hideStaff = false
                $0.useChordMidiNotesForHintHighlights = false
                $0.bChordCompletionAttackOverride = nil
                $0.bChordCompletionUseSpecial = false
            }
            await sleep(0.9)
            if let success = step.successCharacter {
                characterText = success.localized(locale)
                await sleep(step.successDelaySeconds ?? 0.8)
            }
        } else {
            controller.applyMutation { $0.hideStaff = true }
            session.playOnboardingChord(midis: chord.midiNotes)
            session.playOnboardingRoot(for: chord)
            runAttack(assist)
            if let fail = step.failCharacter {
                characterText = fail.localized(locale)
                await sleep(step.failDelaySeconds ?? 1.4)
            }
        }

        controller.applyMutation { $0.hideStaff = true }
        controller.setSlotBChord(nil)
        controller.setSlotBEnabled(true)
        controller.applyMutation {
            $0.blockSlotEvaluation = false
            $0.useChordMidiNotesForHintHighlights = true
            $0.bChordCompletionAttackOverride = nil
            $0.bChordCompletionUseSpecial = false
        }
        characterText = ""
        await sleep(0.35)
    }

    private func runKeyboardSetup(midiWaitSeconds: TimeInterval) async {
        guard let controller else { return }

        let hadDeviceInitially = !MIDIManager.shared.availableDevices.isEmpty
        let midiIn5s = await waitForMidiNoteOrTimeout(seconds: midiWaitSeconds)
        if midiIn5s || hadDeviceInitially {
            narrationText = isJa ? "接続できました" : "Connected"
            await sleep(0.6)
            let sel = MIDIManager.shared.selectedDeviceID
            let dev = MIDIManager.shared.availableDevices.first(where: { $0.uniqueID == sel })
                ?? MIDIManager.shared.availableDevices.first
            if let name = dev?.displayName {
                connectedDeviceLine = (isJa ? "接続: " : "Connected: ") + name
            }
            narrationText = isJa ? "鍵盤を1つ弾いてください" : "Play one key on your keyboard."
            characterText = isJa ? "1音弾いてみよう。" : "Try playing one note."
            controller.applyMutation {
                $0.blockMidiGameInput = false
                $0.blockChordPadInput = true
            }
        } else {
            narrationText = isJa ? "画面鍵盤で試しましょう" : "Let's use the on-screen keyboard."
            await sleep(0.8)
            narrationText = isJa
                ? "まずは音を鳴らすところから。外部キーボードはあとで接続できます。"
                : "Start by making sound. You can plug in a keyboard later."
            characterText = isJa ? "1音弾いてみよう。" : "Try playing one note."
            controller.applyMutation {
                $0.blockChordPadInput = false
                $0.blockMidiGameInput = true
            }
        }

        await waitForFirstInputNote()
        controller.emitAttackOnly(.A)
        await sleep(1.2)
        narrationText = ""
        characterText = ""
    }

    private func runStep(_ step: TutorialScriptStep) async -> Bool {
        guard let controller else { return true }

        switch step.type {
        case "delay":
            await sleep(step.seconds ?? 0)
        case "character":
            if let text = step.text {
                characterText = text.localized(locale)
            }
        case "narration":
            if step.clear == true {
                narrationText = ""
            } else if let text = step.text {
                narrationText = text.localized(locale)
            }
        case "connectedDevice":
            if let text = step.text {
                connectedDeviceLine = text.localized(locale)
            } else {
                connectedDeviceLine = nil
            }
        case "overrides":
            if let preset = step.preset, let resolved = TutorialScriptPresets.resolve(preset: preset) {
                controller.setOverrides(resolved)
            }
        case "slot":
            if let a = step.aEnabled { controller.setSlotAEnabled(a) }
            if let b = step.bEnabled { controller.setSlotBEnabled(b) }
            if step.clearBChord == true {
                controller.setSlotBChord(nil)
            } else if let ref = step.bChord,
                      let chord = TutorialStageBuilder.resolveChord(payload, ref: ref) {
                controller.setSlotBChord(chord)
            }
            if step.resetBCompletion == true {
                controller.applyMutation {
                    $0.bChordCompletionAttackOverride = nil
                    $0.bChordCompletionUseSpecial = false
                }
            }
        case "clearEnemies":
            controller.clearEnemies()
        case "spawn":
            if let spawn = step.spawn { runSpawn(spawn) }
        case "demoOneChord":
            if let ref = step.chord,
               let chord = TutorialStageBuilder.resolveChord(payload, ref: ref),
               let spawn = step.spawn,
               let attack = step.attack {
                await playDemoOneChord(chord: chord, spawn: spawn, attack: attack)
            }
        case "chordFight":
            await runChordFight(step)
        case "keyboardSetup":
            await runKeyboardSetup(midiWaitSeconds: step.midiWaitSeconds ?? 5)
        case "waitInput":
            await waitForFirstInputNote()
        case "attack":
            if let attack = step.attack { runAttack(attack) }
        case "pillar":
            if let text = step.text, let sym = step.systemImage {
                pillarCaption = text.localized(locale)
                pillarSystemImage = sym
                pillarImageAsset = step.imageAsset
                showPillarCard = true
                await sleep(step.durationSeconds ?? 2)
                showPillarCard = false
                pillarCaption = nil
                pillarSystemImage = nil
                pillarImageAsset = nil
            }
        case "showCta":
            showCta = step.show ?? false
        case "audio":
            break
        case "finish":
            return false
        default:
            break
        }
        return true
    }

    private func run() async {
        for step in payload.steps {
            if cancelled { return }
            let shouldContinue = await runStep(step)
            if !shouldContinue { break }
        }
        if !cancelled {
            await finishExperience()
        }
    }

    private func finishExperience() async {
        await MainActor.run { self.onFinish?() }
    }

    private func waitForMidiNoteOrTimeout(seconds: TimeInterval) async -> Bool {
        await withCheckedContinuation { continuation in
            let once = ResumeOnce(continuation)
            var sub: MIDISubscription?
            sub = MIDIManager.shared.subscribe { status, _, vel in
                let t = status & 0xF0
                if t == 0x90 && vel > 0, once.resume(returning: true) {
                    sub?.cancel()
                }
            }
            Task {
                try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                if once.resume(returning: false) {
                    sub?.cancel()
                }
            }
        }
    }

    private func waitForFirstInputNote() async {
        guard let session else { return }
        let startPulse = session.userInputNotePulse
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            let box = ResumeOnceVoid(continuation)
            var cancellable: AnyCancellable?
            cancellable = session.$userInputNotePulse.sink { pulse in
                if pulse != startPulse, box.fire() {
                    cancellable?.cancel()
                }
            }
        }
    }
}

private final class ResumeOnce {
    private var cont: CheckedContinuation<Bool, Never>?
    private var done = false

    init(_ c: CheckedContinuation<Bool, Never>) { cont = c }

    func resume(returning value: Bool) -> Bool {
        guard !done, let c = cont else { return false }
        done = true
        cont = nil
        c.resume(returning: value)
        return true
    }
}

private final class ResumeOnceVoid {
    private var cont: CheckedContinuation<Void, Never>?
    private(set) var isDone = false

    init(_ c: CheckedContinuation<Void, Never>) { cont = c }

    func fire() -> Bool {
        guard !isDone, let c = cont else { return false }
        isDone = true
        cont = nil
        c.resume()
        return true
    }
}

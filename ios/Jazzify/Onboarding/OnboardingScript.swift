import Combine
import CoreGraphics
import Foundation

/// サバイバル上でオンボーディングのシーケンスを進める（イベント駆動・フレームループ無し）。
@MainActor
final class OnboardingScript: ObservableObject {
    let locale: AppLocale

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

    init(locale: AppLocale) {
        self.locale = locale
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

    private func sleep(_ s: TimeInterval) async {
        let ns = UInt64(max(0, s) * 1_000_000_000)
        try? await Task.sleep(nanoseconds: ns)
    }

    func userFinishedCta() {
        Task { await finishExperience(markCompleted: true) }
    }

    func skipTapped() {
        Task { await finishExperience(markCompleted: true) }
    }

    private func waitForBTriggerPulseOrTimeout(startPulse: Int, seconds: TimeInterval) async -> Bool {
        let deadline = Date().addingTimeInterval(seconds)
        while Date() < deadline {
            await sleep(0.04)
            guard let s = session else { return false }
            let p = s.gameLoop.runtime.slots[1].triggerPulse
            if p != startPulse { return true }
        }
        return false
    }

    private func run() async {
        guard let session, let controller else { return }

        // MARK: Scene 1
        narrationText = ""
        controller.setOverrides(scene1Base())
        controller.setSlotAEnabled(false)
        controller.setSlotBEnabled(true)

        characterText = isJa
            ? "ジャズって難しそう？\nコードを覚えるのが難しい？"
            : "Jazz looks hard?\nChords feel hard to memorize?"
        await sleep(2)
        characterText = isJa
            ? "コードを弾くと、ワザが出る。遊んでいるうちに、ジャズの形が身につく。"
            : "Play a chord to unleash a move. As you play, jazz starts to stick."
        await sleep(2)
        characterText = isJa
            ? "これがこのアプリの基本です。"
            : "That's the foundation of this app."
        await sleep(2.2)
        characterText = ""

        await playSceneOneChord(
            chord: OnboardingChords.dm7Voicing,
            spawn: { controller.spawnEnemyInFront(distance: 88) },
            attack: { controller.emitAttackOnly(.A) }
        )
        await playSceneOneChord(
            chord: OnboardingChords.g7Voicing,
            spawn: { controller.spawnEnemyInFront(distance: 88) },
            attack: { controller.emitAttackOnly(.A) }
        )
        await playSceneOneChord(
            chord: OnboardingChords.cm7Voicing,
            spawn: { controller.spawnStationaryRing(count: 12, radius: 180) },
            attack: { controller.emitSpecialShockwaveOnly() }
        )

        await sleep(1.2)

        // MARK: Scene 2
        narrationText = ""
        characterText = isJa ? "キーボードを用意しよう。" : "Let’s get your keyboard ready."
        controller.setOverrides(scene2Base())
        controller.setSlotBChord(nil)
        controller.setSlotBEnabled(false)
        await sleep(2)
        narrationText = isJa
            ? "MIDIキーボードを持っている人は接続してください。\nまだ持っていない人も大丈夫。画面鍵盤でそのまま試せます。"
            : "If you have a MIDI keyboard, connect it.\nNo keyboard yet? You can try with the on-screen one."

        let hadDeviceInitially = !MIDIManager.shared.availableDevices.isEmpty
        let midiIn5s = await waitForMidiNoteOrTimeout(seconds: 5)
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
            narrationText = isJa ? "画面鍵盤で試しましょう" : "Let’s use the on-screen keyboard."
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
        connectedDeviceLine = nil

        // MARK: Scene 3
        narrationText = ""
        characterText = ""
        controller.setOverrides(scene3Base())
        controller.setSlotAEnabled(false)
        controller.setSlotBEnabled(true)
        controller.applyMutation {
            $0.bChordCompletionAttackOverride = nil
            $0.bChordCompletionUseSpecial = false
        }

        func runChordFight(
            chord: SurvivalResolvedChord,
            override: SurvivalSlotIndex?,
            useSpecial: Bool,
            spawn: () -> Void,
            assist: @escaping () -> Void
        ) async -> Bool {
            controller.clearEnemies()
            controller.setSlotBEnabled(true)
            controller.applyMutation {
                $0.hideStaff = true
                $0.blockSlotEvaluation = false
                $0.useChordMidiNotesForHintHighlights = true
            }
            controller.setSlotBChord(chord)
            controller.applyMutation {
                $0.bChordCompletionAttackOverride = override
                $0.bChordCompletionUseSpecial = useSpecial
                $0.hideStaff = false
            }
            spawn()
            let startPulse = session.gameLoop.runtime.slots[1].triggerPulse
            let completed = await waitForBTriggerPulseOrTimeout(startPulse: startPulse, seconds: 5)
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
            } else {
                controller.applyMutation {
                    $0.hideStaff = true
                }
                session.playOnboardingChord(midis: chord.midiNotes)
                session.playOnboardingRoot(for: chord)
                controller.emitChordNameText(chord.displayName)
                assist()
            }
            controller.applyMutation {
                $0.hideStaff = true
            }
            controller.setSlotBChord(nil)
            controller.setSlotBEnabled(true)
            controller.applyMutation {
                $0.blockSlotEvaluation = false
                $0.useChordMidiNotesForHintHighlights = true
            }
            await sleep(0.35)
            return completed
        }

        characterText = isJa ? "まずはDm7。下からCとF、2音だけ。" : "First, Dm7. Just C and F from the bottom."
        await sleep(0.8)
        let dm7Completed = await runChordFight(
            chord: OnboardingChords.sceneThreeDm7Voicing,
            override: .B,
            useSpecial: false,
            spawn: { controller.spawnEnemyInFront(distance: 80) },
            assist: { controller.emitAttackOnly(.B) }
        )
        if dm7Completed {
            characterText = isJa ? "OK。" : "Nice."
            await sleep(0.8)
        } else {
            characterText = isJa ? "大丈夫、次でもう一回。" : "No worries. Once more."
            await sleep(1.4)
        }
        characterText = ""
        await sleep(0.35)

        characterText = isJa ? "次はG7。下からBとF。" : "Next, G7. B and F from the bottom."
        await sleep(0.8)
        let g7Completed = await runChordFight(
            chord: OnboardingChords.sceneThreeG7Voicing,
            override: .A,
            useSpecial: false,
            spawn: {
                let p = session.gameLoop.runtime.player
                let dir = p.direction.vector
                let perp = CGVector(dx: -dir.dy, dy: dir.dx)
                for i in 0..<5 {
                    let t = CGFloat(i - 2) * 52
                    let x = p.x + dir.dx * 95 + perp.dx * t
                    let y = p.y + dir.dy * 95 + perp.dy * t
                    controller.spawnStationaryEnemy(atX: x, y: y)
                }
            },
            assist: { controller.emitAttackOnly(.A) }
        )
        if g7Completed {
            characterText = isJa ? "いいね、ジャズになってきた" : "Nice. That’s starting to sound like jazz."
            await sleep(1.8)
        } else {
            characterText = isJa ? "大丈夫、次でもう一回。" : "No worries. Once more."
            await sleep(1.4)
        }
        characterText = ""
        await sleep(0.35)

        characterText = isJa ? "最後はCM7。下からBとEで着地しよう。" : "Last, CM7. Land on B and E from the bottom."
        await sleep(0.8)
        _ = await runChordFight(
            chord: OnboardingChords.sceneThreeCm7Voicing,
            override: nil,
            useSpecial: true,
            spawn: { controller.spawnStationaryRing(count: 12, radius: 190) },
            assist: { controller.emitSpecialShockwaveOnly() }
        )
        characterText = ""
        await sleep(0.4)

        // MARK: Scene 4
        controller.clearEnemies()
        controller.setSlotBChord(nil)
        controller.setSlotBEnabled(false)
        controller.setSlotAEnabled(false)
        controller.applyMutation {
            $0.hideChordSlots = true
            $0.hideStaff = true
            $0.scenarioStaffClef = 1
            $0.hideStaffOnBSlotCompletion = false
            $0.useChordMidiNotesForHintHighlights = false
            $0.blockSlotEvaluation = true
            $0.bChordCompletionAttackOverride = nil
            $0.bChordCompletionUseSpecial = false
        }
        characterText = isJa ? "今の3つは、ジャズでよく出る進行。" : "Those three show up all the time in jazz."
        await sleep(2)
        characterText = isJa ? "“II-V-I（ツーファイブワン）”。" : "“Two-Five-One” (II-V-I)."
        await sleep(2)
        characterText = isJa
            ? "理屈はあとで追いつく。\nまずは、指で覚えよう。"
            : "Theory will catch up later.\nFirst, let your fingers learn it."
        await sleep(2.2)

        // MARK: Scene 5
        controller.setOverrides(scene5Base())
        characterText = isJa
            ? "ここから少しずつ、できることが増えていくよ。"
            : "From here, you'll slowly unlock more and more."
        await sleep(2)
        characterText = ""
        await showPillar(
            caption: isJa ? "使えるコードが増える。" : "You'll grow your usable chords.",
            systemImage: "music.note.list",
            imageAsset: "onboarding_pillar_chords"
        )
        await showPillar(
            caption: isJa ? "リズムに乗れる。" : "You'll ride the rhythm.",
            systemImage: "metronome",
            imageAsset: "onboarding_pillar_timing"
        )
        await showPillar(
            caption: isJa ? "自分のフレーズで返せる。" : "You'll answer with your own phrases.",
            systemImage: "waveform",
            imageAsset: "onboarding_pillar_phrase"
        )
        characterText = isJa
            ? "僕はファイ、君と一緒に冒険できることを楽しみにしているよ"
            : "I’m Fai, and I can’t wait to go on this adventure with you."
        await sleep(2.5)
        showCta = true
        await sleep(5)
        await finishExperience(markCompleted: true)
    }

    private func playSceneOneChord(
        chord: SurvivalResolvedChord,
        spawn: () -> Void,
        attack: () -> Void
    ) async {
        guard let session, let controller else { return }
        controller.clearEnemies()
        controller.setSlotBChord(chord)
        await sleep(0.35)
        spawn()
        await sleep(0.55)
        session.playOnboardingChord(midis: chord.midiNotes)
        session.playOnboardingRoot(for: chord)
        await sleep(0.25)
        controller.emitChordNameText(chord.displayName)
        attack()
        await sleep(0.60)
        controller.clearEnemies()
    }

    private func showPillar(caption: String, systemImage: String, imageAsset: String? = nil) async {
        pillarCaption = caption
        pillarSystemImage = systemImage
        pillarImageAsset = imageAsset
        showPillarCard = true
        await sleep(2)
        showPillarCard = false
        pillarCaption = nil
        pillarSystemImage = nil
        pillarImageAsset = nil
    }

    private func finishExperience(markCompleted: Bool) async {
        if markCompleted { OnboardingPreferences.markCompleted() }
        await MainActor.run { self.onFinish?() }
    }

    private func scene1Base() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideHud = false
        o.hideStageTitle = true
        o.hideTimerDisplay = true
        o.hideKillCounter = true
        o.hidePauseButton = true
        o.hideHintBadge = true
        o.hideStatusStrip = true
        o.hidePlayerHpBar = true
        o.hideStaff = true
        o.hideChordSlots = true
        o.hideChordPad = true
        o.blockSlotEvaluation = true
        return o
    }

    private func scene2Base() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideHud = true
        o.hideStaff = true
        o.hideChordSlots = true
        o.hideComboBadge = true
        o.hideChordPad = false
        o.blockChordPadInput = true
        o.blockMidiGameInput = true
        o.blockSlotEvaluation = true
        return o
    }

    private func scene3Base() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideHud = false
        o.hideStageTitle = true
        o.hideTimerDisplay = true
        o.hideKillCounter = true
        o.hidePauseButton = true
        o.hideHintBadge = true
        o.hideStatusStrip = true
        o.hideStaff = true
        o.hideChordSlots = true
        o.hideChordPad = false
        o.hideComboBadge = true
        o.scenarioStaffClef = 1
        o.hideStaffOnBSlotCompletion = true
        o.useChordMidiNotesForHintHighlights = true
        o.disableJoystick = false
        o.blockSlotEvaluation = false
        o.blockChordPadInput = false
        o.blockMidiGameInput = false
        return o
    }

    private func scene5Base() -> SurvivalScenarioOverrides {
        var o = OnboardingBootstrap.initial
        o.hideHud = true
        o.hideStaff = true
        o.hideChordSlots = true
        o.hideComboBadge = true
        o.hideChordPad = false
        o.disableJoystick = false
        o.blockSlotEvaluation = true
        o.blockChordPadInput = false
        o.blockMidiGameInput = true
        return o
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

// MARK: - Continuation helpers

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

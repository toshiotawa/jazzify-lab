import SwiftUI
import UIKit

struct PrecisionNotesCanvasView: UIViewRepresentable {
    @ObservedObject var controller: EarTrainingPrecisionBattleController
    let pianoHeight: CGFloat

    func makeUIView(context: Context) -> PrecisionNotesCanvasUIView {
        let view = PrecisionNotesCanvasUIView(pianoHeight: pianoHeight)
        view.controller = controller
        return view
    }

    func updateUIView(_ uiView: PrecisionNotesCanvasUIView, context: Context) {
        uiView.controller = controller
        uiView.pianoHeight = pianoHeight
        uiView.setNeedsLayout()
    }

    static func dismantleUIView(_ uiView: PrecisionNotesCanvasUIView, coordinator: ()) {
        uiView.tearDown()
    }
}

final class PrecisionNotesCanvasUIView: UIView {
    var controller: EarTrainingPrecisionBattleController? {
        didSet { syncFromController() }
    }

    var pianoHeight: CGFloat {
        didSet { recalculateLayout() }
    }

    private enum PrecisionNoteColors {
        static let pendingWhiteFill = UIColor(red: 56 / 255, green: 189 / 255, blue: 248 / 255, alpha: 1)
        static let pendingWhiteBorder = UIColor(red: 2 / 255, green: 132 / 255, blue: 199 / 255, alpha: 1)
        static let pendingBlackFill = UIColor(red: 168 / 255, green: 85 / 255, blue: 247 / 255, alpha: 1)
        static let pendingBlackBorder = UIColor(red: 126 / 255, green: 34 / 255, blue: 206 / 255, alpha: 1)
        static let goodFill = UIColor(red: 34 / 255, green: 197 / 255, blue: 94 / 255, alpha: 1)
        static let goodBorder = UIColor(red: 21 / 255, green: 128 / 255, blue: 61 / 255, alpha: 1)
        static let missFill = UIColor(red: 148 / 255, green: 163 / 255, blue: 184 / 255, alpha: 0.45)
        static let missBorder = UIColor(red: 71 / 255, green: 85 / 255, blue: 105 / 255, alpha: 0.85)
        static let hitGlow = UIColor(red: 134 / 255, green: 239 / 255, blue: 172 / 255, alpha: 1)
        static let hitGlowStroke = UIColor(red: 187 / 255, green: 247 / 255, blue: 208 / 255, alpha: 1)
        static let guideHighlight = UIColor(red: 251 / 255, green: 191 / 255, blue: 36 / 255, alpha: 0.45)
        static let activeKeyHighlight = UIColor(red: 56 / 255, green: 189 / 255, blue: 248 / 255, alpha: 0.55)
        static let hitLine = UIColor(red: 250 / 255, green: 204 / 255, blue: 21 / 255, alpha: 1)
        static let background = UIColor(red: 0.02, green: 0.05, blue: 0.09, alpha: 1)
        static let guideLaneEven = UIColor(red: 30 / 255, green: 41 / 255, blue: 59 / 255, alpha: 0.35)
        static let guideLaneOdd = UIColor(red: 15 / 255, green: 23 / 255, blue: 42 / 255, alpha: 0.25)
        static let octaveMarker = UIColor(red: 148 / 255, green: 163 / 255, blue: 184 / 255, alpha: 0.18)
        static let whiteKeyFill = UIColor(red: 217 / 255, green: 206 / 255, blue: 176 / 255, alpha: 1)
        static let blackKeyFill = UIColor(red: 18 / 255, green: 16 / 255, blue: 16 / 255, alpha: 1)
        static let keySeparatorStroke = UIColor(red: 50 / 255, green: 42 / 255, blue: 30 / 255, alpha: 0.45)
        static let vanishBurstLight = UIColor(red: 134 / 255, green: 239 / 255, blue: 172 / 255, alpha: 1)
        static let vanishSpark = UIColor(red: 251 / 255, green: 191 / 255, blue: 36 / 255, alpha: 1)
        static let vanishFlashWhite = UIColor(white: 1, alpha: 1)
    }

    private static let noteVanishEffectDurationMs: Double = 400
    private static let noteVanishBurstCount = 10
    private static let noteVanishSparkCount = 4
    private static let noteVanishFlashDurationMs: Double = 120
    private static let noteVanishFlashMaxRadiusPx: CGFloat = 18
    private static let noteVanishGravity: CGFloat = 0.00025
    private static let noteVanishBurstSpeedMin: CGFloat = 0.10
    private static let noteVanishBurstSpeedMax: CGFloat = 0.16
    private static let noteVanishSparkSpeedMin: CGFloat = 0.14
    private static let noteVanishSparkSpeedMax: CGFloat = 0.20
    private static let noteHitEffectDurationMs: Double = 100
    private static let noteHitGlowExpandPx: CGFloat = 3

    private var displayLink: CADisplayLink?
    private var keyGeometries: [KeyGeometry] = []
    private var whiteKeyWidth: CGFloat = 1
    private var hitLineY: CGFloat = 0
    private var noteLaneHeight: CGFloat = 0
    private var noteSpeedPxPerSec: CGFloat = 1
    private var minMidi = 60
    private var maxMidi = 83
    private var activeTouchMidi: Int?
    private var guideMidis: Set<Int> = []

    private var staticLayerImage: UIImage?
    private var staticLayerSignature: StaticLayerSignature?

    private var previousJudgments: [String: EarTrainingPrecisionJudge.NoteJudgment] = [:]
    private var previousHiddenFromLane: [String: Bool] = [:]
    private var vanishedIds: Set<String> = []
    private var hitEffects: [HitEffect] = []
    private var vanishEffects: [VanishEffect] = []
    private var lastTrackedPhraseRunId = -1
    private var lastPrecisionNoteCount = 0

    private struct KeyGeometry {
        let midi: Int
        let isBlack: Bool
        let rect: CGRect
    }

    private struct StaticLayerSignature: Equatable {
        let width: CGFloat
        let height: CGFloat
        let minMidi: Int
        let maxMidi: Int
        let pianoHeight: CGFloat
        let hitLineY: CGFloat
    }

    private struct HitEffect {
        let rect: CGRect
        let startedAtMs: Double
    }

    private struct VanishParticle {
        let x: CGFloat
        let y: CGFloat
        let vx: CGFloat
        let vy: CGFloat
        let size: CGFloat
        let color: UIColor
    }

    private struct VanishEffect {
        let particles: [VanishParticle]
        let centerX: CGFloat
        let centerY: CGFloat
        let startedAtMs: Double
    }

    init(pianoHeight: CGFloat) {
        self.pianoHeight = pianoHeight
        super.init(frame: .zero)
        backgroundColor = PrecisionNoteColors.background
        isMultipleTouchEnabled = false
        displayLink = CADisplayLink(target: self, selector: #selector(tick))
        displayLink?.add(to: .main, forMode: .common)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        tearDown()
    }

    func tearDown() {
        displayLink?.invalidate()
        displayLink = nil
        releaseTouch()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        recalculateLayout()
    }

    private func syncFromController() {
        guard let controller else { return }
        let rangeChanged = minMidi != controller.keyboardRange.minMidi
            || maxMidi != controller.keyboardRange.maxMidi
        minMidi = controller.keyboardRange.minMidi
        maxMidi = controller.keyboardRange.maxMidi
        recalculateLayout()
        if rangeChanged || controller.phraseRunId != lastTrackedPhraseRunId {
            lastTrackedPhraseRunId = controller.phraseRunId
            resetEffectTracking()
        }
        setNeedsDisplay()
    }

    private func resetEffectTracking() {
        previousJudgments.removeAll(keepingCapacity: true)
        previousHiddenFromLane.removeAll(keepingCapacity: true)
        vanishedIds.removeAll(keepingCapacity: true)
        hitEffects.removeAll(keepingCapacity: true)
        vanishEffects.removeAll(keepingCapacity: true)
        guard let controller else { return }
        for note in controller.precisionNotes {
            let judgment = controller.runtimeStates[note.id]?.judgment ?? .pending
            previousJudgments[note.id] = judgment
            previousHiddenFromLane[note.id] = controller.runtimeStates[note.id]?.hiddenFromLane ?? false
        }
    }

    private func recalculateLayout() {
        hitLineY = bounds.height - pianoHeight
        noteLaneHeight = max(0, hitLineY)
        noteSpeedPxPerSec = noteLaneHeight / CGFloat(EarTrainingPrecisionNotes.fallLeadSec)
        keyGeometries = buildKeyGeometries()
        invalidateStaticLayerIfNeeded()
    }

    private func invalidateStaticLayerIfNeeded() {
        let signature = StaticLayerSignature(
            width: bounds.width,
            height: bounds.height,
            minMidi: minMidi,
            maxMidi: maxMidi,
            pianoHeight: pianoHeight,
            hitLineY: hitLineY
        )
        guard signature != staticLayerSignature, bounds.width > 0, bounds.height > 0 else { return }
        staticLayerSignature = signature
        staticLayerImage = renderStaticLayer()
    }

    @objc private func tick() {
        if let controller, controller.phraseRunId != lastTrackedPhraseRunId {
            lastTrackedPhraseRunId = controller.phraseRunId
            resetEffectTracking()
        }
        if let controller, controller.precisionNotes.count != lastPrecisionNoteCount {
            lastPrecisionNoteCount = controller.precisionNotes.count
            resetEffectTracking()
        }
        updateGuideKeys()
        trackJudgmentTransitions()
        trackNoteVanish()
        pruneExpiredEffects()
        setNeedsDisplay()
    }

    private func updateGuideKeys() {
        guideMidis.removeAll(keepingCapacity: true)
        guard let controller, controller.practiceMode else { return }
        guard let phraseTime = controller.currentPhraseTimelineSec() else { return }
        for note in controller.precisionNotes {
            guard controller.runtimeStates[note.id]?.judgment == .pending else { continue }
            if EarTrainingPrecisionNotes.isNoteInPerformanceWindow(note: note, phraseTimeSec: phraseTime) {
                guideMidis.insert(note.midi)
            }
        }
    }

    private func trackJudgmentTransitions() {
        guard let controller else { return }
        let nowMs = CFAbsoluteTimeGetCurrent() * 1000
        for note in controller.precisionNotes {
            let state = controller.runtimeStates[note.id]
            let prev = previousJudgments[note.id] ?? .pending
            let next = state?.judgment ?? .pending
            if prev != next {
                previousJudgments[note.id] = next
                if next == .good, let rect = noteRect(for: note, controller: controller) {
                    addHitEffect(rect: rect, startedAtMs: nowMs)
                }
            }
        }
    }

    private func trackNoteVanish() {
        guard let controller else { return }
        let nowMs = CFAbsoluteTimeGetCurrent() * 1000
        let phraseTime = controller.currentPhraseTimelineSec() ?? 0
        for note in controller.precisionNotes {
            guard let state = controller.runtimeStates[note.id] else { continue }
            let wasHidden = previousHiddenFromLane[note.id] ?? false
            let isHidden = state.hiddenFromLane ?? false
            if !wasHidden, isHidden, state.judgment == .good,
               let rect = noteRectForEffect(for: note, controller: controller, phraseTime: phraseTime) {
                addVanishEffect(noteId: note.id, rect: rect, isShortNote: note.isShortNote, startedAtMs: nowMs)
            }
            previousHiddenFromLane[note.id] = isHidden

            if state.judgment == .good,
               !isHidden,
               !vanishedIds.contains(note.id),
               phraseTime >= note.startSec + note.durationSec - 0.001,
               let rect = noteRectForEffect(for: note, controller: controller, phraseTime: phraseTime) {
                addVanishEffect(noteId: note.id, rect: rect, isShortNote: note.isShortNote, startedAtMs: nowMs)
            }
        }
    }

    private func pruneExpiredEffects() {
        let nowMs = CFAbsoluteTimeGetCurrent() * 1000
        hitEffects.removeAll { nowMs - $0.startedAtMs >= Self.noteHitEffectDurationMs }
        vanishEffects.removeAll { nowMs - $0.startedAtMs >= Self.noteVanishEffectDurationMs }
    }

    private func addHitEffect(rect: CGRect, startedAtMs: Double) {
        hitEffects.append(HitEffect(rect: rect, startedAtMs: startedAtMs))
        if hitEffects.count > 24 {
            hitEffects.removeFirst(hitEffects.count - 24)
        }
    }

    private func spawnVanishParticles(cx: CGFloat, cy: CGFloat) -> [VanishParticle] {
        var particles: [VanishParticle] = []
        particles.reserveCapacity(Self.noteVanishBurstCount + Self.noteVanishSparkCount)
        let burstSpeedSpan = Self.noteVanishBurstSpeedMax - Self.noteVanishBurstSpeedMin
        for index in 0..<Self.noteVanishBurstCount {
            let angle = (Double(index) / Double(Self.noteVanishBurstCount)) * Double.pi * 2 + Double(index) * 0.37
            let speed = Self.noteVanishBurstSpeedMin + CGFloat(index % 5) * (burstSpeedSpan / 4)
            particles.append(
                VanishParticle(
                    x: cx,
                    y: cy,
                    vx: CGFloat(cos(angle)) * speed,
                    vy: CGFloat(sin(angle)) * speed,
                    size: CGFloat(3 + index % 3),
                    color: index.isMultiple(of: 2)
                        ? PrecisionNoteColors.vanishBurstLight
                        : PrecisionNoteColors.goodFill
                )
            )
        }
        let sparkSpeedSpan = Self.noteVanishSparkSpeedMax - Self.noteVanishSparkSpeedMin
        for index in 0..<Self.noteVanishSparkCount {
            let angle = (Double(index) / Double(Self.noteVanishSparkCount)) * Double.pi * 2 + 0.5 + Double(index) * 0.61
            let speed = Self.noteVanishSparkSpeedMin + CGFloat(index % 3) * (sparkSpeedSpan / 2)
            particles.append(
                VanishParticle(
                    x: cx,
                    y: cy,
                    vx: CGFloat(cos(angle)) * speed,
                    vy: CGFloat(sin(angle)) * speed,
                    size: 1.5 + CGFloat(index % 2) * 0.5,
                    color: PrecisionNoteColors.vanishSpark
                )
            )
        }
        return particles
    }

    private func addVanishEffect(noteId: String, rect: CGRect, isShortNote: Bool, startedAtMs: Double) {
        if vanishedIds.contains(noteId) {
            return
        }
        vanishedIds.insert(noteId)
        let cx = rect.midX
        let cy = isShortNote
            ? rect.midY
            : rect.minY + min(8, rect.height * 0.12)
        vanishEffects.append(
            VanishEffect(
                particles: spawnVanishParticles(cx: cx, cy: cy),
                centerX: cx,
                centerY: cy,
                startedAtMs: startedAtMs
            )
        )
        if vanishEffects.count > 24 {
            vanishEffects.removeFirst(vanishEffects.count - 24)
        }
    }

    private func buildKeyGeometries() -> [KeyGeometry] {
        var keys: [KeyGeometry] = []
        let whiteCount = max(1, countWhiteKeys(minMidi: minMidi, maxMidi: maxMidi))
        whiteKeyWidth = bounds.width / CGFloat(whiteCount)
        var whiteIndex = 0
        for midi in minMidi...maxMidi {
            guard !EarTrainingPrecisionNotes.isBlackKeyMidi(midi) else { continue }
            keys.append(
                KeyGeometry(
                    midi: midi,
                    isBlack: false,
                    rect: CGRect(
                        x: CGFloat(whiteIndex) * whiteKeyWidth,
                        y: hitLineY,
                        width: whiteKeyWidth,
                        height: pianoHeight
                    )
                )
            )
            whiteIndex += 1
        }
        whiteIndex = 0
        for midi in minMidi...maxMidi {
            if !EarTrainingPrecisionNotes.isBlackKeyMidi(midi) {
                whiteIndex += 1
                continue
            }
            let whiteLeft = CGFloat(whiteIndex - 1) * whiteKeyWidth
            keys.append(
                KeyGeometry(
                    midi: midi,
                    isBlack: true,
                    rect: CGRect(
                        x: whiteLeft + whiteKeyWidth * 0.7,
                        y: hitLineY,
                        width: whiteKeyWidth * 0.6,
                        height: pianoHeight * 0.62
                    )
                )
            )
        }
        return keys
    }

    private func countWhiteKeys(minMidi: Int, maxMidi: Int) -> Int {
        var count = 0
        for midi in minMidi...maxMidi where !EarTrainingPrecisionNotes.isBlackKeyMidi(midi) {
            count += 1
        }
        return count
    }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext(), let controller else { return }

        invalidateStaticLayerIfNeeded()

        context.setFillColor(PrecisionNoteColors.background.cgColor)
        context.fill(bounds)

        if let staticLayerImage {
            staticLayerImage.draw(in: bounds)
        } else {
            drawGuideLanes(context: context)
            drawKeyboardBase(context: context)
        }

        let phraseTime = controller.currentPhraseTimelineSec() ?? 0
        drawNotes(context: context, controller: controller, phraseTime: phraseTime)
        drawHitEffects(context: context)
        drawVanishEffects(context: context)
        drawHitLine(context: context)
        drawKeyHighlights(context: context, controller: controller)
    }

    private func renderStaticLayer() -> UIImage? {
        guard bounds.width > 0, bounds.height > 0 else { return nil }
        let renderer = UIGraphicsImageRenderer(size: bounds.size)
        return renderer.image { context in
            let cgContext = context.cgContext
            cgContext.setFillColor(PrecisionNoteColors.background.cgColor)
            cgContext.fill(bounds)
            drawGuideLanes(context: cgContext)
            drawKeyboardBase(context: cgContext)
        }
    }

    private func drawGuideLanes(context: CGContext) {
        var whiteIndex = 0
        for midi in minMidi...maxMidi {
            guard !EarTrainingPrecisionNotes.isBlackKeyMidi(midi) else { continue }
            let x = CGFloat(whiteIndex) * whiteKeyWidth
            let pitchClass = ((midi % 12) + 12) % 12
            let fillColor = whiteIndex.isMultiple(of: 2)
                ? PrecisionNoteColors.guideLaneEven
                : PrecisionNoteColors.guideLaneOdd
            context.setFillColor(fillColor.cgColor)
            context.fill(CGRect(x: x, y: 0, width: whiteKeyWidth, height: noteLaneHeight))
            if pitchClass == 11 || pitchClass == 4 {
                context.setFillColor(PrecisionNoteColors.octaveMarker.cgColor)
                context.fill(CGRect(x: x + whiteKeyWidth - 1, y: 0, width: 2, height: noteLaneHeight))
            }
            whiteIndex += 1
        }
    }

    private func drawKeyboardBase(context: CGContext) {
        for key in keyGeometries where !key.isBlack {
            context.setFillColor(PrecisionNoteColors.whiteKeyFill.cgColor)
            context.fill(key.rect)
            context.setStrokeColor(PrecisionNoteColors.keySeparatorStroke.cgColor)
            context.setLineWidth(1)
            context.stroke(
                CGRect(
                    x: key.rect.minX + 0.5,
                    y: key.rect.minY + 0.5,
                    width: key.rect.width - 1,
                    height: key.rect.height - 1
                )
            )
        }
        for key in keyGeometries where key.isBlack {
            context.setFillColor(PrecisionNoteColors.blackKeyFill.cgColor)
            context.fill(key.rect)
        }
    }

    private func drawHitLine(context: CGContext) {
        context.setStrokeColor(PrecisionNoteColors.hitLine.cgColor)
        context.setLineWidth(2)
        context.move(to: CGPoint(x: 0, y: hitLineY))
        context.addLine(to: CGPoint(x: bounds.width, y: hitLineY))
        context.strokePath()
    }

    private func drawKeyHighlights(context: CGContext, controller: EarTrainingPrecisionBattleController) {
        for key in keyGeometries {
            guard guideMidis.contains(key.midi), !controller.midiHeldKeys.contains(key.midi) else { continue }
            fillKeyHighlight(context: context, key: key, color: PrecisionNoteColors.guideHighlight)
        }
        for key in keyGeometries where controller.midiHeldKeys.contains(key.midi) {
            fillKeyHighlight(context: context, key: key, color: PrecisionNoteColors.activeKeyHighlight)
        }
    }

    private func fillKeyHighlight(context: CGContext, key: KeyGeometry, color: UIColor) {
        context.setFillColor(color.cgColor)
        if key.isBlack {
            context.fill(key.rect)
        } else {
            let inset = key.rect.width * 0.08
            context.fill(
                CGRect(
                    x: key.rect.minX + inset,
                    y: key.rect.minY,
                    width: key.rect.width - inset * 2,
                    height: key.rect.height
                )
            )
        }
    }

    private func drawNotes(
        context: CGContext,
        controller: EarTrainingPrecisionBattleController,
        phraseTime: Double
    ) {
        for note in controller.precisionNotes {
            guard let state = controller.runtimeStates[note.id] else { continue }
            if state.hiddenFromLane == true || vanishedIds.contains(note.id) { continue }
            guard let noteRect = noteRect(for: note, controller: controller, phraseTime: phraseTime) else { continue }

            let fillColor: UIColor
            let borderColor: UIColor
            switch state.judgment {
            case .good:
                fillColor = PrecisionNoteColors.goodFill
                borderColor = PrecisionNoteColors.goodBorder
            case .miss:
                fillColor = PrecisionNoteColors.missFill
                borderColor = PrecisionNoteColors.missBorder
            case .pending:
                if note.isBlackKey {
                    fillColor = PrecisionNoteColors.pendingBlackFill
                    borderColor = PrecisionNoteColors.pendingBlackBorder
                } else {
                    fillColor = PrecisionNoteColors.pendingWhiteFill
                    borderColor = PrecisionNoteColors.pendingWhiteBorder
                }
            }

            context.setFillColor(fillColor.cgColor)
            context.setStrokeColor(borderColor.cgColor)
            context.setLineWidth(1.5)
            if note.isBlackKey {
                let path = UIBezierPath(roundedRect: noteRect, cornerRadius: 4)
                context.addPath(path.cgPath)
                context.fillPath()
                context.addPath(path.cgPath)
                context.strokePath()
            } else {
                context.fill(noteRect)
                context.stroke(
                    CGRect(
                        x: noteRect.minX + 0.75,
                        y: noteRect.minY + 0.75,
                        width: noteRect.width - 1.5,
                        height: noteRect.height - 1.5
                    )
                )
            }

            if state.judgment == .good, !note.isShortNote {
                context.setFillColor(UIColor(white: 1, alpha: 0.35).cgColor)
                context.fill(CGRect(x: noteRect.minX, y: noteRect.minY, width: noteRect.width, height: 1))
            }
        }
    }

    private func noteRectForEffect(
        for note: EarTrainingPrecisionNote,
        controller: EarTrainingPrecisionBattleController,
        phraseTime: Double? = nil
    ) -> CGRect? {
        let time = phraseTime ?? controller.currentPhraseTimelineSec() ?? 0
        guard controller.runtimeStates[note.id] != nil else { return nil }

        let bottom = hitLineY - CGFloat(note.startSec - time) * noteSpeedPxPerSec
        let height = note.isShortNote
            ? EarTrainingPrecisionNotes.shortNoteHeightPx
            : max(6, CGFloat(note.durationSec) * noteSpeedPxPerSec)
        let top = bottom - height
        let lane = laneRect(forMidi: note.midi)
        return CGRect(
            x: lane.minX + lane.width * (note.isBlackKey ? 0.08 : 0.1),
            y: top,
            width: lane.width * (note.isBlackKey ? 0.84 : 0.8),
            height: height
        )
    }

    private func noteRect(
        for note: EarTrainingPrecisionNote,
        controller: EarTrainingPrecisionBattleController,
        phraseTime: Double? = nil
    ) -> CGRect? {
        let time = phraseTime ?? controller.currentPhraseTimelineSec() ?? 0
        guard let state = controller.runtimeStates[note.id] else { return nil }
        if state.hiddenFromLane == true { return nil }

        let bottom = hitLineY - CGFloat(note.startSec - time) * noteSpeedPxPerSec
        let height = note.isShortNote
            ? EarTrainingPrecisionNotes.shortNoteHeightPx
            : max(6, CGFloat(note.durationSec) * noteSpeedPxPerSec)
        let top = bottom - height
        if EarTrainingPrecisionJudge.shouldCullNoteFromLane(
            judgment: state.judgment,
            bottom: bottom,
            top: top,
            noteLaneHeight: noteLaneHeight,
            canvasHeight: bounds.height
        ) {
            return nil
        }
        let lane = laneRect(forMidi: note.midi)
        return CGRect(
            x: lane.minX + lane.width * (note.isBlackKey ? 0.08 : 0.1),
            y: top,
            width: lane.width * (note.isBlackKey ? 0.84 : 0.8),
            height: height
        )
    }

    private func drawHitEffects(context: CGContext) {
        let nowMs = CFAbsoluteTimeGetCurrent() * 1000
        for effect in hitEffects {
            let t = (nowMs - effect.startedAtMs) / Self.noteHitEffectDurationMs
            guard t < 1 else { continue }
            let alpha = 1 - t
            let glowExpand = Self.noteHitGlowExpandPx * (1 - CGFloat(t) * 0.5)
            context.setAlpha(alpha * 0.35)
            context.setFillColor(PrecisionNoteColors.hitGlow.cgColor)
            context.fill(
                CGRect(
                    x: effect.rect.minX - glowExpand,
                    y: effect.rect.minY - glowExpand,
                    width: effect.rect.width + glowExpand * 2,
                    height: effect.rect.height + glowExpand * 2
                )
            )
            context.setAlpha(alpha * 0.9)
            context.setFillColor(PrecisionNoteColors.goodFill.cgColor)
            context.fill(effect.rect)
            context.setAlpha(alpha * 0.7)
            context.setStrokeColor(PrecisionNoteColors.hitGlowStroke.cgColor)
            context.setLineWidth(1)
            context.stroke(
                CGRect(
                    x: effect.rect.minX + 0.5,
                    y: effect.rect.minY + 0.5,
                    width: effect.rect.width - 1,
                    height: effect.rect.height - 1
                )
            )
            context.setAlpha(1)
        }
    }

    private func drawVanishEffects(context: CGContext) {
        let nowMs = CFAbsoluteTimeGetCurrent() * 1000
        for effect in vanishEffects {
            let elapsed = nowMs - effect.startedAtMs
            let t = elapsed / Self.noteVanishEffectDurationMs
            guard t < 1 else { continue }
            let alpha = 1 - t

            let flashT = elapsed / Self.noteVanishFlashDurationMs
            if flashT < 1 {
                let flashAlpha = (1 - flashT) * 0.85
                let radius = Self.noteVanishFlashMaxRadiusPx * CGFloat(flashT)
                context.setAlpha(flashAlpha)
                context.setStrokeColor(
                    (flashT < 0.5
                        ? PrecisionNoteColors.vanishFlashWhite
                        : PrecisionNoteColors.vanishBurstLight
                    ).cgColor
                )
                context.setLineWidth(2)
                context.strokeEllipse(
                    in: CGRect(
                        x: effect.centerX - radius,
                        y: effect.centerY - radius,
                        width: radius * 2,
                        height: radius * 2
                    )
                )
            }

            context.setBlendMode(.screen)
            for particle in effect.particles {
                let gravityOffset = Self.noteVanishGravity * CGFloat(elapsed * elapsed)
                let px = particle.x + particle.vx * CGFloat(elapsed)
                let py = particle.y + particle.vy * CGFloat(elapsed) + gravityOffset
                let radius = particle.size * 0.5
                context.setAlpha(alpha * 0.9)
                context.setFillColor(particle.color.cgColor)
                context.fillEllipse(
                    in: CGRect(
                        x: px - radius,
                        y: py - radius,
                        width: particle.size,
                        height: particle.size
                    )
                )
            }
            context.setBlendMode(.normal)
            context.setAlpha(1)
        }
    }

    private func laneRect(forMidi midi: Int) -> CGRect {
        for key in keyGeometries where key.midi == midi {
            return key.rect
        }
        return CGRect(x: 0, y: hitLineY, width: whiteKeyWidth, height: pianoHeight)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let point = touches.first?.location(in: self), point.y >= hitLineY else { return }
        guard let midi = findKey(at: point) else { return }
        activeTouchMidi = midi
        controller?.handleNoteOn(midi: midi, velocity: 100)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        releaseTouch()
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        releaseTouch()
    }

    private func releaseTouch() {
        guard let midi = activeTouchMidi else { return }
        activeTouchMidi = nil
        controller?.handleNoteOff(midi: midi)
    }

    private func findKey(at point: CGPoint) -> Int? {
        for key in keyGeometries.reversed() where key.rect.contains(point) {
            return key.midi
        }
        return nil
    }
}

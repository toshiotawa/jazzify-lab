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

    private struct KeyGeometry {
        let midi: Int
        let isBlack: Bool
        let rect: CGRect
    }

    init(pianoHeight: CGFloat) {
        self.pianoHeight = pianoHeight
        super.init(frame: .zero)
        backgroundColor = UIColor(red: 0.02, green: 0.05, blue: 0.09, alpha: 1)
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
        minMidi = controller.keyboardRange.minMidi
        maxMidi = controller.keyboardRange.maxMidi
        recalculateLayout()
        setNeedsDisplay()
    }

    private func recalculateLayout() {
        hitLineY = bounds.height - pianoHeight
        noteLaneHeight = max(0, hitLineY)
        noteSpeedPxPerSec = noteLaneHeight / CGFloat(EarTrainingPrecisionNotes.fallLeadSec)
        keyGeometries = buildKeyGeometries()
    }

    @objc private func tick() {
        updateGuideKeys()
        setNeedsDisplay()
    }

    private func updateGuideKeys() {
        guideMidis.removeAll(keepingCapacity: true)
        guard let controller, controller.practiceMode else { return }
        guard let phraseTime = controller.currentPhraseTimelineSec() else { return }
        let windowSec = controller.currentEffectiveJudgmentWindowSec()
        for note in controller.precisionNotes {
            guard controller.runtimeStates[note.id]?.judgment == .pending else { continue }
            if EarTrainingPrecisionNotes.isNoteInGuideWindow(
                note: note,
                phraseTimeSec: phraseTime,
                windowSec: windowSec
            ) || EarTrainingPrecisionNotes.isNoteInPerformanceWindow(note: note, phraseTimeSec: phraseTime) {
                guideMidis.insert(note.midi)
            }
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

        context.setFillColor(UIColor(red: 0.02, green: 0.05, blue: 0.09, alpha: 1).cgColor)
        context.fill(bounds)

        drawGuideLane(context: context)
        context.setStrokeColor(UIColor.red.withAlphaComponent(0.9).cgColor)
        context.setLineWidth(2)
        context.move(to: CGPoint(x: 0, y: hitLineY))
        context.addLine(to: CGPoint(x: bounds.width, y: hitLineY))
        context.strokePath()

        let phraseTime = controller.currentPhraseTimelineSec() ?? 0
        drawNotes(context: context, controller: controller, phraseTime: phraseTime)
        drawKeyboard(context: context, controller: controller)
    }

    private func drawGuideLane(context: CGContext) {
        context.setFillColor(UIColor.white.withAlphaComponent(0.04).cgColor)
        context.fill(CGRect(x: 0, y: 0, width: bounds.width, height: noteLaneHeight))
    }

    private func drawNotes(
        context: CGContext,
        controller: EarTrainingPrecisionBattleController,
        phraseTime: Double
    ) {
        for note in controller.precisionNotes {
            guard let state = controller.runtimeStates[note.id] else { continue }
            if state.hiddenFromLane == true { continue }
            let bottom = hitLineY - CGFloat(note.startSec - phraseTime) * noteSpeedPxPerSec
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
                continue
            }
            let lane = laneRect(forMidi: note.midi)
            let noteRect = CGRect(
                x: lane.minX + lane.width * (note.isBlackKey ? 0.08 : 0.1),
                y: top,
                width: lane.width * (note.isBlackKey ? 0.84 : 0.8),
                height: height
            )
            let color: UIColor
            switch state.judgment {
            case .good:
                color = UIColor.systemGreen
            case .miss:
                color = UIColor.systemGray
            case .pending:
                color = note.isBlackKey ? UIColor(white: 0.15, alpha: 0.95) : UIColor(white: 0.92, alpha: 0.95)
            }
            context.setFillColor(color.cgColor)
            let path = UIBezierPath(roundedRect: noteRect, cornerRadius: note.isBlackKey ? 3 : 5)
            context.addPath(path.cgPath)
            context.fillPath()
        }
    }

    private func drawKeyboard(context: CGContext, controller: EarTrainingPrecisionBattleController) {
        for key in keyGeometries where !key.isBlack {
            context.setFillColor(UIColor(white: 0.93, alpha: 1).cgColor)
            context.fill(key.rect)
            if guideMidis.contains(key.midi) {
                context.setFillColor(UIColor.systemOrange.withAlphaComponent(0.35).cgColor)
                context.fill(key.rect)
            }
            if controller.midiHeldKeys.contains(key.midi) {
                context.setFillColor(UIColor.systemCyan.withAlphaComponent(0.35).cgColor)
                context.fill(key.rect)
            }
        }
        for key in keyGeometries where key.isBlack {
            context.setFillColor(UIColor(white: 0.12, alpha: 1).cgColor)
            context.fill(key.rect)
            if guideMidis.contains(key.midi) {
                context.setFillColor(UIColor.systemOrange.withAlphaComponent(0.45).cgColor)
                context.fill(key.rect)
            }
            if controller.midiHeldKeys.contains(key.midi) {
                context.setFillColor(UIColor.systemCyan.withAlphaComponent(0.45).cgColor)
                context.fill(key.rect)
            }
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

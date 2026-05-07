import SwiftUI

private struct ParsedVoicingNote: Hashable {
    let step: String
    let alter: Int
    let octave: Int
    let staff: Int
    let pitchClass: Int
    let voicingIndex: Int

    var degree: Int {
        let stepIndex: [String: Int] = [
            "C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6
        ]
        return octave * 7 + (stepIndex[step.uppercased()] ?? 0)
    }
}

private enum VoicingNoteParser {
    static func parse(name: String, staff: Int, voicingIndex: Int) -> ParsedVoicingNote? {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard let first = trimmed.first else { return nil }
        let step = String(first).uppercased()
        guard ["C", "D", "E", "F", "G", "A", "B"].contains(step) else { return nil }
        var index = trimmed.index(after: trimmed.startIndex)
        var alter = 0
        while index < trimmed.endIndex {
            let ch = trimmed[index]
            if ch == "x" { alter = 2; index = trimmed.index(after: index); break }
            if ch == "#" || ch == "♯" { alter += 1; index = trimmed.index(after: index); continue }
            if ch == "b" || ch == "♭" { alter -= 1; index = trimmed.index(after: index); continue }
            break
        }
        guard let octave = Int(trimmed[index...]) else { return nil }
        let baseSemitone: [String: Int] = [
            "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
        ]
        let pitchClass = (((baseSemitone[step] ?? 0) + alter) % 12 + 12) % 12
        return ParsedVoicingNote(
            step: step,
            alter: alter,
            octave: octave,
            staff: staff,
            pitchClass: pitchClass,
            voicingIndex: voicingIndex
        )
    }
}

/// 大譜表（ト音＋ヘ音）に全音符を自前描画する SwiftUI Canvas ビュー。
/// Web `ChordVoicingStaff` ([src/components/earTraining/ChordVoicingStaff.tsx]) と挙動を揃える。
struct ChordVoicingStaffView: View {
    let voicing: [String]
    let voicingStaves: [Int]
    let correctPitchClasses: Set<Int>

    private static let trebleSign = "𝄞"
    private static let bassSign = "𝄢"

    var body: some View {
        Canvas { context, size in
            draw(context: &context, size: size)
        }
        .accessibilityHidden(true)
    }

    private func draw(context: inout GraphicsContext, size: CGSize) {
        let parsedNotes: [ParsedVoicingNote] = zip(voicing, voicingStaves)
            .enumerated()
            .compactMap { offset, pair in
                let (name, staff) = pair
                let normalizedStaff = staff == 2 ? 2 : 1
                return VoicingNoteParser.parse(name: name, staff: normalizedStaff, voicingIndex: offset)
            }

        let backgroundRect = CGRect(origin: .zero, size: size)
        context.fill(Path(roundedRect: backgroundRect, cornerRadius: 14), with: .color(.white))

        let leftMargin: CGFloat = 28
        let rightMargin: CGFloat = 28
        let topMargin: CGFloat = 24
        let bottomMargin: CGFloat = 24
        let staffGap: CGFloat = 24

        let availableHeight = max(40, size.height - topMargin - bottomMargin - staffGap)
        let staffHeight = availableHeight / 2
        let staffSpacing = staffHeight / 4

        let trebleTopY = topMargin
        let bassTopY = topMargin + staffHeight + staffGap

        drawStaff(context: &context, top: trebleTopY, staffSpacing: staffSpacing, leftX: leftMargin, rightX: size.width - rightMargin)
        drawStaff(context: &context, top: bassTopY, staffSpacing: staffSpacing, leftX: leftMargin, rightX: size.width - rightMargin)

        drawClef(
            context: &context,
            sign: Self.trebleSign,
            x: leftMargin + staffSpacing * 0.4,
            y: trebleTopY + staffSpacing * 4,
            fontSize: staffSpacing * 4.4
        )
        drawClef(
            context: &context,
            sign: Self.bassSign,
            x: leftMargin + staffSpacing * 0.4,
            y: bassTopY + staffSpacing * 0.7,
            fontSize: staffSpacing * 3.4
        )

        let treble = parsedNotes.filter { $0.staff == 1 }.sorted { $0.degree < $1.degree }
        let bass = parsedNotes.filter { $0.staff == 2 }.sorted { $0.degree < $1.degree }

        let noteStartX = leftMargin + staffSpacing * 5.2
        let noteEndX = size.width - rightMargin - staffSpacing * 1.2
        let noteAreaWidth = max(staffSpacing * 1.5, noteEndX - noteStartX)
        let stackedXOffset = noteAreaWidth / 2

        for note in treble {
            drawWholeNote(
                context: &context,
                staffTopY: trebleTopY,
                staffSpacing: staffSpacing,
                referenceDegree: 4 * 7 + 6,
                note: note,
                xCenter: noteStartX + stackedXOffset,
                isCorrect: correctPitchClasses.contains(note.pitchClass)
            )
        }

        for note in bass {
            drawWholeNote(
                context: &context,
                staffTopY: bassTopY,
                staffSpacing: staffSpacing,
                referenceDegree: 3 * 7 + 1,
                note: note,
                xCenter: noteStartX + stackedXOffset,
                isCorrect: correctPitchClasses.contains(note.pitchClass)
            )
        }
    }

    private func drawStaff(
        context: inout GraphicsContext,
        top: CGFloat,
        staffSpacing: CGFloat,
        leftX: CGFloat,
        rightX: CGFloat
    ) {
        for line in 0..<5 {
            let y = top + CGFloat(line) * staffSpacing
            var path = Path()
            path.move(to: CGPoint(x: leftX, y: y))
            path.addLine(to: CGPoint(x: rightX, y: y))
            context.stroke(path, with: .color(Color(red: 0.06, green: 0.09, blue: 0.16)), lineWidth: 1.0)
        }
    }

    private func drawClef(context: inout GraphicsContext, sign: String, x: CGFloat, y: CGFloat, fontSize: CGFloat) {
        let resolved = context.resolve(
            Text(sign)
                .font(.system(size: fontSize, weight: .regular))
                .foregroundColor(Color(red: 0.06, green: 0.09, blue: 0.16))
        )
        let textSize = resolved.measure(in: CGSize(width: 200, height: 200))
        context.draw(resolved, at: CGPoint(x: x + textSize.width / 2, y: y), anchor: .center)
    }

    private func drawWholeNote(
        context: inout GraphicsContext,
        staffTopY: CGFloat,
        staffSpacing: CGFloat,
        referenceDegree: Int,
        note: ParsedVoicingNote,
        xCenter: CGFloat,
        isCorrect: Bool
    ) {
        let middleLineY = staffTopY + staffSpacing * 2
        let halfStep = staffSpacing / 2
        let yCenter = middleLineY - CGFloat(note.degree - referenceDegree) * halfStep
        let noteWidth = staffSpacing * 1.45
        let noteHeight = staffSpacing * 0.85
        let rect = CGRect(
            x: xCenter - noteWidth / 2,
            y: yCenter - noteHeight / 2,
            width: noteWidth,
            height: noteHeight
        )
        var ovalPath = Path()
        ovalPath.addEllipse(in: rect)
        let fillColor: Color = isCorrect
            ? Color(red: 0.13, green: 0.74, blue: 0.81)
            : Color(red: 0.06, green: 0.09, blue: 0.16)
        context.fill(ovalPath, with: .color(fillColor))

        drawLedgerLines(
            context: &context,
            xCenter: xCenter,
            yCenter: yCenter,
            staffTopY: staffTopY,
            staffSpacing: staffSpacing,
            referenceDegree: referenceDegree,
            degree: note.degree,
            noteWidth: noteWidth
        )

        if note.alter != 0 {
            let accidental = accidentalString(for: note.alter)
            let textSize = staffSpacing * 1.1
            let resolved = context.resolve(
                Text(accidental)
                    .font(.system(size: textSize, weight: .semibold))
                    .foregroundColor(fillColor)
            )
            context.draw(
                resolved,
                at: CGPoint(x: xCenter - noteWidth * 0.85, y: yCenter),
                anchor: .center
            )
        }
    }

    private func drawLedgerLines(
        context: inout GraphicsContext,
        xCenter: CGFloat,
        yCenter: CGFloat,
        staffTopY: CGFloat,
        staffSpacing: CGFloat,
        referenceDegree: Int,
        degree: Int,
        noteWidth: CGFloat
    ) {
        let halfStep = staffSpacing / 2
        let topLineY = staffTopY
        let bottomLineY = staffTopY + staffSpacing * 4
        let lineColor = Color(red: 0.06, green: 0.09, blue: 0.16)
        let lineWidth = noteWidth * 1.1
        let half: CGFloat = lineWidth / 2

        if yCenter < topLineY {
            var stepY = topLineY - staffSpacing
            while stepY >= yCenter - halfStep {
                if abs(stepY - yCenter) < halfStep + 0.1 {
                    var path = Path()
                    path.move(to: CGPoint(x: xCenter - half, y: stepY))
                    path.addLine(to: CGPoint(x: xCenter + half, y: stepY))
                    context.stroke(path, with: .color(lineColor), lineWidth: 1.0)
                }
                stepY -= staffSpacing
            }
        }
        if yCenter > bottomLineY {
            var stepY = bottomLineY + staffSpacing
            while stepY <= yCenter + halfStep {
                if abs(stepY - yCenter) < halfStep + 0.1 {
                    var path = Path()
                    path.move(to: CGPoint(x: xCenter - half, y: stepY))
                    path.addLine(to: CGPoint(x: xCenter + half, y: stepY))
                    context.stroke(path, with: .color(lineColor), lineWidth: 1.0)
                }
                stepY += staffSpacing
            }
        }
        _ = referenceDegree
        _ = degree
    }

    private func accidentalString(for alter: Int) -> String {
        switch alter {
        case 2: return "𝄪"
        case 1: return "♯"
        case -1: return "♭"
        case -2: return "𝄫"
        default: return ""
        }
    }
}

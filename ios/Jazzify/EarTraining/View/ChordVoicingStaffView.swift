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

private struct PositionedVoicingNote {
    let note: ParsedVoicingNote
    let yCenter: CGFloat
    let xOffset: CGFloat
    let accidentalColumn: Int
}

private struct KeySignatureMark {
    let symbol: String
    let degree: Int
}

/// コード演奏バトル専用の最小譜面ビュー。
/// 調号、全音符、変化記号、音部記号、五線、コードネームだけを描画する。
struct ChordVoicingStaffView: View {
    let voicing: [String]
    let voicingStaves: [Int]
    let chordName: String
    let keyFifths: Int = 0

    private static let trebleSign = "𝄞"
    private static let bassSign = "𝄢"
    private static let notationColor = Color.white
    private static let labelHeight: CGFloat = 28
    private static let trebleReferenceDegree = 4 * 7 + 6
    private static let bassReferenceDegree = 3 * 7 + 1

    var body: some View {
        GeometryReader { proxy in
            let labelHeight = Self.labelHeight
            let canvasHeight = max(CGFloat(1), proxy.size.height - labelHeight - 4)
            VStack(spacing: 4) {
                Text(chordName)
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundStyle(Self.notationColor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .frame(height: labelHeight)
                Canvas { context, size in
                    draw(context: &context, size: size)
                }
                .frame(height: canvasHeight)
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(chordName))
    }

    private func draw(context: inout GraphicsContext, size: CGSize) {
        let parsedNotes: [ParsedVoicingNote] = zip(voicing, voicingStaves)
            .enumerated()
            .compactMap { offset, pair in
                let (name, staff) = pair
                let normalizedStaff = staff == 2 ? 2 : 1
                return VoicingNoteParser.parse(name: name, staff: normalizedStaff, voicingIndex: offset)
            }
        guard !parsedNotes.isEmpty else { return }

        let activeStaves = [1, 2].filter { staff in
            parsedNotes.contains { $0.staff == staff }
        }
        let staffCount = max(activeStaves.count, 1)
        let verticalUnits = staffCount == 1 ? CGFloat(4) : CGFloat(11)
        let staffSpacing = min(CGFloat(18), max(CGFloat(10), (size.height - 18) / verticalUnits))
        let staffGap = staffSpacing * 3
        let groupHeight = staffCount == 1 ? staffSpacing * 4 : staffSpacing * 8 + staffGap
        let firstTopY = max(CGFloat(8), (size.height - groupHeight) / 2)
        let leftMargin = max(CGFloat(18), size.width * 0.06)
        let rightMargin = max(CGFloat(18), size.width * 0.05)
        let rightX = size.width - rightMargin

        for (index, staff) in activeStaves.enumerated() {
            let topY = firstTopY + CGFloat(index) * (staffSpacing * 4 + staffGap)
            let notes = parsedNotes
                .filter { $0.staff == staff }
                .sorted { first, second in
                    if first.degree != second.degree { return first.degree < second.degree }
                    if first.alter != second.alter { return first.alter < second.alter }
                    return first.voicingIndex < second.voicingIndex
                }
            drawStaff(context: &context, top: topY, staffSpacing: staffSpacing, leftX: leftMargin, rightX: rightX)
            drawClef(
                context: &context,
                staff: staff,
                x: leftMargin + staffSpacing * 1.7,
                staffTopY: topY,
                staffSpacing: staffSpacing
            )
            drawKeySignature(
                context: &context,
                staff: staff,
                staffTopY: topY,
                staffSpacing: staffSpacing,
                startX: leftMargin + staffSpacing * 4.8
            )

            let hasKeySignature = keyFifths != 0
            let baseX = size.width * (hasKeySignature ? 0.68 : 0.63)
            for positioned in layoutNotes(notes: notes, staffTopY: topY, staffSpacing: staffSpacing) {
                drawWholeNote(
                    context: &context,
                    staffTopY: topY,
                    staffSpacing: staffSpacing,
                    positioned: positioned,
                    baseX: baseX
                )
            }
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
            context.stroke(path, with: .color(Self.notationColor), lineWidth: 1.3)
        }
    }

    private func drawClef(
        context: inout GraphicsContext,
        staff: Int,
        x: CGFloat,
        staffTopY: CGFloat,
        staffSpacing: CGFloat
    ) {
        let sign = staff == 2 ? Self.bassSign : Self.trebleSign
        let y = staff == 2
            ? staffTopY + staffSpacing * 1.9
            : staffTopY + staffSpacing * 2.35
        let fontSize = staff == 2 ? staffSpacing * 3.0 : staffSpacing * 3.75
        let resolved = context.resolve(
            Text(sign)
                .font(.system(size: fontSize, weight: .regular))
                .foregroundColor(Self.notationColor)
        )
        context.draw(resolved, at: CGPoint(x: x, y: y), anchor: .center)
    }

    private func drawKeySignature(
        context: inout GraphicsContext,
        staff: Int,
        staffTopY: CGFloat,
        staffSpacing: CGFloat,
        startX: CGFloat
    ) {
        let marks = keySignatureMarks(staff: staff, keyFifths: keyFifths)
        guard !marks.isEmpty else { return }
        for (index, mark) in marks.enumerated() {
            let resolved = context.resolve(
                Text(mark.symbol)
                    .font(.system(size: staffSpacing * 1.35, weight: .semibold))
                    .foregroundColor(Self.notationColor)
            )
            context.draw(
                resolved,
                at: CGPoint(
                    x: startX + CGFloat(index) * staffSpacing * 0.72,
                    y: yForDegree(mark.degree, staff: staff, staffTopY: staffTopY, staffSpacing: staffSpacing)
                ),
                anchor: .center
            )
        }
    }

    private func layoutNotes(
        notes: [ParsedVoicingNote],
        staffTopY: CGFloat,
        staffSpacing: CGFloat
    ) -> [PositionedVoicingNote] {
        guard !notes.isEmpty else { return [] }

        let noteWidth = staffSpacing * 1.45
        let adjacentOffset = noteWidth * 0.5
        var offsets = Array(repeating: CGFloat.zero, count: notes.count)

        var clusterStart = 0
        for index in 1...notes.count {
            let shouldBreak = index == notes.count || notes[index].degree - notes[index - 1].degree > 1
            if shouldBreak {
                let clusterCount = index - clusterStart
                if clusterCount > 1 {
                    for noteIndex in clusterStart..<index {
                        offsets[noteIndex] = (noteIndex - clusterStart).isMultiple(of: 2)
                            ? -adjacentOffset
                            : adjacentOffset
                    }
                }
                clusterStart = index
            }
        }

        var yCenters = Array(repeating: CGFloat.zero, count: notes.count)
        for index in notes.indices {
            yCenters[index] = yForDegree(
                notes[index].degree,
                staff: notes[index].staff,
                staffTopY: staffTopY,
                staffSpacing: staffSpacing
            )
        }

        var accidentalColumns = Array(repeating: 0, count: notes.count)
        var occupiedColumnY: [CGFloat] = []
        let accidentalCollisionHeight = staffSpacing * 1.15
        let accidentalIndices = notes.indices
            .filter { notes[$0].alter != 0 }
            .sorted { yCenters[$0] < yCenters[$1] }

        for index in accidentalIndices {
            var column = 0
            while column < occupiedColumnY.count
                && abs(occupiedColumnY[column] - yCenters[index]) < accidentalCollisionHeight {
                column += 1
            }
            if column == occupiedColumnY.count {
                occupiedColumnY.append(yCenters[index])
            } else {
                occupiedColumnY[column] = yCenters[index]
            }
            accidentalColumns[index] = column
        }

        return notes.indices.map { index in
            PositionedVoicingNote(
                note: notes[index],
                yCenter: yCenters[index],
                xOffset: offsets[index],
                accidentalColumn: accidentalColumns[index]
            )
        }
    }

    private func drawWholeNote(
        context: inout GraphicsContext,
        staffTopY: CGFloat,
        staffSpacing: CGFloat,
        positioned: PositionedVoicingNote,
        baseX: CGFloat
    ) {
        let xCenter = baseX + positioned.xOffset
        let yCenter = positioned.yCenter
        let noteWidth = staffSpacing * 1.45
        let noteHeight = staffSpacing * 0.86
        let rect = CGRect(
            x: xCenter - noteWidth / 2,
            y: yCenter - noteHeight / 2,
            width: noteWidth,
            height: noteHeight
        )

        drawLedgerLines(
            context: &context,
            xCenter: xCenter,
            yCenter: yCenter,
            staffTopY: staffTopY,
            staffSpacing: staffSpacing,
            noteWidth: noteWidth
        )

        if positioned.note.alter != 0 {
            let accidental = accidentalString(for: positioned.note.alter)
            let accidentalX = min(
                xCenter - noteWidth * 1.05,
                baseX - noteWidth * 1.15 - CGFloat(positioned.accidentalColumn) * staffSpacing * 0.85
            )
            let resolved = context.resolve(
                Text(accidental)
                    .font(.system(size: staffSpacing * 1.3, weight: .semibold))
                    .foregroundColor(Self.notationColor)
            )
            context.draw(resolved, at: CGPoint(x: accidentalX, y: yCenter), anchor: .center)
        }

        var ovalPath = Path()
        ovalPath.addEllipse(in: rect)
        context.stroke(ovalPath, with: .color(Self.notationColor), lineWidth: max(CGFloat(2.2), staffSpacing * 0.18))
    }

    private func drawLedgerLines(
        context: inout GraphicsContext,
        xCenter: CGFloat,
        yCenter: CGFloat,
        staffTopY: CGFloat,
        staffSpacing: CGFloat,
        noteWidth: CGFloat
    ) {
        let topLineY = staffTopY
        let bottomLineY = staffTopY + staffSpacing * 4
        let lineWidth = noteWidth * 1.25
        let half: CGFloat = lineWidth / 2

        if yCenter < topLineY {
            var stepY = topLineY - staffSpacing
            while stepY >= yCenter - 0.1 {
                drawLedgerLine(context: &context, xCenter: xCenter, halfWidth: half, y: stepY)
                stepY -= staffSpacing
            }
        }
        if yCenter > bottomLineY {
            var stepY = bottomLineY + staffSpacing
            while stepY <= yCenter + 0.1 {
                drawLedgerLine(context: &context, xCenter: xCenter, halfWidth: half, y: stepY)
                stepY += staffSpacing
            }
        }
    }

    private func drawLedgerLine(
        context: inout GraphicsContext,
        xCenter: CGFloat,
        halfWidth: CGFloat,
        y: CGFloat
    ) {
        var path = Path()
        path.move(to: CGPoint(x: xCenter - halfWidth, y: y))
        path.addLine(to: CGPoint(x: xCenter + halfWidth, y: y))
        context.stroke(path, with: .color(Self.notationColor), lineWidth: 1.25)
    }

    private func yForDegree(
        _ degree: Int,
        staff: Int,
        staffTopY: CGFloat,
        staffSpacing: CGFloat
    ) -> CGFloat {
        let referenceDegree = staff == 2
            ? Self.bassReferenceDegree
            : Self.trebleReferenceDegree
        let middleLineY = staffTopY + staffSpacing * 2
        return middleLineY - CGFloat(degree - referenceDegree) * (staffSpacing / 2)
    }

    private func keySignatureMarks(staff: Int, keyFifths: Int) -> [KeySignatureMark] {
        let fifths = max(-7, min(7, keyFifths))
        guard fifths != 0 else { return [] }
        let degreeMap = keySignatureDegreeMap(staff: staff)
        let degrees = fifths > 0
            ? Array(degreeMap.sharps.prefix(fifths))
            : Array(degreeMap.flats.prefix(abs(fifths)))
        let symbol = fifths > 0 ? "♯" : "♭"
        return degrees.map { KeySignatureMark(symbol: symbol, degree: $0) }
    }

    private func keySignatureDegreeMap(staff: Int) -> (sharps: [Int], flats: [Int]) {
        if staff == 2 {
            return (
                sharps: [
                    3 * 7 + 3,
                    3 * 7 + 0,
                    3 * 7 + 4,
                    3 * 7 + 1,
                    2 * 7 + 5,
                    3 * 7 + 2,
                    2 * 7 + 6
                ],
                flats: [
                    2 * 7 + 6,
                    3 * 7 + 2,
                    2 * 7 + 5,
                    3 * 7 + 1,
                    2 * 7 + 4,
                    3 * 7 + 0,
                    2 * 7 + 3
                ]
            )
        }
        return (
            sharps: [
                5 * 7 + 3,
                5 * 7 + 0,
                5 * 7 + 4,
                5 * 7 + 1,
                4 * 7 + 5,
                5 * 7 + 2,
                4 * 7 + 6
            ],
            flats: [
                4 * 7 + 6,
                5 * 7 + 2,
                4 * 7 + 5,
                5 * 7 + 1,
                4 * 7 + 4,
                5 * 7 + 0,
                4 * 7 + 3
            ]
        )
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

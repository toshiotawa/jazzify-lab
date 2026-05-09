import SwiftUI

/// Web `ChordVoicingStaff.tsx` と揃えた Bravura / SMuFL。
private enum MusicNotationFont {
    static let name = "Bravura"
    /// Web: `CLEF_FONT_SIZE = SP * 4`
    static let clefFontScale: CGFloat = 4
    /// Web: `ACCIDENTAL_FONT_SIZE = SP * 2.9`
    static let accidentalFontScale: CGFloat = 2.9
    static let smuflGClef = "\u{E050}"
    static let smuflFClef = "\u{E062}"
}

private func smuflAccidentalGlyph(for alter: Int) -> String {
    switch alter {
    case 2: return "\u{E263}"
    case 1: return "\u{E262}"
    case -1: return "\u{E260}"
    case -2: return "\u{E264}"
    case 0: return "\u{E261}"
    default: return ""
    }
}

private struct ParsedVoicingNote: Hashable {
    let step: String
    let alter: Int
    let octave: Int
    let midi: Int
    let staff: Int
    let pitchClass: Int
    let voicingIndex: Int
    let displayAccidentalAlter: Int?

    var degree: Int {
        let stepIndex: [String: Int] = [
            "C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6
        ]
        return octave * 7 + (stepIndex[step.uppercased()] ?? 0)
    }

    func withDisplayAccidentalAlter(_ value: Int?) -> ParsedVoicingNote {
        ParsedVoicingNote(
            step: step,
            alter: alter,
            octave: octave,
            midi: midi,
            staff: staff,
            pitchClass: pitchClass,
            voicingIndex: voicingIndex,
            displayAccidentalAlter: value
        )
    }
}

private enum VoicingNoteParser {
    static func parse(name: String, staff: Int?, voicingIndex: Int) -> ParsedVoicingNote? {
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
        let semitone = (baseSemitone[step] ?? 0) + alter
        let pitchClass = ((semitone % 12) + 12) % 12
        let midi = (octave + 1) * 12 + semitone
        let normalizedStaff = staff ?? (midi < 60 ? 2 : 1)
        return ParsedVoicingNote(
            step: step,
            alter: alter,
            octave: octave,
            midi: midi,
            staff: normalizedStaff == 2 ? 2 : 1,
            pitchClass: pitchClass,
            voicingIndex: voicingIndex,
            displayAccidentalAlter: nil
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
    let alter: Int
    let degree: Int
}

private let sharpKeySignatureSteps: [String] = ["F", "C", "G", "D", "A", "E", "B"]
private let flatKeySignatureSteps: [String] = ["B", "E", "A", "D", "G", "C", "F"]

private func clampedKeyFifths(_ keyFifths: Int) -> Int {
    max(-7, min(7, keyFifths))
}

private func keySignatureAlter(step: String, keyFifths: Int) -> Int {
    let fifths = clampedKeyFifths(keyFifths)
    if fifths > 0 {
        return sharpKeySignatureSteps.prefix(fifths).contains(step) ? 1 : 0
    }
    if fifths < 0 {
        return flatKeySignatureSteps.prefix(abs(fifths)).contains(step) ? -1 : 0
    }
    return 0
}

private func accidentalStateKey(_ note: ParsedVoicingNote) -> String {
    "\(note.staff):\(note.step):\(note.octave)"
}

private func applyRequiredAccidentals(
    to notes: [ParsedVoicingNote],
    keyFifths: Int
) -> [ParsedVoicingNote] {
    var state: [String: Int] = [:]
    return applyRequiredAccidentals(to: notes, keyFifths: keyFifths, state: &state)
}

private func applyRequiredAccidentals(
    to notes: [ParsedVoicingNote],
    keyFifths: Int,
    state: inout [String: Int]
) -> [ParsedVoicingNote] {
    let updated = notes.map { note in
        let key = accidentalStateKey(note)
        let currentAlter = state[key] ?? keySignatureAlter(step: note.step, keyFifths: keyFifths)
        return note.withDisplayAccidentalAlter(currentAlter == note.alter ? nil : note.alter)
    }
    for note in notes {
        state[accidentalStateKey(note)] = note.alter
    }
    return updated
}

/// コード演奏バトル専用の最小譜面ビュー。
/// 調号、全音符、変化記号、音部記号、五線、コードネームだけを描画する。
struct ChordVoicingStaffView: View {
    let voicing: [String]
    let voicingStaves: [Int]
    let chordName: String
    let keyFifths: Int = 0

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
        let shouldInferStaves = voicingStaves.isEmpty
        let rawParsedNotes: [ParsedVoicingNote] = voicing.enumerated().compactMap { offset, name in
            let staff = shouldInferStaves || !voicingStaves.indices.contains(offset)
                ? nil
                : (voicingStaves[offset] == 2 ? 2 : 1)
            return VoicingNoteParser.parse(name: name, staff: staff, voicingIndex: offset)
        }
        let parsedNotes = applyRequiredAccidentals(to: rawParsedNotes, keyFifths: keyFifths)
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
        let glyph = staff == 2 ? MusicNotationFont.smuflFClef : MusicNotationFont.smuflGClef
        let fontSize = staffSpacing * MusicNotationFont.clefFontScale
        let y = staff == 2
            ? staffTopY + staffSpacing * 1.75
            : staffTopY + staffSpacing * 2.35
        let resolved = context.resolve(
            Text(glyph)
                .font(.custom(MusicNotationFont.name, size: fontSize))
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
            let glyph = smuflAccidentalGlyph(for: mark.alter)
            let resolved = context.resolve(
                Text(glyph)
                    .font(.custom(MusicNotationFont.name, size: staffSpacing * MusicNotationFont.accidentalFontScale))
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
            .filter { notes[$0].displayAccidentalAlter != nil }
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

        if let displayAccidentalAlter = positioned.note.displayAccidentalAlter {
            let accidental = accidentalString(for: displayAccidentalAlter)
            let accidentalX = min(
                xCenter - noteWidth * 0.95,
                baseX - noteWidth * 1.05 - CGFloat(positioned.accidentalColumn) * staffSpacing * 0.75
            )
            let resolved = context.resolve(
                Text(accidental)
                    .font(.custom(MusicNotationFont.name, size: staffSpacing * MusicNotationFont.accidentalFontScale))
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
        let alter = fifths > 0 ? 1 : -1
        return degrees.map { KeySignatureMark(alter: alter, degree: $0) }
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
        smuflAccidentalGlyph(for: alter)
    }
}

// MARK: - Multi-group staff (Web `ChordVoicingStaff` voicingGroups)

/// Web `ChordVoicingCompletionPulse` と同等の完成エフェクトワンショット指示。
struct ChordVoicingCompletionPulse: Equatable {
    enum Kind: String, Equatable {
        case voicingPartial
        case harmonyComplete
    }
    let groupId: UUID
    let kind: Kind
    let eventKey: Int
}

/// アクティブコード名ラベルの Global 座標フレーム。Controller がエネルギー演出の起点として利用する。
struct ChordVoicingActiveChordLabelFrameKey: PreferenceKey {
    static var defaultValue: CGRect? = nil
    static func reduce(value: inout CGRect?, nextValue: () -> CGRect?) {
        if let next = nextValue() {
            value = next
        }
    }
}

/// Web `ChordVoicingStaff` の複数グループ（2 小節・密集・正解色）を Canvas で近似描画する。
struct ChordVoicingStaffGroupsView: View {
    let groups: [EarTrainingChordVoicingStaffLayout.GroupInput]
    let denseCurrentMeasureLayout: Bool
    let keyFifths: Int
    let activeGroupId: UUID?
    let correctPitchClassesByGroupId: [UUID: Set<Int>]
    let completionPulse: ChordVoicingCompletionPulse?

    init(
        groups: [EarTrainingChordVoicingStaffLayout.GroupInput],
        denseCurrentMeasureLayout: Bool,
        keyFifths: Int,
        activeGroupId: UUID?,
        correctPitchClassesByGroupId: [UUID: Set<Int>],
        completionPulse: ChordVoicingCompletionPulse? = nil
    ) {
        self.groups = groups
        self.denseCurrentMeasureLayout = denseCurrentMeasureLayout
        self.keyFifths = keyFifths
        self.activeGroupId = activeGroupId
        self.correctPitchClassesByGroupId = correctPitchClassesByGroupId
        self.completionPulse = completionPulse
    }

    static let notationColor = Color.white
    static let correctColor = Color(red: 0.13, green: 0.77, blue: 0.37)
    /// Web `NEXT_TARGET_COLOR` / `TOP_POINTER_COLOR`（#f39800 マリンゴールド）
    static let nextTargetColor = Color(red: 243 / 255, green: 152 / 255, blue: 0 / 255)
    static let topPointerColor = nextTargetColor
    static let activeLabelColor = Color(red: 0.98, green: 0.8, blue: 0.09)
    private static let trebleReferenceDegree = 4 * 7 + 6
    private static let bassReferenceDegree = 3 * 7 + 1

    var body: some View {
        GeometryReader { proxy in
            let w = max(1, proxy.size.width)
            let h = max(1, proxy.size.height)
            let canvasSize = CGSize(width: w, height: h)
            let overlay = Self.computeOverlayLayout(
                size: canvasSize,
                groups: groups,
                dense: denseCurrentMeasureLayout,
                keyFifths: keyFifths,
                correctByGroup: correctPitchClassesByGroupId
            )
            let activeLabelGlobalFrame = activeLabelGlobalRect(proxy: proxy, overlay: overlay)
            ZStack(alignment: .topLeading) {
                Canvas { context, size in
                    Self.drawAll(
                        context: &context,
                        size: size,
                        groups: groups,
                        dense: denseCurrentMeasureLayout,
                        keyFifths: keyFifths,
                        activeGroupId: activeGroupId,
                        correctByGroup: correctPitchClassesByGroupId
                    )
                }
                .frame(width: w, height: h)

                if let pulse = effectivePulse() {
                    PulseOverlayView(
                        pulse: pulse,
                        overlay: overlay,
                        groupsByMeasureZero: measureZeroGroupIds(),
                        canvasSize: canvasSize
                    )
                    .id(pulse.eventKey)
                }
            }
            .preference(key: ChordVoicingActiveChordLabelFrameKey.self, value: activeLabelGlobalFrame)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text("Chord voicing staff"))
    }

    private func activeLabelGlobalRect(
        proxy: GeometryProxy,
        overlay: OverlayLayout
    ) -> CGRect? {
        guard let aid = activeGroupId, let center = overlay.chordLabelCenters[aid] else {
            return nil
        }
        let globalFrame = proxy.frame(in: .global)
        let centerX = globalFrame.minX + center.x
        let centerY = globalFrame.minY + center.y
        let labelSize = CGSize(width: 64, height: 28)
        return CGRect(
            x: centerX - labelSize.width / 2,
            y: centerY - labelSize.height / 2,
            width: labelSize.width,
            height: labelSize.height
        )
    }

    private func effectivePulse() -> ChordVoicingCompletionPulse? {
        guard let pulse = completionPulse else { return nil }
        let exists = groups.contains { $0.id == pulse.groupId && $0.measureOffset == 0 }
        return exists ? pulse : nil
    }

    private func measureZeroGroupIds() -> Set<UUID> {
        var set = Set<UUID>()
        for g in groups where g.measureOffset == 0 {
            set.insert(g.id)
        }
        return set
    }

    private struct StaffLayoutMetrics {
        let measureDividerX: CGFloat
        let measureOneNoteLeftX: CGFloat
        let measureOneNoteRightX: CGFloat
        let measureTwoNoteLeftX: CGFloat
        let measureTwoNoteRightX: CGFloat
    }

    private struct ParsedGroupRenderItem {
        let group: EarTrainingChordVoicingStaffLayout.GroupInput
        let slotIndex: Int
        let slotCount: Int
        let notes: [ParsedVoicingNote]

        func withNotes(_ nextNotes: [ParsedVoicingNote]) -> ParsedGroupRenderItem {
            ParsedGroupRenderItem(
                group: group,
                slotIndex: slotIndex,
                slotCount: slotCount,
                notes: nextNotes
            )
        }
    }

    /// 計算済みのコード名ラベル（Canvas 描画座標のみ保持）
    private struct ChordLabelFrame {
        let text: String
        let color: Color
        let center: CGPoint
        let fontSize: CGFloat
    }

    private struct ChordLabelLayoutRow {
        let item: ParsedGroupRenderItem
        let color: Color
        let fullWidth: CGFloat
        var centerX: CGFloat

        var leftEdge: CGFloat { centerX - fullWidth / 2 }
        var rightEdge: CGFloat { centerX + fullWidth / 2 }
    }

    private struct StaffSystemGeometry {
        let staffSpacing: CGFloat
        let staffGap: CGFloat
        let groupHeight: CGFloat
        let firstTopY: CGFloat
        let labelCenterY: CGFloat
        let sp: CGFloat
    }

    private static func staffLayoutMetrics(width: CGFloat, keyFifths: Int, wideFirstMeasure: Bool) -> StaffLayoutMetrics {
        let sp = max(8, width * (12 / 720))
        let staffLineLeft = width * (24 / 720)
        let staffLineRight = width * (696 / 720)
        let fifths = max(0, min(7, abs(keyFifths)))
        let keySigLeft = width * (88 / 720)
        let keySigGap = sp * 1.05
        let accFont = sp * 2.9
        let keySignatureEndX = fifths > 0
            ? keySigLeft + CGFloat(fifths - 1) * keySigGap + accFont * 0.4
            : keySigLeft
        let dividerX = wideFirstMeasure
            ? staffLineLeft + (staffLineRight - staffLineLeft) * 0.9
            : width / 2
        let measureOneLeft = max(width * (138 / 720), keySignatureEndX + sp * 3.1)
        let measureOneRight = max(measureOneLeft + sp * 3, dividerX - sp * 2.5)
        let measureTwoLeft = min(dividerX + sp * 2.1, staffLineRight - sp * 2.2)
        let measureTwoRight = staffLineRight - sp * 2.5
        return StaffLayoutMetrics(
            measureDividerX: dividerX,
            measureOneNoteLeftX: measureOneLeft,
            measureOneNoteRightX: measureOneRight,
            measureTwoNoteLeftX: measureTwoLeft,
            measureTwoNoteRightX: measureTwoRight
        )
    }

    /// 1. 入力グループを解析し、小節内スロットと臨時記号を付与した描画アイテムを返す。
    private static func buildParsedRenderItems(
        groups: [EarTrainingChordVoicingStaffLayout.GroupInput],
        keyFifths: Int
    ) -> [ParsedGroupRenderItem] {
        var measureSlotCounts: [Int: Int] = [:]
        for g in groups {
            measureSlotCounts[g.measureOffset, default: 0] += 1
        }
        var nextSlot: [Int: Int] = [:]
        var parsedGroups: [ParsedGroupRenderItem] = []
        for g in groups {
            let mo = g.measureOffset
            let si = nextSlot[mo, default: 0]
            nextSlot[mo] = si + 1
            let sc = measureSlotCounts[mo] ?? 1
            let notes = parseGroupNotes(g)
            parsedGroups.append(ParsedGroupRenderItem(group: g, slotIndex: si, slotCount: sc, notes: notes))
        }
        var accidentalStateByMeasure: [Int: [String: Int]] = [:]
        return parsedGroups.map { item in
            var state = accidentalStateByMeasure[item.group.measureOffset] ?? [:]
            let notes = applyRequiredAccidentals(to: item.notes, keyFifths: keyFifths, state: &state)
            accidentalStateByMeasure[item.group.measureOffset] = state
            return item.withNotes(notes)
        }
    }

    private static func measureChordNameFullWidth(
        context: inout GraphicsContext,
        chordName: String,
        color: Color,
        fontSize: CGFloat,
        horizontalPadding: CGFloat
    ) -> CGFloat {
        let resolved = context.resolve(
            Text(chordName)
                .font(.system(size: fontSize, weight: .heavy, design: .rounded))
                .foregroundColor(color)
        )
        let measured = resolved.measure(in: CGSize(width: CGFloat.greatestFiniteMagnitude, height: 80))
        return measured.width + horizontalPadding
    }

    /// 希望 X を起点に左右 clamp → 左から右へ重なりを解消 → はみ出し補正。
    private static func resolveChordLabelHorizontalLayout(
        rows: inout [ChordLabelLayoutRow],
        leftBound: CGFloat,
        rightBound: CGFloat,
        minGap: CGFloat
    ) {
        rows.sort { $0.centerX < $1.centerX }
        for i in rows.indices.dropFirst() {
            let previousRight = rows[i - 1].rightEdge
            let currentLeft = rows[i].leftEdge
            if currentLeft < previousRight + minGap {
                rows[i].centerX += previousRight + minGap - currentLeft
            }
        }
        if let lastIndex = rows.indices.last {
            let overflow = rows[lastIndex].rightEdge - rightBound
            if overflow > 0 {
                for i in rows.indices {
                    rows[i].centerX -= overflow
                }
            }
        }
        if let firstIndex = rows.indices.first {
            let underflow = leftBound - rows[firstIndex].leftEdge
            if underflow > 0 {
                for i in rows.indices {
                    rows[i].centerX += underflow
                }
            }
        }
    }

    private static func makeChordLabelFrames(
        context: inout GraphicsContext,
        parsedItems: [ParsedGroupRenderItem],
        layout: StaffLayoutMetrics,
        labelCenterY: CGFloat,
        leftBound: CGFloat,
        rightBound: CGFloat,
        sp: CGFloat,
        activeGroupId: UUID?
    ) -> [ChordLabelFrame] {
        let named = parsedItems.filter { !$0.group.chordName.isEmpty }
        guard !named.isEmpty else { return [] }
        let minGap = sp * 0.8
        let horizontalPadding = sp * 0.8
        var fontSize: CGFloat = 18
        let minFont: CGFloat = 12
        while fontSize >= minFont {
            var rows: [ChordLabelLayoutRow] = named.map { item in
                let color = item.group.id == activeGroupId ? activeLabelColor : notationColor
                let desiredX = groupBaseX(
                    group: item.group,
                    slotIndex: item.slotIndex,
                    slotCount: item.slotCount,
                    layout: layout
                )
                let fullWidth = measureChordNameFullWidth(
                    context: &context,
                    chordName: item.group.chordName,
                    color: color,
                    fontSize: fontSize,
                    horizontalPadding: horizontalPadding
                )
                let clampedX = min(
                    max(desiredX, leftBound + fullWidth / 2),
                    rightBound - fullWidth / 2
                )
                return ChordLabelLayoutRow(
                    item: item,
                    color: color,
                    fullWidth: fullWidth,
                    centerX: clampedX
                )
            }
            resolveChordLabelHorizontalLayout(
                rows: &rows,
                leftBound: leftBound,
                rightBound: rightBound,
                minGap: minGap
            )
            let fits = rows.allSatisfy { $0.leftEdge >= leftBound - 0.5 && $0.rightEdge <= rightBound + 0.5 }
            if fits {
                return rows.map {
                    ChordLabelFrame(
                        text: $0.item.group.chordName,
                        color: $0.color,
                        center: CGPoint(x: $0.centerX, y: labelCenterY),
                        fontSize: fontSize
                    )
                }
            }
            fontSize -= 1
        }
        var rows: [ChordLabelLayoutRow] = named.map { item in
            let color = item.group.id == activeGroupId ? activeLabelColor : notationColor
            let desiredX = groupBaseX(
                group: item.group,
                slotIndex: item.slotIndex,
                slotCount: item.slotCount,
                layout: layout
            )
            let fullWidth = measureChordNameFullWidth(
                context: &context,
                chordName: item.group.chordName,
                color: color,
                fontSize: minFont,
                horizontalPadding: horizontalPadding
            )
            let clampedX = min(
                max(desiredX, leftBound + fullWidth / 2),
                rightBound - fullWidth / 2
            )
            return ChordLabelLayoutRow(item: item, color: color, fullWidth: fullWidth, centerX: clampedX)
        }
        resolveChordLabelHorizontalLayout(
            rows: &rows,
            leftBound: leftBound,
            rightBound: rightBound,
            minGap: minGap
        )
        return rows.map {
            ChordLabelFrame(
                text: $0.item.group.chordName,
                color: $0.color,
                center: CGPoint(x: $0.centerX, y: labelCenterY),
                fontSize: minFont
            )
        }
    }

    private static func drawChordLabels(context: inout GraphicsContext, labels: [ChordLabelFrame]) {
        for label in labels {
            let resolved = context.resolve(
                Text(label.text)
                    .font(.system(size: label.fontSize, weight: .heavy, design: .rounded))
                    .foregroundColor(label.color)
            )
            context.draw(resolved, at: label.center, anchor: .center)
        }
    }

    /// 2. コード名レーンを先に確保し、その下に五線ブロックが収まる縦レイアウトを計算する。
    private static func computeStaffSystemGeometry(
        size: CGSize,
        width: CGFloat,
        activeStaves: [Int]
    ) -> StaffSystemGeometry {
        let sp = max(8, width * (12 / 720))
        let labelTopPadding = sp * 0.4
        let labelBandCoreHeight = min(CGFloat(34), max(CGFloat(24), sp * 2.6))
        let reservedLabelTop = labelTopPadding + labelBandCoreHeight
        let labelCenterY = labelTopPadding + labelBandCoreHeight / 2
        let labelBottomGap = sp * 0.9
        let availableStaffHeight = max(CGFloat(0), size.height - reservedLabelTop - labelBottomGap)
        let staffSpacing = min(
            18,
            max(10, (availableStaffHeight - sp * 8) / CGFloat(max(11, activeStaves.count * 7 + 3)))
        )
        let staffGap = staffSpacing * 3
        let groupHeight = activeStaves.count == 1 ? staffSpacing * 4 : staffSpacing * 8 + staffGap
        let firstTopY = reservedLabelTop + labelBottomGap + max(CGFloat(0), (availableStaffHeight - groupHeight) / 2)
        return StaffSystemGeometry(
            staffSpacing: staffSpacing,
            staffGap: staffGap,
            groupHeight: groupHeight,
            firstTopY: firstTopY,
            labelCenterY: labelCenterY,
            sp: sp
        )
    }

    private struct VoicingBattleHints {
        let nextHintVoicingIndex: Int?
        let topPointer: CGPoint?
    }

    private static func sortStaffNotesForVoicing(_ notes: [ParsedVoicingNote]) -> [ParsedVoicingNote] {
        notes.sorted {
            if $0.degree != $1.degree { return $0.degree < $1.degree }
            if $0.alter != $1.alter { return $0.alter < $1.alter }
            return $0.voicingIndex < $1.voicingIndex
        }
    }

    private static func computeVoicingBattleHints(
        parsedGroups: [ParsedGroupRenderItem],
        layout: StaffLayoutMetrics,
        activeGroupId: UUID?,
        correctByGroup: [UUID: Set<Int>],
        activeStaves: [Int],
        firstTopY: CGFloat,
        staffSpacing: CGFloat,
        staffGap: CGFloat
    ) -> VoicingBattleHints {
        guard let aid = activeGroupId,
              let activeItem = parsedGroups.first(where: { $0.group.id == aid }),
              activeItem.group.measureOffset == 0,
              !activeItem.group.isRest,
              !activeItem.notes.isEmpty else {
            return VoicingBattleHints(nextHintVoicingIndex: nil, topPointer: nil)
        }
        let pressed = correctByGroup[aid] ?? []
        struct Row {
            let voicingIndex: Int
            let xCenter: CGFloat
            let yCenter: CGFloat
            let degree: Int
            let midi: Int
        }
        var rowsForTop: [Row] = []
        var candidates: [Row] = []
        for (staffIndex, staff) in activeStaves.enumerated() {
            let topY = firstTopY + CGFloat(staffIndex) * (staffSpacing * 4 + staffGap)
            let baseX = groupBaseX(group: activeItem.group, slotIndex: activeItem.slotIndex, slotCount: activeItem.slotCount, layout: layout)
            let staffNotes = sortStaffNotesForVoicing(activeItem.notes.filter { $0.staff == staff })
            for positioned in groupsLayoutNotes(notes: staffNotes, staffTopY: topY, staffSpacing: staffSpacing) {
                let xCenter = baseX + positioned.xOffset
                let row = Row(
                    voicingIndex: positioned.note.voicingIndex,
                    xCenter: xCenter,
                    yCenter: positioned.yCenter,
                    degree: positioned.note.degree,
                    midi: positioned.note.midi
                )
                rowsForTop.append(row)
                if !pressed.contains(positioned.note.pitchClass) {
                    candidates.append(row)
                }
            }
        }
        guard !candidates.isEmpty else {
            return VoicingBattleHints(nextHintVoicingIndex: nil, topPointer: nil)
        }
        let best = candidates.min(by: { a, b in
            if a.xCenter != b.xCenter { return a.xCenter < b.xCenter }
            if a.degree != b.degree { return a.degree < b.degree }
            return a.voicingIndex < b.voicingIndex
        })!
        guard let highest = rowsForTop.max(by: { $0.midi < $1.midi }) else {
            return VoicingBattleHints(nextHintVoicingIndex: best.voicingIndex, topPointer: nil)
        }
        let topPoint = CGPoint(x: highest.xCenter, y: highest.yCenter)
        return VoicingBattleHints(nextHintVoicingIndex: best.voicingIndex, topPointer: topPoint)
    }

    private static func groupsDrawTopPointer(
        context: inout GraphicsContext,
        xCenter: CGFloat,
        yCenter: CGFloat,
        staffSpacing: CGFloat
    ) {
        let noteHeight = staffSpacing * 0.86
        let triH = staffSpacing * 0.55
        let halfW = staffSpacing * 0.42
        let topEdgeY = yCenter - noteHeight / 2
        let tipY = topEdgeY - staffSpacing * 0.35
        let baseY = tipY - triH
        var path = Path()
        path.move(to: CGPoint(x: xCenter, y: tipY))
        path.addLine(to: CGPoint(x: xCenter - halfW, y: baseY))
        path.addLine(to: CGPoint(x: xCenter + halfW, y: baseY))
        path.closeSubpath()
        context.fill(path, with: .color(topPointerColor))
    }

    private static func drawAll(
        context: inout GraphicsContext,
        size: CGSize,
        groups: [EarTrainingChordVoicingStaffLayout.GroupInput],
        dense: Bool,
        keyFifths: Int,
        activeGroupId: UUID?,
        correctByGroup: [UUID: Set<Int>]
    ) {
        guard !groups.isEmpty else { return }
        let w = size.width
        let layout = staffLayoutMetrics(width: w, keyFifths: keyFifths, wideFirstMeasure: dense)
        let parsedGroups = buildParsedRenderItems(groups: groups, keyFifths: keyFifths)

        let hasRest = parsedGroups.contains { $0.group.isRest }
        let activeStaves = hasRest ? [1, 2] : [1, 2].filter { st in
            parsedGroups.contains { $0.notes.contains { $0.staff == st } }
        }
        let geo = computeStaffSystemGeometry(size: size, width: w, activeStaves: activeStaves)
        let margin = geo.sp * 0.35
        let leftBound = w * (24 / 720) + margin
        let rightBound = w * (696 / 720) - margin
        let labelFrames = makeChordLabelFrames(
            context: &context,
            parsedItems: parsedGroups,
            layout: layout,
            labelCenterY: geo.labelCenterY,
            leftBound: leftBound,
            rightBound: rightBound,
            sp: geo.sp,
            activeGroupId: activeGroupId
        )

        let battleHints = computeVoicingBattleHints(
            parsedGroups: parsedGroups,
            layout: layout,
            activeGroupId: activeGroupId,
            correctByGroup: correctByGroup,
            activeStaves: activeStaves,
            firstTopY: geo.firstTopY,
            staffSpacing: geo.staffSpacing,
            staffGap: geo.staffGap
        )

        for (staffIndex, staff) in activeStaves.enumerated() {
            let topY = geo.firstTopY + CGFloat(staffIndex) * (geo.staffSpacing * 4 + geo.staffGap)
            let leftX = w * (24 / 720)
            let rightX = w * (696 / 720)
            groupsDrawStaff(
                context: &context,
                top: topY,
                staffSpacing: geo.staffSpacing,
                leftX: leftX,
                rightX: rightX,
                dividerX: layout.measureDividerX
            )
            groupsDrawClef(
                context: &context,
                staff: staff,
                x: leftX + geo.staffSpacing * 1.7,
                staffTopY: topY,
                staffSpacing: geo.staffSpacing
            )
            groupsDrawKeySignature(
                context: &context,
                staff: staff,
                staffTopY: topY,
                staffSpacing: geo.staffSpacing,
                startX: leftX + geo.staffSpacing * 4.8,
                keyFifths: keyFifths
            )

            for item in parsedGroups {
                let baseX = groupBaseX(group: item.group, slotIndex: item.slotIndex, slotCount: item.slotCount, layout: layout)
                if item.group.isRest {
                    groupsDrawWholeRest(context: &context, baseX: baseX, staffTopY: topY, staffSpacing: geo.staffSpacing)
                    continue
                }
                let staffNotes = sortStaffNotesForVoicing(item.notes.filter { $0.staff == staff })
                let correctSet = correctByGroup[item.group.id] ?? []
                for positioned in groupsLayoutNotes(notes: staffNotes, staffTopY: topY, staffSpacing: geo.staffSpacing) {
                    let isCorrect = correctSet.contains(positioned.note.pitchClass)
                    let isNextHint =
                        !isCorrect
                        && item.group.id == activeGroupId
                        && battleHints.nextHintVoicingIndex == positioned.note.voicingIndex
                    let noteColor: Color = isCorrect ? correctColor : (isNextHint ? nextTargetColor : notationColor)
                    groupsDrawWholeNote(
                        context: &context,
                        staffTopY: topY,
                        staffSpacing: geo.staffSpacing,
                        positioned: positioned,
                        baseX: baseX,
                        color: noteColor
                    )
                }
            }
        }

        drawChordLabels(context: &context, labels: labelFrames)

        if let tp = battleHints.topPointer {
            groupsDrawTopPointer(context: &context, xCenter: tp.x, yCenter: tp.y, staffSpacing: geo.staffSpacing)
        }
    }

    private static func groupBaseX(
        group: EarTrainingChordVoicingStaffLayout.GroupInput,
        slotIndex: Int,
        slotCount: Int,
        layout: StaffLayoutMetrics
    ) -> CGFloat {
        let left = group.measureOffset == 0 ? layout.measureOneNoteLeftX : layout.measureTwoNoteLeftX
        let right = group.measureOffset == 0 ? layout.measureOneNoteRightX : layout.measureTwoNoteRightX
        let slotWidth = (right - left) / CGFloat(max(1, slotCount))
        return left + slotWidth * (CGFloat(slotIndex) + 0.5)
    }

    private static func parseGroupNotes(_ group: EarTrainingChordVoicingStaffLayout.GroupInput) -> [ParsedVoicingNote] {
        let v = group.voicing
        let st = group.voicingStaves
        let shouldInferStaves = st.isEmpty
        return v.enumerated().compactMap { offset, name in
            let staff = shouldInferStaves || !st.indices.contains(offset)
                ? nil
                : (st[offset] == 2 ? 2 : 1)
            return VoicingNoteParser.parse(name: name, staff: staff, voicingIndex: offset)
        }
    }

    private static func groupsDrawStaff(
        context: inout GraphicsContext,
        top: CGFloat,
        staffSpacing: CGFloat,
        leftX: CGFloat,
        rightX: CGFloat,
        dividerX: CGFloat
    ) {
        for line in 0..<5 {
            let y = top + CGFloat(line) * staffSpacing
            var path = Path()
            path.move(to: CGPoint(x: leftX, y: y))
            path.addLine(to: CGPoint(x: rightX, y: y))
            context.stroke(path, with: .color(notationColor), lineWidth: 1.3)
        }
        for x in [dividerX, rightX] {
            var barline = Path()
            barline.move(to: CGPoint(x: x, y: top))
            barline.addLine(to: CGPoint(x: x, y: top + staffSpacing * 4))
            context.stroke(barline, with: .color(notationColor), lineWidth: 1.3)
        }
    }

    private static func groupsDrawClef(
        context: inout GraphicsContext,
        staff: Int,
        x: CGFloat,
        staffTopY: CGFloat,
        staffSpacing: CGFloat
    ) {
        let glyph = staff == 2 ? MusicNotationFont.smuflFClef : MusicNotationFont.smuflGClef
        let fontSize = staffSpacing * MusicNotationFont.clefFontScale
        let y = staff == 2
            ? staffTopY + staffSpacing * 1.75
            : staffTopY + staffSpacing * 2.35
        let resolved = context.resolve(
            Text(glyph)
                .font(.custom(MusicNotationFont.name, size: fontSize))
                .foregroundColor(notationColor)
        )
        context.draw(resolved, at: CGPoint(x: x, y: y), anchor: .center)
    }

    private static func groupsDrawKeySignature(
        context: inout GraphicsContext,
        staff: Int,
        staffTopY: CGFloat,
        staffSpacing: CGFloat,
        startX: CGFloat,
        keyFifths: Int
    ) {
        let marks = groupsKeySignatureMarks(staff: staff, keyFifths: keyFifths)
        guard !marks.isEmpty else { return }
        for (index, mark) in marks.enumerated() {
            let glyph = smuflAccidentalGlyph(for: mark.alter)
            let resolved = context.resolve(
                Text(glyph)
                    .font(.custom(MusicNotationFont.name, size: staffSpacing * MusicNotationFont.accidentalFontScale))
                    .foregroundColor(notationColor)
            )
            context.draw(
                resolved,
                at: CGPoint(
                    x: startX + CGFloat(index) * staffSpacing * 0.72,
                    y: groupsYForDegree(mark.degree, staff: staff, staffTopY: staffTopY, staffSpacing: staffSpacing)
                ),
                anchor: .center
            )
        }
    }

    private static func groupsKeySignatureMarks(staff: Int, keyFifths: Int) -> [KeySignatureMark] {
        let fifths = max(-7, min(7, keyFifths))
        guard fifths != 0 else { return [] }
        let degreeMap = groupsKeySignatureDegreeMap(staff: staff)
        let degrees = fifths > 0
            ? Array(degreeMap.sharps.prefix(fifths))
            : Array(degreeMap.flats.prefix(abs(fifths)))
        let alter = fifths > 0 ? 1 : -1
        return degrees.map { KeySignatureMark(alter: alter, degree: $0) }
    }

    private static func groupsKeySignatureDegreeMap(staff: Int) -> (sharps: [Int], flats: [Int]) {
        if staff == 2 {
            return (
                sharps: [24, 21, 25, 22, 19, 23, 20],
                flats: [20, 23, 19, 22, 18, 21, 17]
            )
        }
        return (
            sharps: [38, 35, 39, 36, 33, 37, 34],
            flats: [34, 37, 33, 36, 32, 35, 31]
        )
    }

    private static func groupsYForDegree(_ degree: Int, staff: Int, staffTopY: CGFloat, staffSpacing: CGFloat) -> CGFloat {
        let ref = staff == 2 ? bassReferenceDegree : trebleReferenceDegree
        let middleLineY = staffTopY + staffSpacing * 2
        return middleLineY - CGFloat(degree - ref) * (staffSpacing / 2)
    }

    private static func groupsLayoutNotes(
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
            yCenters[index] = groupsYForDegree(
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
            .filter { notes[$0].displayAccidentalAlter != nil }
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

    private static func groupsDrawWholeNote(
        context: inout GraphicsContext,
        staffTopY: CGFloat,
        staffSpacing: CGFloat,
        positioned: PositionedVoicingNote,
        baseX: CGFloat,
        color: Color
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
        groupsDrawLedgerLines(
            context: &context,
            xCenter: xCenter,
            yCenter: yCenter,
            staffTopY: staffTopY,
            staffSpacing: staffSpacing,
            noteWidth: noteWidth,
            color: color
        )
        if let displayAccidentalAlter = positioned.note.displayAccidentalAlter {
            let accidental = groupsAccidentalString(for: displayAccidentalAlter)
            let accidentalX = min(
                xCenter - noteWidth * 0.95,
                baseX - noteWidth * 1.05 - CGFloat(positioned.accidentalColumn) * staffSpacing * 0.75
            )
            let resolved = context.resolve(
                Text(accidental)
                    .font(.custom(MusicNotationFont.name, size: staffSpacing * MusicNotationFont.accidentalFontScale))
                    .foregroundColor(color)
            )
            context.draw(resolved, at: CGPoint(x: accidentalX, y: yCenter), anchor: .center)
        }
        var ovalPath = Path()
        ovalPath.addEllipse(in: rect)
        context.stroke(ovalPath, with: .color(color), lineWidth: max(CGFloat(2.2), staffSpacing * 0.18))
    }

    private static func groupsDrawLedgerLines(
        context: inout GraphicsContext,
        xCenter: CGFloat,
        yCenter: CGFloat,
        staffTopY: CGFloat,
        staffSpacing: CGFloat,
        noteWidth: CGFloat,
        color: Color
    ) {
        let topLineY = staffTopY
        let bottomLineY = staffTopY + staffSpacing * 4
        let lineWidth = noteWidth * 1.25
        let half = lineWidth / 2
        if yCenter < topLineY {
            var stepY = topLineY - staffSpacing
            while stepY >= yCenter - 0.1 {
                groupsDrawLedgerLine(context: &context, xCenter: xCenter, halfWidth: half, y: stepY, color: color)
                stepY -= staffSpacing
            }
        }
        if yCenter > bottomLineY {
            var stepY = bottomLineY + staffSpacing
            while stepY <= yCenter + 0.1 {
                groupsDrawLedgerLine(context: &context, xCenter: xCenter, halfWidth: half, y: stepY, color: color)
                stepY += staffSpacing
            }
        }
    }

    private static func groupsDrawLedgerLine(
        context: inout GraphicsContext,
        xCenter: CGFloat,
        halfWidth: CGFloat,
        y: CGFloat,
        color: Color
    ) {
        var path = Path()
        path.move(to: CGPoint(x: xCenter - halfWidth, y: y))
        path.addLine(to: CGPoint(x: xCenter + halfWidth, y: y))
        context.stroke(path, with: .color(color), lineWidth: 1.25)
    }

    private static func groupsDrawWholeRest(
        context: inout GraphicsContext,
        baseX: CGFloat,
        staffTopY: CGFloat,
        staffSpacing: CGFloat
    ) {
        let rect = CGRect(
            x: baseX - staffSpacing * 0.35,
            y: staffTopY + staffSpacing * 1.25,
            width: staffSpacing * 0.7,
            height: staffSpacing * 0.35
        )
        context.fill(Path(rect), with: .color(notationColor.opacity(0.85)))
    }

    private static func groupsAccidentalString(for alter: Int) -> String {
        smuflAccidentalGlyph(for: alter)
    }

    // MARK: - Completion pulse overlay layout

    /// 完成エフェクト用に各種位置情報を返す（Canvas 描画と同じ計算を再利用）。
    struct OverlayLayout {
        let chordLabelCenters: [UUID: CGPoint]
        let currentMeasureFrame: CGRect?
        /// 各グループ内の正解済み音符の幾何情報（オーバーレイ用ハロー描画に使用）
        let correctNotesByGroupId: [UUID: [PulseNoteInfo]]
    }

    struct PulseNoteInfo: Equatable, Identifiable {
        let id: String
        let staff: Int
        let center: CGPoint
        let size: CGSize
    }

    static func computeOverlayLayout(
        size: CGSize,
        groups: [EarTrainingChordVoicingStaffLayout.GroupInput],
        dense: Bool,
        keyFifths: Int,
        correctByGroup: [UUID: Set<Int>]
    ) -> OverlayLayout {
        guard !groups.isEmpty, size.width > 0, size.height > 0 else {
            return OverlayLayout(
                chordLabelCenters: [:],
                currentMeasureFrame: nil,
                correctNotesByGroupId: [:]
            )
        }
        let w = size.width
        let layout = staffLayoutMetrics(width: w, keyFifths: keyFifths, wideFirstMeasure: dense)
        let parsedGroups = buildParsedRenderItems(groups: groups, keyFifths: keyFifths)
        let hasRest = parsedGroups.contains { $0.group.isRest }
        let activeStaves = hasRest ? [1, 2] : [1, 2].filter { st in
            parsedGroups.contains { $0.notes.contains { $0.staff == st } }
        }
        let geo = computeStaffSystemGeometry(size: size, width: w, activeStaves: activeStaves)

        var labelCenters: [UUID: CGPoint] = [:]
        for item in parsedGroups where !item.group.chordName.isEmpty {
            let baseX = groupBaseX(group: item.group, slotIndex: item.slotIndex, slotCount: item.slotCount, layout: layout)
            labelCenters[item.group.id] = CGPoint(x: baseX, y: geo.labelCenterY)
        }

        var measureFrame: CGRect? = nil
        let hasCurrentMeasure = parsedGroups.contains { $0.group.measureOffset == 0 }
        if hasCurrentMeasure && !activeStaves.isEmpty {
            let leftX = w * (24 / 720)
            let staffBlockHeight = CGFloat(activeStaves.count - 1) * (geo.staffSpacing * 4 + geo.staffGap) + geo.staffSpacing * 4
            measureFrame = CGRect(
                x: leftX,
                y: geo.firstTopY,
                width: layout.measureDividerX - leftX,
                height: staffBlockHeight
            )
        }

        var correctNotes: [UUID: [PulseNoteInfo]] = [:]
        for (staffIndex, staff) in activeStaves.enumerated() {
            let topY = geo.firstTopY + CGFloat(staffIndex) * (geo.staffSpacing * 4 + geo.staffGap)
            for item in parsedGroups {
                guard !item.group.isRest else { continue }
                let correctSet = correctByGroup[item.group.id] ?? []
                guard !correctSet.isEmpty else { continue }
                let baseX = groupBaseX(group: item.group, slotIndex: item.slotIndex, slotCount: item.slotCount, layout: layout)
                let staffNotes = sortStaffNotesForVoicing(item.notes.filter { $0.staff == staff })
                for positioned in groupsLayoutNotes(notes: staffNotes, staffTopY: topY, staffSpacing: geo.staffSpacing) {
                    guard correctSet.contains(positioned.note.pitchClass) else { continue }
                    let xCenter = baseX + positioned.xOffset
                    let info = PulseNoteInfo(
                        id: "\(staff)-\(positioned.note.voicingIndex)",
                        staff: staff,
                        center: CGPoint(x: xCenter, y: positioned.yCenter),
                        size: CGSize(width: geo.staffSpacing * 1.45, height: geo.staffSpacing * 0.86)
                    )
                    correctNotes[item.group.id, default: []].append(info)
                }
            }
        }

        return OverlayLayout(
            chordLabelCenters: labelCenters,
            currentMeasureFrame: measureFrame,
            correctNotesByGroupId: correctNotes
        )
    }
}

/// 完成エフェクトオーバーレイ。`.id(eventKey)` で再マウントし、各サブビューの onAppear からアニメーションを開始する。
private struct PulseOverlayView: View {
    let pulse: ChordVoicingCompletionPulse
    let overlay: ChordVoicingStaffGroupsView.OverlayLayout
    let groupsByMeasureZero: Set<UUID>
    let canvasSize: CGSize

    private static let frameDuration: TimeInterval = 0.28
    private static let labelDuration: TimeInterval = 0.28
    private static let haloCompleteDuration: TimeInterval = 0.28
    private static let haloPartialDuration: TimeInterval = 0.22
    private static let pulseGreen = Color(red: 0.13, green: 0.77, blue: 0.37)
    private static let haloGreen = Color(red: 0.36, green: 0.86, blue: 0.55)

    var body: some View {
        ZStack(alignment: .topLeading) {
            if pulse.kind == .harmonyComplete, let frame = overlay.currentMeasureFrame {
                FadeOutView(duration: Self.frameDuration, initialOpacity: 0.9) {
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Self.pulseGreen, lineWidth: 3)
                        .frame(width: frame.width + 8, height: frame.height + 16)
                        .position(x: frame.midX, y: frame.midY)
                }
                .allowsHitTesting(false)
            }

            if pulse.kind == .harmonyComplete, let center = overlay.chordLabelCenters[pulse.groupId] {
                FadeOutView(duration: Self.labelDuration, initialOpacity: 0.85) {
                    Capsule()
                        .fill(Self.pulseGreen)
                        .frame(width: 64, height: 28)
                        .blur(radius: 9)
                        .position(x: center.x, y: center.y)
                }
                .allowsHitTesting(false)
            }

            ForEach(haloItems(), id: \.compositeId) { item in
                FadeOutView(
                    duration: pulse.kind == .harmonyComplete ? Self.haloCompleteDuration : Self.haloPartialDuration,
                    initialOpacity: 0.65
                ) {
                    Ellipse()
                        .fill(Self.haloGreen)
                        .frame(width: item.note.size.width * 1.9, height: item.note.size.height * 2.4)
                        .blur(radius: 4)
                        .position(x: item.note.center.x, y: item.note.center.y)
                }
                .allowsHitTesting(false)
            }
        }
        .frame(width: canvasSize.width, height: canvasSize.height)
        .allowsHitTesting(false)
    }

    private struct HaloItem {
        let groupId: UUID
        let note: ChordVoicingStaffGroupsView.PulseNoteInfo
        var compositeId: String { "\(groupId.uuidString)-\(note.id)" }
    }

    private func haloItems() -> [HaloItem] {
        let targetGroups: Set<UUID> = pulse.kind == .harmonyComplete
            ? groupsByMeasureZero
            : [pulse.groupId]
        var items: [HaloItem] = []
        for gid in targetGroups {
            guard let notes = overlay.correctNotesByGroupId[gid] else { continue }
            for note in notes {
                items.append(HaloItem(groupId: gid, note: note))
            }
        }
        return items
    }
}

/// onAppear からの片道フェードアウト。タイマーは SwiftUI 標準アニメーションだけを使う。
private struct FadeOutView<Content: View>: View {
    let duration: TimeInterval
    let initialOpacity: Double
    @ViewBuilder let content: () -> Content
    @State private var opacity: Double

    init(duration: TimeInterval, initialOpacity: Double = 0.9, @ViewBuilder content: @escaping () -> Content) {
        self.duration = duration
        self.initialOpacity = initialOpacity
        self.content = content
        self._opacity = State(initialValue: initialOpacity)
    }

    var body: some View {
        content()
            .opacity(opacity)
            .onAppear {
                opacity = initialOpacity
                withAnimation(.easeOut(duration: duration)) {
                    opacity = 0
                }
            }
    }
}

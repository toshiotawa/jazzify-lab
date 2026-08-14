import Foundation

/// Web `earTrainingCanonicalPhraseNotes.ts` 相当。OSMD / 精密で共有する正本ノーツ列。
enum EarTrainingCanonicalPhraseNotes {
    static let midiXmlMatchWindowSec = 0.1
    private static let sameTargetEpsilonSec = 0.0005

    enum TimingSource: String, Sendable {
        case midi
        case musicxml
        case midiMergedXml = "midi_merged_xml"
    }

    struct CanonicalPhraseNote: Sendable {
        let midi: Int
        let startSec: Double
        let durationSec: Double
        let measureNumber: Int
        let clusterId: String
        let source: TimingSource
        let beatStartInMeasure: Double
        let attackOrderIndex: Int
        let spelling: String?
        let partIndex: Int?
        let staff: Int?
    }

    struct BuildParams: Sendable {
        let musicXmlText: String?
        let midiData: Data?
        let midiNotes: [(midi: Int, startSec: Double, durationSec: Double?)]?
        let bpm: Int
        let beatsPerMeasure: Int
        let isSwing: Bool
        let transposeOffset: Int
        let audioAnchorMs: Int?
    }

    struct BuildResult: Sendable {
        let notes: [CanonicalPhraseNote]
        let timingSource: TimingSource
        let attacks: [ChordOsmdMusicXmlAttack]
    }

    struct OsmdRhythmTargetDraft: Sendable {
        let id: UUID
        let label: String
        let targetTimeSec: Double
        let measureNumber: Int
        let midiCounts: [Int: Int]
        let noteSpellings: [String]
        let orderIndex: Int
    }

    private struct ResolvedAttackTiming {
        let attack: ChordOsmdMusicXmlAttack
        let orderIndex: Int
        let xmlStartSec: Double
        let resolvedStartSec: Double
        let source: TimingSource
        let noteDurations: [Int: Double]
        let matchedMidiByPitch: [Int: (startSec: Double, durationSec: Double)]
    }

    private struct MidiNoteLike {
        let midi: Int
        let startSec: Double
        let durationSec: Double
    }

    static func build(_ params: BuildParams) -> BuildResult {
        let xmlText = params.musicXmlText?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let attacks = xmlText.isEmpty
            ? []
            : EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(xmlText)
        let straightBeatKeys: Set<String>? = params.isSwing && !xmlText.isEmpty
            ? EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdStraightBeatKeys(xmlText)
            : nil

        var midiNotes: [MidiNoteLike] = []
        if let midiData = params.midiData, !midiData.isEmpty,
           let result = try? EarTrainingPrecisionMidi.buildFromMidi(
               data: midiData,
               bpm: params.bpm,
               transposeOffset: 0
           ) {
            midiNotes = result.notes.map {
                MidiNoteLike(midi: $0.midi, startSec: $0.startSec, durationSec: $0.durationSec)
            }
        } else if let fallbackNotes = params.midiNotes, !fallbackNotes.isEmpty {
            let defaultDuration = (60.0 / Double(max(1, params.bpm))) * 0.5
            midiNotes = fallbackNotes.map { note in
                MidiNoteLike(
                    midi: note.midi,
                    startSec: note.startSec,
                    durationSec: note.durationSec ?? defaultDuration
                )
            }
        }

        var notes: [CanonicalPhraseNote] = []
        if !attacks.isEmpty {
            let durationMaps = xmlText.isEmpty
                ? [:]
                : buildNoteDurationsFromMusicXml(
                    xmlText,
                    bpm: params.bpm,
                    beatsPerMeasure: params.beatsPerMeasure,
                    isSwing: params.isSwing,
                    straightBeatKeys: straightBeatKeys
                )
            let resolved = resolveAttackTimings(
                attacks: attacks,
                midiNotes: midiNotes,
                bpm: params.bpm,
                beatsPerMeasure: params.beatsPerMeasure,
                isSwing: params.isSwing,
                straightBeatKeys: straightBeatKeys,
                durationMaps: durationMaps
            )
            notes = resolvedAttacksToCanonicalNotes(resolved.resolved, transposeOffset: params.transposeOffset)
                + unusedMidiToCanonicalNotes(
                    resolved.unusedMidi,
                    transposeOffset: params.transposeOffset,
                    startOrderIndex: resolved.resolved.count
                )
        } else if !midiNotes.isEmpty {
            notes = unusedMidiToCanonicalNotes(midiNotes, transposeOffset: params.transposeOffset, startOrderIndex: 0)
        }

        notes.sort { lhs, rhs in
            if abs(lhs.startSec - rhs.startSec) > sameTargetEpsilonSec {
                return lhs.startSec < rhs.startSec
            }
            if lhs.attackOrderIndex != rhs.attackOrderIndex {
                return lhs.attackOrderIndex < rhs.attackOrderIndex
            }
            if lhs.midi != rhs.midi {
                return lhs.midi < rhs.midi
            }
            return lhs.clusterId < rhs.clusterId
        }

        notes = applyAudioAnchor(notes, audioAnchorMs: params.audioAnchorMs)
        return BuildResult(
            notes: notes,
            timingSource: deriveTimingSource(notes),
            attacks: attacks
        )
    }

    static func toPrecisionNotes(_ notes: [CanonicalPhraseNote], bpm: Int) -> [EarTrainingPrecisionNote] {
        var precisionNotes: [EarTrainingPrecisionNote] = []
        precisionNotes.reserveCapacity(notes.count)
        for (index, note) in notes.enumerated() {
            precisionNotes.append(
                EarTrainingPrecisionNote(
                    id: "c:\(note.clusterId):\(note.midi):\(index)",
                    midi: note.midi,
                    startSec: note.startSec,
                    durationSec: note.durationSec,
                    isBlackKey: EarTrainingPrecisionNotes.isBlackKeyMidi(note.midi),
                    measureNumber: note.measureNumber,
                    isShortNote: EarTrainingPrecisionNotes.isShortNoteDuration(durationSec: note.durationSec, bpm: bpm)
                )
            )
        }
        return EarTrainingPrecisionNotes.trimOverlappingSamePitchNotes(notes: precisionNotes, classificationBpm: bpm)
    }

    static func toOsmdRhythmTargets(
        notes: [CanonicalPhraseNote],
        chords: [EarTrainingPhraseChordDetail],
        attacks: [ChordOsmdMusicXmlAttack],
        transposeOffset: Int = 0
    ) -> [OsmdRhythmTargetDraft] {
        guard !notes.isEmpty else { return [] }

        var measureLabels: [Int: String] = [:]
        var playableMeasures = Set<Int>()
        var disabledMeasures = Set<Int>()
        for chord in chords {
            guard let measureNumber = chord.measureNumber else { continue }
            let measure = max(1, measureNumber)
            if chord.inputDisabled {
                disabledMeasures.insert(measure)
                continue
            }
            playableMeasures.insert(measure)
            if measureLabels[measure] == nil {
                measureLabels[measure] = EarTrainingMusicXmlTransposer.transposeChordLabel(
                    chord.chordName,
                    semitones: transposeOffset
                )
            }
        }
        let useAllScoreMeasures = playableMeasures.isEmpty && disabledMeasures.isEmpty

        var notesByCluster: [String: [CanonicalPhraseNote]] = [:]
        for note in notes {
            notesByCluster[note.clusterId, default: []].append(note)
        }

        var attackByOrder: [Int: ChordOsmdMusicXmlAttack] = [:]
        for (index, attack) in attacks.enumerated() {
            attackByOrder[index] = attack
        }

        let clusterEntries = notesByCluster.sorted { lhs, rhs in
            let aStart = lhs.value.first?.startSec ?? 0
            let bStart = rhs.value.first?.startSec ?? 0
            if abs(aStart - bStart) > sameTargetEpsilonSec {
                return aStart < bStart
            }
            let aOrder = lhs.value.first?.attackOrderIndex ?? 0
            let bOrder = rhs.value.first?.attackOrderIndex ?? 0
            return aOrder < bOrder
        }

        var targets: [OsmdRhythmTargetDraft] = []
        var orderIndex = 0
        for (clusterId, clusterNotes) in clusterEntries {
            guard let first = clusterNotes.first else { continue }
            let attack = attackByOrder[first.attackOrderIndex]
            let measureNumber = attack?.measureNumber ?? first.measureNumber
            if !useAllScoreMeasures, !playableMeasures.isEmpty, !playableMeasures.contains(measureNumber) {
                continue
            }
            if !useAllScoreMeasures, disabledMeasures.contains(measureNumber) {
                continue
            }

            var midiCounts: [Int: Int] = [:]
            for note in clusterNotes {
                midiCounts[note.midi, default: 0] += 1
            }
            let spellings = attack?.spellings ?? []
            let noteSpellings = EarTrainingBattleOsuCircleNoteLabels.uniqueSpellings(
                midis: clusterNotes.map(\.midi),
                spellings: spellings
            )

            targets.append(
                OsmdRhythmTargetDraft(
                    id: rhythmTargetId(
                        clusterId: clusterId,
                        measureNumber: measureNumber,
                        beatStart: first.beatStartInMeasure
                    ),
                    label: measureLabels[measureNumber] ?? "—",
                    targetTimeSec: first.startSec,
                    measureNumber: measureNumber,
                    midiCounts: midiCounts,
                    noteSpellings: noteSpellings,
                    orderIndex: orderIndex
                )
            )
            orderIndex += 1
        }
        return targets
    }

    // MARK: - Private

    private static func clusterIdForAttack(_ attack: ChordOsmdMusicXmlAttack, orderIndex: Int) -> String {
        String(format: "attack:%d:%.4f:%d", attack.measureNumber, attack.beatStartInMeasure, orderIndex)
    }

    /// 段ごとの Swing 判定スコープ。partIndex 不明の attack は従来どおり全体判定にフォールバックする。
    private static func attackSwingScope(
        _ attack: ChordOsmdMusicXmlAttack
    ) -> (partIndex: Int, staff: Int)? {
        guard let partIndex = attack.partIndex else { return nil }
        return (partIndex, attack.staff ?? 1)
    }

    private static func resolveAttackXmlStartSec(
        _ attack: ChordOsmdMusicXmlAttack,
        bpm: Int,
        beatsPerMeasure: Int,
        isSwing: Bool,
        straightBeatKeys: Set<String>?
    ) -> Double {
        let scope = attackSwingScope(attack)
        return EarTrainingChordOsmdMusicXmlNormalizer.chordOsmdBeatToTargetTimeSec(
            measureNumber: attack.measureNumber,
            beatStartInMeasure: attack.beatStartInMeasure,
            bpm: Double(bpm),
            beatsPerMeasure: beatsPerMeasure,
            isSwing: isSwing,
            straightBeatKeys: straightBeatKeys,
            swingPartIndex: scope?.partIndex,
            swingStaff: scope?.staff
        )
    }

    private static func buildNoteDurationsFromMusicXml(
        _ musicXmlText: String,
        bpm: Int,
        beatsPerMeasure: Int,
        isSwing: Bool,
        straightBeatKeys: Set<String>?
    ) -> [String: [Int: Double]] {
        var byCluster: [String: [Int: Double]] = [:]
        EarTrainingPrecisionMusicXmlClusterWalker.forEachCluster(musicXmlText: musicXmlText) { context in
            let timing = resolveClusterTimingSec(
                measureNumber: context.measureNumber,
                beatStartInMeasure: context.beatStartInMeasure,
                durationDivisions: context.durationDivisions,
                divisions: context.divisions,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing,
                straightBeatKeys: straightBeatKeys,
                partIndex: context.partIndex,
                staff: context.staff
            )
            let clusterKey = String(
                format: "%d:%.4f:%d:%d",
                context.measureNumber,
                context.beatStartInMeasure,
                context.partIndex,
                context.staff
            )
            var midiDurations = byCluster[clusterKey] ?? [:]
            for noteElement in context.clusterNotes {
                if EarTrainingPrecisionMusicXmlClusterWalker.hasTieStop(on: noteElement) {
                    continue
                }
                guard let midi = EarTrainingPrecisionMusicXmlClusterWalker.midiFromNoteElement(
                    noteElement,
                    keyFifths: context.keyFifths
                ) else {
                    continue
                }
                midiDurations[midi] = timing.durationSec
            }
            if !midiDurations.isEmpty {
                byCluster[clusterKey] = midiDurations
            }
        }
        return byCluster
    }

    private static func resolveClusterTimingSec(
        measureNumber: Int,
        beatStartInMeasure: Double,
        durationDivisions: Double,
        divisions: Int,
        bpm: Int,
        beatsPerMeasure: Int,
        isSwing: Bool,
        straightBeatKeys: Set<String>?,
        partIndex: Int,
        staff: Int
    ) -> (startSec: Double, durationSec: Double) {
        if !isSwing {
            let startSec = EarTrainingChordOsmdMusicXmlNormalizer.chordOsmdBeatToTargetTimeSec(
                measureNumber: measureNumber,
                beatStartInMeasure: beatStartInMeasure,
                bpm: Double(bpm),
                beatsPerMeasure: beatsPerMeasure
            )
            let beatDurationSec = 60.0 / Double(max(1, bpm))
            let quarters = durationDivisions / Double(max(1, divisions))
            return (startSec, max(0.05, quarters * beatDurationSec))
        }
        let quarters = durationDivisions / Double(max(1, divisions))
        let startSec = EarTrainingChordOsmdMusicXmlNormalizer.chordOsmdBeatToTargetTimeSec(
            measureNumber: measureNumber,
            beatStartInMeasure: beatStartInMeasure,
            bpm: Double(bpm),
            beatsPerMeasure: beatsPerMeasure,
            isSwing: true,
            straightBeatKeys: straightBeatKeys,
            swingPartIndex: partIndex,
            swingStaff: staff
        )
        let endSec = EarTrainingChordOsmdMusicXmlNormalizer.chordOsmdBeatToTargetTimeSec(
            measureNumber: measureNumber,
            beatStartInMeasure: beatStartInMeasure + quarters,
            bpm: Double(bpm),
            beatsPerMeasure: beatsPerMeasure,
            isSwing: true,
            straightBeatKeys: straightBeatKeys,
            swingPartIndex: partIndex,
            swingStaff: staff
        )
        return (startSec, max(0.05, endSec - startSec))
    }

    private static func findClusterDurations(
        _ attack: ChordOsmdMusicXmlAttack,
        durationMaps: [String: [Int: Double]]
    ) -> [Int: Double] {
        let clusterKey = String(
            format: "%d:%.4f:%d:%d",
            attack.measureNumber,
            attack.beatStartInMeasure,
            attack.partIndex ?? 0,
            attack.staff ?? 1
        )
        return durationMaps[clusterKey] ?? [:]
    }

    private static func resolveAttackTimings(
        attacks: [ChordOsmdMusicXmlAttack],
        midiNotes: [MidiNoteLike],
        bpm: Int,
        beatsPerMeasure: Int,
        isSwing: Bool,
        straightBeatKeys: Set<String>?,
        durationMaps: [String: [Int: Double]]
    ) -> (resolved: [ResolvedAttackTiming], unusedMidi: [MidiNoteLike]) {
        var usedMidiIndices = Set<Int>()
        var resolved: [ResolvedAttackTiming] = []
        let defaultDuration = (60.0 / Double(max(1, bpm))) * 0.5

        for (orderIndex, attack) in attacks.enumerated() {
            let xmlStartSec = resolveAttackXmlStartSec(
                attack,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                isSwing: isSwing,
                straightBeatKeys: straightBeatKeys
            )
            var matchedStarts: [Double] = []
            var matchedMidiByPitch: [Int: (startSec: Double, durationSec: Double)] = [:]
            for targetMidi in attack.midis {
                var bestIndex: Int?
                var bestDelta = Double.greatestFiniteMagnitude
                for (index, note) in midiNotes.enumerated() {
                    guard !usedMidiIndices.contains(index), note.midi == targetMidi else { continue }
                    let delta = abs(note.startSec - xmlStartSec)
                    if delta <= midiXmlMatchWindowSec, delta < bestDelta {
                        bestDelta = delta
                        bestIndex = index
                    }
                }
                if let bestIndex {
                    usedMidiIndices.insert(bestIndex)
                    let matched = midiNotes[bestIndex]
                    matchedStarts.append(matched.startSec)
                    matchedMidiByPitch[targetMidi] = (matched.startSec, matched.durationSec)
                }
            }

            let noteDurations = findClusterDurations(attack, durationMaps: durationMaps)
            var resolvedStartSec = xmlStartSec
            var source: TimingSource = .musicxml
            if !matchedStarts.isEmpty {
                resolvedStartSec = matchedStarts.min() ?? xmlStartSec
                source = matchedStarts.count == attack.midis.count ? .midi : .midiMergedXml
            }

            var durations = noteDurations
            if durations.isEmpty {
                for midi in attack.midis {
                    durations[midi] = defaultDuration
                }
            }

            resolved.append(
                ResolvedAttackTiming(
                    attack: attack,
                    orderIndex: orderIndex,
                    xmlStartSec: xmlStartSec,
                    resolvedStartSec: resolvedStartSec,
                    source: source,
                    noteDurations: durations,
                    matchedMidiByPitch: matchedMidiByPitch
                )
            )
        }

        let unusedMidi = midiNotes.enumerated().compactMap { index, note -> MidiNoteLike? in
            usedMidiIndices.contains(index) ? nil : note
        }
        return (resolved, unusedMidi)
    }

    private static func resolvedAttacksToCanonicalNotes(
        _ resolved: [ResolvedAttackTiming],
        transposeOffset: Int
    ) -> [CanonicalPhraseNote] {
        var notes: [CanonicalPhraseNote] = []
        for item in resolved {
            let clusterId = clusterIdForAttack(item.attack, orderIndex: item.orderIndex)
            for (index, midi) in item.attack.midis.enumerated() {
                let spelling = item.attack.spellings.indices.contains(index) ? item.attack.spellings[index] : nil
                let matched = item.matchedMidiByPitch[midi]
                let durationSec = matched?.durationSec ?? item.noteDurations[midi] ?? 0.25
                notes.append(
                    CanonicalPhraseNote(
                        midi: midi + transposeOffset,
                        startSec: item.resolvedStartSec,
                        durationSec: durationSec,
                        measureNumber: item.attack.measureNumber,
                        clusterId: clusterId,
                        source: item.source,
                        beatStartInMeasure: item.attack.beatStartInMeasure,
                        attackOrderIndex: item.orderIndex,
                        spelling: spelling,
                        partIndex: nil,
                        staff: nil
                    )
                )
            }
        }
        return notes
    }

    private static func unusedMidiToCanonicalNotes(
        _ unusedMidi: [MidiNoteLike],
        transposeOffset: Int,
        startOrderIndex: Int
    ) -> [CanonicalPhraseNote] {
        var clusters: [Int: [MidiNoteLike]] = [:]
        for note in unusedMidi {
            let tickKey = Int((note.startSec / sameTargetEpsilonSec).rounded())
            clusters[tickKey, default: []].append(note)
        }

        var notes: [CanonicalPhraseNote] = []
        var orderIndex = startOrderIndex
        for key in clusters.keys.sorted() {
            guard let cluster = clusters[key], let first = cluster.first else { continue }
            let clusterId = String(format: "midi:%.4f:%d", first.startSec, orderIndex)
            for note in cluster {
                notes.append(
                    CanonicalPhraseNote(
                        midi: note.midi + transposeOffset,
                        startSec: first.startSec,
                        durationSec: note.durationSec,
                        measureNumber: 1,
                        clusterId: clusterId,
                        source: .midi,
                        beatStartInMeasure: 1,
                        attackOrderIndex: orderIndex,
                        spelling: nil,
                        partIndex: nil,
                        staff: nil
                    )
                )
            }
            orderIndex += 1
        }
        return notes
    }

    private static func applyAudioAnchor(_ notes: [CanonicalPhraseNote], audioAnchorMs: Int?) -> [CanonicalPhraseNote] {
        let anchorSec = Double(audioAnchorMs ?? 0) / 1000.0
        guard abs(anchorSec) > 1e-9 else { return notes }
        return notes.map { note in
            CanonicalPhraseNote(
                midi: note.midi,
                startSec: note.startSec + anchorSec,
                durationSec: note.durationSec,
                measureNumber: note.measureNumber,
                clusterId: note.clusterId,
                source: note.source,
                beatStartInMeasure: note.beatStartInMeasure,
                attackOrderIndex: note.attackOrderIndex,
                spelling: note.spelling,
                partIndex: note.partIndex,
                staff: note.staff
            )
        }
    }

    private static func deriveTimingSource(_ notes: [CanonicalPhraseNote]) -> TimingSource {
        let sources = Set(notes.map(\.source))
        if sources.count == 1, let only = sources.first {
            return only
        }
        if sources.contains(.midiMergedXml) || (sources.contains(.midi) && sources.contains(.musicxml)) {
            return .midiMergedXml
        }
        if sources.contains(.midi) {
            return .midi
        }
        return .musicxml
    }

    private static func rhythmTargetId(clusterId: String, measureNumber: Int, beatStart: Double) -> UUID {
        if clusterId.hasPrefix("attack:") {
            let beatKey = Int((beatStart * 10_000).rounded())
            let lo = UInt64(max(0, measureNumber)) << 32 | UInt64(bitPattern: Int64(beatKey))
            let idString = String(format: "a0000000-0000-4000-8000-%012llx", lo & 0x0000FFFFFFFFFFFF)
            return UUID(uuidString: idString) ?? UUID()
        }
        var hasher = Hasher()
        hasher.combine(clusterId)
        let hash = UInt64(bitPattern: Int64(hasher.finalize()))
        let idString = String(format: "b0000000-0000-4000-8000-%012llx", hash & 0x0000FFFFFFFFFFFF)
        return UUID(uuidString: idString) ?? UUID()
    }
}

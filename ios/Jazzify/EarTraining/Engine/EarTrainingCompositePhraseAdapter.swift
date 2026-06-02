import CryptoKit
import Foundation

/// Web `earTrainingCompositePhraseAdapter.ts` 相当。
enum EarTrainingCompositePhraseAdapter {
    /// 譜面ラベルの位置合わせ用（グループごと一意）。Web の `cmp-\(chordId)-n\(i)` に相当。
    nonisolated static func compositeStaffGroupUUID(stageId: UUID, chordId: UUID, noteIndex: Int) -> UUID {
        let payload = Data("\(stageId.uuidString):\(chordId.uuidString):n\(noteIndex)".utf8)
        let hash = SHA256.hash(data: payload)
        var uuidBytes = [UInt8]()
        uuidBytes.reserveCapacity(16)
        uuidBytes.append(contentsOf: hash.prefix(16))
        uuidBytes[6] = (uuidBytes[6] & 0x0F) | 0x40
        uuidBytes[8] = (uuidBytes[8] & 0x3F) | 0x80
        let tuple: uuid_t = (
            uuidBytes[0], uuidBytes[1], uuidBytes[2], uuidBytes[3],
            uuidBytes[4], uuidBytes[5], uuidBytes[6], uuidBytes[7],
            uuidBytes[8], uuidBytes[9], uuidBytes[10], uuidBytes[11],
            uuidBytes[12], uuidBytes[13], uuidBytes[14], uuidBytes[15]
        )
        return UUID(uuid: tuple)
    }

    /// アクティブコード名バブルのアンカーグループ。
    nonisolated static func compositeChordLabelGroupId(
        stageId: UUID,
        state: EarTrainingCompositePhraseRuntimeState?
    ) -> UUID? {
        guard let state else {
            return nil
        }
        let view = EarTrainingCompositePhraseEngine.staffChordView(state: state)
        guard let chord = view.chord else {
            return nil
        }
        for i in 0..<chord.notes.count {
            if !view.correctNoteIndices.contains(i) {
                return compositeStaffGroupUUID(stageId: stageId, chordId: chord.id, noteIndex: i)
            }
        }
        if chord.notes.isEmpty {
            return nil
        }
        let last = chord.notes.count - 1
        return compositeStaffGroupUUID(stageId: stageId, chordId: chord.id, noteIndex: last)
    }

    static func phraseDetailToDefinition(_ phrase: EarTrainingPhraseDetail) -> EarTrainingCompositePhraseDefinition? {
        if let noteChords = phraseNotesToCompositeChords(phrase), !noteChords.isEmpty {
            let title = (phrase.title ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            return EarTrainingCompositePhraseDefinition(
                id: phrase.id,
                sourcePhraseId: phrase.id,
                title: title,
                chords: noteChords
            )
        }

        let sortedChords = (phrase.chords ?? []).sorted { $0.orderIndex < $1.orderIndex }
        var outChords: [EarTrainingCompositePhraseChord] = []

        for chord in sortedChords {
            guard EarTrainingChordVoicingEngine.chordHasVoicingNotes(chord) else { continue }
            guard let voicing = chord.voicing, !voicing.isEmpty else { continue }

            let stavesRaw = chord.voicingStaves ?? []
            var notes: [EarTrainingCompositePhraseChordNote] = []
            notes.reserveCapacity(voicing.count)
            var noteParseFailed = false
            for (idx, rawName) in voicing.enumerated() {
                guard let pc = EarTrainingChordVoicingEngine.noteNameToPitchClass(rawName) else {
                    noteParseFailed = true
                    break
                }
                let trimmed = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
                let rawStaff = stavesRaw.indices.contains(idx) ? stavesRaw[idx] : 1
                let staffNumber = rawStaff == 2 ? 2 : 1
                notes.append(EarTrainingCompositePhraseChordNote(
                    pitchClass: pc,
                    noteName: trimmed,
                    staff: staffNumber
                ))
            }
            if noteParseFailed { return nil }

            let measureNum = chord.measureNumber ?? 1
            outChords.append(EarTrainingCompositePhraseChord(
                id: chord.id,
                orderIndex: chord.orderIndex,
                chordName: chord.chordName,
                quoteText: trimmedQuoteText(chord.quote?.text),
                measureNumber: measureNum,
                notes: notes
            ))
        }

        guard !outChords.isEmpty else { return nil }
        let title = (phrase.title ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        return EarTrainingCompositePhraseDefinition(
            id: phrase.id,
            sourcePhraseId: phrase.id,
            title: title,
            chords: outChords
        )
    }

    static func buildBootstrap(
        stagePhrases sortedPhrases: [EarTrainingPhraseDetail],
        bgmUrl: String,
        keyFifths: Int,
        sourcePhraseIdsOrdered: [UUID]
    ) -> EarTrainingCompositePhraseBootstrap? {
        var phraseMap: [UUID: EarTrainingPhraseDetail] = [:]
        phraseMap.reserveCapacity(sortedPhrases.count)
        for p in sortedPhrases {
            phraseMap[p.id] = p
        }

        var definitions: [EarTrainingCompositePhraseDefinition] = []
        definitions.reserveCapacity(sourcePhraseIdsOrdered.count)

        for pid in sourcePhraseIdsOrdered {
            guard let phrase = phraseMap[pid], let def = phraseDetailToDefinition(phrase) else {
                return nil
            }
            definitions.append(def)
        }

        let trimmed = bgmUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        return EarTrainingCompositePhraseBootstrap(
            bgmUrl: trimmed,
            keyFifths: keyFifths,
            sourcePhraseIds: sourcePhraseIdsOrdered,
            definitions: definitions
        )
    }

    static func compositeStaffArtifact(
        runtime: EarTrainingCompositePhraseRuntimeState?,
        stageId: UUID
    ) -> (groups: [EarTrainingChordVoicingStaffLayout.GroupInput], dense: Bool, correctMap: [UUID: Set<Int>], activeLabelGroupId: UUID?, chordNamePrefix: String) {
        guard let rt = runtime else {
            return ([], false, [:], nil, "")
        }

        let view = EarTrainingCompositePhraseEngine.staffChordView(state: rt)
        guard let chord = view.chord, !chord.notes.isEmpty else {
            return ([], false, [:], compositeChordLabelGroupId(stageId: stageId, state: rt), "")
        }

        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        groups.reserveCapacity(chord.notes.count)
        var correctMap: [UUID: Set<Int>] = [:]

        for (i, note) in chord.notes.enumerated() {
            let gid = compositeStaffGroupUUID(stageId: stageId, chordId: chord.id, noteIndex: i)
            groups.append(EarTrainingChordVoicingStaffLayout.GroupInput(
                id: gid,
                chordName: i == 0 ? chord.chordName : "",
                voicing: [note.noteName],
                voicingStaves: [note.staff],
                measureOffset: 0,
                isRest: false,
                exemptFromFade: view.correctNoteIndices.contains(i)
            ))
            let pc = ((note.pitchClass % 12) + 12) % 12
            if view.correctNoteIndices.contains(i) {
                correctMap[gid] = Set([pc])
            }
        }

        let labelId = compositeChordLabelGroupId(stageId: stageId, state: rt)

        let prefixName = chord.notes.isEmpty ? "" : chord.chordName
        return (groups, false, correctMap, labelId, prefixName)
    }

    private static func phraseNotesToCompositeChords(
        _ phrase: EarTrainingPhraseDetail
    ) -> [EarTrainingCompositePhraseChord]? {
        let sortedNotes = (phrase.notes ?? []).sorted { $0.noteIndex < $1.noteIndex }
        guard !sortedNotes.isEmpty else { return nil }

        let sortedChords = (phrase.chords ?? []).sorted { $0.orderIndex < $1.orderIndex }
        var measureNumbers: [Int] = []
        var notesByMeasure: [Int: [EarTrainingPhraseNoteDetail]] = [:]
        for note in sortedNotes {
            let measureNumber = max(1, note.measureNumber ?? 1)
            if notesByMeasure[measureNumber] == nil {
                measureNumbers.append(measureNumber)
                notesByMeasure[measureNumber] = []
            }
            notesByMeasure[measureNumber]?.append(note)
        }

        var outChords: [EarTrainingCompositePhraseChord] = []
        outChords.reserveCapacity(measureNumbers.count)
        for (measureIndex, measureNumber) in measureNumbers.enumerated() {
            guard let measureNotes = notesByMeasure[measureNumber], !measureNotes.isEmpty else {
                continue
            }
            var mappedNotes: [EarTrainingCompositePhraseChordNote] = []
            mappedNotes.reserveCapacity(measureNotes.count)
            for note in measureNotes {
                mappedNotes.append(EarTrainingCompositePhraseChordNote(
                    pitchClass: normalizePitchClass(note.pitchClass),
                    noteName: noteDisplayNameWithOctave(note),
                    staff: 1
                ))
            }

            let labelChord = chordLabel(forMeasure: measureNumber, chords: sortedChords)
            outChords.append(EarTrainingCompositePhraseChord(
                id: labelChord?.id ?? compositeMeasureChordUUID(phraseId: phrase.id, measureNumber: measureNumber),
                orderIndex: labelChord?.orderIndex ?? measureIndex,
                chordName: labelChord?.chordName ?? "",
                quoteText: trimmedQuoteText(labelChord?.quote?.text),
                measureNumber: measureNumber,
                notes: mappedNotes
            ))
        }
        return outChords.isEmpty ? nil : outChords
    }

    private static func chordLabel(
        forMeasure measureNumber: Int,
        chords: [EarTrainingPhraseChordDetail]
    ) -> EarTrainingPhraseChordDetail? {
        chords.first { ($0.measureNumber ?? 1) == measureNumber } ?? chords.first
    }

    private static func noteDisplayNameWithOctave(_ note: EarTrainingPhraseNoteDetail) -> String {
        let trimmed = note.noteName.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.range(of: #"\d+$"#, options: .regularExpression) != nil {
            return trimmed
        }
        let octave = note.octave ?? 4
        if !trimmed.isEmpty {
            return "\(trimmed)\(octave)"
        }
        return "\(noteName(forPitchClass: note.pitchClass))\(octave)"
    }

    private static func noteName(forPitchClass pitchClass: Int) -> String {
        let names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        return names[normalizePitchClass(pitchClass)]
    }

    private static func normalizePitchClass(_ pitchClass: Int) -> Int {
        ((pitchClass % 12) + 12) % 12
    }

    private static func trimmedQuoteText(_ text: String?) -> String? {
        guard let text else { return nil }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private static func compositeMeasureChordUUID(phraseId: UUID, measureNumber: Int) -> UUID {
        let payload = Data("\(phraseId.uuidString):m\(measureNumber)".utf8)
        let hash = SHA256.hash(data: payload)
        var uuidBytes = [UInt8]()
        uuidBytes.reserveCapacity(16)
        uuidBytes.append(contentsOf: hash.prefix(16))
        uuidBytes[6] = (uuidBytes[6] & 0x0F) | 0x40
        uuidBytes[8] = (uuidBytes[8] & 0x3F) | 0x80
        let tuple: uuid_t = (
            uuidBytes[0], uuidBytes[1], uuidBytes[2], uuidBytes[3],
            uuidBytes[4], uuidBytes[5], uuidBytes[6], uuidBytes[7],
            uuidBytes[8], uuidBytes[9], uuidBytes[10], uuidBytes[11],
            uuidBytes[12], uuidBytes[13], uuidBytes[14], uuidBytes[15]
        )
        return UUID(uuid: tuple)
    }
}

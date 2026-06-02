import Foundation

/// Web `src/utils/earTrainingAdlibEngine.ts` と同等のアドリブ判定。
enum EarTrainingAdlibEngine {
    static let maxFireballsPerHarmony = 16

    struct WindowState: Sendable, Equatable {
        var harmonyRepresentativeId: UUID?
        var pressedPitchClasses: Set<Int>
        var fireCount: Int
    }

    enum NoteKind: Sendable, Equatable {
        case correct
        case miss
    }

    struct NoteResult: Sendable, Equatable {
        let kind: NoteKind
        let nextWindow: WindowState
        let shouldFire: Bool
        let enemyDamage: Int
        let playerDamage: Int
        let hitPitchClass: Int?
    }

    static func createWindow(harmonyRepresentativeId: UUID? = nil) -> WindowState {
        WindowState(
            harmonyRepresentativeId: harmonyRepresentativeId,
            pressedPitchClasses: [],
            fireCount: 0
        )
    }

    static func applyHarmonyTransition(_ current: WindowState, harmonyRepresentativeId: UUID?) -> WindowState {
        if current.harmonyRepresentativeId == harmonyRepresentativeId {
            return current
        }
        return createWindow(harmonyRepresentativeId: harmonyRepresentativeId)
    }

    static func harmonyRow(
        containingChordId chordId: UUID,
        phrase: EarTrainingPhraseDetail
    ) -> EarTrainingChordVoicingEngine.HarmonyHudRow? {
        EarTrainingChordVoicingEngine.harmonyRow(containingChordId: chordId, phrase: phrase)
    }

    static func unionPitchClasses(
        phrase: EarTrainingPhraseDetail,
        row: EarTrainingChordVoicingEngine.HarmonyHudRow
    ) -> Set<Int> {
        var pcs = Set<Int>()
        for chordId in row.voicingIds {
            guard let chord = phrase.chords?.first(where: { $0.id == chordId }) else { continue }
            for pc in EarTrainingChordVoicingEngine.voicingPitchClasses(for: chord) {
                pcs.insert(pc)
            }
        }
        return pcs
    }

    static func voicingKeyboardHints(
        phrase: EarTrainingPhraseDetail,
        row: EarTrainingChordVoicingEngine.HarmonyHudRow,
        pressedPitchClasses: Set<Int>
    ) -> [Int: VoicingHintState] {
        let names = collectVoicingNoteNames(phrase: phrase, row: row)
        return EarTrainingChordVoicingEngine.voicingKeyboardHints(
            voicing: names,
            pressedPitchClasses: pressedPitchClasses
        )
    }

    static func staffGroups(
        phrase: EarTrainingPhraseDetail,
        row: EarTrainingChordVoicingEngine.HarmonyHudRow
    ) -> [EarTrainingChordVoicingStaffLayout.GroupInput] {
        let chords = (phrase.chords ?? [])
            .filter { row.voicingIds.contains($0.id) }
            .sorted { $0.orderIndex < $1.orderIndex }
        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        var slotIndex = 0
        for chord in chords {
            let voicing = chord.voicing ?? []
            let staves = chord.voicingStaves ?? []
            for (vi, noteName) in voicing.enumerated() {
                let staff: Int = (vi < staves.count && staves[vi] == 2) ? 2 : 1
                groups.append(
                    EarTrainingChordVoicingStaffLayout.GroupInput(
                        id: UUID(),
                        chordName: slotIndex == 0 ? row.chordName : "",
                        voicing: [noteName],
                        voicingStaves: [staff],
                        measureOffset: 0,
                        isRest: false,
                        exemptFromFade: true
                    )
                )
                slotIndex += 1
            }
        }
        return groups
    }

    static func correctPitchClassesByGroup(
        groups: [EarTrainingChordVoicingStaffLayout.GroupInput],
        pressedPitchClasses: Set<Int>
    ) -> [UUID: Set<Int>] {
        var map: [UUID: Set<Int>] = [:]
        for group in groups {
            guard let noteName = group.voicing.first,
                  let midi = EarTrainingChordVoicingEngine.noteNameToMidi(noteName)
            else { continue }
            let pc = EarTrainingChordVoicingEngine.midiToPitchClass(midi)
            if pressedPitchClasses.contains(pc) {
                map[group.id] = [pc]
            }
        }
        return map
    }

    static func handleNoteOn(
        window: WindowState,
        unionPitchClasses: Set<Int>,
        midiNote: Int,
        damage: EarTrainingDamageConfig
    ) -> NoteResult {
        let inputPc = EarTrainingChordVoicingEngine.midiToPitchClass(midiNote)
        if !unionPitchClasses.contains(inputPc) {
            return NoteResult(
                kind: .miss,
                nextWindow: window,
                shouldFire: false,
                enemyDamage: 0,
                playerDamage: damage.miss,
                hitPitchClass: nil
            )
        }
        let shouldFire = window.fireCount < maxFireballsPerHarmony
        var nextPressed = window.pressedPitchClasses
        nextPressed.insert(inputPc)
        let nextWindow = WindowState(
            harmonyRepresentativeId: window.harmonyRepresentativeId,
            pressedPitchClasses: nextPressed,
            fireCount: shouldFire ? window.fireCount + 1 : window.fireCount
        )
        return NoteResult(
            kind: .correct,
            nextWindow: nextWindow,
            shouldFire: shouldFire,
            enemyDamage: shouldFire ? damage.perCorrectNote : 0,
            playerDamage: 0,
            hitPitchClass: inputPc
        )
    }

    private static func collectVoicingNoteNames(
        phrase: EarTrainingPhraseDetail,
        row: EarTrainingChordVoicingEngine.HarmonyHudRow
    ) -> [String] {
        let chords = (phrase.chords ?? [])
            .filter { row.voicingIds.contains($0.id) }
            .sorted { $0.orderIndex < $1.orderIndex }
        var names: [String] = []
        for chord in chords {
            for name in chord.voicing ?? [] {
                let trimmed = name.trimmingCharacters(in: .whitespaces)
                if !trimmed.isEmpty {
                    names.append(trimmed)
                }
            }
        }
        return names
    }
}

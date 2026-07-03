import Foundation

enum EarTrainingPrecisionAutoPlayPreferences {
    static let storageKey = "earTraining.precision.autoPlayEnabled"

    static func loadEnabled() -> Bool {
        UserDefaults.standard.string(forKey: storageKey) == "1"
    }

    static func saveEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled ? "1" : "0", forKey: storageKey)
    }
}

struct EarTrainingPrecisionAutoPlayCallbacks {
    let onNoteOn: (_ midi: Int, _ noteId: String) -> Void
    let onNoteOff: (_ midi: Int, _ noteId: String) -> Void
}

final class EarTrainingPrecisionAutoPlayScheduler {
    private struct ActiveNote {
        let noteId: String
        let midi: Int
        let endSec: Double
    }

    private var notes: [EarTrainingPrecisionNote] = []
    private var nextOnIndex = 0
    private var activeNotes: [ActiveNote] = []

    func setNotes(_ notes: [EarTrainingPrecisionNote]) {
        self.notes = notes
    }

    func reset() {
        nextOnIndex = 0
        activeNotes.removeAll(keepingCapacity: true)
    }

    func syncAfterSeek(
        phraseTimeSec: Double,
        states: [String: EarTrainingPrecisionJudge.NoteRuntimeState]
    ) {
        nextOnIndex = 0
        activeNotes.removeAll(keepingCapacity: true)
        for note in notes {
            if note.startSec > phraseTimeSec {
                break
            }
            guard let state = states[note.id], state.judgment == .good else { continue }
            guard !note.isShortNote, state.hiddenFromLane != true else { continue }
            guard phraseTimeSec < note.startSec + note.durationSec - 0.001 else { continue }
            activeNotes.append(
                ActiveNote(
                    noteId: note.id,
                    midi: note.midi,
                    endSec: note.startSec + note.durationSec
                )
            )
        }
    }

    @discardableResult
    func tick(
        phraseTimeSec: Double,
        states: inout [String: EarTrainingPrecisionJudge.NoteRuntimeState],
        callbacks: EarTrainingPrecisionAutoPlayCallbacks
    ) -> Bool {
        var changed = false

        while nextOnIndex < notes.count {
            let note = notes[nextOnIndex]
            if note.startSec > phraseTimeSec {
                break
            }
            if var state = states[note.id], state.judgment == .pending {
                state.judgment = .good
                state.hitAtSec = note.startSec
                if note.isShortNote {
                    state.hiddenFromLane = true
                } else {
                    activeNotes.append(
                        ActiveNote(
                            noteId: note.id,
                            midi: note.midi,
                            endSec: note.startSec + note.durationSec
                        )
                    )
                }
                states[note.id] = state
                callbacks.onNoteOn(note.midi, note.id)
                changed = true
            }
            nextOnIndex += 1
        }

        var removeIndices: [Int] = []
        for (index, active) in activeNotes.enumerated() {
            guard phraseTimeSec >= active.endSec - 0.001 else { continue }
            if var state = states[active.noteId],
               state.judgment == .good,
               state.hiddenFromLane != true {
                state.hiddenFromLane = true
                states[active.noteId] = state
                callbacks.onNoteOff(active.midi, active.noteId)
                changed = true
            }
            removeIndices.append(index)
        }
        for index in removeIndices.reversed() {
            activeNotes.remove(at: index)
        }

        return changed
    }
}

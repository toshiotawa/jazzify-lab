import Foundation

/// Web `earTrainingPrecisionMidi.ts` 相当。
enum EarTrainingPrecisionMidi {
    private struct ParsedMidiNoteEvent {
        let startTick: Int
        let endTick: Int
        let midi: Int
    }

    private struct ActiveNote {
        let startTick: Int
    }

    static func buildFromMidi(
        data: Data,
        bpm: Int,
        transposeOffset: Int = 0
    ) throws -> EarTrainingPrecisionNoteBuildResult {
        let tempoMap = try EarTrainingSmfBinary.buildTempoMap(data)
        let (_, trackChunks) = try EarTrainingSmfBinary.parseHeader(data)
        var parsed: [ParsedMidiNoteEvent] = []
        for chunk in trackChunks {
            parsed.append(contentsOf: parseTrackNoteEvents(data: data, trackStart: chunk.trackStart, trackEnd: chunk.trackEnd))
        }

        var clusterIndexByTick: [Int: Int] = [:]
        var notes: [EarTrainingPrecisionNote] = []
        notes.reserveCapacity(parsed.count)

        for event in parsed {
            let startSec = EarTrainingSmfBinary.tickToSeconds(tempoMap, tick: event.startTick)
            let endSec = EarTrainingSmfBinary.tickToSeconds(tempoMap, tick: event.endTick)
            let durationSec = max(0.05, endSec - startSec)
            let midi = event.midi + transposeOffset
            let indexInCluster = clusterIndexByTick[event.startTick] ?? 0
            clusterIndexByTick[event.startTick] = indexInCluster + 1
            notes.append(
                EarTrainingPrecisionNote(
                    id: "m:\(event.startTick):\(midi):\(indexInCluster)",
                    midi: midi,
                    startSec: startSec,
                    durationSec: durationSec,
                    isBlackKey: EarTrainingPrecisionNotes.isBlackKeyMidi(midi),
                    measureNumber: 1,
                    isShortNote: EarTrainingPrecisionNotes.isShortNoteDuration(durationSec: durationSec, bpm: bpm)
                )
            )
        }

        notes.sort { lhs, rhs in
            if abs(lhs.startSec - rhs.startSec) > 0.0005 {
                return lhs.startSec < rhs.startSec
            }
            if lhs.midi != rhs.midi {
                return lhs.midi < rhs.midi
            }
            return lhs.id < rhs.id
        }

        let trimmedNotes = EarTrainingPrecisionNotes.trimOverlappingSamePitchNotes(
            notes: notes,
            classificationBpm: bpm
        )

        let keyboardRange = EarTrainingPrecisionNotes.resolveKeyboardRange(noteMidis: trimmedNotes.map(\.midi))
        return EarTrainingPrecisionNoteBuildResult(notes: trimmedNotes, keyboardRange: keyboardRange)
    }

    private static func parseTrackNoteEvents(
        data: Data,
        trackStart: Int,
        trackEnd: Int
    ) -> [ParsedMidiNoteEvent] {
        var notes: [ParsedMidiNoteEvent] = []
        var activeByKey: [String: [ActiveNote]] = [:]
        var offset = trackStart
        var absoluteTick = 0
        var runningStatus = 0

        func closeNote(channel: Int, midi: Int, endTick: Int) {
            let key = "\(channel):\(midi)"
            guard var stack = activeByKey[key], !stack.isEmpty else { return }
            let started = stack.removeLast()
            if stack.isEmpty {
                activeByKey.removeValue(forKey: key)
            } else {
                activeByKey[key] = stack
            }
            if endTick > started.startTick {
                notes.append(ParsedMidiNoteEvent(startTick: started.startTick, endTick: endTick, midi: midi))
            }
        }

        func pushNoteOn(channel: Int, midi: Int, velocity: Int) {
            if velocity <= 0 {
                closeNote(channel: channel, midi: midi, endTick: absoluteTick)
                return
            }
            let key = "\(channel):\(midi)"
            var stack = activeByKey[key] ?? []
            stack.append(ActiveNote(startTick: absoluteTick))
            activeByKey[key] = stack
        }

        while offset < trackEnd {
            let delta = EarTrainingSmfBinary.readVariableLengthQuantity(data, offset: offset)
            absoluteTick += delta.value
            offset = delta.nextOffset
            guard offset < trackEnd else { break }

            var status = Int(data[offset])
            if status < 0x80 {
                status = runningStatus
            } else {
                offset += 1
            }

            if status == 0xff {
                guard offset < trackEnd else { break }
                let metaType = Int(data[offset])
                offset += 1
                let len = EarTrainingSmfBinary.readVariableLengthQuantity(data, offset: offset)
                offset = len.nextOffset + len.value
                if metaType == 0x2f {
                    break
                }
                continue
            }

            if status == 0xf0 || status == 0xf7 {
                let len = EarTrainingSmfBinary.readVariableLengthQuantity(data, offset: offset)
                offset = len.nextOffset + len.value
                continue
            }

            let high = status & 0xf0
            let channel = status & 0x0f
            runningStatus = status

            if high == 0x90 {
                guard offset + 1 < trackEnd else { break }
                let midi = Int(data[offset])
                let velocity = Int(data[offset + 1])
                pushNoteOn(channel: channel, midi: midi, velocity: velocity)
                offset += 2
                continue
            }

            if high == 0x80 {
                guard offset < trackEnd else { break }
                let midi = Int(data[offset])
                closeNote(channel: channel, midi: midi, endTick: absoluteTick)
                offset += 2
                continue
            }

            offset += EarTrainingSmfBinary.dataBytesForChannelStatus(status)
        }

        return notes
    }
}

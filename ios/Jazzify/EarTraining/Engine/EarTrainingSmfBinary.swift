import Foundation

/// SMF(Standard MIDI File) バイナリ読み取り共通ユーティリティ（Web `smfBinary.ts` 相当）。
enum EarTrainingSmfBinary {
    struct TempoEvent: Equatable, Sendable {
        let tick: Int
        let usPerQuarter: Int
    }

    struct TempoMap: Sendable {
        let ticksPerQuarter: Int
        let tempos: [TempoEvent]
    }

    struct VlqResult: Sendable {
        let value: Int
        let nextOffset: Int
    }

    struct TrackChunk: Sendable {
        let trackStart: Int
        let trackEnd: Int
    }

    static let defaultUsPerQuarter = 500_000

    static func readUint32(_ data: Data, offset: Int) -> UInt32 {
        guard offset + 4 <= data.count else { return 0 }
        let b0 = UInt32(data[offset])
        let b1 = UInt32(data[offset + 1])
        let b2 = UInt32(data[offset + 2])
        let b3 = UInt32(data[offset + 3])
        return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
    }

    static func readUint16(_ data: Data, offset: Int) -> Int {
        guard offset + 2 <= data.count else { return 0 }
        return (Int(data[offset]) << 8) | Int(data[offset + 1])
    }

    static func matchesAscii(_ data: Data, offset: Int, ascii: String) -> Bool {
        let bytes = Array(ascii.utf8)
        guard offset + bytes.count <= data.count else { return false }
        for (index, byte) in bytes.enumerated() where data[offset + index] != byte {
            return false
        }
        return true
    }

    static func readVariableLengthQuantity(_ data: Data, offset: Int) -> VlqResult {
        var value = 0
        var cursor = offset
        for _ in 0..<4 {
            guard cursor < data.count else { break }
            let byte = Int(data[cursor])
            cursor += 1
            value = (value << 7) | (byte & 0x7f)
            if (byte & 0x80) == 0 {
                return VlqResult(value: value, nextOffset: cursor)
            }
        }
        return VlqResult(value: value, nextOffset: cursor)
    }

    static func dataBytesForChannelStatus(_ status: Int) -> Int {
        let high = status & 0xf0
        return high == 0xc0 || high == 0xd0 ? 1 : 2
    }

    static func parseHeader(_ data: Data) throws -> (ticksPerQuarter: Int, trackChunks: [TrackChunk]) {
        guard data.count >= 14, matchesAscii(data, offset: 0, ascii: "MThd") else {
            throw SmfError.missingHeader
        }
        let headerLength = Int(readUint32(data, offset: 4))
        let division = readUint16(data, offset: 12)
        if (division & 0x8000) != 0 {
            throw SmfError.smpteDivisionUnsupported
        }
        let ticksPerQuarter = division
        guard ticksPerQuarter > 0 else {
            throw SmfError.invalidDivision
        }

        var trackChunks: [TrackChunk] = []
        var offset = 8 + headerLength
        while offset + 8 <= data.count {
            if !matchesAscii(data, offset: offset, ascii: "MTrk") {
                let len = Int(readUint32(data, offset: offset + 4))
                offset += 8 + len
                continue
            }
            let trackLength = Int(readUint32(data, offset: offset + 4))
            let trackStart = offset + 8
            let trackEnd = trackStart + trackLength
            trackChunks.append(TrackChunk(trackStart: trackStart, trackEnd: trackEnd))
            offset = trackEnd
        }
        return (ticksPerQuarter, trackChunks)
    }

    static func collectTempoEvents(_ data: Data, trackStart: Int, trackEnd: Int) -> [TempoEvent] {
        var tempos: [TempoEvent] = []
        var offset = trackStart
        var absoluteTick = 0
        var runningStatus = 0

        while offset < trackEnd {
            let delta = readVariableLengthQuantity(data, offset: offset)
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
                let len = readVariableLengthQuantity(data, offset: offset)
                offset = len.nextOffset
                if metaType == 0x51, len.value == 3, offset + 3 <= trackEnd {
                    let usPerQuarter =
                        (Int(data[offset]) << 16)
                        | (Int(data[offset + 1]) << 8)
                        | Int(data[offset + 2])
                    tempos.append(TempoEvent(tick: absoluteTick, usPerQuarter: usPerQuarter))
                }
                offset += len.value
                continue
            }

            if status == 0xf0 || status == 0xf7 {
                let len = readVariableLengthQuantity(data, offset: offset)
                offset = len.nextOffset + len.value
                continue
            }

            runningStatus = status
            offset += dataBytesForChannelStatus(status)
        }

        return tempos
    }

    static func buildTempoMap(_ data: Data) throws -> TempoMap {
        let (ticksPerQuarter, trackChunks) = try parseHeader(data)
        var collected: [TempoEvent] = []
        for chunk in trackChunks {
            collected.append(contentsOf: collectTempoEvents(data, trackStart: chunk.trackStart, trackEnd: chunk.trackEnd))
        }
        let sorted = collected.sorted { $0.tick < $1.tick }
        let tempos: [TempoEvent]
        if let first = sorted.first, first.tick == 0 {
            tempos = sorted
        } else {
            tempos = [TempoEvent(tick: 0, usPerQuarter: defaultUsPerQuarter)] + sorted
        }
        return TempoMap(ticksPerQuarter: ticksPerQuarter, tempos: tempos)
    }

    static func tickToSeconds(_ map: TempoMap, tick: Int) -> Double {
        let tempos = map.tempos
        let ticksPerQuarter = map.ticksPerQuarter
        var seconds = 0.0
        for index in tempos.indices {
            let current = tempos[index]
            let next = index + 1 < tempos.count ? tempos[index + 1] : nil
            let segmentEndTick = next.map { min($0.tick, tick) } ?? tick
            if segmentEndTick > current.tick {
                let deltaTicks = segmentEndTick - current.tick
                seconds += Double(deltaTicks * current.usPerQuarter) / Double(ticksPerQuarter) / 1_000_000.0
            }
            if let next, tick <= next.tick {
                break
            }
        }
        return (seconds * 1_000_000).rounded() / 1_000_000
    }

    enum SmfError: Error {
        case missingHeader
        case smpteDivisionUnsupported
        case invalidDivision
    }
}

import XCTest
@testable import Jazzify

final class EarTrainingPrecisionMidiTests: XCTestCase {
    private func encodeVlq(_ value: Int) -> [UInt8] {
        var v = value
        var bytes: [UInt8] = [UInt8(v & 0x7f)]
        while v > 0x7f {
            v >>= 7
            bytes.insert(UInt8((v & 0x7f) | 0x80), at: 0)
        }
        return bytes
    }

    private func writeUint32(_ value: Int) -> [UInt8] {
        [
            UInt8((value >> 24) & 0xff),
            UInt8((value >> 16) & 0xff),
            UInt8((value >> 8) & 0xff),
            UInt8(value & 0xff),
        ]
    }

    private func writeUint16(_ value: Int) -> [UInt8] {
        [UInt8((value >> 8) & 0xff), UInt8(value & 0xff)]
    }

    private func buildMinimalSmf(events: [(tick: Int, kind: String, midi: Int)]) -> Data {
        let ticksPerQuarter = 480
        var trackBytes: [UInt8] = []
        var previousTick = 0

        func pushDelta(_ tick: Int) {
            trackBytes.append(contentsOf: encodeVlq(max(0, tick - previousTick)))
            previousTick = tick
        }

        pushDelta(0)
        trackBytes.append(contentsOf: [0xff, 0x51, 0x03, 0x07, 0xa1, 0x20])

        for event in events {
            pushDelta(event.tick)
            if event.kind == "on" {
                trackBytes.append(contentsOf: [0x90, UInt8(event.midi & 0x7f), 0x50])
            } else {
                trackBytes.append(contentsOf: [0x80, UInt8(event.midi & 0x7f), 0x40])
            }
        }

        pushDelta(previousTick)
        trackBytes.append(contentsOf: [0xff, 0x2f, 0x00])

        let header: [UInt8] = [
            0x4d, 0x54, 0x68, 0x64,
        ] + writeUint32(6) + writeUint16(0) + writeUint16(1) + writeUint16(ticksPerQuarter)

        let trackChunk: [UInt8] = [
            0x4d, 0x54, 0x72, 0x6b,
        ] + writeUint32(trackBytes.count) + trackBytes

        return Data(header + trackChunk)
    }

    func testBuildFromMidiCreatesQuarterAndEighthNotes() throws {
        let quarterTick = 480
        let eighthTick = 240
        let data = buildMinimalSmf(events: [
            (tick: 0, kind: "on", midi: 60),
            (tick: quarterTick, kind: "off", midi: 60),
            (tick: quarterTick, kind: "on", midi: 64),
            (tick: quarterTick + eighthTick, kind: "off", midi: 64),
        ])

        let result = try EarTrainingPrecisionMidi.buildFromMidi(data: data, bpm: 120)
        XCTAssertEqual(result.notes.count, 2)
        XCTAssertEqual(result.notes[0].midi, 60)
        XCTAssertEqual(result.notes[0].durationSec, 0.5, accuracy: 0.01)
        XCTAssertFalse(result.notes[0].isShortNote)
        XCTAssertEqual(result.notes[1].midi, 64)
        XCTAssertEqual(result.notes[1].durationSec, 0.25, accuracy: 0.01)
        XCTAssertTrue(result.notes[1].isShortNote)
    }

    func testBuildFromMidiAppliesTransposeOffset() throws {
        let data = buildMinimalSmf(events: [
            (tick: 0, kind: "on", midi: 60),
            (tick: 480, kind: "off", midi: 60),
        ])

        let result = try EarTrainingPrecisionMidi.buildFromMidi(data: data, bpm: 120, transposeOffset: 2)
        XCTAssertEqual(result.notes[0].midi, 62)
    }

    func testBuildFromMidiTrimsOverlappingSamePitchNotes() throws {
        let nextOnTick = 480
        let lateOffTick = 500
        let data = buildMinimalSmf(events: [
            (tick: 0, kind: "on", midi: 60),
            (tick: nextOnTick, kind: "on", midi: 60),
            (tick: lateOffTick, kind: "off", midi: 60),
            (tick: lateOffTick, kind: "off", midi: 60),
        ])

        let result = try EarTrainingPrecisionMidi.buildFromMidi(data: data, bpm: 120)
        XCTAssertEqual(result.notes.count, 2)
        XCTAssertEqual(result.notes[0].startSec, 0, accuracy: 0.01)
        XCTAssertEqual(result.notes[0].durationSec, 0.499, accuracy: 0.01)
        XCTAssertEqual(result.notes[1].startSec, 0.5, accuracy: 0.01)
    }
}

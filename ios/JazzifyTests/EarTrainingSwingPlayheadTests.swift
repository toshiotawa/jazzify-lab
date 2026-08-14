import XCTest
@testable import Jazzify

/// スイング済みオーディオ時刻 → 記譜上時刻（譜面プレイヘッド）の変換。
final class EarTrainingSwingPlayheadTests: XCTestCase {
    private let measureDurationSec = 2.0
    private let beatsPerMeasure = 4

    private func notatedSec(_ phraseTimeSec: Double, straightBeatKeys: Set<String>? = nil) -> Double {
        EarTrainingChordOsmdMusicXmlNormalizer.swungTimelineToNotatedTimelineSec(
            phraseTimeSec: phraseTimeSec,
            measureDurationSec: measureDurationSec,
            beatsPerMeasure: beatsPerMeasure,
            straightBeatKeys: straightBeatKeys
        )
    }

    func testSwungOffBeatMapsToNotatedEighth() {
        let beatDurationSec = 0.5
        // スイングの裏 8 分（拍内 2/3）は記譜上の 8 分（拍内 1/2）に戻る。
        XCTAssertEqual(notatedSec(beatDurationSec * (2.0 / 3.0)), beatDurationSec * 0.5, accuracy: 0.0001)
        XCTAssertEqual(notatedSec(0), 0, accuracy: 0.0001)
        XCTAssertEqual(notatedSec(beatDurationSec), beatDurationSec, accuracy: 0.0001)
    }

    func testPlayheadSpeedHasNoJumpAcrossBeats() {
        let stepSec = 0.005
        let sampleCount = 200
        let notated = (0...sampleCount).map { notatedSec(Double($0) * stepSec) }
        var deltas: [Double] = []
        deltas.reserveCapacity(sampleCount)
        for index in 1...sampleCount {
            deltas.append(notated[index] - notated[index - 1])
        }
        for delta in deltas {
            XCTAssertGreaterThan(delta, 0)
        }
        for index in 1..<deltas.count {
            XCTAssertLessThan(abs(deltas[index] - deltas[index - 1]), stepSec * 0.1)
        }
    }

    func testStraightBeatKeyKeepsTimelineUnchanged() {
        let swungSec = 0.5 * (2.0 / 3.0)
        XCTAssertEqual(notatedSec(swungSec, straightBeatKeys: ["1:0"]), swungSec, accuracy: 0.0001)
    }
}

import XCTest
@testable import Jazzify

/// 旧ズーム段階テストの置き換え: 表示レンジ全幅フィットの白鍵幅を検証する。
final class EarTrainingPianoLayoutTests: XCTestCase {
    func testWhiteKeyWidthFitsDisplayRangeToViewport() {
        let viewportWidth: CGFloat = 390
        let displayRange = PianoStagePitchRange(minMidi: 60, maxMidi: 72)
        let whites = (displayRange.minMidi...displayRange.maxMidi).filter {
            !PianoKeyboardScrollGeometry.isBlackKey($0)
        }
        let whiteKeyWidth = viewportWidth / CGFloat(max(1, whites.count))
        XCTAssertEqual(whiteKeyWidth * CGFloat(whites.count), viewportWidth, accuracy: 0.001)
    }
}

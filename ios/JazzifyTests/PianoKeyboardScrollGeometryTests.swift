import XCTest
@testable import Jazzify

final class PianoKeyboardScrollGeometryTests: XCTestCase {
    private let whiteKeyWidth: CGFloat = 28
    private let maxScroll: CGFloat = 500
    private let fullWhiteKeyCount = 52
    private let viewportWidth: CGFloat = 400

    private var whiteMidiIndexByMidi: [Int: Int] {
        PianoKeyboardScrollGeometry.buildWhiteMidiIndexByMidi(
            PianoKeyboardScrollGeometry.whiteMidiNotes()
        )
    }

    private func whiteKeyWidth(visibleWhiteKeys: Int) -> CGFloat {
        viewportWidth / CGFloat(visibleWhiteKeys)
    }

    private func contentWidth(visibleWhiteKeys: Int) -> CGFloat {
        CGFloat(fullWhiteKeyCount) * whiteKeyWidth(visibleWhiteKeys: visibleWhiteKeys)
    }

    func testSteppedScrollOffsetXMovesRightByFiveWhiteKeys() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 100,
            direction: 1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: maxScroll
        )
        XCTAssertEqual(next, 100 + whiteKeyWidth * 5, accuracy: 0.001)
    }

    func testSteppedScrollOffsetXMovesLeftByFiveWhiteKeys() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 200,
            direction: -1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: maxScroll
        )
        XCTAssertEqual(next, 200 - whiteKeyWidth * 5, accuracy: 0.001)
    }

    func testSteppedScrollOffsetXClampsAtLeftEdge() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 50,
            direction: -1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: maxScroll
        )
        XCTAssertEqual(next, 0, accuracy: 0.001)
    }

    func testSteppedScrollOffsetXClampsAtRightEdge() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 480,
            direction: 1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: maxScroll
        )
        XCTAssertEqual(next, maxScroll, accuracy: 0.001)
    }

    func testSteppedScrollOffsetXUnchangedWhenMaxScrollIsZero() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 0,
            direction: 1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: 0
        )
        XCTAssertEqual(next, 0, accuracy: 0.001)
    }

    func testEarTrainingScrollBarHeightIsTallerThanSurvivalBar() {
        XCTAssertGreaterThan(
            PianoKeyboardScrollGeometry.earTrainingScrollBarHeight,
            PianoKeyboardScrollGeometry.dragBarHeight
        )
        XCTAssertEqual(PianoKeyboardScrollGeometry.earTrainingScrollBarHeight, 30, accuracy: 0.001)
    }

    func testCenterAnchorWhiteMidiInvertsCenterScrollOffsetX() {
        let keyWidth = whiteKeyWidth(visibleWhiteKeys: 21)
        let content = contentWidth(visibleWhiteKeys: 21)
        let anchorMidi = 60
        let offset = PianoKeyboardScrollGeometry.centerScrollOffsetX(
            anchorMidi: anchorMidi,
            whiteKeyWidth: keyWidth,
            viewportWidth: viewportWidth,
            contentWidth: content,
            whiteMidiIndexByMidi: whiteMidiIndexByMidi
        )
        let recovered = PianoKeyboardScrollGeometry.centerAnchorWhiteMidi(
            scrollOffsetX: offset,
            viewportWidth: viewportWidth,
            whiteKeyWidth: keyWidth,
            whiteMidiIndexByMidi: whiteMidiIndexByMidi
        )
        XCTAssertEqual(recovered, anchorMidi)
    }

    func testPreservedScrollOffsetXOnZoomKeepsCenterMidiAcrossVisibleWhiteKeySteps() {
        let anchorMidi = 72
        let oldVisible = 21
        let newVisible = 25
        let oldKeyWidth = whiteKeyWidth(visibleWhiteKeys: oldVisible)
        let oldContent = contentWidth(visibleWhiteKeys: oldVisible)
        let currentOffset = PianoKeyboardScrollGeometry.centerScrollOffsetX(
            anchorMidi: anchorMidi,
            whiteKeyWidth: oldKeyWidth,
            viewportWidth: viewportWidth,
            contentWidth: oldContent,
            whiteMidiIndexByMidi: whiteMidiIndexByMidi
        )

        let newKeyWidth = whiteKeyWidth(visibleWhiteKeys: newVisible)
        let newContent = contentWidth(visibleWhiteKeys: newVisible)
        let preserved = PianoKeyboardScrollGeometry.preservedScrollOffsetXOnZoom(
            currentScrollOffsetX: currentOffset,
            viewportWidth: viewportWidth,
            whiteKeyWidth: newKeyWidth,
            contentWidth: newContent,
            whiteMidiIndexByMidi: whiteMidiIndexByMidi
        )

        let centerAfter = PianoKeyboardScrollGeometry.centerAnchorWhiteMidi(
            scrollOffsetX: preserved,
            viewportWidth: viewportWidth,
            whiteKeyWidth: newKeyWidth,
            whiteMidiIndexByMidi: whiteMidiIndexByMidi
        )
        XCTAssertEqual(centerAfter, anchorMidi)
    }

    func testPreservedScrollOffsetXOnZoomRoundTripEarTrainingSteps() {
        let anchorMidi = 60
        let steps = [21, 25, 29, 35]
        var currentOffset = PianoKeyboardScrollGeometry.centerScrollOffsetX(
            anchorMidi: anchorMidi,
            whiteKeyWidth: whiteKeyWidth(visibleWhiteKeys: steps[0]),
            viewportWidth: viewportWidth,
            contentWidth: contentWidth(visibleWhiteKeys: steps[0]),
            whiteMidiIndexByMidi: whiteMidiIndexByMidi
        )

        for visible in steps.dropFirst() + steps.dropLast().reversed() {
            let keyWidth = whiteKeyWidth(visibleWhiteKeys: visible)
            let content = contentWidth(visibleWhiteKeys: visible)
            currentOffset = PianoKeyboardScrollGeometry.preservedScrollOffsetXOnZoom(
                currentScrollOffsetX: currentOffset,
                viewportWidth: viewportWidth,
                whiteKeyWidth: keyWidth,
                contentWidth: content,
                whiteMidiIndexByMidi: whiteMidiIndexByMidi
            )
            let centerMidi = PianoKeyboardScrollGeometry.centerAnchorWhiteMidi(
                scrollOffsetX: currentOffset,
                viewportWidth: viewportWidth,
                whiteKeyWidth: keyWidth,
                whiteMidiIndexByMidi: whiteMidiIndexByMidi
            )
            XCTAssertEqual(centerMidi, anchorMidi)
        }
    }

    func testPreservedScrollOffsetXOnZoomClampsAtLeftEdge() {
        let visible = 21
        let keyWidth = whiteKeyWidth(visibleWhiteKeys: visible)
        let content = contentWidth(visibleWhiteKeys: visible)
        let preserved = PianoKeyboardScrollGeometry.preservedScrollOffsetXOnZoom(
            currentScrollOffsetX: 0,
            viewportWidth: viewportWidth,
            whiteKeyWidth: keyWidth,
            contentWidth: content,
            whiteMidiIndexByMidi: whiteMidiIndexByMidi
        )
        XCTAssertEqual(preserved, 0, accuracy: 0.001)
    }

    func testPreservedScrollOffsetXOnZoomClampsAtRightEdge() {
        let visible = 21
        let keyWidth = whiteKeyWidth(visibleWhiteKeys: visible)
        let content = contentWidth(visibleWhiteKeys: visible)
        let maxOffset = PianoKeyboardScrollGeometry.maxScrollOffset(
            contentWidth: content,
            viewportWidth: viewportWidth
        )
        let preserved = PianoKeyboardScrollGeometry.preservedScrollOffsetXOnZoom(
            currentScrollOffsetX: maxOffset,
            viewportWidth: viewportWidth,
            whiteKeyWidth: keyWidth,
            contentWidth: content,
            whiteMidiIndexByMidi: whiteMidiIndexByMidi
        )
        XCTAssertEqual(preserved, maxOffset, accuracy: 0.001)
    }
}

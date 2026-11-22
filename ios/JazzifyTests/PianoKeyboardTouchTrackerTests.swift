import CoreGraphics
import XCTest
@testable import Jazzify

final class PianoKeyboardTouchTrackerTests: XCTestCase {
    func testTouchBeganFiresNoteOnWithoutNoteOff() {
        var tracker = PianoKeyboardTouchTracker()
        let token = ObjectIdentifier("touch-a" as NSString)
        let transition = tracker.touchBegan(token: token, midi: 60)
        XCTAssertEqual(transition.noteOns, [60])
        XCTAssertTrue(transition.noteOffs.isEmpty)
        XCTAssertEqual(transition.activeMidis, [60])
    }

    func testTouchEndedFiresNoteOff() {
        var tracker = PianoKeyboardTouchTracker()
        let token = ObjectIdentifier("touch-a" as NSString)
        _ = tracker.touchBegan(token: token, midi: 60)
        let transition = tracker.touchEnded(token: token)
        XCTAssertTrue(transition.noteOns.isEmpty)
        XCTAssertEqual(transition.noteOffs, [60])
        XCTAssertTrue(transition.activeMidis.isEmpty)
    }

    func testMultiTouchChord() {
        var tracker = PianoKeyboardTouchTracker()
        let a = ObjectIdentifier("touch-a" as NSString)
        let b = ObjectIdentifier("touch-b" as NSString)
        _ = tracker.touchBegan(token: a, midi: 60)
        let chord = tracker.touchBegan(token: b, midi: 64)
        XCTAssertEqual(chord.noteOns, [64])
        XCTAssertEqual(chord.activeMidis, Set([60, 64]))
    }

    func testTouchMovedBetweenKeys() {
        var tracker = PianoKeyboardTouchTracker()
        let token = ObjectIdentifier("touch-a" as NSString)
        _ = tracker.touchBegan(token: token, midi: 60)
        let moved = tracker.touchMoved(token: token, to: 62)
        XCTAssertEqual(moved.noteOffs, [60])
        XCTAssertEqual(moved.noteOns, [62])
    }

    func testReleaseAllClearsActiveNotes() {
        var tracker = PianoKeyboardTouchTracker()
        let a = ObjectIdentifier("touch-a" as NSString)
        let b = ObjectIdentifier("touch-b" as NSString)
        _ = tracker.touchBegan(token: a, midi: 60)
        _ = tracker.touchBegan(token: b, midi: 64)
        let all = tracker.releaseAll()
        XCTAssertEqual(Set(all.noteOffs), Set([60, 64]))
        XCTAssertTrue(all.activeMidis.isEmpty)
    }

    func testHitTestPrefersBlackKey() {
        let layout = PianoKeyboardHitTestLayout(
            displayRange: PianoStagePitchRange(minMidi: 60, maxMidi: 72),
            blackKeyWidthRatio: 0.6,
            blackKeyHeightRatio: 0.62
        )
        let size = CGSize(width: 390, height: 88)
        let whites = (60...72).filter { !PianoKeyboardScrollGeometry.isBlackKey($0) }
        let whiteWidth = size.width / CGFloat(max(1, whites.count))
        // C#61 sits between C60 and D62; center near right edge of C white key
        let blackCenterX = whiteWidth * 1.0
        let midi = layout.midi(at: CGPoint(x: blackCenterX, y: 10), in: size)
        XCTAssertEqual(midi, 61)
    }
}
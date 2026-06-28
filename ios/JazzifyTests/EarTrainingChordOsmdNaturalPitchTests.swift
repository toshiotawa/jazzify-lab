import XCTest
@testable import Jazzify

final class EarTrainingChordOsmdNaturalPitchTests: XCTestCase {
    private func singleNoteXml(fifths: Int, step: String, alter: String? = nil, accidental: String? = nil) -> String {
        let alterXml = alter.map { "<alter>\($0)</alter>" } ?? ""
        let accidentalXml = accidental.map { "<accidental>\($0)</accidental>" } ?? ""
        return """
        <?xml version="1.0" encoding="UTF-8"?>
        <score-partwise>
          <part>
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key><fifths>\(fifths)</fifths></key>
              </attributes>
              <note>
                <pitch><step>\(step)</step>\(alterXml)<octave>4</octave></pitch>
                <duration>1</duration>
                \(accidentalXml)
              </note>
            </measure>
          </part>
        </score-partwise>
        """
    }

    func testFMajorBNaturalWithoutAlterIsMidi71() {
        let xml = singleNoteXml(fifths: -1, step: "B")
        let attacks = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(xml)
        XCTAssertEqual(attacks.count, 1)
        XCTAssertEqual(attacks[0].midis, [71])
    }

    func testEbMajorANaturalWithoutAlterIsMidi69() {
        let xml = singleNoteXml(fifths: -3, step: "A")
        let attacks = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(xml)
        XCTAssertEqual(attacks.count, 1)
        XCTAssertEqual(attacks[0].midis, [69])
    }

    func testAllKeySignatureStepsAsNaturalAcrossFifths() {
        let sharpSteps = ["F", "C", "G", "D", "A", "E", "B"]
        let flatSteps = ["B", "E", "A", "D", "G", "C", "F"]
        let naturalMidi: [String: Int] = [
            "C": 60, "D": 62, "E": 64, "F": 65, "G": 67, "A": 69, "B": 71,
        ]

        for fifths in -7...7 {
            let steps: [String]
            if fifths > 0 {
                steps = Array(sharpSteps.prefix(fifths))
            } else if fifths < 0 {
                steps = Array(flatSteps.prefix(abs(fifths)))
            } else {
                steps = []
            }
            for step in steps {
                let xml = singleNoteXml(fifths: fifths, step: step)
                let attacks = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(xml)
                XCTAssertEqual(
                    attacks.first?.midis,
                    [naturalMidi[step] ?? -1],
                    "fifths=\(fifths) step=\(step)"
                )
            }
        }
    }

    func testTransposeEmitsNaturalAccidentalWhenNeeded() {
        let base = singleNoteXml(fifths: 0, step: "B", alter: "-1")
        let transposed = EarTrainingMusicXmlTransposer.transposeMusicXml(base, semitones: 2)
        XCTAssertTrue(transposed.contains("<step>C</step>"))
        XCTAssertTrue(transposed.contains("<alter>0</alter>"))
        XCTAssertTrue(transposed.contains("<accidental>natural</accidental>"))

        let attacks = EarTrainingChordOsmdMusicXmlNormalizer.collectChordOsmdMusicXmlAttacks(transposed)
        XCTAssertEqual(attacks.first?.midis, [72])
    }
}

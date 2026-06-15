import XCTest
@testable import Jazzify

final class EarTrainingTutorialOsmdDrumLoopResolverTests: XCTestCase {
    private let countIn = "https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3"
    private let drumOnly = "https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3"

    func testResolveReturnsPhraseAudioUrl() {
        let content: [String: EarTrainingTutorialContentRef] = [
            "mq-b1-q1-osmd": EarTrainingTutorialContentRef(
                stage: makeStage(),
                phrases: [EarTrainingTutorialContentPhrase(
                    order_index: 0,
                    title: nil,
                    title_en: nil,
                    music_xml_url: nil,
                    audio_url: countIn,
                    loop_duration_sec: nil,
                    audio_duration_sec: nil,
                    note_count: nil,
                    key_fifths: nil,
                    chords: nil,
                    notes: nil
                )],
                chord_quiz_items: nil,
                phrase_pair_adlib: nil,
                composite_config: nil
            ),
        ]
        XCTAssertEqual(
            EarTrainingTutorialOsmdDrumLoopResolver.resolveTutorialOsmdDrumLoopUrl(
                content: content,
                contentRef: "mq-b1-q1-osmd"
            ),
            countIn
        )
    }

    func testShouldNotStartDrumWhenPhraseHasAudio() {
        XCTAssertFalse(
            EarTrainingTutorialOsmdDrumLoopResolver.shouldStartTutorialOsmdDrumLoop(
                phraseAudioUrl: countIn,
                drumLoopUrl: drumOnly
            )
        )
    }

    func testShouldStartDrumOnlyWhenPhraseEmptyAndDrumPresent() {
        XCTAssertTrue(
            EarTrainingTutorialOsmdDrumLoopResolver.shouldStartTutorialOsmdDrumLoop(
                phraseAudioUrl: "",
                drumLoopUrl: drumOnly
            )
        )
    }

    private func makeStage() -> EarTrainingTutorialContentStage {
        EarTrainingTutorialContentStage(
            slug: "mq-b1-q1-osmd",
            title: "t",
            title_en: nil,
            bpm: 100,
            key_fifths: 0,
            beats_per_measure: 4,
            beat_type: 4,
            loop_measures: 24,
            max_loops_per_phrase: 1,
            count_in_beats: 0,
            time_limit_sec: 600,
            player_hp: 100,
            enemy_hp: 100,
            per_correct_note_damage: nil,
            good_completion_damage: nil,
            great_completion_damage: nil,
            perfect_completion_damage: nil,
            miss_damage: nil,
            fail_damage: nil,
            perfect_max_misses: nil,
            great_max_misses: nil,
            background_theme: nil,
            mode: "chord_osmd",
            chord_voicing_self_paced: nil,
            chord_voicing_composite_phrase: nil,
            quiz_duration_seconds: nil,
            quiz_question_order: nil,
            quiz_show_notation_in_battle: nil,
            hide_chord_names_in_battle: nil,
            quiz_required_correct_count: nil,
            show_keyboard_hints_in_battle: nil,
            osmd_targets_from_score: nil
        )
    }
}

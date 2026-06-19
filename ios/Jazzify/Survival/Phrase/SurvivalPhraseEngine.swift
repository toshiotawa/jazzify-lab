import Foundation

enum SurvivalPhraseNoteResult: Equatable {
    case progress
    case resync
    case measureComplete
    case miss
}

struct SurvivalPhraseRuntimeState: Equatable {
    let phrase: SurvivalPhraseDefinition
    var chordIndex: Int
    var targetNoteIndex: Int
    var correctNoteIndices: Set<Int>
    var revealedNoteIndices: Set<Int>
}

enum SurvivalPhraseEngine {
    static func createInitialState(phrase: SurvivalPhraseDefinition) -> SurvivalPhraseRuntimeState {
        SurvivalPhraseRuntimeState(
            phrase: phrase,
            chordIndex: 0,
            targetNoteIndex: 0,
            correctNoteIndices: [],
            revealedNoteIndices: []
        )
    }

    static func evaluateNoteOn(
        state: SurvivalPhraseRuntimeState,
        pitchClass: Int
    ) -> (result: SurvivalPhraseNoteResult, nextState: SurvivalPhraseRuntimeState) {
        guard let chord = state.phrase.chords[safe: state.chordIndex],
              !chord.notes.isEmpty
        else {
            return (.miss, state)
        }

        let beforeLength = state.targetNoteIndex
        let cache = PhraseStreamMatching.getChordPatternCache(notes: chord.notes)
        let advance = PhraseStreamMatching.advanceSequential(
            pattern: cache.pattern,
            matchedLength: beforeLength,
            pitchClass: pitchClass
        )
        let nextMatchedLength = advance.matchedLength

        if nextMatchedLength == 0 {
            return (.miss, resetChord(state))
        }

        let nextCorrect = PhraseStreamMatching.prefixIndexSet(nextMatchedLength)
        var progressed = state
        progressed.targetNoteIndex = nextMatchedLength
        progressed.correctNoteIndices = nextCorrect
        progressed.revealedNoteIndices = nextCorrect

        if nextMatchedLength >= chord.notes.count {
            return (.measureComplete, advanceChord(progressed))
        }

        let result: SurvivalPhraseNoteResult = advance.resync ? .resync : .progress
        return (result, progressed)
    }

    /// 現在塊が休符(notes 空)のとき入力なしで次塊へ送る。play の「会話だけの小節」用。
    /// non-rest では advanced=false を返し何もしない。
    static func skipRestChord(
        _ state: SurvivalPhraseRuntimeState
    ) -> (advanced: Bool, wrapped: Bool, nextState: SurvivalPhraseRuntimeState) {
        guard let chord = state.phrase.chords[safe: state.chordIndex], !chord.notes.isEmpty else {
            let next = advanceChord(state)
            return (!state.phrase.chords.isEmpty, next.chordIndex == 0, next)
        }
        return (false, false, state)
    }

    static func targetMidi(state: SurvivalPhraseRuntimeState) -> Int? {
        guard let chord = state.phrase.chords[safe: state.chordIndex],
              let note = chord.notes[safe: state.targetNoteIndex] else { return nil }
        return note.pitchMidi
    }

    static func displayChords(state: SurvivalPhraseRuntimeState) -> (current: SurvivalPhraseChord?, next: SurvivalPhraseChord?) {
        let chords = state.phrase.chords
        guard !chords.isEmpty else { return (nil, nil) }
        let current = chords[state.chordIndex]
        let nextIndex = (state.chordIndex + 1) % chords.count
        return (current, chords[nextIndex])
    }

    private static func resetChord(_ state: SurvivalPhraseRuntimeState) -> SurvivalPhraseRuntimeState {
        var next = state
        next.targetNoteIndex = 0
        next.correctNoteIndices = []
        next.revealedNoteIndices = []
        return next
    }

    private static func advanceChord(_ state: SurvivalPhraseRuntimeState) -> SurvivalPhraseRuntimeState {
        let count = state.phrase.chords.count
        guard count > 0 else { return state }
        var next = state
        next.chordIndex = (state.chordIndex + 1) % count
        next.targetNoteIndex = 0
        next.correctNoteIndices = []
        next.revealedNoteIndices = []
        return next
    }

    /// 塊 index が同一 measureNumber 内の最終塊か（playalong 衝撃波の小節単位判定）。
    static func isLastChunkInMeasure(chords: [SurvivalPhraseChord], chunkIndex: Int) -> Bool {
        guard chunkIndex >= 0, chunkIndex < chords.count else { return false }
        let measureNum = chords[chunkIndex].measureNumber
        for i in (chunkIndex + 1)..<chords.count where chords[i].measureNumber == measureNum {
            return false
        }
        return true
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

// MARK: - 鍵盤スクロール（フレーズ全曲の最高音基準）

enum SurvivalPhraseKeyboardScroll {
    private static func isBlackKey(_ midi: Int) -> Bool {
        switch ((midi % 12) + 12) % 12 {
        case 1, 3, 6, 8, 10:
            return true
        default:
            return false
        }
    }

    static func maxPitchMidi(in phrase: SurvivalPhraseDefinition) -> Int? {
        var maxValue: Int?
        for chord in phrase.chords {
            for note in chord.notes {
                if maxValue == nil || note.pitchMidi > maxValue! {
                    maxValue = note.pitchMidi
                }
            }
        }
        return maxValue
    }

    /// 複合フレーズ: ソース全フレーズの最高 MIDI。
    static func maxPitchMidi(in phrases: [SurvivalPhraseDefinition]) -> Int? {
        var maxValue: Int?
        for phrase in phrases {
            guard let v = maxPitchMidi(in: phrase) else { continue }
            if maxValue == nil || v > maxValue! {
                maxValue = v
            }
        }
        return maxValue
    }

    /// フレーズ最高音が右端に来るとタップしづらいため、白鍵1つ分だけ右端を空ける。
    private static let trailingInsetWhiteKeys = 1

    static func scrollAnchorWhiteMidi(maxPhraseMidi: Int, firstMidi: Int = 21, lastMidi: Int = 108) -> Int {
        let whites = (firstMidi...lastMidi).filter { !isBlackKey($0) }
        guard !whites.isEmpty else {
            return max(firstMidi, min(lastMidi, maxPhraseMidi))
        }
        var highestWhiteIndex = 0
        for (index, midi) in whites.enumerated() where midi <= maxPhraseMidi {
            highestWhiteIndex = index
        }
        let anchorIndex = min(highestWhiteIndex + trailingInsetWhiteKeys, whites.count - 1)
        return whites[anchorIndex]
    }

    /// Progression での実ボイシング（`midiNotes`）の全体最大 MIDI。
    static func maxPitchMidi(in chord: SurvivalResolvedChord) -> Int? {
        chord.midiNotes.max()
    }

    /// コード進行ステージ全体のボイシング最大 MIDI。
    static func maxPitchMidi(in chords: [SurvivalResolvedChord]) -> Int? {
        var maxValue: Int?
        for chord in chords {
            for note in chord.midiNotes {
                if maxValue == nil || note > maxValue! {
                    maxValue = note
                }
            }
        }
        return maxValue
    }

    /// 鍵盤 HINT 用 MIDI 集合（`midiNotes` 直値）。
    static func hintHighlightMidis(from chord: SurvivalResolvedChord) -> Set<Int> {
        Set(chord.midiNotes)
    }

    /// 出題コードプールにおけるヒント鍵の最大 MIDI（`midiNotes` 直値）。
    static func maxHintMidi(fromChordIds allowedChordIds: [String]) -> Int? {
        var maxValue: Int?
        for id in allowedChordIds {
            guard let chord = SurvivalChordResolver.resolve(id: id) else { continue }
            for midi in chord.midiNotes {
                if maxValue == nil || midi > maxValue! {
                    maxValue = midi
                }
            }
        }
        return maxValue
    }
}

// MARK: - 序盤コンボ与ダメ上限（Web survivalPhraseComboDamageCap.ts と整合）

enum SurvivalPhraseComboDamageCap {
    static let earlyUntilCombo = 5
    static let maxOutgoingDamagePerHit = 50

    /// フレーズ序盤（1〜5コンボ）はプレイヤー攻撃自体を出さない。6コンボ目から発生。
    static func shouldFirePlayerAttacks(comboCount: Int) -> Bool {
        comboCount > earlyUntilCombo
    }

    static func clampOutgoing(rawDamage: Int, isPhraseMode: Bool, comboCount: Int) -> Int {
        guard isPhraseMode, comboCount <= earlyUntilCombo else { return rawDamage }
        return min(rawDamage, maxOutgoingDamagePerHit)
    }
}

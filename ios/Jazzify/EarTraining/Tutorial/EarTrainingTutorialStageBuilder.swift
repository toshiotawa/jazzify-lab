import Foundation

enum EarTrainingTutorialStageBuilder {
    private static let namespace = UUID(uuidString: "A0000000-0000-4000-8000-000000000001")!

    static func stableId(_ seed: String) -> UUID {
        var bytes = [UInt8](repeating: 0, count: 16)
        for (index, byte) in seed.utf8.enumerated() {
            bytes[index % 16] ^= byte
        }
        bytes[6] = (bytes[6] & 0x0F) | 0x40
        bytes[8] = (bytes[8] & 0x3F) | 0x80
        return UUID(uuid: (
            bytes[0], bytes[1], bytes[2], bytes[3],
            bytes[4], bytes[5], bytes[6], bytes[7],
            bytes[8], bytes[9], bytes[10], bytes[11],
            bytes[12], bytes[13], bytes[14], bytes[15]
        ))
    }

    static func buildStageDetail(
        contentKey: String,
        content: EarTrainingTutorialContentRef,
        keyboardHintsScriptDefault: Bool = false,
        locale: AppLocale = .ja
    ) -> EarTrainingStageDetail {
        let stageId = stableId("tutorial-stage-\(contentKey)")
        let stage = content.stage
        let mode = EarTrainingMode(rawValue: stage.mode) ?? .chordVoicing
        let phrases: [EarTrainingPhraseDetail]? = content.phrases?.map { phrase in
            let phraseId = stableId("tutorial-\(contentKey)-phrase-\(phrase.order_index)")
            let loopDurationSec = phrase.loop_duration_sec ?? 8
            let timedChordPayloads = fillChordTimingsIfNeeded(
                chords: phrase.chords ?? [],
                bpm: stage.bpm,
                beatsPerMeasure: stage.beats_per_measure,
                loopDurationSec: loopDurationSec
            )
            let chords = timedChordPayloads.map { chord in
                let chordId = stableId("tutorial-\(phraseId.uuidString)-ch-\(chord.order_index)")
                let quoteDetail: EarTrainingPhraseChordQuoteDetail?
                if let quote = chord.quote {
                    let text = quote.localized(locale).trimmingCharacters(in: .whitespacesAndNewlines)
                    if text.isEmpty {
                        quoteDetail = nil
                    } else {
                        quoteDetail = EarTrainingPhraseChordQuoteDetail(
                            id: stableId("tutorial-\(chordId.uuidString)-quote"),
                            phraseChordId: chordId,
                            text: text
                        )
                    }
                } else {
                    quoteDetail = nil
                }
                return EarTrainingPhraseChordDetail(
                    id: chordId,
                    phraseId: phraseId,
                    orderIndex: chord.order_index,
                    chordName: chord.chord_name,
                    measureNumber: chord.measure_number,
                    beatOffset: chord.beat_offset,
                    durationBeats: chord.duration_beats,
                    startTimeSec: chord.start_time_sec,
                    endTimeSec: chord.end_time_sec,
                    voicing: chord.voicing,
                    voicingStaves: chord.voicing_staves,
                    quote: quoteDetail,
                    inputDisabled: chord.input_disabled ?? false
                )
            }
            let notes = phrase.notes?.map { note in
                EarTrainingPhraseNoteDetail(
                    id: stableId("tutorial-\(phraseId.uuidString)-note-\(note.note_index)"),
                    phraseId: phraseId,
                    noteIndex: note.note_index,
                    pitchMidi: note.pitch_midi,
                    pitchClass: ((note.pitch_class % 12) + 12) % 12,
                    noteName: note.note_name,
                    octave: note.octave,
                    measureNumber: note.measure_number,
                    beatOffset: note.beat_offset,
                    tiedFromPrevious: note.tied_from_previous
                )
            }
            return EarTrainingPhraseDetail(
                id: phraseId,
                stageId: stageId,
                orderIndex: phrase.order_index,
                keyFifths: phrase.key_fifths,
                title: phrase.title,
                titleEn: phrase.title_en,
                musicXmlUrl: phrase.music_xml_url,
                midiUrl: nil,
                audioUrl: phrase.audio_url ?? "",
                loopDurationSec: phrase.loop_duration_sec ?? 8,
                audioDurationSec: phrase.audio_duration_sec ?? 8,
                noteCount: phrase.note_count ?? notes?.count ?? 1,
                notes: notes,
                chords: chords,
                demoLoops: nil
            )
        }
        let quizItems: [EarTrainingChordQuizItem]? = content.chord_quiz_items?.map { item in
            EarTrainingChordQuizItem(
                id: stableId("tutorial-\(contentKey)-qi-\(item.order_index)"),
                stageId: stageId,
                orderIndex: item.order_index,
                measureNumber: item.measure_number,
                beatOffset: nil,
                durationBeats: nil,
                chordName: item.chord_name,
                voicing: item.voicing,
                voicingStaves: item.voicing_staves ?? [],
                keyFifths: item.key_fifths
            )
        }
        let phrasePairAdlibBootstrap = content.phrase_pair_adlib.map {
            EarTrainingTutorialInlineBootstrap.buildPhrasePairAdlibBootstrap(
                contentKey: contentKey,
                payload: $0,
                locale: locale
            )
        } ?? nil

        var compositePhraseBootstrap: EarTrainingCompositePhraseBootstrap?
        if stage.chord_voicing_composite_phrase == true,
           let cfg = content.composite_config,
           let builtPhrases = phrases {
            compositePhraseBootstrap = EarTrainingTutorialInlineBootstrap.buildCompositePhraseBootstrap(
                contentKey: contentKey,
                stageId: stageId,
                phrases: builtPhrases,
                config: cfg
            )
        }

        return EarTrainingStageDetail(
            id: stageId,
            slug: stage.slug,
            title: stage.title,
            titleEn: stage.title_en,
            description: nil,
            descriptionEn: nil,
            bpm: stage.bpm,
            beatsPerMeasure: stage.beats_per_measure,
            beatType: stage.beat_type,
            loopMeasures: stage.loop_measures,
            maxLoopsPerPhrase: stage.max_loops_per_phrase,
            countInBeats: stage.count_in_beats,
            timeLimitSec: stage.time_limit_sec,
            playerHp: stage.player_hp,
            enemyHp: stage.enemy_hp,
            perCorrectNoteDamage: stage.per_correct_note_damage ?? 0,
            goodCompletionDamage: stage.good_completion_damage ?? 0,
            greatCompletionDamage: stage.great_completion_damage ?? 0,
            perfectCompletionDamage: stage.perfect_completion_damage ?? 0,
            missDamage: stage.miss_damage ?? 0,
            failDamage: stage.fail_damage ?? 0,
            perfectMaxMisses: stage.perfect_max_misses ?? 0,
            greatMaxMisses: stage.great_max_misses ?? 0,
            backgroundTheme: stage.background_theme,
            isActive: true,
            mode: mode,
            keyFifths: stage.key_fifths,
            phrases: phrases,
            chordVoicingSelfPaced: stage.chord_voicing_self_paced,
            quizDurationSeconds: stage.quiz_duration_seconds,
            quizQuestionOrder: stage.quiz_question_order,
            quizShowNotationInBattle: stage.quiz_show_notation_in_battle,
            hideChordNamesInBattle: stage.hide_chord_names_in_battle,
            quizRequiredCorrectCount: stage.quiz_required_correct_count,
            showKeyboardHintsInBattle: (stage.show_keyboard_hints_in_battle == true) || keyboardHintsScriptDefault,
            osmdTargetsFromScore: stage.osmd_targets_from_score,
            isSwing: stage.is_swing,
            chordQuizItems: quizItems,
            chordVoicingCompositePhrase: stage.chord_voicing_composite_phrase,
            compositePhraseBootstrap: compositePhraseBootstrap,
            phrasePairAdlibBootstrap: phrasePairAdlibBootstrap
        )
    }

    static func resolveStage(
        content: [String: EarTrainingTutorialContentRef],
        contentRef: String,
        keyboardHintsScriptDefault: Bool = false,
        locale: AppLocale = .ja
    ) throws -> EarTrainingStageDetail {
        guard let ref = content[contentRef] else {
            throw NSError(domain: "EarTrainingTutorial", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Tutorial content not found: \(contentRef)"
            ])
        }
        return buildStageDetail(
            contentKey: contentRef,
            content: ref,
            keyboardHintsScriptDefault: keyboardHintsScriptDefault,
            locale: locale
        )
    }

    /// Web `fillTutorialPhraseChordTimings` 相当。measure/beat から start/end を補完する。
    private static func fillChordTimingsIfNeeded(
        chords: [EarTrainingTutorialContentChord],
        bpm: Int,
        beatsPerMeasure: Int,
        loopDurationSec: Double
    ) -> [EarTrainingTutorialContentChord] {
        guard !chords.isEmpty else { return chords }
        let beatSec = 60.0 / Double(max(1, bpm))
        let sorted = chords.sorted { $0.order_index < $1.order_index }
        var withStart: [EarTrainingTutorialContentChord] = []
        withStart.reserveCapacity(sorted.count)
        for (index, chord) in sorted.enumerated() {
            if let start = chord.start_time_sec, start.isFinite {
                withStart.append(chord)
                continue
            }
            let measure = chord.measure_number ?? (index + 1)
            let beat = chord.beat_offset ?? 1
            let startSec = (Double(max(1, measure) - 1) * Double(max(1, beatsPerMeasure)) + (beat - 1)) * beatSec
            withStart.append(EarTrainingTutorialContentChord(
                order_index: chord.order_index,
                chord_name: chord.chord_name,
                measure_number: chord.measure_number,
                beat_offset: chord.beat_offset,
                duration_beats: chord.duration_beats,
                start_time_sec: startSec,
                end_time_sec: chord.end_time_sec,
                voicing: chord.voicing,
                voicing_staves: chord.voicing_staves,
                quote: chord.quote,
                input_disabled: chord.input_disabled
            ))
        }
        return withStart.enumerated().map { pair in
            let index = pair.offset
            var chord = pair.element
            if let end = chord.end_time_sec, end.isFinite {
                return chord
            }
            let nextStart = index + 1 < withStart.count ? withStart[index + 1].start_time_sec : nil
            let endSec: Double
            if let nextStart, nextStart.isFinite {
                endSec = nextStart
            } else {
                endSec = loopDurationSec
            }
            chord = EarTrainingTutorialContentChord(
                order_index: chord.order_index,
                chord_name: chord.chord_name,
                measure_number: chord.measure_number,
                beat_offset: chord.beat_offset,
                duration_beats: chord.duration_beats,
                start_time_sec: chord.start_time_sec,
                end_time_sec: min(loopDurationSec, endSec),
                voicing: chord.voicing,
                voicing_staves: chord.voicing_staves,
                quote: chord.quote,
                input_disabled: chord.input_disabled
            )
            return chord
        }
    }
}

// MARK: - Inline bootstrap / measure clear / timed dialogue（Xcode 登録用に同ファイルへ集約）

enum EarTrainingTutorialInlineBootstrap {
    static func buildPhrasePairAdlibBootstrap(
        contentKey: String,
        payload: EarTrainingTutorialContentPhrasePairAdlib,
        locale: AppLocale
    ) -> EarTrainingPhrasePairAdlibBootstrap? {
        let bgmUrl = payload.bgm_url.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !bgmUrl.isEmpty, !payload.steps.isEmpty else { return nil }

        var patternsByGroupId: [UUID: [EarTrainingPhrasePairEngine.Pattern]] = [:]
        let patterns = payload.patterns ?? []
        for (index, row) in patterns.enumerated() {
            let key = row.group_key.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !key.isEmpty else { continue }
            let groupId = EarTrainingTutorialStageBuilder.stableId("tutorial-ppg-\(contentKey)-\(key)")
            let pattern = EarTrainingPhrasePairEngine.Pattern(
                id: "tutorial-ppat-\(contentKey)-\(key)-\(index)",
                label: row.label,
                pcs: row.pcs.map { (($0 % 12) + 12) % 12 },
                familyId: row.family_id,
                carryTailLength: row.carry_tail_length ?? 0,
                priority: row.priority ?? 0,
                voicing: row.voicing,
                voicingStaves: row.voicing_staves
            )
            patternsByGroupId[groupId, default: []].append(pattern)
        }
        guard !patternsByGroupId.isEmpty else { return nil }

        let sortedSteps = payload.steps.sorted { $0.order_index < $1.order_index }
        var steps: [EarTrainingPhrasePairAdlibStep] = []
        steps.reserveCapacity(sortedSteps.count)
        for row in sortedSteps {
            let groupKey = row.pattern_group_key.trimmingCharacters(in: .whitespacesAndNewlines)
            let groupId = EarTrainingTutorialStageBuilder.stableId("tutorial-ppg-\(contentKey)-\(groupKey)")
            guard patternsByGroupId[groupId]?.isEmpty == false else { return nil }
            let quoteText: String?
            if let quote = row.quote {
                let trimmed = quote.localized(locale).trimmingCharacters(in: .whitespacesAndNewlines)
                quoteText = trimmed.isEmpty ? nil : trimmed
            } else {
                quoteText = nil
            }
            steps.append(EarTrainingPhrasePairAdlibStep(
                id: EarTrainingTutorialStageBuilder.stableId("tutorial-pstep-\(contentKey)-\(row.order_index)"),
                orderIndex: row.order_index,
                chordName: row.chord_name,
                patternGroupId: groupId,
                measureNumber: row.measure_number,
                startTimeSec: row.start_time_sec,
                endTimeSec: row.end_time_sec,
                quote: quoteText,
                inputDisabled: row.input_disabled ?? false
            ))
        }

        return EarTrainingPhrasePairAdlibBootstrap(
            bgmUrl: bgmUrl,
            keyFifths: payload.key_fifths ?? 0,
            loopDurationSec: payload.loop_duration_sec,
            steps: steps,
            patternsByGroupId: patternsByGroupId
        )
    }

    static func buildCompositePhraseBootstrap(
        contentKey: String,
        stageId: UUID,
        phrases: [EarTrainingPhraseDetail],
        config: EarTrainingTutorialContentCompositeConfig
    ) -> EarTrainingCompositePhraseBootstrap? {
        let orderIndices = config.source_phrase_order_indices?.isEmpty == false
            ? config.source_phrase_order_indices!
            : phrases.map(\.orderIndex)
        let sourcePhraseIds: [UUID] = orderIndices.compactMap { oi in
            phrases.first(where: { $0.orderIndex == oi })?.id
        }
        guard sourcePhraseIds.count == orderIndices.count else { return nil }
        return EarTrainingCompositePhraseAdapter.buildBootstrap(
            stagePhrases: phrases,
            bgmUrl: config.bgm_url,
            keyFifths: config.key_fifths ?? 0,
            sourcePhraseIdsOrdered: sourcePhraseIds
        )
    }
}

enum EarTrainingTutorialMeasureClear {
    static func clearDelayMs(
        bpm: Int,
        beatsPerMeasure: Int,
        countInBeats: Int,
        requiredMeasures: Int
    ) -> Double {
        let beatDurationSec = 60.0 / Double(max(1, bpm))
        let measureDurationSec = beatDurationSec * Double(max(1, beatsPerMeasure))
        let countInDurationSec = Double(max(0, countInBeats)) * beatDurationSec
        let measures = max(1, requiredMeasures)
        return (countInDurationSec + Double(measures) * measureDurationSec) * 1000
    }
}

enum EarTrainingTutorialOsmdTimedDialogue {
    static func delayMs(
        line: EarTrainingTutorialOsmdTimedLine,
        bpm: Int,
        beatsPerMeasure: Int,
        countInBeats: Int,
        loopIndex: Int,
        phraseLoopDurationSec: Double
    ) -> Double? {
        let safeBpm = max(1, bpm)
        let beatDurationSec = 60.0 / Double(safeBpm)
        let measureDurationSec = beatDurationSec * Double(max(1, beatsPerMeasure))
        let safeCountIn = max(0, min(32, countInBeats))
        let countInDurationSec = Double(safeCountIn) * beatDurationSec
        let skipCountIn = loopIndex > 0
        let loopDur = phraseLoopDurationSec.isFinite && phraseLoopDurationSec > 0
            ? phraseLoopDurationSec
            : measureDurationSec * Double(max(1, beatsPerMeasure))

        switch line {
        case let .countIn(loop: optionalLoop, beat: beat, _):
            if skipCountIn { return nil }
            let targetLoop = optionalLoop ?? 0
            if targetLoop != loopIndex { return nil }
            let clampedBeat = max(1, beat)
            if clampedBeat > safeCountIn { return nil }
            return Double(clampedBeat - 1) * beatDurationSec * 1000
        case let .at(loop: atLoop, measure: measure, beat: beat, _):
            if atLoop != loopIndex { return nil }
            let countInOffsetSec = skipCountIn ? 0 : countInDurationSec
            let measureIndex = max(1, measure) - 1
            let beatIndex = max(1, beat) - 1
            let phraseOffsetSec = Double(measureIndex) * measureDurationSec + Double(beatIndex) * beatDurationSec
            let loopOffsetSec = Double(loopIndex) * loopDur
            return (loopOffsetSec + countInOffsetSec + phraseOffsetSec) * 1000
        }
    }

    @discardableResult
    static func schedule(
        lines: [EarTrainingTutorialOsmdTimedLine],
        bpm: Int,
        beatsPerMeasure: Int,
        countInBeats: Int,
        loopIndex: Int,
        phraseLoopDurationSec: Double,
        locale: AppLocale,
        isActive: @escaping () -> Bool,
        onLine: @escaping (String) -> Void
    ) -> [DispatchWorkItem] {
        var works: [DispatchWorkItem] = []
        let mainQueue = DispatchQueue.main
        for line in lines {
            guard let delayMs = delayMs(
                line: line,
                bpm: bpm,
                beatsPerMeasure: beatsPerMeasure,
                countInBeats: countInBeats,
                loopIndex: loopIndex,
                phraseLoopDurationSec: phraseLoopDurationSec
            ) else { continue }
            let text: String
            switch line {
            case let .countIn(_, _, loc),
                 let .at(_, _, _, loc):
                text = loc.localized(locale)
            }
            let work = DispatchWorkItem {
                guard isActive() else { return }
                onLine(text)
            }
            works.append(work)
            mainQueue.asyncAfter(deadline: .now() + delayMs / 1000, execute: work)
        }
        return works
    }

    static func cancel(_ works: inout [DispatchWorkItem]) {
        for work in works {
            work.cancel()
        }
        works.removeAll()
    }
}

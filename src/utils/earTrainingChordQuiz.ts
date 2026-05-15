import type {
  EarTrainingChordQuizItem,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
  EarTrainingStage,
} from '@/types';

/**
 * chord_quiz: 次の出題インデックス（読み取りやすさのため `items[].order_index` は使わず 0..n-1）。
 * `random`: 問題が2つ以上あるとき `prevIndex` と別の問題を選ぶ。
 */
export const pickNextQuizIndex = <T extends { order_index?: number | null }>(
  items: readonly T[],
  order: 'random' | 'sequential',
  prevIndex: number | null,
  rand: () => number,
): number => {
  const n = items.length;
  if (n <= 0) {
    return 0;
  }
  if (n === 1) {
    return 0;
  }
  if (order === 'sequential') {
    return ((prevIndex ?? -1) + 1) % n;
  }
  let next = Math.floor(rand() * n);
  if (prevIndex !== null && next === prevIndex) {
    let guard = 0;
    while (next === prevIndex && guard < 32) {
      next = Math.floor(rand() * n);
      guard += 1;
    }
    if (next === prevIndex) {
      next = (prevIndex + 1) % n;
    }
  }
  return next;
};

export const isQuizClear = (correct: number, required: number): boolean => (
  correct >= Math.max(0, required)
);

export interface EarTrainingChordQuizQuestion {
  id: string;
  order_index: number;
  measure_number: number | null;
  key_fifths?: number | null;
  chords: readonly EarTrainingPhraseChord[];
}

interface MutableQuestionGroup {
  id: string;
  orderIndex: number;
  measureNumber: number | null;
  keyFifths?: number | null;
  chords: EarTrainingPhraseChord[];
}

const hasPlayableVoicing = (
  chord: Pick<EarTrainingPhraseChord, 'voicing'>,
): boolean => (chord.voicing?.length ?? 0) > 0;

const normalizedPositiveInteger = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const normalized = Math.trunc(value);
  return normalized >= 1 ? normalized : null;
};

const sortChordsForQuizQuestion = <T extends {
  order_index: number;
  measure_number?: number | null;
  beat_offset?: number | null;
  start_time_sec?: number | null;
}>(a: T, b: T): number => {
  const measureA = a.measure_number ?? Number.POSITIVE_INFINITY;
  const measureB = b.measure_number ?? Number.POSITIVE_INFINITY;
  if (measureA !== measureB) {
    return measureA - measureB;
  }
  const beatA = a.beat_offset ?? Number.POSITIVE_INFINITY;
  const beatB = b.beat_offset ?? Number.POSITIVE_INFINITY;
  if (beatA !== beatB) {
    return beatA - beatB;
  }
  const startA = a.start_time_sec ?? Number.POSITIVE_INFINITY;
  const startB = b.start_time_sec ?? Number.POSITIVE_INFINITY;
  if (startA !== startB) {
    return startA - startB;
  }
  return a.order_index - b.order_index;
};

const questionFromGroup = (group: MutableQuestionGroup): EarTrainingChordQuizQuestion => ({
  id: group.id,
  order_index: group.orderIndex,
  measure_number: group.measureNumber,
  key_fifths: group.keyFifths,
  chords: group.chords.slice().sort(sortChordsForQuizQuestion),
});

const quizItemToPhraseChord = (
  item: EarTrainingChordQuizItem,
  phraseId: string,
): EarTrainingPhraseChord => ({
  id: item.id,
  phrase_id: phraseId,
  order_index: item.order_index,
  chord_name: item.chord_name,
  measure_number: item.measure_number ?? null,
  beat_offset: item.beat_offset ?? null,
  duration_beats: item.duration_beats ?? null,
  voicing: item.voicing,
  voicing_staves: item.voicing_staves,
});

const buildEarTrainingChordQuizQuestionsFromItems = (
  items: readonly EarTrainingChordQuizItem[],
): EarTrainingChordQuizQuestion[] => {
  const groups: MutableQuestionGroup[] = [];
  const groupByMeasure = new Map<number, MutableQuestionGroup>();

  items
    .filter(item => item.voicing.length > 0)
    .slice()
    .sort(sortChordsForQuizQuestion)
    .forEach(item => {
      const measureNumber = normalizedPositiveInteger(item.measure_number);
      if (measureNumber === null) {
        const phraseId = `chord-quiz-item-${item.id}`;
        groups.push({
          id: phraseId,
          orderIndex: item.order_index,
          measureNumber: null,
          chords: [quizItemToPhraseChord(item, phraseId)],
        });
        return;
      }

      let group = groupByMeasure.get(measureNumber);
      if (!group) {
        group = {
          id: `chord-quiz-measure-${measureNumber}`,
          orderIndex: item.order_index,
          measureNumber,
          chords: [],
        };
        groupByMeasure.set(measureNumber, group);
        groups.push(group);
      }
      group.orderIndex = Math.min(group.orderIndex, item.order_index);
      group.chords.push(quizItemToPhraseChord(item, group.id));
    });

  return groups
    .map(questionFromGroup)
    .sort((a, b) => a.order_index - b.order_index);
};

const buildEarTrainingChordQuizQuestionsFromPhrases = (
  phrases: readonly EarTrainingPhrase[],
): EarTrainingChordQuizQuestion[] => {
  const groups: MutableQuestionGroup[] = [];

  phrases
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .forEach(phrase => {
      const groupByMeasure = new Map<number, MutableQuestionGroup>();
      const phraseChords = (phrase.chords ?? [])
        .filter(hasPlayableVoicing)
        .slice()
        .sort(sortChordsForQuizQuestion);

      phraseChords.forEach(chord => {
        const measureNumber = normalizedPositiveInteger(chord.measure_number);
        if (measureNumber === null) {
          groups.push({
            id: `${phrase.id}-chord-${chord.id}`,
            orderIndex: groups.length,
            measureNumber: null,
            keyFifths: phrase.key_fifths,
            chords: [chord],
          });
          return;
        }

        let group = groupByMeasure.get(measureNumber);
        if (!group) {
          group = {
            id: `${phrase.id}-measure-${measureNumber}`,
            orderIndex: groups.length,
            measureNumber,
            keyFifths: phrase.key_fifths,
            chords: [],
          };
          groupByMeasure.set(measureNumber, group);
          groups.push(group);
        }
        group.chords.push(chord);
      });
    });

  return groups.map(questionFromGroup);
};

export const buildEarTrainingChordQuizQuestions = (
  stage: Pick<EarTrainingStage, 'chord_quiz_items' | 'phrases'>,
): EarTrainingChordQuizQuestion[] => {
  const itemQuestions = buildEarTrainingChordQuizQuestionsFromItems(stage.chord_quiz_items ?? []);
  if (itemQuestions.length > 0) {
    return itemQuestions;
  }
  return buildEarTrainingChordQuizQuestionsFromPhrases(stage.phrases ?? []);
};

export const getActiveChordInQuizQuestion = (
  question: EarTrainingChordQuizQuestion | null | undefined,
  completedChordIds: ReadonlySet<string> | null | undefined,
): EarTrainingPhraseChord | null => {
  const chords = question?.chords ?? [];
  if (chords.length === 0) {
    return null;
  }
  return chords.find(
    chord => hasPlayableVoicing(chord) && completedChordIds?.has(chord.id) !== true,
  ) ?? null;
};

export const isChordQuizQuestionCompleted = (
  question: EarTrainingChordQuizQuestion | null | undefined,
  completedChordIds: ReadonlySet<string>,
): boolean => {
  const chords = question?.chords ?? [];
  return chords.length > 0 && chords.every(chord => !hasPlayableVoicing(chord) || completedChordIds.has(chord.id));
};

/**
 * Separate-tracks PCM mixer: one sample clock, boundary phrase/tempo apply.
 */
import {
  computeBgmReadFrame,
  planPhraseReservation,
  type PhraseSchedule,
  type SeparateTracksGrid,
} from './defenseSeparateTracksTransport';

export interface SeparateTracksPhrasePcm {
  readonly left: Float32Array;
  readonly right: Float32Array;
}

export interface SeparateTracksPreparedSet {
  readonly grid: SeparateTracksGrid;
  readonly bgmLeft: Float32Array;
  readonly bgmRight: Float32Array;
  readonly phrasePcms: readonly SeparateTracksPhrasePcm[];
  readonly speedPercent: number;
  readonly setId: number;
}

export interface PhraseRequestMailbox {
  readonly phraseIndex: number;
  readonly revision: number;
  readonly generation: number;
}

export interface TempoRequestMailbox {
  readonly preparedSet: SeparateTracksPreparedSet;
  readonly tempoRevision: number;
  readonly generation: number;
}

export interface SeparateTracksMixerState {
  sessionGeneration: number;
  absoluteCycle: number;
  phaseFrame: number;
  audiblePhraseIndex: number;
  desiredPhraseIndex: number;
  scheduled: PhraseSchedule | null;
  scheduledConfirmed: boolean;
  activeSet: SeparateTracksPreparedSet;
  pendingTempoSet: SeparateTracksPreparedSet | null;
  pendingTempoRevision: number;
  paused: boolean;
  bgmGain: number;
  melodyGain: number;
  /** Tempo-boundary crossfade: frames remaining, previous set snapshot. */
  tempoCrossfadeFramesRemaining: number;
  tempoCrossfadePreviousSet: SeparateTracksPreparedSet | null;
}

export interface RenderSeparateTracksBlockParams {
  readonly state: SeparateTracksMixerState;
  readonly outputLeft: Float32Array;
  readonly outputRight: Float32Array;
  readonly blockFrames: number;
  readonly leadFrames: number;
  readonly phraseRequest: PhraseRequestMailbox | null;
  readonly tempoRequest: TempoRequestMailbox | null;
}

export interface RenderSeparateTracksBlockResult {
  readonly state: SeparateTracksMixerState;
  readonly appliedPhraseAtBoundary: boolean;
  readonly appliedTempoAtBoundary: boolean;
}

const TEMPO_CROSSFADE_FRAMES = 220;

const clampPhraseIndex = (index: number, phraseCount: number): number => {
  if (phraseCount <= 0) {
    return 0;
  }
  return ((index % phraseCount) + phraseCount) % phraseCount;
};

const readSample = (
  data: Float32Array,
  frame: number,
): number => {
  if (frame < 0 || frame >= data.length) {
    return 0;
  }
  return data[frame] ?? 0;
};

const mixPhraseSample = (
  set: SeparateTracksPreparedSet,
  phraseIndex: number,
  melodyFrame: number,
): { left: number; right: number } => {
  const safeIndex = clampPhraseIndex(phraseIndex, set.phrasePcms.length);
  const phrase = set.phrasePcms[safeIndex];
  if (!phrase) {
    return { left: 0, right: 0 };
  }
  const safeFrame = Math.max(0, Math.min(melodyFrame, set.grid.cycleFrames - 1));
  return {
    left: readSample(phrase.left, safeFrame),
    right: readSample(phrase.right, safeFrame),
  };
};

const mixBgmSample = (
  set: SeparateTracksPreparedSet,
  bgmFrame: number,
): { left: number; right: number } => {
  const safeFrame = Math.max(0, Math.min(bgmFrame, set.grid.bgmFrames - 1));
  return {
    left: readSample(set.bgmLeft, safeFrame),
    right: readSample(set.bgmRight, safeFrame),
  };
};

const ingestPhraseRequest = (
  state: SeparateTracksMixerState,
  request: PhraseRequestMailbox | null,
  leadFrames: number,
): SeparateTracksMixerState => {
  if (!request || request.generation !== state.sessionGeneration) {
    return state;
  }

  const nextDesired = clampPhraseIndex(request.phraseIndex, state.activeSet.phrasePcms.length);
  const planned = planPhraseReservation({
    absoluteCycle: state.absoluteCycle,
    phaseFrame: state.phaseFrame,
    cycleFrames: state.activeSet.grid.cycleFrames,
    leadFrames,
    phraseIndex: nextDesired,
    revision: request.revision,
    generation: request.generation,
  });

  if (state.scheduled !== null && state.scheduledConfirmed) {
    return {
      ...state,
      desiredPhraseIndex: nextDesired,
      scheduled: {
        ...state.scheduled,
        phraseIndex: nextDesired,
        revision: request.revision,
      },
    };
  }

  if (state.scheduled !== null
    && !state.scheduledConfirmed
    && state.scheduled.targetCycle === planned.targetCycle
    && state.scheduled.generation === planned.generation) {
    return {
      ...state,
      desiredPhraseIndex: nextDesired,
      scheduled: {
        ...state.scheduled,
        phraseIndex: nextDesired,
        revision: request.revision,
      },
    };
  }

  return {
    ...state,
    desiredPhraseIndex: nextDesired,
    scheduled: planned,
    scheduledConfirmed: false,
  };
};

const ingestTempoRequest = (
  state: SeparateTracksMixerState,
  request: TempoRequestMailbox | null,
): SeparateTracksMixerState => {
  if (!request || request.generation !== state.sessionGeneration) {
    return state;
  }
  if (request.preparedSet.setId === state.activeSet.setId) {
    return state;
  }
  if (state.pendingTempoSet !== null
    && state.pendingTempoRevision >= request.tempoRevision) {
    return state;
  }
  return {
    ...state,
    pendingTempoSet: request.preparedSet,
    pendingTempoRevision: request.tempoRevision,
  };
};

const applyBoundaryActions = (
  state: SeparateTracksMixerState,
): SeparateTracksMixerState => {
  let next = state;

  if (next.pendingTempoSet !== null) {
    const previousSet = next.activeSet;
    next = {
      ...next,
      activeSet: next.pendingTempoSet,
      pendingTempoSet: null,
      phaseFrame: 0,
      tempoCrossfadeFramesRemaining: TEMPO_CROSSFADE_FRAMES,
      tempoCrossfadePreviousSet: previousSet,
    };
  }

  if (next.scheduled !== null && next.absoluteCycle === next.scheduled.targetCycle) {
    next = {
      ...next,
      audiblePhraseIndex: clampPhraseIndex(
        next.scheduled.phraseIndex,
        next.activeSet.phrasePcms.length,
      ),
      scheduled: null,
      scheduledConfirmed: false,
    };
  }

  if (next.scheduled === null && next.desiredPhraseIndex !== next.audiblePhraseIndex) {
    next = {
      ...next,
      scheduled: planPhraseReservation({
        absoluteCycle: next.absoluteCycle,
        phaseFrame: next.phaseFrame,
        cycleFrames: next.activeSet.grid.cycleFrames,
        leadFrames: 0,
        phraseIndex: next.desiredPhraseIndex,
        revision: 0,
        generation: next.sessionGeneration,
      }),
      scheduledConfirmed: false,
    };
  }

  return next;
};

const updateScheduleConfirmation = (
  state: SeparateTracksMixerState,
  leadFrames: number,
): SeparateTracksMixerState => {
  if (state.scheduled === null || state.scheduledConfirmed) {
    return state;
  }
  const safeF = state.activeSet.grid.cycleFrames;
  const remaining = safeF - state.phaseFrame;
  const cyclesUntil = state.scheduled.targetCycle - (state.absoluteCycle + 1);
  const framesUntil = remaining + Math.max(0, cyclesUntil) * safeF;
  if (framesUntil < leadFrames) {
    return { ...state, scheduledConfirmed: true };
  }
  return state;
};

export const createSeparateTracksMixerState = (params: {
  readonly preparedSet: SeparateTracksPreparedSet;
  readonly sessionGeneration: number;
  readonly initialPhraseIndex: number;
  readonly bgmGain?: number;
  readonly melodyGain?: number;
}): SeparateTracksMixerState => ({
  sessionGeneration: params.sessionGeneration,
  absoluteCycle: 0,
  phaseFrame: 0,
  audiblePhraseIndex: clampPhraseIndex(params.initialPhraseIndex, params.preparedSet.phrasePcms.length),
  desiredPhraseIndex: clampPhraseIndex(params.initialPhraseIndex, params.preparedSet.phrasePcms.length),
  scheduled: null,
  scheduledConfirmed: false,
  activeSet: params.preparedSet,
  pendingTempoSet: null,
  pendingTempoRevision: 0,
  paused: false,
  bgmGain: params.bgmGain ?? 0.5,
  melodyGain: params.melodyGain ?? 0.5,
  tempoCrossfadeFramesRemaining: 0,
  tempoCrossfadePreviousSet: null,
});

export const renderSeparateTracksBlock = (
  params: RenderSeparateTracksBlockParams,
): RenderSeparateTracksBlockResult => {
  const {
    outputLeft,
    outputRight,
    blockFrames,
    leadFrames,
    phraseRequest,
    tempoRequest,
  } = params;

  let state = ingestPhraseRequest(params.state, phraseRequest, leadFrames);
  state = ingestTempoRequest(state, tempoRequest);

  if (state.paused) {
    outputLeft.fill(0);
    outputRight.fill(0);
    return {
      state,
      appliedPhraseAtBoundary: false,
      appliedTempoAtBoundary: false,
    };
  }

  let appliedPhraseAtBoundary = false;
  let appliedTempoAtBoundary = false;
  const safeF = state.activeSet.grid.cycleFrames;

  for (let i = 0; i < blockFrames; i += 1) {
    if (state.phaseFrame === 0 && (state.scheduled !== null || state.pendingTempoSet !== null)) {
      const hadTempo = state.pendingTempoSet !== null;
      const hadPhrase = state.scheduled !== null
        && state.absoluteCycle === state.scheduled.targetCycle;
      state = applyBoundaryActions(state);
      if (hadTempo) {
        appliedTempoAtBoundary = true;
      }
      if (hadPhrase) {
        appliedPhraseAtBoundary = true;
      }
    }

    state = updateScheduleConfirmation(state, leadFrames);

    const bgmFrame = computeBgmReadFrame(
      state.absoluteCycle,
      state.phaseFrame,
      state.activeSet.grid.cycleFrames,
      state.activeSet.grid.cyclesPerForm,
    );

    const bgm = mixBgmSample(state.activeSet, bgmFrame);
    const melody = mixPhraseSample(state.activeSet, state.audiblePhraseIndex, state.phaseFrame);

    let outL = bgm.left * state.bgmGain + melody.left * state.melodyGain;
    let outR = bgm.right * state.bgmGain + melody.right * state.melodyGain;

    if (state.tempoCrossfadeFramesRemaining > 0 && state.tempoCrossfadePreviousSet !== null) {
      const prev = state.tempoCrossfadePreviousSet;
      const prevBgmFrame = computeBgmReadFrame(
        state.absoluteCycle,
        state.phaseFrame,
        prev.grid.cycleFrames,
        prev.grid.cyclesPerForm,
      );
      const prevBgm = mixBgmSample(prev, prevBgmFrame);
      const prevMelody = mixPhraseSample(prev, state.audiblePhraseIndex, state.phaseFrame);
      const fadeOut = state.tempoCrossfadeFramesRemaining / TEMPO_CROSSFADE_FRAMES;
      const fadeIn = 1 - fadeOut;
      outL = (prevBgm.left * state.bgmGain + prevMelody.left * state.melodyGain) * fadeOut
        + outL * fadeIn;
      outR = (prevBgm.right * state.bgmGain + prevMelody.right * state.melodyGain) * fadeOut
        + outR * fadeIn;
      state = {
        ...state,
        tempoCrossfadeFramesRemaining: state.tempoCrossfadeFramesRemaining - 1,
        tempoCrossfadePreviousSet: state.tempoCrossfadeFramesRemaining <= 1
          ? null
          : state.tempoCrossfadePreviousSet,
      };
    }

    outputLeft[i] = outL;
    outputRight[i] = outR;

    state = {
      ...state,
      phaseFrame: state.phaseFrame + 1,
    };

    if (state.phaseFrame >= safeF) {
      state = {
        ...state,
        phaseFrame: 0,
        absoluteCycle: state.absoluteCycle + 1,
      };
    }
  }

  return {
    state,
    appliedPhraseAtBoundary,
    appliedTempoAtBoundary,
  };
};

/** Simulate long playback and verify BGM frame continuity across phrase switches. */
export const simulateSeparateTracksPlayback = (params: {
  readonly initialState: SeparateTracksMixerState;
  readonly blockFrames: number;
  readonly totalFrames: number;
  readonly leadFrames: number;
  readonly phraseRequests: readonly { atFrame: number; request: PhraseRequestMailbox }[];
  readonly tempoRequests?: readonly { atFrame: number; request: TempoRequestMailbox }[];
}): {
  readonly finalState: SeparateTracksMixerState;
  readonly bgmDiscontinuities: number;
} => {
  const {
    initialState,
    blockFrames,
    totalFrames,
    leadFrames,
    phraseRequests,
    tempoRequests = [],
  } = params;

  let state = initialState;
  const outputLeft = new Float32Array(blockFrames);
  const outputRight = new Float32Array(blockFrames);
  let rendered = 0;
  let requestIndex = 0;
  let tempoIndex = 0;
  let bgmDiscontinuities = 0;
  let lastBgmSample = 0;

  while (rendered < totalFrames) {
    const framesThisBlock = Math.min(blockFrames, totalFrames - rendered);

    let phraseRequest: PhraseRequestMailbox | null = null;
    while (requestIndex < phraseRequests.length
      && phraseRequests[requestIndex]?.atFrame === rendered) {
      phraseRequest = phraseRequests[requestIndex]?.request ?? null;
      requestIndex += 1;
    }

    let tempoRequest: TempoRequestMailbox | null = null;
    while (tempoIndex < tempoRequests.length
      && tempoRequests[tempoIndex]?.atFrame === rendered) {
      tempoRequest = tempoRequests[tempoIndex]?.request ?? null;
      tempoIndex += 1;
    }

    const result = renderSeparateTracksBlock({
      state,
      outputLeft: outputLeft.subarray(0, framesThisBlock),
      outputRight: outputRight.subarray(0, framesThisBlock),
      blockFrames: framesThisBlock,
      leadFrames,
      phraseRequest,
      tempoRequest,
    });
    state = result.state;

    for (let i = 0; i < framesThisBlock; i += 1) {
      const bgmFrame = computeBgmReadFrame(
        state.absoluteCycle,
        state.phaseFrame,
        state.activeSet.grid.cycleFrames,
        state.activeSet.grid.cyclesPerForm,
      );
      const sample = readSample(state.activeSet.bgmLeft, bgmFrame);
      if (rendered + i > 0 && Math.abs(sample - lastBgmSample) > 2) {
        const prevFrame = bgmFrame - 1;
        if (prevFrame >= 0) {
          const expected = readSample(state.activeSet.bgmLeft, prevFrame);
          if (Math.abs(sample - expected) > 2) {
            bgmDiscontinuities += 1;
          }
        }
      }
      lastBgmSample = sample;
    }

    rendered += framesThisBlock;
  }

  return { finalState: state, bgmDiscontinuities };
};

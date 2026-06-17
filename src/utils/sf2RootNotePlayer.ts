type Sf2KeyRange = readonly [number, number];

interface Sf2Chunk {
  readonly id: string;
  readonly type: string | null;
  readonly offset: number;
  readonly size: number;
}

interface Sf2Generator {
  readonly oper: number;
  readonly rawAmount: number;
  readonly signedAmount: number;
}

interface Sf2PresetHeader {
  readonly bagIndex: number;
}

interface Sf2Bag {
  readonly genIndex: number;
}

interface Sf2Instrument {
  readonly bagIndex: number;
}

interface Sf2SampleHeader {
  readonly index: number;
  readonly start: number;
  readonly end: number;
  readonly startLoop: number;
  readonly endLoop: number;
  readonly sampleRate: number;
  readonly originalPitch: number;
  readonly pitchCorrection: number;
  readonly sampleType: number;
}

interface Sf2ZoneParams {
  readonly keyRange: Sf2KeyRange;
  readonly sampleIndex: number | null;
  readonly overridingRootKey: number | null;
  readonly coarseTune: number;
  readonly fineTune: number;
  readonly sampleModes: number;
  readonly initialAttenuation: number;
}

interface Sf2SampleZone {
  readonly keyRange: Sf2KeyRange;
  readonly sample: Sf2SampleHeader;
  readonly overridingRootKey: number | null;
  readonly coarseTune: number;
  readonly fineTune: number;
  readonly sampleModes: number;
  readonly initialAttenuation: number;
}

interface PreparedSf2Zone {
  readonly keyRange: Sf2KeyRange;
  readonly sample: Sf2SampleHeader;
  readonly buffer: AudioBuffer;
  readonly rootMidi: number;
  readonly coarseTune: number;
  readonly fineTune: number;
  readonly sampleModes: number;
  readonly initialAttenuation: number;
  readonly loopStartSec: number;
  readonly loopEndSec: number;
}

export interface Sf2Playback {
  stop: (releaseSec?: number) => void;
}

const GEN_KEY_RANGE = 43;
const GEN_INSTRUMENT = 41;
const GEN_INITIAL_ATTENUATION = 48;
const GEN_COARSE_TUNE = 51;
const GEN_FINE_TUNE = 52;
const GEN_SAMPLE_ID = 53;
const GEN_SAMPLE_MODES = 54;
const GEN_OVERRIDING_ROOT_KEY = 58;

const DEFAULT_ZONE_PARAMS: Sf2ZoneParams = {
  keyRange: [0, 127],
  sampleIndex: null,
  overridingRootKey: null,
  coarseTune: 0,
  fineTune: 0,
  sampleModes: 0,
  initialAttenuation: 0,
};

const readId = (view: DataView, offset: number): string => (
  String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  )
);

const readName = (view: DataView, offset: number, length: number): string => {
  let value = '';
  for (let i = 0; i < length; i++) {
    const code = view.getUint8(offset + i);
    if (code === 0) break;
    value += String.fromCharCode(code);
  }
  return value;
};

const signedWord = (value: number): number => (value >= 0x8000 ? value - 0x10000 : value);

const parseKeyRange = (raw: number): Sf2KeyRange => {
  const lo = raw & 0xff;
  const hi = (raw >> 8) & 0xff;
  return [Math.max(0, Math.min(127, lo)), Math.max(0, Math.min(127, hi))];
};

const collectChunks = (view: DataView, start: number, end: number, type: string | null, chunks: Sf2Chunk[]): void => {
  let offset = start;
  while (offset + 8 <= end) {
    const id = readId(view, offset);
    const size = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;
    if (dataOffset + size > view.byteLength) break;

    if (id === 'LIST') {
      const listType = size >= 4 ? readId(view, dataOffset) : null;
      chunks.push({ id, type: listType, offset: dataOffset + 4, size: Math.max(0, size - 4) });
      collectChunks(view, dataOffset + 4, dataOffset + size, listType, chunks);
    } else {
      chunks.push({ id, type, offset: dataOffset, size });
    }

    offset = dataOffset + size + (size % 2);
  }
};

const findRequiredChunk = (chunks: readonly Sf2Chunk[], id: string, type: string): Sf2Chunk => {
  const chunk = chunks.find(item => item.id === id && item.type === type);
  if (!chunk) {
    throw new Error(`Missing SF2 chunk: ${type}/${id}`);
  }
  return chunk;
};

const parsePresets = (view: DataView, chunk: Sf2Chunk): Sf2PresetHeader[] => {
  const count = Math.floor(chunk.size / 38);
  const presets: Sf2PresetHeader[] = [];
  for (let i = 0; i < count; i++) {
    const offset = chunk.offset + i * 38;
    const name = readName(view, offset, 20);
    if (name === 'EOP') continue;
    presets.push({ bagIndex: view.getUint16(offset + 24, true) });
  }
  return presets;
};

const parseBags = (view: DataView, chunk: Sf2Chunk): Sf2Bag[] => {
  const count = Math.floor(chunk.size / 4);
  const bags: Sf2Bag[] = [];
  for (let i = 0; i < count; i++) {
    bags.push({ genIndex: view.getUint16(chunk.offset + i * 4, true) });
  }
  return bags;
};

const parseGenerators = (view: DataView, chunk: Sf2Chunk): Sf2Generator[] => {
  const count = Math.floor(chunk.size / 4);
  const generators: Sf2Generator[] = [];
  for (let i = 0; i < count; i++) {
    const offset = chunk.offset + i * 4;
    const rawAmount = view.getUint16(offset + 2, true);
    generators.push({
      oper: view.getUint16(offset, true),
      rawAmount,
      signedAmount: signedWord(rawAmount),
    });
  }
  return generators;
};

const parseInstruments = (view: DataView, chunk: Sf2Chunk): Sf2Instrument[] => {
  const count = Math.floor(chunk.size / 22);
  const instruments: Sf2Instrument[] = [];
  for (let i = 0; i < count; i++) {
    const offset = chunk.offset + i * 22;
    const name = readName(view, offset, 20);
    if (name === 'EOI') continue;
    instruments.push({ bagIndex: view.getUint16(offset + 20, true) });
  }
  return instruments;
};

const parseSampleHeaders = (view: DataView, chunk: Sf2Chunk): Sf2SampleHeader[] => {
  const count = Math.floor(chunk.size / 46);
  const samples: Sf2SampleHeader[] = [];
  for (let i = 0; i < count; i++) {
    const offset = chunk.offset + i * 46;
    const name = readName(view, offset, 20);
    if (name === 'EOS') continue;
    samples.push({
      index: i,
      start: view.getUint32(offset + 20, true),
      end: view.getUint32(offset + 24, true),
      startLoop: view.getUint32(offset + 28, true),
      endLoop: view.getUint32(offset + 32, true),
      sampleRate: view.getUint32(offset + 36, true),
      originalPitch: view.getUint8(offset + 40),
      pitchCorrection: view.getInt8(offset + 41),
      sampleType: view.getUint16(offset + 44, true),
    });
  }
  return samples;
};

const generatorsForBag = (
  bagIndex: number,
  bags: readonly Sf2Bag[],
  generators: readonly Sf2Generator[],
): readonly Sf2Generator[] => {
  const bag = bags[bagIndex];
  const next = bags[bagIndex + 1];
  if (!bag || !next) return [];
  return generators.slice(bag.genIndex, next.genIndex);
};

const applyGenerators = (base: Sf2ZoneParams, generators: readonly Sf2Generator[]): Sf2ZoneParams => {
  let keyRange = base.keyRange;
  let sampleIndex = base.sampleIndex;
  let overridingRootKey = base.overridingRootKey;
  let coarseTune = base.coarseTune;
  let fineTune = base.fineTune;
  let sampleModes = base.sampleModes;
  let initialAttenuation = base.initialAttenuation;

  for (const generator of generators) {
    switch (generator.oper) {
      case GEN_KEY_RANGE:
        keyRange = parseKeyRange(generator.rawAmount);
        break;
      case GEN_SAMPLE_ID:
        sampleIndex = generator.rawAmount;
        break;
      case GEN_OVERRIDING_ROOT_KEY:
        overridingRootKey = generator.rawAmount === 255 ? null : generator.rawAmount;
        break;
      case GEN_COARSE_TUNE:
        coarseTune = generator.signedAmount;
        break;
      case GEN_FINE_TUNE:
        fineTune = generator.signedAmount;
        break;
      case GEN_SAMPLE_MODES:
        sampleModes = generator.rawAmount;
        break;
      case GEN_INITIAL_ATTENUATION:
        initialAttenuation = generator.rawAmount;
        break;
      default:
        break;
    }
  }

  return {
    keyRange,
    sampleIndex,
    overridingRootKey,
    coarseTune,
    fineTune,
    sampleModes,
    initialAttenuation,
  };
};

const findInstrumentIndex = (generators: readonly Sf2Generator[]): number | null => {
  const generator = generators.find(item => item.oper === GEN_INSTRUMENT);
  return generator ? generator.rawAmount : null;
};

export interface OfflineSf2Zone {
  readonly keyRange: Sf2KeyRange;
  readonly rootMidi: number;
  readonly coarseTune: number;
  readonly fineTune: number;
  readonly sampleModes: number;
  readonly initialAttenuation: number;
  readonly pitchCorrection: number;
  readonly pcm: Float32Array;
  readonly sampleRate: number;
  readonly loopStartFrame: number;
  readonly loopEndFrame: number;
}

export const parseSampleZones = (arrayBuffer: ArrayBuffer): { readonly samples: Int16Array; readonly zones: readonly Sf2SampleZone[] } => {
  const view = new DataView(arrayBuffer);
  if (readId(view, 0) !== 'RIFF' || readId(view, 8) !== 'sfbk') {
    throw new Error('Unsupported SF2 file');
  }

  const chunks: Sf2Chunk[] = [];
  collectChunks(view, 12, view.byteLength, null, chunks);

  const smpl = findRequiredChunk(chunks, 'smpl', 'sdta');
  const phdr = findRequiredChunk(chunks, 'phdr', 'pdta');
  const pbag = findRequiredChunk(chunks, 'pbag', 'pdta');
  const pgen = findRequiredChunk(chunks, 'pgen', 'pdta');
  const inst = findRequiredChunk(chunks, 'inst', 'pdta');
  const ibag = findRequiredChunk(chunks, 'ibag', 'pdta');
  const igen = findRequiredChunk(chunks, 'igen', 'pdta');
  const shdr = findRequiredChunk(chunks, 'shdr', 'pdta');

  const presets = parsePresets(view, phdr);
  const presetBags = parseBags(view, pbag);
  const presetGenerators = parseGenerators(view, pgen);
  const instruments = parseInstruments(view, inst);
  const instrumentBags = parseBags(view, ibag);
  const instrumentGenerators = parseGenerators(view, igen);
  const sampleHeaders = parseSampleHeaders(view, shdr);
  const sampleHeaderByIndex = new Map(sampleHeaders.map(sample => [sample.index, sample]));
  const zones: Sf2SampleZone[] = [];

  for (let presetIndex = 0; presetIndex < presets.length; presetIndex++) {
    const preset = presets[presetIndex];
    const nextPreset = presets[presetIndex + 1];
    const presetBagEnd = nextPreset?.bagIndex ?? Math.max(0, presetBags.length - 1);
    let presetGlobal = DEFAULT_ZONE_PARAMS;

    for (let presetBagIndex = preset.bagIndex; presetBagIndex < presetBagEnd; presetBagIndex++) {
      const presetGens = generatorsForBag(presetBagIndex, presetBags, presetGenerators);
      const instrumentIndex = findInstrumentIndex(presetGens);
      const presetParams = applyGenerators(presetGlobal, presetGens);
      if (instrumentIndex === null) {
        presetGlobal = presetParams;
        continue;
      }

      const instrument = instruments[instrumentIndex];
      if (!instrument) continue;
      const nextInstrument = instruments[instrumentIndex + 1];
      const instrumentBagEnd = nextInstrument?.bagIndex ?? Math.max(0, instrumentBags.length - 1);
      let instrumentGlobal = DEFAULT_ZONE_PARAMS;

      for (let instrumentBagIndex = instrument.bagIndex; instrumentBagIndex < instrumentBagEnd; instrumentBagIndex++) {
        const instrumentGens = generatorsForBag(instrumentBagIndex, instrumentBags, instrumentGenerators);
        const mergedGlobal = {
          ...presetParams,
          sampleIndex: null,
          overridingRootKey: instrumentGlobal.overridingRootKey ?? presetParams.overridingRootKey,
          coarseTune: presetParams.coarseTune + instrumentGlobal.coarseTune,
          fineTune: presetParams.fineTune + instrumentGlobal.fineTune,
          sampleModes: instrumentGlobal.sampleModes || presetParams.sampleModes,
          initialAttenuation: presetParams.initialAttenuation + instrumentGlobal.initialAttenuation,
        };
        const zoneParams = applyGenerators(mergedGlobal, instrumentGens);
        if (zoneParams.sampleIndex === null) {
          instrumentGlobal = applyGenerators(instrumentGlobal, instrumentGens);
          continue;
        }

        const sample = sampleHeaderByIndex.get(zoneParams.sampleIndex);
        if (!sample || sample.sampleRate <= 0 || sample.end <= sample.start) continue;
        zones.push({
          keyRange: zoneParams.keyRange,
          sample,
          overridingRootKey: zoneParams.overridingRootKey,
          coarseTune: zoneParams.coarseTune,
          fineTune: zoneParams.fineTune,
          sampleModes: zoneParams.sampleModes,
          initialAttenuation: zoneParams.initialAttenuation,
        });
      }
    }
  }

  return {
    samples: new Int16Array(arrayBuffer, smpl.offset, Math.floor(smpl.size / 2)),
    zones,
  };
};

// ts-prune-ignore-next
export const resolveSf2PlaybackRate = (
  midiNote: number,
  rootMidi: number,
  coarseTune: number,
  fineTune: number,
  pitchCorrection: number,
): number => {
  const cents = (midiNote - rootMidi + coarseTune) * 100 + fineTune - pitchCorrection;
  return Math.pow(2, cents / 1200);
};

// ts-prune-ignore-next
export const pickSf2ZoneForMidi = <T extends { readonly keyRange: Sf2KeyRange; readonly rootMidi: number }>(
  zones: readonly T[],
  midiNote: number,
): T | null => {
  let best: T | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const zone of zones) {
    const [low, high] = zone.keyRange;
    if (midiNote < low || midiNote > high) continue;
    const width = high - low;
    const rootDistance = Math.abs(midiNote - zone.rootMidi);
    const score = width * 128 + rootDistance;
    if (score < bestScore) {
      best = zone;
      bestScore = score;
    }
  }
  return best;
};

const midiNotesFromPitchClasses = (baseOctaveMidi: number): readonly number[] => (
  Array.from({ length: 12 }, (_, index) => baseOctaveMidi + index)
);

/** サバイバル codeRunRootPlayer.load() のデフォルト（C2〜B2） */
export const SURVIVAL_CODE_RUN_ROOT_BASE_MIDI = 36;

export const survivalCodeRunRootMidiNotes = (): readonly number[] => (
  midiNotesFromPitchClasses(SURVIVAL_CODE_RUN_ROOT_BASE_MIDI)
);

const makeAudioBuffer = (
  context: AudioContext,
  samples: Int16Array,
  sample: Sf2SampleHeader,
): AudioBuffer | null => {
  const start = Math.max(0, Math.min(samples.length, sample.start));
  const end = Math.max(start + 1, Math.min(samples.length, sample.end));
  const frameCount = end - start;
  const buffer = context.createBuffer(1, frameCount, sample.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channel[i] = samples[start + i] / 32768;
  }
  return buffer;
};

const floatPcmFromSample = (samples: Int16Array, sample: Sf2SampleHeader): Float32Array => {
  const start = Math.max(0, Math.min(samples.length, sample.start));
  const end = Math.max(start + 1, Math.min(samples.length, sample.end));
  const frameCount = end - start;
  const pcm = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i += 1) {
    pcm[i] = samples[start + i] / 32768;
  }
  return pcm;
};

const toOfflineSf2Zone = (
  samples: Int16Array,
  zone: Sf2SampleZone,
): OfflineSf2Zone => {
  const loopStartFrames = Math.max(0, zone.sample.startLoop - zone.sample.start);
  const loopEndFrames = Math.max(loopStartFrames, zone.sample.endLoop - zone.sample.start);
  return {
    keyRange: zone.keyRange,
    rootMidi: zone.overridingRootKey ?? zone.sample.originalPitch,
    coarseTune: zone.coarseTune,
    fineTune: zone.fineTune,
    sampleModes: zone.sampleModes,
    initialAttenuation: zone.initialAttenuation,
    pitchCorrection: zone.sample.pitchCorrection,
    pcm: floatPcmFromSample(samples, zone.sample),
    sampleRate: zone.sample.sampleRate,
    loopStartFrame: loopStartFrames,
    loopEndFrame: loopEndFrames,
  };
};

/** オフライン MP3 生成用: Sf2RootNotePlayer.load と同様に MIDI ノートごとにゾーンを選ぶ。 */
export const loadOfflineSf2ZonesForMidiNotes = (
  arrayBuffer: ArrayBuffer,
  midiNotes: readonly number[],
): OfflineSf2Zone[] => {
  const parsed = parseSampleZones(arrayBuffer);
  const selectedZones: Sf2SampleZone[] = [];

  for (const midiNote of midiNotes) {
    const candidates = parsed.zones.filter(zone => zone.sample.sampleType !== 0);
    const pickedMeta = pickSf2ZoneForMidi(
      candidates.map(zone => ({
        keyRange: zone.keyRange,
        rootMidi: zone.overridingRootKey ?? zone.sample.originalPitch,
      })),
      midiNote,
    );
    if (!pickedMeta) {
      continue;
    }
    const selected = candidates.find(
      zone => zone.keyRange[0] === pickedMeta.keyRange[0]
        && zone.keyRange[1] === pickedMeta.keyRange[1]
        && (zone.overridingRootKey ?? zone.sample.originalPitch) === pickedMeta.rootMidi,
    );
    if (selected && !selectedZones.includes(selected)) {
      selectedZones.push(selected);
    }
  }

  return selectedZones.map(zone => toOfflineSf2Zone(parsed.samples, zone));
};

/** FingerBass SF2 をサバイバル正解ルート音と同じゾーンセットで読み込む */
export const loadOfflineSf2ZonesForSurvivalCodeRunRoots = (
  arrayBuffer: ArrayBuffer,
): OfflineSf2Zone[] => loadOfflineSf2ZonesForMidiNotes(arrayBuffer, survivalCodeRunRootMidiNotes());

/** オフライン MP3 生成用: 指定 MIDI 範囲と重なる SF2 ゾーンをすべて読み込む。 */
export const loadOfflineSf2ZonesForMidiRange = (
  arrayBuffer: ArrayBuffer,
  minMidi: number,
  maxMidi: number,
): OfflineSf2Zone[] => {
  const parsed = parseSampleZones(arrayBuffer);
  const prepared: OfflineSf2Zone[] = [];

  for (const zone of parsed.zones) {
    if (zone.sample.sampleType === 0) {
      continue;
    }
    if (zone.keyRange[1] < minMidi || zone.keyRange[0] > maxMidi) {
      continue;
    }

    prepared.push(toOfflineSf2Zone(parsed.samples, zone));
  }
  return prepared;
};

export class Sf2RootNotePlayer {
  private readonly context: AudioContext;
  private readonly masterGain: GainNode;
  private zones: readonly PreparedSf2Zone[] = [];
  private loadPromise: Promise<void> | null = null;

  constructor(context: AudioContext) {
    this.context = context;
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(context.destination);
  }

  get ready(): boolean {
    return this.zones.length > 0;
  }

  load(url: string, midiNotes: readonly number[] = midiNotesFromPitchClasses(36)): Promise<void> {
    if (this.ready) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load SF2: ${response.status}`);
      }
      const parsed = parseSampleZones(await response.arrayBuffer());
      const selectedZones: Sf2SampleZone[] = [];
      for (const midiNote of midiNotes) {
        const candidates = parsed.zones
          .map(zone => ({
            ...zone,
            rootMidi: zone.overridingRootKey ?? zone.sample.originalPitch,
          }))
          .filter(zone => zone.sample.sampleType !== 0);
        const selected = pickSf2ZoneForMidi(candidates, midiNote);
        if (selected && !selectedZones.includes(selected)) {
          selectedZones.push(selected);
        }
      }

      const bufferBySampleIndex = new Map<number, AudioBuffer>();
      const prepared: PreparedSf2Zone[] = [];
      for (const zone of selectedZones) {
        let buffer = bufferBySampleIndex.get(zone.sample.index);
        if (!buffer) {
          const made = makeAudioBuffer(this.context, parsed.samples, zone.sample);
          if (!made) continue;
          buffer = made;
          bufferBySampleIndex.set(zone.sample.index, buffer);
        }

        const loopStartFrames = Math.max(0, zone.sample.startLoop - zone.sample.start);
        const loopEndFrames = Math.max(loopStartFrames, zone.sample.endLoop - zone.sample.start);
        prepared.push({
          keyRange: zone.keyRange,
          sample: zone.sample,
          buffer,
          rootMidi: zone.overridingRootKey ?? zone.sample.originalPitch,
          coarseTune: zone.coarseTune,
          fineTune: zone.fineTune,
          sampleModes: zone.sampleModes,
          initialAttenuation: zone.initialAttenuation,
          loopStartSec: loopStartFrames / zone.sample.sampleRate,
          loopEndSec: loopEndFrames / zone.sample.sampleRate,
        });
      }
      this.zones = prepared;
    })().finally(() => {
      this.loadPromise = null;
    });

    return this.loadPromise;
  }

  start(midiNote: number, volume: number): Sf2Playback | null {
    return this.startInternal(midiNote, volume, null);
  }

  play(midiNote: number, volume: number, durationSec = 0.44): boolean {
    return this.startInternal(midiNote, volume, durationSec) !== null;
  }

  private startInternal(midiNote: number, volume: number, durationSec: number | null): Sf2Playback | null {
    const zone = pickSf2ZoneForMidi(this.zones, midiNote);
    if (!zone) return null;

    try {
      if (this.context.state === 'suspended') {
        this.context.resume().catch(() => {});
      }
      const now = this.context.currentTime;
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      const attenuationGain = Math.pow(10, -zone.initialAttenuation / 200);
      const baseGain = Math.max(0, Math.min(1.8, volume * 1.35 * attenuationGain));
      const releaseSec = 0.055;
      const stopAt = durationSec === null ? null : now + durationSec + 0.02;
      let stopped = false;

      source.buffer = zone.buffer;
      source.playbackRate.setValueAtTime(
        resolveSf2PlaybackRate(
          midiNote,
          zone.rootMidi,
          zone.coarseTune,
          zone.fineTune,
          zone.sample.pitchCorrection,
        ),
        now,
      );

      if ((zone.sampleModes & 1) === 1 && zone.loopEndSec > zone.loopStartSec) {
        source.loop = true;
        source.loopStart = zone.loopStartSec;
        source.loopEnd = zone.loopEndSec;
      }

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(baseGain, now + 0.006);
      if (durationSec !== null) {
        gain.gain.setValueAtTime(baseGain, Math.max(now + 0.006, now + durationSec - releaseSec));
        gain.gain.linearRampToValueAtTime(0, now + durationSec);
      }

      source.connect(gain);
      gain.connect(this.masterGain);
      source.start(now);
      if (stopAt !== null) {
        source.stop(stopAt);
      }
      source.onended = () => {
        try {
          source.disconnect();
          gain.disconnect();
        } catch {
          // ignore
        }
      };
      return {
        stop: (noteReleaseSec = 0.08) => {
          if (stopped) return;
          stopped = true;
          const stopNow = this.context.currentTime;
          try {
            gain.gain.cancelScheduledValues(stopNow);
            gain.gain.setValueAtTime(gain.gain.value, stopNow);
            gain.gain.linearRampToValueAtTime(0, stopNow + noteReleaseSec);
            source.stop(stopNow + noteReleaseSec + 0.02);
          } catch {
            // ignore
          }
        },
      };
    } catch {
      return null;
    }
  }
}

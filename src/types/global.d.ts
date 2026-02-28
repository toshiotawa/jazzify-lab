declare global {
    interface Window {
    Tone: {
      Context: typeof AudioContext;
      Sampler: unknown;
      Frequency: unknown;
      setContext: (context: AudioContext) => void;
      loaded: () => Promise<void>;
      start: () => Promise<void>;
      context: {
        state: string;
      };
    };
    webkitAudioContext?: typeof AudioContext;
  }
  
  interface MIDIOptions {
    sysex?: boolean;
  }

  interface Navigator {
    requestMIDIAccess(options?: MIDIOptions): Promise<MIDIAccess>;
  }
  
  interface MIDIAccess {
    inputs: MIDIInputMap;
    outputs: MIDIOutputMap;
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
    sysexEnabled: boolean;
  }
  
  interface MIDIInputMap {
    forEach(callback: (value: MIDIInput, key: string, map: MIDIInputMap) => void): void;
    get(key: string): MIDIInput | undefined;
    has(key: string): boolean;
    keys(): IterableIterator<string>;
    values(): IterableIterator<MIDIInput>;
    entries(): IterableIterator<[string, MIDIInput]>;
    size: number;
  }
  
  interface MIDIOutputMap {
    forEach(callback: (value: MIDIOutput, key: string, map: MIDIOutputMap) => void): void;
    get(key: string): MIDIOutput | undefined;
    has(key: string): boolean;
    keys(): IterableIterator<string>;
    values(): IterableIterator<MIDIOutput>;
    entries(): IterableIterator<[string, MIDIOutput]>;
    size: number;
  }
  
  interface MIDIInput {
    id: string;
    name: string;
    manufacturer?: string;
    state: string;
    connection: string;
    type: string;
    addEventListener(type: string, listener: (event: Event) => void): void;
    removeEventListener(type: string, listener: (event: Event) => void): void;
    onmidimessage: ((event: { data: Uint8Array }) => void) | null;
  }
  
  interface MIDIOutput {
    id: string;
    name: string;
    manufacturer?: string;
    state: string;
    connection: string;
    type: string;
  }
  
  interface MIDIConnectionEvent {
    port: MIDIInput | MIDIOutput;
  }
}

// Vite 環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
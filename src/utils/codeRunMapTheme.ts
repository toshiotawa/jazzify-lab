export type CodeRunMapBiome = 'grass' | 'sand' | 'snow' | 'stone' | 'purple';

const BIOME_ORDER: readonly CodeRunMapBiome[] = [
  'grass',
  'sand',
  'snow',
  'stone',
  'purple',
];

export interface CodeRunMapBiomeTheme {
  biome: CodeRunMapBiome;
  skyTop: string;
  skyBottom: string;
  signPlateTop: string;
  signPlateBottom: string;
  signPlateBorder: string;
  signText: string;
  signDepthText: string;
  connectorHueDeg: number;
}

const BIOME_THEMES: Record<CodeRunMapBiome, CodeRunMapBiomeTheme> = {
  grass: {
    biome: 'grass',
    skyTop: '#7ec8f0',
    skyBottom: '#b8e4ff',
    signPlateTop: '#2d6b3a',
    signPlateBottom: '#1a4528',
    signPlateBorder: '#8fd49a',
    signText: '#f0fff4',
    signDepthText: '#c8f0d0',
    connectorHueDeg: 0,
  },
  sand: {
    biome: 'sand',
    skyTop: '#f0c878',
    skyBottom: '#ffe8b0',
    signPlateTop: '#8b5a2b',
    signPlateBottom: '#5c3a18',
    signPlateBorder: '#f0c878',
    signText: '#fff8e8',
    signDepthText: '#ffe0a8',
    connectorHueDeg: 18,
  },
  snow: {
    biome: 'snow',
    skyTop: '#a8c8e8',
    skyBottom: '#dce8f8',
    signPlateTop: '#4a6888',
    signPlateBottom: '#2a4058',
    signPlateBorder: '#c8e0f8',
    signText: '#f0f8ff',
    signDepthText: '#d0e8ff',
    connectorHueDeg: 200,
  },
  stone: {
    biome: 'stone',
    skyTop: '#8898a8',
    skyBottom: '#c0ccd8',
    signPlateTop: '#4a5058',
    signPlateBottom: '#2a3038',
    signPlateBorder: '#b0b8c0',
    signText: '#f0f4f8',
    signDepthText: '#c8d0d8',
    connectorHueDeg: 220,
  },
  purple: {
    biome: 'purple',
    skyTop: '#8868c8',
    skyBottom: '#c8a8f0',
    signPlateTop: '#5a3888',
    signPlateBottom: '#381858',
    signPlateBorder: '#d0a8f0',
    signText: '#f8f0ff',
    signDepthText: '#e8c8ff',
    connectorHueDeg: 280,
  },
};

export const getCodeRunMapBiome = (blockIndex: number): CodeRunMapBiome => {
  const idx = ((blockIndex % BIOME_ORDER.length) + BIOME_ORDER.length) % BIOME_ORDER.length;
  return BIOME_ORDER[idx];
};

export const getCodeRunMapTheme = (blockIndex: number): CodeRunMapBiomeTheme =>
  BIOME_THEMES[getCodeRunMapBiome(blockIndex)];

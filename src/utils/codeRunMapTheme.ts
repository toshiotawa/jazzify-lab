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
    skyTop: '#12182a',
    skyBottom: '#1a2840',
    signPlateTop: '#1a2838',
    signPlateBottom: '#0e1828',
    signPlateBorder: '#6a8ab8',
    signText: '#e8f0ff',
    signDepthText: '#a8c0e0',
    connectorHueDeg: 0,
  },
  sand: {
    biome: 'sand',
    skyTop: '#1a1420',
    skyBottom: '#2a1c18',
    signPlateTop: '#281820',
    signPlateBottom: '#181018',
    signPlateBorder: '#e8a040',
    signText: '#fff4e0',
    signDepthText: '#d0a860',
    connectorHueDeg: 18,
  },
  snow: {
    biome: 'snow',
    skyTop: '#101828',
    skyBottom: '#1c2a40',
    signPlateTop: '#182838',
    signPlateBottom: '#0c1828',
    signPlateBorder: '#88a8d0',
    signText: '#e8f4ff',
    signDepthText: '#a0c0e8',
    connectorHueDeg: 200,
  },
  stone: {
    biome: 'stone',
    skyTop: '#12141c',
    skyBottom: '#1c222c',
    signPlateTop: '#222830',
    signPlateBottom: '#141820',
    signPlateBorder: '#8898a8',
    signText: '#e8ecf0',
    signDepthText: '#a8b0b8',
    connectorHueDeg: 220,
  },
  purple: {
    biome: 'purple',
    skyTop: '#140c24',
    skyBottom: '#281848',
    signPlateTop: '#281840',
    signPlateBottom: '#140828',
    signPlateBorder: '#a878d0',
    signText: '#f0e8ff',
    signDepthText: '#c8a8e8',
    connectorHueDeg: 280,
  },
};

export const getCodeRunMapBiome = (blockIndex: number): CodeRunMapBiome => {
  const idx = ((blockIndex % BIOME_ORDER.length) + BIOME_ORDER.length) % BIOME_ORDER.length;
  return BIOME_ORDER[idx];
};

export const getCodeRunMapTheme = (blockIndex: number): CodeRunMapBiomeTheme =>
  BIOME_THEMES[getCodeRunMapBiome(blockIndex)];

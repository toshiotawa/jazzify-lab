import { buildDrop2IIVIBABDemoScript } from '@/components/survival/tutorial/buildDrop2IIVIBABDemoScript';

describe('buildDrop2IIVIBABDemoScript', () => {
  it('B-A-B デモは C キーの BAB ヴォイシングを含む', () => {
    const script = buildDrop2IIVIBABDemoScript();
    const demo = script.scenes.find((scene) => scene.type === 'demo_play');
    expect(demo?.type).toBe('demo_play');
    if (demo?.type !== 'demo_play') {
      return;
    }
    const dm7 = demo.chords.find((chord) => chord.chordName === 'Dm7');
    expect(dm7?.voicingNames).toEqual(['F3', 'C4', 'E4', 'A4']);
    expect(demo.introLines?.[0]?.ja).toContain('ブロック2');
  });
});

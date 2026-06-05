import { computeBackgroundLayout } from './CodeRunCanvas';

const BG_WIDTH = 1672;
const BG_HEIGHT = 941;
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 528;

describe('computeBackgroundLayout', () => {
  it('縦長ワールドの下端では背景画像を下揃えにする', () => {
    const layout = computeBackgroundLayout(
      VIEW_WIDTH,
      VIEW_HEIGHT,
      BG_WIDTH,
      BG_HEIGHT,
      3840,
      0,
    );
    const drawH = BG_HEIGHT * (VIEW_WIDTH / BG_WIDTH);
    expect(layout.drawY).toBe(Math.round(VIEW_HEIGHT - drawH));
    expect(layout.gradientTop).toBeNull();
  });

  it('縦長ワールドの上端ではパララックス分だけ上に流し、下端は紫グラデーションで埋める', () => {
    const maxScroll = 3840 - VIEW_HEIGHT;
    const layout = computeBackgroundLayout(
      VIEW_WIDTH,
      VIEW_HEIGHT,
      BG_WIDTH,
      BG_HEIGHT,
      3840,
      maxScroll,
    );
    const drawH = Math.round(BG_HEIGHT * (VIEW_WIDTH / BG_WIDTH));
    const expectedDrawY = Math.round(Math.min(0, VIEW_HEIGHT - drawH - maxScroll * 0.08));
    expect(layout.drawY).toBe(expectedDrawY);
    expect(layout.drawY).toBeLessThan(0);
    expect(layout.gradientTop).toBe(layout.drawY + drawH);
    expect(layout.gradientTop).toBeLessThan(VIEW_HEIGHT);
  });

  it('ビューと同じ高さのワールドでは従来どおり縦パララックスを適用する', () => {
    const layout = computeBackgroundLayout(
      VIEW_WIDTH,
      VIEW_HEIGHT,
      BG_WIDTH,
      BG_HEIGHT,
      528,
      100,
    );
    const drawH = BG_HEIGHT * (VIEW_WIDTH / BG_WIDTH);
    expect(layout.drawY).toBe(Math.round((VIEW_HEIGHT - drawH) / 2 - 8));
  });

  it('背景がビューより低いとき下端グラデーション位置を返す', () => {
    const tallViewHeight = 800;
    const maxScroll = 3840 - tallViewHeight;
    const layout = computeBackgroundLayout(
      VIEW_WIDTH,
      tallViewHeight,
      BG_WIDTH,
      BG_HEIGHT,
      3840,
      maxScroll,
    );
    const drawH = Math.round(BG_HEIGHT * (VIEW_WIDTH / BG_WIDTH));
    const expectedDrawY = Math.round(Math.min(0, tallViewHeight - drawH - maxScroll * 0.08));
    expect(layout.drawY).toBe(expectedDrawY);
    expect(layout.gradientTop).toBe(expectedDrawY + drawH);
    expect(layout.gradientTop).toBeLessThan(tallViewHeight);
  });
});

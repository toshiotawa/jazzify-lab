/**
 * ネイティブ・シームレス V4 ランタイム動作確認用のバンドルサンプル manifest。
 * フェーズ1 の生成 JSON を読み込み、型ガードで検証して公開する。
 */
import sampleV4ManifestJson from './__fixtures__/sampleStageV4.manifest.json';
import {
  isSurvivalTutorialV4Manifest,
  type SurvivalTutorialV4Manifest,
} from './survivalTutorialV4Types';

const parseSampleManifest = (): SurvivalTutorialV4Manifest => {
  if (!isSurvivalTutorialV4Manifest(sampleV4ManifestJson)) {
    throw new Error('Invalid bundled V4 sample manifest');
  }
  return sampleV4ManifestJson;
};

export const SAMPLE_STAGE_V4_MANIFEST: SurvivalTutorialV4Manifest = parseSampleManifest();

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteFooter from '@/components/common/SiteFooter';

const diagramBoxClass =
  'font-mono text-sm bg-slate-800/80 p-3 rounded border border-white/10 whitespace-pre-wrap my-3';

const connectionImgClass =
  'w-full bg-slate-900/80 object-contain max-h-64 rounded-lg border border-white/10 my-4';

const CONNECTION_IMAGE_FILES = [
  'iPhone_Lightning_adapter.webp',
  'iPad_Lightning_adapter.webp',
  'iPhone_TypeC_Direct.webp',
  'iPhone_TypeC_hub.webp',
  'iPad_TypeC_Direct.webp',
  'iPad_TypeC_hub.webp',
] as const;

const connectionImgSrc = (file: string): string =>
  encodeURI(`/midi-connection-patterns/${file}`);

interface ConnectionExampleProps {
  heading: string;
  imageFile: string;
  imageAlt: string;
  diagram: string;
  priority?: boolean;
}

const ConnectionExample: React.FC<ConnectionExampleProps> = ({
  heading,
  imageFile,
  imageAlt,
  diagram,
  priority = false,
}) => (
  <div className="mt-6">
    <h3 className="text-lg font-medium text-white/90 mb-2">{heading}</h3>
    <img
      src={connectionImgSrc(imageFile)}
      alt={imageAlt}
      className={connectionImgClass}
      width={1448}
      height={1086}
      loading="eager"
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
    <p className={diagramBoxClass}>{diagram}</p>
  </div>
);

const HelpIosMidi: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    CONNECTION_IMAGE_FILES.forEach((file) => {
      const img = new Image();
      img.src = connectionImgSrc(file);
    });
  }, []);
  return (
    <div className="bg-slate-900 text-white flex flex-col h-screen overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-6 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm border border-white/10"
            aria-label="前のページに戻る"
          >
            ← 戻る
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-6 py-12 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">iPhone/iPad での MIDI 機器利用について</h1>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <p>
              MIDIキーボード（電子ピアノ）をiPhone/iPadに接続すると、より本格的な演奏練習が可能になります。ここでは接続方法を説明します。
            </p>

            <section aria-labelledby="midi-lightning-heading">
              <h2 id="midi-lightning-heading" className="text-xl font-semibold text-white mb-3">
                Lightning端子のiPhone / iPadの場合
              </h2>
              <p>
                Lightning端子のiPhone/iPadでは、Apple純正の「Lightning - USBカメラアダプタ」が必要です。以下の順番で接続してください。
              </p>

              <ConnectionExample
                heading="iPhone（Lightning端子）"
                imageFile="iPhone_Lightning_adapter.webp"
                imageAlt="Lightning端子のiPhoneとMIDIキーボードの接続例"
                diagram="iPhone ― カメラアダプタ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード"
                priority
              />

              <ConnectionExample
                heading="iPad（Lightning端子）"
                imageFile="iPad_Lightning_adapter.webp"
                imageAlt="Lightning端子のiPadとMIDIキーボードの接続例"
                diagram="iPad ― カメラアダプタ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード"
              />
            </section>

            <section aria-labelledby="midi-usbc-heading">
              <h2 id="midi-usbc-heading" className="text-xl font-semibold text-white mb-3">
                USB Type-C端子のiPhone / iPadの場合
              </h2>
              <p>USB Type-C端子のiPhone/iPadでは、カメラアダプタなしで直接接続できる場合があります。</p>

              <ConnectionExample
                heading="iPhone — パターン1（Type-C → Type-Bケーブル）"
                imageFile="iPhone_TypeC_Direct.webp"
                imageAlt="USB Type-C端子のiPhoneとMIDIキーボードの直接接続例"
                diagram="iPhone ― ケーブル（Type-C ↔ Type-B） ― MIDIキーボード"
              />

              <ConnectionExample
                heading="iPhone — パターン2（Type-A → Type-Bケーブル + ハブ）"
                imageFile="iPhone_TypeC_hub.webp"
                imageAlt="USB Type-C端子のiPhoneとType-Cハブ経由のMIDIキーボード接続例"
                diagram="iPhone ― TypeCハブ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード"
              />

              <ConnectionExample
                heading="iPad — パターン1（Type-C → Type-Bケーブル）"
                imageFile="iPad_TypeC_Direct.webp"
                imageAlt="USB Type-C端子のiPadとMIDIキーボードの直接接続例"
                diagram="iPad ― ケーブル（Type-C ↔ Type-B） ― MIDIキーボード"
              />

              <ConnectionExample
                heading="iPad — パターン2（Type-A → Type-Bケーブル + ハブ）"
                imageFile="iPad_TypeC_hub.webp"
                imageAlt="USB Type-C端子のiPadとType-Cハブ経由のMIDIキーボード接続例"
                diagram="iPad ― TypeCハブ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード"
              />

              <p className="mt-3">お使いのMIDIキーボードの端子に合わせて、適切なケーブルを選んでください。</p>
            </section>

            <section aria-labelledby="midi-tips-heading">
              <h2 id="midi-tips-heading" className="text-xl font-semibold text-white mb-3">
                接続のヒント
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>MIDIキーボードの電源が入っていることを確認してください。</li>
                <li>接続すると、アプリが自動的にMIDIデバイスを検出します。</li>
                <li>うまく接続できない場合は、ケーブルを抜き差ししたり、アプリを再起動してみてください。</li>
              </ul>
            </section>

            <div className="pt-4">
              <Link to="/contact" className="text-blue-300 underline">
                お問い合わせフォーム
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HelpIosMidi;

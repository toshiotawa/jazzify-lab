import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteFooter from '@/components/common/SiteFooter';

const diagramBoxClass =
  'font-mono text-sm bg-slate-800/80 p-3 rounded border border-white/10 whitespace-pre-wrap my-3';

const HelpIosMidi: React.FC = () => {
  const navigate = useNavigate();
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
              MIDIキーボード（電子ピアノ）をiPhoneに接続すると、より本格的な演奏練習が可能になります。ここではiPhoneとの接続方法を説明します。
            </p>

            <section aria-labelledby="midi-lightning-heading">
              <h2 id="midi-lightning-heading" className="text-xl font-semibold text-white mb-3">
                Lightning端子のiPhoneの場合
              </h2>
              <p>
                Lightning端子のiPhoneでは、Apple純正の「Lightning - USBカメラアダプタ」が必要です。以下の順番で接続してください。
              </p>
              <p className={diagramBoxClass}>つまり：iPhone ― カメラアダプタ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード</p>
            </section>

            <section aria-labelledby="midi-usbc-heading">
              <h2 id="midi-usbc-heading" className="text-xl font-semibold text-white mb-3">
                USB Type-C端子のiPhoneやiPadの場合
              </h2>
              <p>Type-C端子のiPhoneでは、カメラアダプタなしで直接接続できる場合があります。</p>
              <p className="mt-4 font-medium text-white/90">パターン1（Type-C → Type-Bケーブル）</p>
              <p className={diagramBoxClass}>iPhone ― ケーブル（Type-C ↔ Type-B） ― MIDIキーボード</p>
              <p className="mt-4 font-medium text-white/90">パターン2（Type-A → Type-Bケーブル）</p>
              <p className={diagramBoxClass}>iPhone ― TypeCハブ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード</p>
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

            <p className="text-gray-400 text-sm border-t border-white/10 pt-6">
              同じ内容は、チュートリアルコースのレッスン「MIDIキーボード接続方法」でもご確認いただけます。
            </p>

            <section aria-labelledby="midi-browser-heading" className="rounded-lg bg-slate-800/50 border border-white/10 p-4">
              <h2 id="midi-browser-heading" className="text-lg font-semibold text-white mb-2">
                ブラウザ（Safari 等）からご利用の場合
              </h2>
              <p className="text-sm">
                iPhone／iPad の Safari などでは Web MIDI API が利用できないことがあります。ブラウザ経由で MIDI を使う場合は、App Store の{' '}
                <a
                  href="https://apps.apple.com/us/app/web-midi-browser/id953846217?l"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 underline"
                >
                  Web MIDI Browser
                </a>
                {' '}のご利用をご検討ください。
              </p>
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

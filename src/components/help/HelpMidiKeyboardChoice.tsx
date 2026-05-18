import React from 'react';
import { useNavigate } from 'react-router-dom';
import SiteFooter from '@/components/common/SiteFooter';

const diagramBoxClass =
  'font-mono text-sm bg-slate-800/80 p-3 rounded border border-white/10 whitespace-pre-wrap my-3';

const imgSrc = (file: string): string => encodeURI(`/midi-keyboard-recomended/${file}`);

const HelpMidiKeyboardChoice: React.FC = () => {
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
          <h1 className="text-3xl font-bold mb-6">MIDIキーボードの選び方</h1>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section aria-labelledby="midi-buy-conclusion-heading">
              <h2 id="midi-buy-conclusion-heading" className="text-xl font-semibold text-white mb-3">
                まず結論
              </h2>
              <p className="text-white font-medium mb-4">
                このアプリをしっかり楽しむなら、49鍵以上のMIDIキーボードがおすすめです。迷ったら{' '}
                <span className="text-purple-300 font-semibold">61鍵</span>{' '}
                を選んでください。コード練習、左手・右手を使った練習、ジャズのボイシング練習にちょうどよいサイズです。
              </p>
              <p>
                25〜37鍵の小型キーボードでも接続できますが、鍵盤数が少ないため、両手を使った練習や広い音域のコード練習では窮屈に感じることがあります。
              </p>
              <p>88鍵は、本格的なピアノ練習やほかの音楽制作にも使いたい方向けです。</p>
              <p className="text-white/90 border-l-4 border-purple-500/60 pl-4 py-1">
                <strong className="text-white">ひとことで：</strong>{' '}
                迷ったら61鍵。安く始めるなら49鍵以上。88鍵は本格派向け。
              </p>
            </section>

            <section aria-labelledby="midi-buy-size-heading">
              <h2 id="midi-buy-size-heading" className="text-xl font-semibold text-white mb-3">
                鍵数の位置づけ（目安）
              </h2>
              <pre className={diagramBoxClass}>
{`鍵盤数     位置づけ                    アプリでの考え方
25〜37鍵   お試し・持ち運び向き        使えるがジャズピアノ練習には狭い
49鍵       最低おすすめライン          まず楽しむならここから
61鍵       一番おすすめ               迷ったらこれ
88鍵       本格派・ピアノ兼用         ほか用途もあるなら選ぶ価値あり`}
              </pre>
              <p className="text-sm text-gray-400">
                ジャズピアノでは左手のルートやシェルボイシング、右手のコードやメロディを同時に扱うことが多く、鍵が少ないとすぐ狭く感じます。
              </p>
            </section>

            <section aria-labelledby="midi-buy-models-heading">
              <h2 id="midi-buy-models-heading" className="text-xl font-semibold text-white mb-3">
                機種の例（参考・リンクなし）
              </h2>
              <p>
                USB‑MIDIでシンプルに使える製品として、
                <span className="text-white font-medium">M‑Audio Keystation</span>
                シリーズの一例です。価格は店舗・在庫・時期で変わるため、ここには固定では書きません。
              </p>

              <article className="rounded-lg bg-slate-800/40 border border-white/10 overflow-hidden mb-8">
                <img
                  src={imgSrc('32 Keys.png')}
                  alt="Keystation Mini 32 イメージ"
                  className="w-full bg-slate-900/80 object-contain max-h-64"
                  loading="lazy"
                />
                <div className="p-4 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-emerald-300 font-semibold">まず試したい・省スペース</p>
                  <h3 className="text-lg font-semibold text-white">Keystation Mini 32</h3>
                  <p className="text-sm">
                    アプリに触ってみたい・持ち運びたいとき向け。本格的な両手でのジャズピアノ練習というより、まず環境をそろえる段階向けです。
                  </p>
                </div>
              </article>

              <article className="rounded-lg bg-slate-800/40 border border-white/10 overflow-hidden mb-8">
                <img
                  src={imgSrc('61 Keys.png')}
                  alt="Keystation 61 MK3 イメージ"
                  className="w-full bg-slate-900/80 object-contain max-h-64"
                  loading="lazy"
                />
                <div className="p-4 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-emerald-300 font-semibold">迷ったらこれ</p>
                  <h3 className="text-lg font-semibold text-white">Keystation 61 MK3</h3>
                  <p className="text-sm">
                    Jazzifyでのコード練習や両手ワークのバランスが一番取りやすいサイズです。迷ったときの標準になる機種クラスです。
                  </p>
                </div>
              </article>

              <article className="rounded-lg bg-slate-800/40 border border-white/10 overflow-hidden mb-8">
                <img
                  src={imgSrc('88 Keys.png')}
                  alt="Keystation 88 MK3 イメージ"
                  className="w-full bg-slate-900/80 object-contain max-h-64"
                  loading="lazy"
                />
                <div className="p-4 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-emerald-300 font-semibold">フルレンジ／兼用したい人</p>
                  <h3 className="text-lg font-semibold text-white">Keystation 88 MK3</h3>
                  <p className="text-sm">
                    88鍵すべてを使えるため、両手で広く音域を取る練習や、ピアノと同じ段数に慣れるのに向いています。DAWでの制作とも兼用しやすいです。設置場所と予算に余裕があるかもあわせて検討してください。
                  </p>
                </div>
              </article>
            </section>

            <section
              aria-labelledby="midi-buy-disclaimer-heading"
              className="rounded-lg bg-amber-950/40 border border-amber-900/60 p-4"
            >
              <h2 id="midi-buy-disclaimer-heading" className="text-lg font-semibold text-amber-200 mb-2">
                MIDIキーボード単体では音は鳴りません
              </h2>
              <p className="text-sm text-gray-200">
                MIDIキーボードは、そのまま電子ピアノのように内蔵スピーカーから鳴らす機器とは限りません。iPhone / iPad / PC / Mac
                などに接続し、対応するアプリやソフトウェア音源から音を出します。このアプリでも、対応するMIDIキーボードをホスト側に認識させたうえで練習します。
              </p>
              <p className="text-sm text-gray-400 mt-3">
                多くの製品は説明文で「コンピューター上のバーチャル楽器などを演奏するためのUSB‑MIDIコントローラー」と案内されています。つまり音源本体ではなく、音源ソフトウェアへ演奏情報を送る入力デバイスと考えるとずれがありません。
              </p>
            </section>

            <p className="text-gray-400 text-sm border-t border-white/10 pt-6">
              ケーブルや接続手順は、このサイトのフッターやログイン前画面から開ける「iPhone/iPadでMIDIを使う」もあわせてご覧ください。
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HelpMidiKeyboardChoice;

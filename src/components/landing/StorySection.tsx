import React from 'react';

export const StorySection: React.FC = () => (
  <section id="story" className="py-20 story-gradient" data-animate="slide-left text-up">
    <div className="container mx-auto px-6">
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 section-title flex items-center justify-center gap-4"
        data-animate="from-behind heading-underline"
      >
        <img src="/stage_icons/2.png" alt="ストーリー" className="w-16 h-16" loading="lazy" />
        ストーリー
      </h2>

      <div
        className="max-w-4xl mx-auto mb-16 p-8 rounded-2xl character-card"
        data-animate="slide-right text-up"
      >
        <h3 className="text-2xl font-bold mb-6 text-purple-300">物語の始まり</h3>
        <p className="text-lg leading-relaxed text-gray-300 space-y-3">
          <span className="block">
            ジャズに憧れを持つ青年が、ある日突然、摩訶不思議なジャズ異世界に飛ばされてしまう...！
          </span>
          <span className="block">
            この世界では、音楽を愛するモンスターたちが暮らしており、彼らとセッションを重ね、音楽で心を通わせることが、元の世界へ帰る唯一の方法だという。
          </span>
          <span className="block">
            ジャズの魔法を操り、リズムとハーモニーを極めた者だけが辿り着ける境地――それが「ジャズソーサラー（大魔法使い）」。
          </span>
          <span className="block">
            果たして、君はこの異世界で真のジャズの力を身につけ、伝説のジャズソーサラーになることができるのか？
          </span>
        </p>
        <p className="text-lg leading-relaxed text-gray-300 mt-6">
          世界観は遊び心、学習はガチ。— そんな"冒険する学習体験"がJazzifyです。
        </p>
        <p className="text-sm text-gray-400 mt-4">
          &quot;Jazzify&quot;
          は接尾語「-fy」（〇〇化する）から生まれた言葉。あなたの演奏を「ジャズ化」するという意味を込めています。
        </p>
      </div>

      {/* Character Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto" data-animate="alt-cards text-up">
        <div className="character-card rounded-2xl p-8 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            <img
              src="/default_avater/default-avater.png"
              alt="不破市太郎 (ファイ)"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-blue-300">不破 市太郎 (ファイ)</h3>
          <p className="text-gray-300 leading-relaxed">
            ジャズに憧れを持つ青年。ジャズ研究会に所属していたが、何から始めればいいかもわからず、コードが覚えられないことに悩んでいた。突然ジャズ異世界に飛ばされてしまう。
          </p>
          <h4 className="mt-6 text-lg font-semibold text-white inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <i className="fas fa-exclamation-circle text-yellow-400" aria-hidden="true"></i>
            悩み
          </h4>
          <ul className="mt-2 flex flex-wrap justify-center gap-2 text-sm">
            <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">
              何から始めればいいかわからない
            </li>
            <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">
              コードが覚えられない
            </li>
          </ul>
        </div>

        <div className="character-card rounded-2xl p-8 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            <img
              src="/stage_icons/5.png"
              alt="ジャ爺 (ジャジィ)"
              className="w-24 h-24 object-contain"
              loading="lazy"
            />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-green-300">ジャ爺 (ジャジィ)</h3>
          <p className="text-gray-300 leading-relaxed">
            異世界の住人で、エレキベースを弾く占い師。ファイが元の世界に戻れるよう、ジャズの奥義を伝授し、ジャズソーサラー（大魔法使い）への道を導く。自身も&quot;ジャジファイの魔導書&quot;でスキルアップに励んでいる。
          </p>
          <h4 className="mt-6 text-lg font-semibold text-white inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <i className="fas fa-exclamation-circle text-yellow-400" aria-hidden="true"></i>
            悩み
          </h4>
          <ul className="mt-2 flex flex-wrap justify-center gap-2 text-sm">
            <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">
              練習時間が取れない
            </li>
            <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">
              上達の壁を感じている
            </li>
          </ul>
        </div>

        <div className="character-card rounded-2xl p-8 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            <img
              src="/monster_icons/monster_43.png"
              alt="異世界のモンスター"
              className="w-24 h-24 object-contain"
              loading="lazy"
            />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-pink-300">異世界のモンスター</h3>
          <p className="text-gray-300 leading-relaxed">
            ジャズを愛し、何らかの楽器をたしなんでいる異世界の住人たち。ファイと旅の道中で出会うといつもセッションを申し出てくる音楽好きな仲間たち。
          </p>
          <h4 className="mt-6 text-lg font-semibold text-white inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <i className="fas fa-exclamation-circle text-yellow-400" aria-hidden="true"></i>
            悩み
          </h4>
          <ul className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
            <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">
              ジャズらしくならない
            </li>
            <li className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-gray-200">
              1からきちんと学びたい
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center">
        <h4 className="text-2xl font-bold mb-4">あなたはどのタイプ？</h4>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
          <span className="px-4 py-2 rounded-full bg-slate-800">ファイタイプ</span>
          <span className="px-4 py-2 rounded-full bg-slate-800">ジャジィタイプ</span>
          <span className="px-4 py-2 rounded-full bg-slate-800">モンスタータイプ</span>
        </div>
        <p className="mt-4 text-gray-300 text-sm">
          どのタイプの方にも役立つ学習ツールが満載――あなたの冒険を加速させるのが、Jazzifyです！
        </p>
      </div>
    </div>
  </section>
);

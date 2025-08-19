import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';

const GuildDetail: React.FC = () => {
	const [open, setOpen] = useState(window.location.hash === '#guilds-detail');

	useEffect(() => {
		const handler = () => setOpen(window.location.hash === '#guilds-detail');
		window.addEventListener('hashchange', handler);
		return () => window.removeEventListener('hashchange', handler);
	}, []);

	if (!open) return null;

	return (
		<div className="w-full h-full flex flex-col bg-gradient-game text-white">
			<GameHeader />
			<div className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="max-w-4xl mx-auto space-y-6">
					<h2 className="text-xl font-bold">ギルドの詳細ガイド</h2>

					{/* 概要 */}
					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ギルドとは？</h3>
						<p className="text-gray-300 text-sm">
							ギルドは、仲間と一緒に協力してXPを稼ぎ、ボーナスを得たり、クエストに挑戦したり、ランキングで競い合えるシステムです。
							プレイスタイルに合わせて2つのタイプから選べます。
						</p>
					</div>

					{/* タイプ */}
					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ギルドタイプ</h3>
						<ul className="list-disc pl-5 text-sm text-gray-200 space-y-1">
							<li><span className="font-semibold">カジュアル</span>: のんびり協力して遊びたい方向け。月次クエストの強制はありません。</li>
							<li><span className="font-semibold">チャレンジ</span>:
								毎月の大きな目標に挑む上級者向け。ボーナスに「ストリーク加算」が含まれます。
							</li>
						</ul>
					</div>

					{/* ボーナス */}
					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ギルドボーナス</h3>
						<p className="text-gray-300 text-sm mb-2">
							ギルドに所属していると、XP獲得にボーナス倍率がかかります。合算したボーナスを <span className="font-mono">1 + 係数</span> として適用します。
						</p>
						<ul className="list-disc pl-5 text-sm text-gray-200 space-y-1">
							<li><span className="font-semibold">レベル</span>: レベル1ごとに +0.1%（例: Lv.50 → +5.0%）</li>
							<li><span className="font-semibold">メンバー</span>: 当月にXPを1以上獲得したメンバー人数 × +10%（上限 +50%）</li>
							<li><span className="font-semibold">ストリーク</span>: チャレンジギルドのみ、全メンバーのストリークのティア%を合計（例: +5% や +10% を合算）。</li>
						</ul>
					</div>

					{/* クエスト */}
					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ギルドクエスト</h3>
						<p className="text-gray-300 text-sm">
							チャレンジギルドでは、当月のギルド合計XPが <span className="font-mono">1,000,000</span> に達しない場合、月末にギルドは解散（メンバー0人）となります。メンバー全員で目標達成を目指しましょう。
						</p>
					</div>

					{/* ランキング */}
					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ランキング</h3>
						<p className="text-gray-300 text-sm">
							毎月、ギルドの合計XPでランキングを集計します。上位を目指して協力しましょう。
							<button className="btn btn-xs btn-outline ml-2" onClick={() => { window.location.hash = '#guilds-ranking'; }}>ランキングを見る</button>
						</p>
					</div>

					{/* MVP */}
					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">MVP</h3>
						<p className="text-gray-300 text-sm">
							各月のギルド内で最も多くXPを貢献したメンバーをMVPとして称えます。日頃の努力がしっかり評価されます。
						</p>
					</div>

					<div className="flex gap-2 justify-end">
						<button className="btn btn-outline" onClick={() => { window.location.hash = '#guilds'; }}>ギルドページへ戻る</button>
						<button className="btn btn-primary" onClick={() => { window.location.hash = '#guilds-ranking'; }}>ギルドランキングへ</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GuildDetail;


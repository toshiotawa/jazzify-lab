import React from 'react';
import GameHeader from '@/components/ui/GameHeader';

const GuildsDetail: React.FC = () => {
	return (
		<div className="w-full h-full flex flex-col bg-gradient-game text-white">
			<GameHeader />
			<div className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="max-w-4xl mx-auto space-y-4">
					<h2 className="text-xl font-bold">ギルドの詳細</h2>
					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ギルドタイプ</h3>
						<ul className="list-disc pl-6 text-sm text-gray-300 space-y-1">
							<li><span className="font-semibold text-white">ゆるギルド</span>: 気軽に参加できるタイプ。毎月のクエストなどの厳しい条件はありません。</li>
							<li><span className="font-semibold text-white">チャレンジギルド</span>: 継続（ストリーク）や月次クエストに挑戦する上級者向け。ストリークに応じて追加ボーナスが加算され、毎月のクエスト未達の場合は月末にギルドが解散（メンバー0人）になります。</li>
						</ul>
					</div>

					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ギルドボーナス</h3>
						<ul className="list-disc pl-6 text-sm text-gray-300 space-y-1">
							<li><span className="font-semibold text-white">レベルボーナス</span>: ギルドレベル1ごとに+0.1%（例: Lv.30なら+3.0%）。</li>
							<li><span className="font-semibold text-white">メンバーボーナス</span>: 当月にXPを1以上獲得したメンバー数×+10%（上限+50%）。</li>
							<li><span className="font-semibold text-white">ストリークボーナス</span>: チャレンジギルドのみ。メンバーの継続日数ティアに応じた%を合算して加算。</li>
							<li>適用方法: 合算したボーナス値を1に足した倍率がXP獲得に乗算されます（例: 1 + 0.030 + 0.20 + 0.10 = 1.33x）。</li>
						</ul>
					</div>

					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">クエスト（チャレンジギルド）</h3>
						<p className="text-sm text-gray-300">当月のギルド合計XPが1,000,000に到達しない場合、月末にギルドは解散（メンバー数が0人にリセット）されます。進捗はギルドダッシュボードまたは各ギルドページで確認できます。</p>
					</div>

					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ランキング</h3>
						<p className="text-sm text-gray-300">ギルドの月次ランキングを公開しています。上位を目指して協力しましょう。</p>
						<div className="mt-2">
							<button className="btn btn-xs btn-outline" onClick={()=>{ window.location.hash = '#guilds-ranking'; }}>ギルドランキングを見る</button>
						</div>
					</div>

					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">MVP（今月）</h3>
						<p className="text-sm text-gray-300">当月に最も貢献したメンバー（XP獲得量が最大）をMVPとして表示します。詳細は各ギルドのページで確認できます。</p>
					</div>

					<div className="flex justify-end">
						<button className="btn btn-outline btn-sm" onClick={()=>{ window.location.hash = '#guilds'; }}>戻る</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GuildsDetail;

import React from 'react';
import GameHeader from '@/components/ui/GameHeader';

const GuildsDetail: React.FC = () => {
	return (
		<div className="w-full h-full flex flex-col bg-gradient-game text-white">
			<GameHeader />
			<div className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="max-w-4xl mx-auto space-y-4">
					<h2 className="text-xl font-bold">ギルドの詳細</h2>
					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ギルドタイプ</h3>
						<ul className="list-disc pl-6 text-sm text-gray-300 space-y-1">
							<li><span className="font-semibold text-white">ゆるギルド</span>: 気軽に参加できるタイプ。毎月のクエストなどの厳しい条件はありません。</li>
							<li><span className="font-semibold text-white">チャレンジギルド</span>: 継続（ストリーク）や月次クエストに挑戦する上級者向け。ストリークに応じて追加ボーナスが加算され、毎月のクエスト未達の場合は月末にギルドが解散（メンバー0人）になります。</li>
						</ul>
					</div>

					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ギルドボーナス</h3>
						<ul className="list-disc pl-6 text-sm text-gray-300 space-y-1">
							<li><span className="font-semibold text-white">レベルボーナス</span>: ギルドレベル1ごとに+0.1%（例: Lv.30なら+3.0%）。</li>
							<li><span className="font-semibold text-white">メンバーボーナス</span>: 当月にXPを1以上獲得したメンバー数×+10%（上限+50%）。</li>
							<li><span className="font-semibold text-white">ストリークボーナス</span>: チャレンジギルドのみ。メンバーの継続日数ティアに応じた%を合算して加算。</li>
							<li>適用方法: 合算したボーナス値を1に足した倍率がXP獲得に乗算されます（例: 1 + 0.030 + 0.20 + 0.10 = 1.33x）。</li>
						</ul>
					</div>

					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">クエスト（チャレンジギルド）</h3>
						<p className="text-sm text-gray-300">当月のギルド合計XPが1,000,000に到達しない場合、月末にギルドは解散（メンバー数が0人にリセット）されます。進捗は`#guilds`/ギルドページで確認できます。</p>
					</div>

					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">ランキング</h3>
						<p className="text-sm text-gray-300">ギルドの月次ランキングを公開しています。上位を目指して協力しましょう。</p>
						<div className="mt-2">
							<button className="btn btn-xs btn-outline" onClick={()=>{ window.location.hash = '#guilds-ranking'; }}>ギルドランキングを見る</button>
						</div>
					</div>

					<div className="bg-slate-800 border border-slate-700 rounded p-4">
						<h3 className="font-semibold mb-2">MVP（今月）</h3>
						<p className="text-sm text-gray-300">当月に最も貢献したメンバー（XP獲得量が最大）をMVPとして表示します。詳細は各ギルドのページで確認できます。</p>
					</div>

					<div className="flex justify-end">
						<button className="btn btn-outline btn-sm" onClick={()=>{ window.location.hash = '#guilds'; }}>戻る</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GuildsDetail;


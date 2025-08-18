import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
	getMyGuild,
	getGuildMembers,
	searchGuilds,
	requestJoin,
	createGuild,
	fetchMyGuildRank,
	fetchGuildMonthlyRanks,
	fetchGuildMemberMonthlyXp,
	fetchJoinRequestsForMyGuild,
	approveJoinRequest,
	rejectJoinRequest,
	Guild,
	GuildMember,
	GuildJoinRequest,
	fetchMyGuildContributionTotal,
	updateGuildDescription,
	disbandMyGuild,
	leaveMyGuild,
	kickMember,
} from '@/platform/supabaseGuilds';
import GuildBoard from '@/components/guild/GuildBoard';
import GameHeader from '@/components/ui/GameHeader';
import { currentLevelXP, xpToNextLevel } from '@/utils/xpCalculator';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { computeGuildBonus, formatMultiplier } from '@/utils/guildBonus';
 
 const GuildDashboard: React.FC = () => {
 	const { user, profile } = useAuthStore();
 	const [loading, setLoading] = useState(true);
 	const [myGuild, setMyGuild] = useState<Guild | null>(null);
 	const [members, setMembers] = useState<GuildMember[]>([]);
 	const [keyword, setKeyword] = useState('');
 	const [results, setResults] = useState<Guild[]>([]);
 	const [creating, setCreating] = useState(false);
 	const [newGuildName, setNewGuildName] = useState('');
 	const [busy, setBusy] = useState(false);
 	const [myRank, setMyRank] = useState<number | null>(null);
 	const [thisMonthXp, setThisMonthXp] = useState<number>(0);
 	const [memberMonthly, setMemberMonthly] = useState<Array<{ user_id: string; monthly_xp: number }>>([]);
 	const [joinRequests, setJoinRequests] = useState<GuildJoinRequest[]>([]);
 	const [myMonthlyXp, setMyMonthlyXp] = useState<number>(0);
 	const [myTotalContribXp, setMyTotalContribXp] = useState<number>(0);
 	const [descEdit, setDescEdit] = useState<string>('');
 	const [editingDesc, setEditingDesc] = useState<boolean>(false);
 	const [isLeader, setIsLeader] = useState<boolean>(false);
 
 	useEffect(() => {
 		const fetchData = async () => {
 			if (user) {
 				try {
 					setLoading(true);
 					const [guild, rank, monthlyXp, memberMonthly, joinRequests, myTotalContribXp] = await Promise.all([
 						getMyGuild(user.id),
 						fetchMyGuildRank(user.id),
 						fetchGuildMemberMonthlyXp(user.id),
 						fetchGuildMemberMonthlyXp(user.id), // This seems redundant, should be fetchGuildMemberMonthlyXp(user.id)
 						fetchJoinRequestsForMyGuild(user.id),
 						fetchMyGuildContributionTotal(user.id),
 					]);
 					setMyGuild(guild);
 					setMyRank(rank);
 					setThisMonthXp(monthlyXp);
 					setMemberMonthly(memberMonthly);
 					setJoinRequests(joinRequests);
 					setMyTotalContribXp(myTotalContribXp);
 
 					if (guild) {
 						const members = await getGuildMembers(guild.id);
 						setMembers(members);
 						setIsLeader(members.some(m => m.user_id === user.id && m.role === 'leader'));
 					}
 				} catch (e: any) {
 					alert(e?.message || 'ギルド情報の取得に失敗しました');
 				} finally {
 					setLoading(false);
 				}
 			}
 		};
 
 		fetchData();
 	}, [user]);
 
 	const handleSearch = async () => {
 		if (keyword) {
 			try {
 				setLoading(true);
 				const results = await searchGuilds(keyword);
 				setResults(results);
 			} catch (e: any) {
 				alert(e?.message || 'ギルド検索に失敗しました');
 			} finally {
 				setLoading(false);
 			}
 		}
 	};
 
 	const handleCreateGuild = async () => {
 		if (newGuildName) {
 			try {
 				setBusy(true);
 				const guild = await createGuild(newGuildName, user.id);
 				if (guild) {
 					setMyGuild(guild);
 					setIsLeader(true);
 					alert('ギルドが作成されました！');
 				}
 			} catch (e: any) {
 				alert(e?.message || 'ギルド作成に失敗しました');
 			} finally {
 				setBusy(false);
 			}
 		}
 	};
 
 	const handleLeaveGuild = async () => {
 		if (myGuild) {
 			try {
 				setBusy(true);
 				await leaveMyGuild(myGuild.id, user.id);
 				alert('ギルドから退出しました。');
 				window.location.reload();
 			} catch (e: any) {
 				alert(e?.message || 'ギルドから退出に失敗しました');
 			} finally {
 				setBusy(false);
 			}
 		}
 	};
 
 	const handleDisbandGuild = async () => {
 		if (myGuild) {
 			try {
 				setBusy(true);
 				await disbandMyGuild(myGuild.id, user.id);
 				alert('ギルドが解散されました。');
 				window.location.reload();
 			} catch (e: any) {
 				alert(e?.message || 'ギルド解散に失敗しました');
 			} finally {
 				setBusy(false);
 			}
 		}
 	};
 
 	const handleApproveJoinRequest = async (requestId: string) => {
 		if (myGuild) {
 			try {
 				setBusy(true);
 				await approveJoinRequest(requestId);
 				alert('参加リクエストが承認されました。');
 				window.location.reload();
 			} catch (e: any) {
 				alert(e?.message || '参加リクエスト承認に失敗しました');
 			} finally {
 				setBusy(false);
 			}
 		}
 	};
 
 	const handleRejectJoinRequest = async (requestId: string) => {
 		if (myGuild) {
 			try {
 				setBusy(true);
 				await rejectJoinRequest(requestId);
 				alert('参加リクエストが拒否されました。');
 				window.location.reload();
 			} catch (e: any) {
 				alert(e?.message || '参加リクエスト拒否に失敗しました');
 			} finally {
 				setBusy(false);
 			}
 		}
 	};
 
 	const handleUpdateDescription = async () => {
 		if (myGuild && descEdit) {
 			try {
 				setBusy(true);
 				await updateGuildDescription(myGuild.id, descEdit);
 				setMyGuild(prev => prev ? { ...prev, description: descEdit } : null);
 				setEditingDesc(false);
 				alert('ギルド説明が更新されました。');
 			} catch (e: any) {
 				alert(e?.message || 'ギルド説明更新に失敗しました');
 			} finally {
 				setBusy(false);
 			}
 		}
 	};
 
 	if (loading) {
 		return <div className="text-center py-8">Loading...</div>;
 	}
 
 	if (!user) {
 		return <div className="text-center py-8">Please log in to view this page.</div>;
 	}
 
 	if (!myGuild) {
 		return (
 			<div className="text-center py-8">
 				<h2>ギルドを作成または参加</h2>
 				<p>ギルドを作成して、仲間と一緒に冒険を楽しもう！</p>
 				<div className="mt-4">
 					<input
 						type="text"
 						placeholder="ギルド名"
 						value={newGuildName}
 						onChange={(e) => setNewGuildName(e.target.value)}
 						className="input input-bordered w-full max-w-xs"
 					/>
 					<button onClick={handleCreateGuild} className="btn btn-primary mt-2">ギルドを作成</button>
 				</div>
 				<div className="mt-4">
 					<input
 						type="text"
 						placeholder="ギルドを検索"
 						value={keyword}
 						onChange={(e) => setKeyword(e.target.value)}
 						onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
 						className="input input-bordered w-full max-w-xs"
 					/>
 					<button onClick={handleSearch} className="btn btn-secondary mt-2">検索</button>
 				</div>
 				{results.length > 0 && (
 					<div className="mt-4">
 						<h3>検索結果</h3>
 						<ul>
 							{results.map(g => (
 								<li key={g.id} onClick={() => requestJoin(g.id, user.id)} className="cursor-pointer hover:bg-slate-800 p-2 rounded">
 									{g.name}
 								</li>
 							))}
 						</ul>
 					</div>
 				)}
 			</div>
 		);
 	}
 
 	return (
 		<div className="container mx-auto p-4">
 			<GameHeader title={myGuild.name} />
 
 			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 				<div className="bg-slate-900 p-4 rounded-lg">
 					<h3>ギルド情報</h3>
 					<p>ギルド説明: {myGuild.description || 'なし'}</p>
 					<p>メンバー数: {members.length}</p>
 					<p>リーダー: {myGuild.leader_id === user?.id ? 'あなた' : members.find(m => m.user_id === myGuild.leader_id)?.nickname || '不明'}</p>
 					<p>月間XP: {thisMonthXp}</p>
 					<p>総貢献XP: {myTotalContribXp}</p>
 					<p>ボーナス: {formatMultiplier(computeGuildBonus(myGuild.level, myGuild.member_count))}</p>
 					<p>現在のレベル: {currentLevelXP(myTotalContribXp)}</p>
 					<p>次のレベルまで: {xpToNextLevel(myTotalContribXp)}</p>
 
 					{editingDesc ? (
 						<div className="mt-4">
 							<textarea
 								value={descEdit}
 								onChange={(e) => setDescEdit(e.target.value)}
 								className="input input-bordered w-full"
 							/>
 							<button onClick={handleUpdateDescription} className="btn btn-primary mt-2">説明を更新</button>
 						</div>
 					) : (
 						<button onClick={() => setEditingDesc(true)} className="btn btn-outline btn-sm">ギルド説明を編集</button>
 					)}
 
 					<h3 className="mt-4">ギルドボード</h3>
 					<GuildBoard guild={myGuild} />
 				</div>
 
 				<div className="bg-slate-900 p-4 rounded-lg">
 					<h3>メンバーリスト</h3>
 					<input
 						type="text"
 						placeholder="メンバーを検索"
 						value={keyword}
 						onChange={(e) => setKeyword(e.target.value)}
 						onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
 						className="input input-bordered w-full max-w-xs mb-2"
 					/>
 					<button onClick={handleSearch} className="btn btn-secondary mb-2">検索</button>
 					{members.length === 0 ? (
 						<p>メンバーはまだいません。</p>
 					) : (
 						<ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
 							{members.map(m => (
 								<li key={m.user_id} className="flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-700">
 									<button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} aria-label="ユーザーページへ">
 										<img src={m.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
 									</button>
 									<div className="flex-1 min-w-0">
 										<button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} className="font-medium text-sm truncate text-left hover:text-blue-400">{m.nickname}</button>
 										<div className="text-xs text-gray-400">Lv {m.level} / {m.rank}</div>
 									</div>
 									{m.role === 'leader' && (
 										<span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500 text-black font-bold">Leader</span>
 									)}
 									{isLeader && m.role !== 'leader' && m.user_id !== user?.id && (
 										<button
 											className="btn btn-xs btn-outline text-red-300 border-red-600"
 											disabled={busy}
 											onClick={async()=>{
 												if(!confirm('このメンバーを除名しますか？')) return;
 												if(!confirm('最終確認: 除名すると元に戻せません。よろしいですか？')) return;
 												try {
 													setBusy(true);
 													await kickMember(m.user_id);
 													setMembers(prev => prev.filter(x => x.user_id !== m.user_id));
 												} catch(e: any) {
 													alert(e?.message || '除名に失敗しました');
 												} finally {
 													setBusy(false);
 												}
 										}}
 									>除名</button>
 									)}
 								</li>
 							))}
 						</ul>
 					)}
 				</div>
 
 				<div className="bg-slate-900 p-4 rounded-lg">
 					<h3>参加リクエスト</h3>
 					{joinRequests.length === 0 ? (
 						<p>参加リクエストはありません。</p>
 					) : (
 						<ul>
 							{joinRequests.map(req => (
 								<li key={req.id} className="bg-slate-800 p-2 rounded-lg mb-2">
 									<p>{req.user.nickname} からの参加リクエスト</p>
 									<button onClick={() => handleApproveJoinRequest(req.id)} className="btn btn-xs btn-success mr-2">承認</button>
 									<button onClick={() => handleRejectJoinRequest(req.id)} className="btn btn-xs btn-error">拒否</button>
 								</li>
 							))}
 						</ul>
 					)}
 				</div>
 			</div>
 
 			<div className="flex justify-end gap-2 mt-4">
 				<button onClick={handleLeaveGuild} className="btn btn-outline text-red-300 border-red-600">ギルドから退出</button>
 				{isLeader && (
 					<button onClick={handleDisbandGuild} className="btn btn-outline text-red-300 border-red-600">ギルドを解散</button>
 				)}
 			</div>
 		</div>
 	);
 };
 
 export default GuildDashboard;
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
	getMyGuild,
	getGuildMembers,
	searchGuilds,
	requestJoin,
	createGuild,
	fetchMyGuildRank,
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
	fetchGuildDailyStreaks,
} from '@/platform/supabaseGuilds';
import GuildBoard from '@/components/guild/GuildBoard';
import GameHeader from '@/components/ui/GameHeader';
import { currentLevelXP, xpToNextLevel } from '@/utils/xpCalculator';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { computeGuildBonus, formatMultiplier } from '@/utils/guildBonus';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { FaCrown, FaTrophy, FaGraduationCap, FaHatWizard, FaCheckCircle } from 'react-icons/fa';

const GuildDashboard: React.FC = () => {
	const { user } = useAuthStore();
	const [loading, setLoading] = useState(true);
	const [myGuild, setMyGuild] = useState<Guild | null>(null);
	const [members, setMembers] = useState<GuildMember[]>([]);
	const [keyword, setKeyword] = useState('');
	const [results, setResults] = useState<Guild[]>([]);
	const [busy, setBusy] = useState(false);
	const [myRank, setMyRank] = useState<number | null>(null);
	const [thisMonthXp, setThisMonthXp] = useState<number>(0);
	const [memberMonthly, setMemberMonthly] = useState<Array<{ user_id: string; monthly_xp: number }>>([]);
	const [joinRequests, setJoinRequests] = useState<GuildJoinRequest[]>([]);
	const [myTotalContribXp, setMyTotalContribXp] = useState<number>(0);
	const [descEdit, setDescEdit] = useState<string>('');
	const [editingDesc, setEditingDesc] = useState<boolean>(false);
	const [isLeader, setIsLeader] = useState<boolean>(false);
	const [streaks, setStreaks] = useState<Record<string, { daysCurrentStreak: number; tierPercent: number; tierMaxDays: number; display: string }>>({});

	useEffect(() => {
		const fetchData = async () => {
			if (!user) return;
			try {
				setLoading(true);
				const [guild, rank, memberMonthlyData, joinReqs, totalContrib] = await Promise.all([
					getMyGuild(user.id),
					fetchMyGuildRank(user.id),
					fetchGuildMemberMonthlyXp(user.id),
					fetchJoinRequestsForMyGuild(user.id),
					fetchMyGuildContributionTotal(user.id),
				]);
				setMyGuild(guild);
				setMyRank(rank);
				setMemberMonthly(memberMonthlyData);
				setJoinRequests(joinReqs);
				setMyTotalContribXp(totalContrib);
				setThisMonthXp(memberMonthlyData.reduce((a, b) => a + Number(b.monthly_xp || 0), 0));
				if (guild) {
					const m = await getGuildMembers(guild.id);
					setMembers(m);
					setIsLeader(m.some(x => x.user_id === user.id && x.role === 'leader'));
					const st = await fetchGuildDailyStreaks(guild.id).catch(() => ({} as Record<string, any>));
					setStreaks(st);
				}
			} catch (e: any) {
				alert(e?.message || 'ギルド情報の取得に失敗しました');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [user]);

	const handleSearch = async () => {
		if (!keyword) return;
		try {
			setLoading(true);
			const r = await searchGuilds(keyword);
			setResults(r);
		} catch (e: any) {
			alert(e?.message || 'ギルド検索に失敗しました');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateGuild = async () => {
		if (!user || !keyword.trim()) return;
		try {
			setBusy(true);
			const g = await createGuild(keyword.trim(), user.id);
			if (g) {
				setMyGuild(g);
				setIsLeader(true);
				alert('ギルドが作成されました！');
			}
		} catch (e: any) {
			alert(e?.message || 'ギルド作成に失敗しました');
		} finally {
			setBusy(false);
		}
	};

	const handleLeaveGuild = async () => {
		if (!myGuild || !user) return;
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
	};

	const handleDisbandGuild = async () => {
		if (!myGuild || !user) return;
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
	};

	const handleApproveJoinRequest = async (requestId: string) => {
		if (!myGuild) return;
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
	};

	const handleRejectJoinRequest = async (requestId: string) => {
		if (!myGuild) return;
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
	};

	const handleUpdateDescription = async () => {
		if (!myGuild || !descEdit.trim()) return;
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
	};

	const getTitleType = (title: string): 'level' | 'mission' | 'lesson' | 'wizard' => {
		if (TITLES.includes(title as any)) return 'level';
		if (MISSION_TITLES.some(mt => mt.name === title)) return 'mission';
		if (LESSON_TITLES.some(lt => lt.name === title)) return 'lesson';
		if (WIZARD_TITLES.includes(title as any)) return 'wizard';
		return 'level';
	};
	const getTitleIcon = (title: string) => {
		const t = getTitleType(title);
		switch (t) {
			case 'level': return <FaCrown className="text-[10px] text-yellow-400"/>;
			case 'mission': return <FaTrophy className="text-[10px] text-purple-400"/>;
			case 'lesson': return <FaGraduationCap className="text-[10px] text-blue-400"/>;
			case 'wizard': return <FaHatWizard className="text-[10px] text-green-400"/>;
			default: return <FaCrown className="text-[10px] text-yellow-400"/>;
		}
	};

	if (loading) return <div className="text-center py-8">Loading...</div>;
	if (!user) return <div className="text-center py-8">Please log in to view this page.</div>;
	if (!myGuild) {
		return (
			<div className="text-center py-8">
				<h2>ギルドを作成または参加</h2>
				<p>ギルドを作成して、仲間と一緒に冒険を楽しもう！</p>
				<div className="mt-4">
					<input type="text" placeholder="ギルド名/検索キーワード" value={keyword} onChange={(e)=>setKeyword(e.target.value)} className="input input-bordered w-full max-w-xs" />
					<div className="mt-2 flex gap-2 justify-center">
						<button onClick={handleCreateGuild} className="btn btn-primary" disabled={busy}>ギルドを作成</button>
						<button onClick={handleSearch} className="btn btn-secondary" disabled={busy}>検索</button>
					</div>
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

	const contributors = memberMonthly.filter(x => Number(x.monthly_xp || 0) >= 1).length;
	const bonus = computeGuildBonus(myGuild.level || 1, contributors);

	return (
		<div className="container mx-auto p-4">
			<GameHeader title={myGuild.name} />

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
				<div className="bg-slate-900 p-4 rounded-lg">
					<h3>ギルド情報</h3>
					<p>ギルド説明: {myGuild.description || 'なし'}</p>
					<p>メンバー数: {members.length}</p>
					<p>リーダー: {myGuild.leader_id === user?.id ? 'あなた' : members.find(m => m.user_id === myGuild.leader_id)?.nickname || '不明'}</p>
					<p>今月合計XP: {thisMonthXp}</p>
					<p>総貢献XP: {myTotalContribXp}</p>
					<p>ギルドボーナス: {formatMultiplier(bonus.totalMultiplier)}</p>
					<p className="text-xs text-gray-400">（レベル +{(bonus.levelBonus*100).toFixed(1)}% / メンバー +{(bonus.memberBonus*100).toFixed(0)}%）</p>
					<p>現在のレベル: {currentLevelXP(myTotalContribXp)}</p>
					<p>次のレベルまで: {xpToNextLevel(myTotalContribXp)}</p>

					{editingDesc ? (
						<div className="mt-4">
							<textarea value={descEdit} onChange={(e)=>setDescEdit(e.target.value)} className="input input-bordered w-full" />
							<button onClick={handleUpdateDescription} className="btn btn-primary mt-2" disabled={busy}>説明を更新</button>
						</div>
					) : (
						<button onClick={()=>setEditingDesc(true)} className="btn btn-outline btn-sm">ギルド説明を編集</button>
					)}

					<h3 className="mt-4">ギルドボード</h3>
					<GuildBoard guildId={myGuild.id} />
				</div>

				<div className="bg-slate-900 p-4 rounded-lg">
					<h3>メンバーリスト</h3>
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
										<div className="flex items-center gap-2">
											<button onClick={()=>{ window.location.hash = `#diary-user?id=${m.user_id}`; }} className="font-medium text-sm truncate text-left hover:text-blue-400">{m.nickname}</button>
											{m.selected_title && (
												<div className="relative">
													<div className="flex items-center gap-1 text-yellow-400 cursor-help group">
														{getTitleIcon((m.selected_title as Title) || DEFAULT_TITLE)}
														<span className="text-[10px] truncate max-w-[140px]">{(m.selected_title as Title) || DEFAULT_TITLE}</span>
													</div>
													<div className="absolute hidden group-hover:block z-50 bg-gray-900 text-white text-[11px] p-2 rounded shadow-lg whitespace-nowrap" style={{ top: '100%', left: 0, marginTop: '4px' }}>
														{getTitleRequirement((m.selected_title as Title) || DEFAULT_TITLE)}
														<div className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" style={{ top: '-4px', left: '12px' }} />
													</div>
												</div>
											)}
										</div>
										<div className="text-xs text-gray-400">Lv {m.level} / {m.rank}</div>
										{streaks[m.user_id] && (
											<div className="mt-1">
												<div className="h-1.5 bg-slate-800 rounded overflow-hidden">
													<div className="h-full bg-green-500" style={{ width: `${Math.min(100, (Math.min(streaks[m.user_id].daysCurrentStreak, streaks[m.user_id].tierMaxDays) / streaks[m.user_id].tierMaxDays) * 100)}%` }} />
												</div>
												<div className="text-[10px] text-gray-400 mt-1">{streaks[m.user_id].display}</div>
											</div>
										)}
									</div>
									{m.role === 'leader' && (
										<span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500 text-black font-bold">Leader</span>
									)}
									{memberMonthly.some(x=>x.user_id===m.user_id && Number(x.monthly_xp||0)>=1) && (
										<FaCheckCircle className="text-green-400 text-sm" title="今月のギルド貢献にカウント済み" />
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
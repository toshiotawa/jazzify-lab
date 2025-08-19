import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { Guild, getGuildById, getGuildMembers, fetchGuildMemberMonthlyXp, fetchGuildRankForMonth, fetchGuildMonthlyXpSingle, requestJoin, getMyGuild, cancelMyJoinRequest } from '@/platform/supabaseGuilds';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES, WIZARD_TITLES, getTitleRequirement } from '@/utils/titleConstants';
import { FaCrown, FaTrophy, FaGraduationCap, FaHatWizard, FaCheckCircle } from 'react-icons/fa';

const GuildPage: React.FC = () => {
  const [open, setOpen] = useState(window.location.hash.startsWith('#guild'));
  const [guildId, setGuildId] = useState<string | null>(null);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<Array<{ user_id: string; nickname: string; avatar_url?: string; level: number; rank: string; role: 'leader' | 'member'; selected_title?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [memberMonthly, setMemberMonthly] = useState<Array<{ user_id: string; monthly_xp: number }>>([]);
  const [seasonXp, setSeasonXp] = useState<number>(0);
  const [rank, setRank] = useState<number | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getMyGuildId, getGuildIdOfUser, getPendingInvitationToUser, inviteUserToMyGuild, cancelInvitation } from '@/platform/supabaseGuilds';

interface Props {
  targetUserId: string;
}

const GuildInviteControls: React.FC<Props> = ({ targetUserId }) => {
  const { user, profile } = useAuthStore();
  const [myGuildId, setMyGuildId] = useState<string | null>(null);
  const [targetGuildId, setTargetGuildId] = useState<string | null>(null);
  const [pendingInvitationId, setPendingInvitationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const isFree = profile?.rank === 'free';

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [myGid, targetGid] = await Promise.all([
          getMyGuildId(),
          getGuildIdOfUser(targetUserId),
        ]);
        if (!mounted) return;
        setMyGuildId(myGid);
        setTargetGuildId(targetGid);
        if (myGid) {
          const inv = await getPendingInvitationToUser(targetUserId);
          if (!mounted) return;
          setPendingInvitationId(inv?.id ?? null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [targetUserId]);

  if (!user) return null;
  if (isFree) return null;
  if (loading) return null;

  // 既にギルド所属のユーザーは勧誘不可
  if (targetGuildId) {
    return <p className="text-sm text-gray-400">このユーザーは既にギルドに所属しています</p>;
  }

  // 自分がギルドに入っていない場合は勧誘不可
  if (!myGuildId) {
    return <p className="text-sm text-gray-400">ギルドに所属していないため勧誘できません</p>;
  }

  return (
    <div className="flex gap-2 items-center">
      {pendingInvitationId ? (
        <button
          className="btn btn-xs btn-outline"
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              await cancelInvitation(pendingInvitationId);
              setPendingInvitationId(null);
            } finally {
              setBusy(false);
            }
          }}
        >招待をキャンセル</button>
      ) : (
        <button
          className="btn btn-xs btn-primary"
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              const id = await inviteUserToMyGuild(targetUserId);
              setPendingInvitationId(id);
            } catch (e: any) {
              alert(e.message || '勧誘に失敗しました');
            } finally {
              setBusy(false);
            }
          }}
        >ギルドに勧誘</button>
      )}
    </div>
  );
};

export default GuildInviteControls;


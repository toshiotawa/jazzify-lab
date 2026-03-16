export type LegacyMembershipRank =
  | 'free'
  | 'standard'
  | 'standard_global'
  | 'premium'
  | 'platinum'
  | 'black';

export type MembershipTier = 'free' | 'premium';

export const normalizeMembershipTier = (
  rank: string | null | undefined,
): MembershipTier => {
  if (!rank) {
    return 'free';
  }

  return rank === 'free' ? 'free' : 'premium';
};

export const isPremiumTier = (rank: string | null | undefined): boolean => (
  normalizeMembershipTier(rank) === 'premium'
);

export const getMembershipLabel = (
  rank: string | null | undefined,
  locale: 'ja' | 'en',
): string => {
  const tier = normalizeMembershipTier(rank);
  if (locale === 'en') {
    return tier === 'premium' ? 'Premium' : 'Free';
  }
  return tier === 'premium' ? 'プレミアム' : 'フリー';
};

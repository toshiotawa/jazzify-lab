export interface SubscriptionRowForDeletion {
  provider: string | null;
  entitlement_state: string | null;
}

export interface CoachingSubscriptionRowForDeletion {
  provider: string | null;
  entitlement_state: string | null;
}

export interface LegacyProfileForDeletion {
  rank: string | null;
  lemon_subscription_status: string | null;
}

export interface AccountDeletionBlockResult {
  error: string;
  provider: string;
  product?: 'coaching';
}

export const formatBillingProviderLabel = (provider: string | null | undefined): string => {
  switch (provider) {
    case 'apple':
      return 'Apple';
    case 'stripe':
      return 'Stripe';
    case 'lemon':
      return 'Lemon Squeezy';
    default:
      return provider && provider.trim().length > 0 ? provider : 'your payment provider';
  }
};

export const evaluateAccountDeletionBlock = (input: {
  subscription: SubscriptionRowForDeletion | null;
  coachingSubscription: CoachingSubscriptionRowForDeletion | null;
  profile: LegacyProfileForDeletion | null;
}): AccountDeletionBlockResult | null => {
  if (input.subscription && input.subscription.entitlement_state !== 'expired') {
    const provider = input.subscription.provider ?? 'unknown';
    const providerLabel = formatBillingProviderLabel(provider);
    return {
      error: `Active subscription exists via ${providerLabel}. Please cancel first.`,
      provider,
    };
  }

  if (
    input.coachingSubscription &&
    input.coachingSubscription.entitlement_state !== 'expired'
  ) {
    const provider = input.coachingSubscription.provider ?? 'stripe';
    const providerLabel = formatBillingProviderLabel(provider);
    return {
      error: `Active coaching subscription exists via ${providerLabel}. Please cancel first.`,
      provider,
      product: 'coaching',
    };
  }

  if (input.profile?.rank && input.profile.rank !== 'free') {
    const isLemonActive = ['active', 'on_trial', 'past_due'].includes(
      input.profile.lemon_subscription_status ?? '',
    );
    if (isLemonActive) {
      return {
        error: 'Active Lemon subscription. Cancel via web portal first.',
        provider: 'lemon',
      };
    }
  }

  return null;
};

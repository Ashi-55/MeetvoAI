export const TRIAL_DAYS = 14;
export const STARTER_AGENT_LIMIT = 3;
export const TRIAL_ENDED_MESSAGE = 'Your free trial has ended. Choose a plan to keep building and earning on MeetvoAI.';

type TrialInput = {
  createdAt?: string | null;
  subscriptionStatus?: string | null;
};

export function getTrialEndsAt(createdAt?: string | null) {
  if (!createdAt) return null;
  const started = new Date(createdAt);
  if (Number.isNaN(started.getTime())) return null;
  return new Date(started.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function isPaidSubscriptionActive(subscriptionStatus?: string | null) {
  return subscriptionStatus === 'active';
}

export function isTrialExpired({ createdAt, subscriptionStatus }: TrialInput) {
  if (isPaidSubscriptionActive(subscriptionStatus)) return false;
  const trialEndsAt = getTrialEndsAt(createdAt);
  if (!trialEndsAt) return false;
  return Date.now() >= trialEndsAt.getTime();
}

export function isStarterPublishLimitReached(publishedCount: number, subscriptionPlan?: string | null, subscriptionStatus?: string | null) {
  if (subscriptionStatus === 'active' && subscriptionPlan && subscriptionPlan !== 'starter') return false;
  return publishedCount >= STARTER_AGENT_LIMIT;
}

import { useTenantContext } from "./useTenantContext";

export function useSubscriptionGuard() {
  const { data, isLoading } = useTenantContext();
  const status = data?.subscriptionStatus ?? null;
  const readOnly = status === "canceled";
  const warning = status === "past_due";
  const blocking = status === "incomplete";
  return { data, isLoading, status, readOnly, warning, blocking };
}
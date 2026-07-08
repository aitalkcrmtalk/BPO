import { useTenantContext } from "./useTenantContext";

export function useSubscriptionGuard() {
  const { data, isLoading } = useTenantContext();
  const status = data?.subscriptionStatus ?? null;
  const readOnly = status === "cancelada";
  const warning = status === "atrasada";
  const blocking = status === "incompleta";
  return { data, isLoading, status, readOnly, warning, blocking };
}
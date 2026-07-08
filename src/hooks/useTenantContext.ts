import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyTenantContext } from "@/lib/tenant.functions";

export function useTenantContext() {
  const fetcher = useServerFn(getMyTenantContext);
  return useQuery({
    queryKey: ["my-tenant-context"],
    queryFn: () => fetcher(),
    staleTime: 30_000,
  });
}
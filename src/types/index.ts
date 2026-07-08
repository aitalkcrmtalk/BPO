import type { Database, PlanTier, SubscriptionStatus, TenantRole, TenantStatus } from "./database";

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantUser = Database["public"]["Tables"]["tenant_users"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type InternalApproval = Database["public"]["Tables"]["internal_approvals"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface TenantContext {
  tenant: Tenant | null;
  role: TenantRole | null;
  subscription: Subscription | null;
  tenants: Array<Pick<Tenant, "id" | "name" | "slug" | "status">>;
  isSuperAdmin: boolean;
  status: TenantStatus | null;
  subscriptionStatus: SubscriptionStatus | null;
  plan: PlanTier | null;
}
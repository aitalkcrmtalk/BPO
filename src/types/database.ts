// Tipos gerados manualmente para o Supabase do Projeto-BPO.
// Reflete o schema definido em supabase/migrations/0001_init.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TenantStatus = "pending" | "approved" | "rejected" | "suspended";
export type TenantRole = "owner" | "admin" | "operator" | "viewer";
export type PlanTier = "free" | "starter" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type DocumentStatus = "pending" | "processing" | "processed" | "error";
export type AppRole = "super_admin";

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          document: string | null;
          segment: string | null;
          size: string | null;
          phone: string | null;
          status: TenantStatus;
          plan: PlanTier;
          onboarded_at: string | null;
          created_at: string;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          document?: string | null;
          segment?: string | null;
          size?: string | null;
          phone?: string | null;
          status?: TenantStatus;
          plan?: PlanTier;
          onboarded_at?: string | null;
          created_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: TenantRole;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: TenantRole;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenant_users"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role_title: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role_title?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          plan: PlanTier;
          status: SubscriptionStatus;
          current_period_end: string | null;
          provider: string | null;
          provider_subscription_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plan?: PlanTier;
          status?: SubscriptionStatus;
          current_period_end?: string | null;
          provider?: string | null;
          provider_subscription_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      internal_approvals: {
        Row: {
          id: string;
          tenant_id: string;
          protocol: string;
          requester_email: string;
          requester_name: string;
          requester_phone: string | null;
          requester_role: string | null;
          status: ApprovalStatus;
          notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          protocol: string;
          requester_email: string;
          requester_name: string;
          requester_phone?: string | null;
          requester_role?: string | null;
          status?: ApprovalStatus;
          notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["internal_approvals"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_id: string | null;
          action: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string | null;
          action: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
    };
    Enums: {
      tenant_status: TenantStatus;
      tenant_role: TenantRole;
      plan_tier: PlanTier;
      subscription_status: SubscriptionStatus;
      approval_status: ApprovalStatus;
      app_role: AppRole;
      document_status: DocumentStatus;
    };
  };
}
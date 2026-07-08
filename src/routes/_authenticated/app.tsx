import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { useTenantContext } from "@/hooks/useTenantContext";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  const { data, isLoading } = useTenantContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !data) return;
    if (!data.tenant && !data.isSuperAdmin) return; // pending, allow limited view
    if (data.tenant && !data.tenant.onboarded_at && window.location.pathname !== "/app/onboarding") {
      navigate({ to: "/app/onboarding" });
    }
  }, [data, isLoading, navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <SubscriptionBanner />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
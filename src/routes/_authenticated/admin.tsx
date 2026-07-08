import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_platform_role", {
      _user_id: data.user.id,
      _role: "super_admin",
    });
    if (!isAdmin) throw redirect({ to: "/app/dashboard" });
  },
  component: () => (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  ),
});
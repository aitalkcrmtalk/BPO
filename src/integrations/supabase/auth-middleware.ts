import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createUserClient } from "./server-user-client";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const authHeader = getRequestHeader("authorization") ?? getRequestHeader("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Response("Unauthorized: No authorization header provided", { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length);
    const supabase = createUserClient(token);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Response("Unauthorized", { status: 401 });
    }
    return next({ context: { supabase, userId: data.user.id, email: data.user.email ?? null } });
  },
);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: "list_admin_ids" | "grant_admin" | "revoke_admin";
  userId?: string;
}

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });
    const service = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify caller is admin
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_admin");
    if (adminCheckError) {
      console.error("Admin check error:", adminCheckError);
      return new Response(JSON.stringify({ error: "auth_failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: RequestBody = await req.json();
    console.log("manage-user-roles action:", body.action);

    if (body.action === "list_admin_ids") {
      const { data, error } = await service
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (error) throw error;
      const adminIds = (data ?? []).map((r: any) => r.user_id);
      return new Response(JSON.stringify({ adminIds }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if ((body.action === "grant_admin" || body.action === "revoke_admin") && (!body.userId || !isUuid(body.userId))) {
      return new Response(JSON.stringify({ error: "invalid_user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.action === "grant_admin") {
      const { error } = await service.from("user_roles").insert({ user_id: body.userId, role: "admin" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.action === "revoke_admin") {
      const { error } = await service
        .from("user_roles")
        .delete()
        .eq("user_id", body.userId!)
        .eq("role", "admin");
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("manage-user-roles error:", err);
    return new Response(JSON.stringify({ error: err.message || "internal_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

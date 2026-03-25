import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing Authorization header");
        }
        const token = authHeader.replace("Bearer ", "");

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Get the authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const userId = user.id;
        console.log(`Starting deletion process for user ${userId}`);

        // 2. Find their organization ID (if they are an owner/employee)
        const { data: profile, error: profileError } = await supabaseAdmin
            .schema("multiclubes")
            .from("perfiles_empleados")
            .select("organizacion_id")
            .eq("user_id", userId)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            // PGRST116 is "Rows not found", which is fine if they don't have a profile yet
            console.error("Error fetching profile:", profileError);
        }

        const organizacionId = profile?.organizacion_id;

        // 3. Delete legacy data in `clubes` schema to avoid RESTRICT errors
        // We do this via the service role to bypass any RLS that might prevent deletion
        console.log("Deleting legacy data in 'clubes' schema...");

        // bookings -> courts -> branches -> (players, products, profiles) all link to user_id
        await supabaseAdmin.schema("clubes").from("bookings").delete().eq("user_id", userId);
        await supabaseAdmin.schema("clubes").from("players").delete().eq("user_id", userId);
        await supabaseAdmin.schema("clubes").from("products").delete().eq("user_id", userId);

        // Branches have a cascade to courts and courts to bookings, delete branches
        await supabaseAdmin.schema("clubes").from("branches").delete().eq("user_id", userId);

        // Profiles
        await supabaseAdmin.schema("clubes").from("profiles").delete().eq("id", userId);


        // 4. Delete the Organization (This cascades to EVERYTHING in multiclubes schema)
        if (organizacionId) {
            console.log(`Deleting organization: ${organizacionId}`);
            const { error: orgError } = await supabaseAdmin
                .schema("multiclubes")
                .from("organizaciones")
                .delete()
                .eq("id", organizacionId);

            if (orgError) {
                console.error("Error deleting organization:", orgError);
                throw new Error("Failed to delete organization data");
            }
            console.log("Organization and cascading data deleted.");
        }

        // 5. Finally, delete the auth user
        console.log("Deleting auth user...");
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
            userId
        );

        if (deleteUserError) {
            console.error("Error deleting auth user:", deleteUserError);
            throw new Error(`Failed to delete user account: ${deleteUserError.message}`);
        }

        console.log(`User ${userId} completely deleted.`);

        return new Response(
            JSON.stringify({ message: "User account and all data deleted successfully" }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("Function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

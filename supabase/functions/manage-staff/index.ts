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
        const { action, email, password, nombre, apellido, targetUserId } = await req.json();

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");
        const token = authHeader.replace("Bearer ", "");

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) {
            console.error("Authentication Error Details:", authError);
            throw new Error("Unauthorized: " + (authError?.message || "User could not be verified"));
        }

        const invokerOrgId = user?.app_metadata?.organizacion_id;
        if (!invokerOrgId) throw new Error("User has no organization ID");

        if (action === "create") {
            if (!email || !password || !nombre || !apellido) {
                throw new Error("Missing required fields for create");
            }

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                app_metadata: { organizacion_id: invokerOrgId }
            });

            if (createError) throw createError;
            const newUserId = newUser.user.id;

            const { error: profileError } = await supabaseAdmin
                .schema('multiclubes')
                .from('perfiles_empleados')
                .insert({
                    user_id: newUserId,
                    organizacion_id: invokerOrgId,
                    nombre,
                    apellido,
                    rol: 'ejecutivo'
                });
            
            if (profileError) {
                console.error("Profile creation error details:", JSON.stringify(profileError));
            }

            return new Response(JSON.stringify({ user: newUser.user }), { 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });

        } else if (action === "delete") {
            if (!targetUserId) throw new Error("Missing targetUserId for delete");
            
            const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
            if (getUserError || !targetUser) throw new Error("Target user not found");
            
            if (targetUser.user.app_metadata?.organizacion_id !== invokerOrgId) {
                throw new Error("Unauthorized to delete this user");
            }

            // Cleanup: remove the user session so the license is freed immediately
            await supabaseAdmin
                .schema('multiclubes')
                .from('user_sessions')
                .delete()
                .eq('user_id', targetUserId);

            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
            if (deleteError) throw deleteError;
            
            return new Response(JSON.stringify({ success: true }), { 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        } else {
            throw new Error("Invalid action");
        }

    } catch (error: any) {
        console.error("Function Error Detail:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

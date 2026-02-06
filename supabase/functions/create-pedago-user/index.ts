import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Create admin client with service role
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Create the pedago user
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: "pedago@test.com",
            password: "Pedago123!",
            email_confirm: true, // Auto-confirm the email
            user_metadata: {
                first_name: "Pédago",
                last_name: "Test",
                role: "pedago",
            },
        });

        if (createError) {
            console.error("Error creating pedago user:", createError);
            return new Response(
                JSON.stringify({ error: createError.message }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Pédago user created successfully:", userData.user?.id);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Pédago account created successfully",
                userId: userData.user?.id
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: unknown) {
        console.error("Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

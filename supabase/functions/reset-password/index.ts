import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, newPassword }: ResetPasswordRequest = await req.json();

    if (!email || !code || !newPassword) {
      throw new Error("Missing required fields: email, code, and newPassword");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the reset code
    const { data: codes, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("type", "password_reset")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError || !codes || codes.length === 0) {
      console.error("Code verification failed:", fetchError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .from("verification_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", codes[0].id);

    // Get user by email using getUserByEmail instead of listUsers (more reliable)
    // First try to find user in profiles table to get user_id
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .ilike("username", email.toLowerCase())
      .maybeSingle();
    
    let userId: string | null = null;
    
    // Try to get user directly by iterating through pages
    let page = 1;
    const perPage = 1000;
    let foundUser = null;
    
    while (!foundUser) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      
      if (userError) {
        console.error("Error listing users:", userError);
        return new Response(
          JSON.stringify({ error: "Invalid or expired reset code" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      foundUser = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (foundUser) break;
      if (userData.users.length < perPage) break; // No more pages
      page++;
      if (page > 10) break; // Safety limit
    }
    
    if (!foundUser) {
      console.log("User not found for email:", email);
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const user = foundUser;

    // Update password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error("Failed to update password");
    }

    console.log("Password reset successful for:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in reset-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json()
    console.log("[v0] reset-password called with:", { email, code: code?.substring(0, 2) + "****", hasPassword: !!newPassword })

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Missing required fields: email, code, and newPassword" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log("[v0] Querying verification_codes for:", { email: normalizedEmail, code, type: "password_reset" })

    // Verify the reset code
    const { data: codes, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", code)
      .eq("type", "password_reset")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)

    console.log("[v0] Query result:", { codesFound: codes?.length || 0, fetchError: fetchError?.message })

    if (fetchError) {
      console.log("[v0] DB fetch error:", JSON.stringify(fetchError))
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    if (!codes || codes.length === 0) {
      console.log("[v0] No matching code found")
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    console.log("[v0] Found valid code, expires_at:", codes[0].expires_at)

    // Query profiles table to get user_id by email
    console.log("[v0] Looking up user_id from profiles table for:", normalizedEmail)
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", normalizedEmail)
      .single()
    
    if (profileError || !profile) {
      console.log("[v0] Profile not found:", profileError)
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    console.log("[v0] Found user_id from profile:", profile.user_id)

    // Update password using admin API
    console.log("[v0] Updating password for user_id:", profile.user_id)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.log("[v0] Password update error:", updateError)
      if (updateError.message.includes("weak") || updateError.message.includes("easy to guess")) {
        return NextResponse.json({
          error: "Password is too weak. Please choose a stronger password."
        }, { status: 400 })
      }
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    console.log("[v0] Password updated successfully")

    // Mark code as used (after successful password update)
    console.log("[v0] Marking code as used")
    await supabaseAdmin
      .from("verification_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", codes[0].id)

    // Invalidate all sessions
    try {
      console.log("[v0] Signing out all sessions for user:", profile.user_id)
      await supabaseAdmin.auth.admin.signOut(profile.user_id, "global")
    } catch (e) {
      console.log("[v0] Session signout failed (non-critical):", e)
    }

    console.log("[v0] Password reset complete")
    return NextResponse.json({ success: true, message: "Password updated successfully. Please log in with your new password." })
  } catch (error: unknown) {
    console.error("Error in reset-password:", error)
    const msg = error instanceof Error ? error.message : "Password reset failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

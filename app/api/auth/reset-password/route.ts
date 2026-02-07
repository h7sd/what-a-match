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

    // Sign in to verify user exists and get user_id
    console.log("[v0] Signing in with provided email and new password (to verify user exists)")
    
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password: newPassword,
    })
    
    // If sign in works, user already has this password - code is being reused
    if (signInData?.user) {
      console.log("[v0] User already has this password or code already used")
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }
    
    // Now try with a dummy password to get the user_id from error
    // Actually, let's use listUsers with pagination to find the user
    console.log("[v0] Fetching users to find user_id for:", normalizedEmail)
    let userId: string | null = null
    let page = 0
    
    while (!userId && page < 20) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: page + 1,
        perPage: 100
      })
      
      if (error) {
        console.log("[v0] listUsers error:", error)
        break
      }
      
      const user = data.users.find(u => u.email?.toLowerCase() === normalizedEmail)
      if (user) {
        userId = user.id
        console.log("[v0] Found user_id:", userId, "on page", page + 1)
        break
      }
      
      if (data.users.length < 100) break
      page++
    }
    
    if (!userId) {
      console.log("[v0] User not found in auth system")
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    // Update password using admin API
    console.log("[v0] Updating password for user_id:", userId)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
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
      console.log("[v0] Signing out all sessions for user:", userId)
      await supabaseAdmin.auth.admin.signOut(userId, "global")
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

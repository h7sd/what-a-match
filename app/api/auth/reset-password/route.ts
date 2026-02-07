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

    // Mark code as used
    console.log("[v0] Marking code as used")
    const { error: updateCodeError } = await supabaseAdmin
      .from("verification_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", codes[0].id)

    if (updateCodeError) {
      console.log("[v0] Error marking code as used:", updateCodeError)
    }

    // Find user by email using getUserByEmail (more efficient)
    console.log("[v0] Looking up user by email:", normalizedEmail)
    
    let foundUser = null
    try {
      // Try direct lookup first - Supabase might support this
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(normalizedEmail)
      
      if (userError) {
        console.log("[v0] getUserByEmail failed, falling back to listUsers:", userError.message)
      } else {
        foundUser = userData.user
        console.log("[v0] Found user via getUserByEmail:", foundUser?.id)
      }
    } catch (e) {
      console.log("[v0] getUserByEmail not available, using listUsers")
    }

    // Fallback to pagination if direct lookup failed
    if (!foundUser) {
      console.log("[v0] Starting user pagination lookup")
      let page = 1
      const perPage = 1000

      while (!foundUser) {
        console.log("[v0] Fetching page", page)
        const { data: pageData, error: pageError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        })

        if (pageError) {
          console.log("[v0] listUsers error:", pageError)
          return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
        }

        console.log("[v0] Page", page, "returned", pageData.users.length, "users")
        foundUser = pageData.users.find(u => u.email?.toLowerCase() === normalizedEmail)

        if (foundUser) {
          console.log("[v0] Found user on page", page)
          break
        }
        if (pageData.users.length < perPage) {
          console.log("[v0] Reached last page")
          break
        }
        page++
        if (page > 10) {
          console.log("[v0] Max pages reached")
          break
        }
      }
    }

    if (!foundUser) {
      console.log("[v0] User not found in auth system")
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    console.log("[v0] Found user, updating password for:", foundUser.id)

    // Update password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      foundUser.id,
      { password: newPassword }
    )

    if (updateError) {
      console.log("[v0] Password update error:", updateError)
      if (updateError.message.includes("weak") || updateError.message.includes("easy to guess")) {
        return NextResponse.json({
          error: "Password is too weak. Please choose a stronger password."
        }, { status: 400 })
      }
      throw new Error("Failed to update password")
    }

    console.log("[v0] Password updated successfully")

    // Invalidate all sessions
    try {
      console.log("[v0] Signing out all sessions")
      await supabaseAdmin.auth.admin.signOut(foundUser.id, "global")
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

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const { userId, username } = await req.json()

    let resolvedUserId = userId

    if (!resolvedUserId && username) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("username", username.toLowerCase())
        .maybeSingle()

      if (profile) {
        resolvedUserId = profile.user_id
      }
    }

    if (!resolvedUserId) {
      return NextResponse.json({ isBanned: false })
    }

    // Use the RPC function if it exists, otherwise check directly
    const { data: banStatus, error: banError } = await supabaseAdmin
      .rpc("check_user_ban_status", { p_user_id: resolvedUserId })

    if (banError) {
      console.error("Error checking ban status:", banError)
      return NextResponse.json({ isBanned: false })
    }

    if (!banStatus || banStatus.length === 0 || !banStatus[0].is_banned) {
      return NextResponse.json({ isBanned: false })
    }

    return NextResponse.json({
      isBanned: true,
      canAppeal: banStatus[0].can_appeal,
    })
  } catch (error: unknown) {
    console.error("Error checking ban status:", error)
    return NextResponse.json({ isBanned: false })
  }
}

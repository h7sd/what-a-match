import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const body = await req.json()
    const { action, factorId, code } = body

    if (action !== "challenge" && action !== "verify") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (!factorId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Ensure factor belongs to user and is verified
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError || !factorsData) {
      return NextResponse.json({ error: "Failed to list factors" }, { status: 400 })
    }

    const userFactor = factorsData.totp.find((f) => f.id === factorId && f.status === "verified")
    if (!userFactor) {
      return NextResponse.json({ error: "Invalid factor" }, { status: 400 })
    }

    if (action === "challenge") {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeError || !challengeData?.id) {
        return NextResponse.json({ error: "Failed to create challenge" }, { status: 400 })
      }
      return NextResponse.json({ challengeId: challengeData.id })
    }

    // verify
    if (!/^\d{6}$/.test(code?.trim() || "")) {
      return NextResponse.json({ error: "Invalid code format" }, { status: 400 })
    }

    // Fresh challenge per verification
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError || !challengeData?.id) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 })
    }

    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: code.trim(),
    })

    if (verifyError) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      access_token: verifyData?.session?.access_token,
      refresh_token: verifyData?.session?.refresh_token,
    })
  } catch (error: unknown) {
    console.error("MFA verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}

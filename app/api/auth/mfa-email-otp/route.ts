import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase-admin"

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

function generateSecureCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(array[0] % 1_000_000).padStart(6, "0")
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@")
  if (!domain) return "***"
  return localPart.length > 2 ? `${localPart.slice(0, 2)}***@${domain}` : `***@${domain}`
}

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

    const userEmail = (userData.user.email || "").toLowerCase().trim()
    if (!userEmail) {
      return NextResponse.json({ error: "No email associated with account" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { action, code } = body

    if (action !== "send" && action !== "verify") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (action === "send") {
      const otpCode = generateSecureCode()
      const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString()

      const { error: insertError } = await supabaseAdmin.from("verification_codes").insert({
        email: userEmail,
        code: otpCode,
        type: "mfa_email",
        expires_at: expiresAt,
      })

      if (insertError) {
        console.error("Failed to insert MFA email code:", insertError)
        return NextResponse.json({ error: "Failed to create code" }, { status: 500 })
      }

      const maskedEmail = maskEmail(userEmail)

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "UserVault Security <noreply@uservault.cc>",
          to: [userEmail],
          subject: "Your Login Verification Code",
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr><td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#111;border-radius:16px;border:1px solid #222;overflow:hidden;">
                    <tr><td align="center" style="padding:36px 40px 18px;">
                      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Login Verification Code</h1>
                    </td></tr>
                    <tr><td style="padding:0 40px 24px;">
                      <p style="color:#a0a0a0;font-size:15px;line-height:1.6;margin:0 0 18px;text-align:center;">
                        Use this code to complete your login. It expires in 10 minutes.
                      </p>
                      <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:22px;text-align:center;margin-bottom:18px;">
                        <span style="color:#00D9A5;font-size:34px;font-weight:800;letter-spacing:8px;font-family:monospace;">${otpCode}</span>
                      </div>
                      <p style="color:#666;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                        If you didn't request this code, you can ignore this email.
                      </p>
                    </td></tr>
                    <tr><td style="padding:18px 40px;border-top:1px solid #222;">
                      <p style="color:#444;font-size:12px;margin:0;text-align:center;">UserVault Security</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
          `,
        }),
      })

      if (!emailRes.ok) {
        const errorText = await emailRes.text()
        console.error("Email send error:", errorText)
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
      }

      return NextResponse.json({ success: true, maskedEmail, expiresIn: CODE_EXPIRY_MS / 1000 })
    }

    // verify
    if (!/^\d{6}$/.test(code?.trim() || "")) {
      return NextResponse.json({ error: "Invalid code format" }, { status: 400 })
    }

    const { data: codes, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", userEmail)
      .eq("code", code.trim())
      .eq("type", "mfa_email")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)

    if (fetchError || !codes || codes.length === 0) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    await supabaseAdmin
      .from("verification_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", codes[0].id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("MFA email OTP error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

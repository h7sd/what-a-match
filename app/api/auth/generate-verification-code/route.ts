import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const RESEND_API_KEY = process.env.RESEND_API_KEY!

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendSignupEmail(to: string, code: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "UserVault <noreply@uservault.cc>",
      to: [to],
      subject: "Verify Your Email - UserVault",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">
                <tr><td align="center" style="padding-bottom:30px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                    <tr><td align="center" style="width:60px;height:60px;background:linear-gradient(135deg,#8b5cf6,#a855f7);border-radius:16px;">
                      <span style="color:white;font-weight:bold;font-size:24px;line-height:60px;">UV</span>
                    </td></tr>
                  </table>
                  <h1 style="color:#ffffff;margin:20px 0 0 0;font-size:28px;font-weight:700;text-align:center;">UserVault</h1>
                </td></tr>
                <tr><td style="background:linear-gradient(180deg,rgba(139,92,246,0.1) 0%,rgba(0,0,0,0.8) 100%);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:40px;">
                  <h2 style="color:#ffffff;margin:0 0 16px 0;font-size:22px;text-align:center;">Verify Your Email</h2>
                  <p style="color:#a1a1aa;margin:0 0 30px 0;font-size:16px;line-height:1.6;text-align:center;">Enter this code to complete your signup:</p>
                  <div style="text-align:center;margin-bottom:30px;">
                    <span style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#a855f7);color:white;padding:16px 40px;border-radius:12px;font-weight:700;font-size:32px;letter-spacing:8px;">${code}</span>
                  </div>
                  <p style="color:#71717a;margin:0;font-size:14px;text-align:center;">This code expires in <strong style="color:#a1a1aa;">15 minutes</strong>.</p>
                </td></tr>
                <tr><td style="padding-top:30px;text-align:center;">
                  <p style="color:#52525b;font-size:12px;margin:0;">If you didn't request this email, you can safely ignore it.</p>
                  <p style="color:#3f3f46;font-size:11px;margin:16px 0 0 0;">&copy; ${new Date().getFullYear()} UserVault. All rights reserved.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Resend API error: ${res.status} - ${errorText}`)
  }
  return res.json()
}

async function sendPasswordResetEmail(to: string, code: string, resetUrl: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "UserVault <noreply@uservault.cc>",
      to: [to],
      subject: "Reset Your Password - UserVault",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">
                <tr><td align="center" style="padding-bottom:30px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                    <tr><td align="center" style="width:60px;height:60px;background:linear-gradient(135deg,#8b5cf6,#a855f7);border-radius:16px;">
                      <span style="color:white;font-weight:bold;font-size:24px;line-height:60px;">UV</span>
                    </td></tr>
                  </table>
                  <h1 style="color:#ffffff;margin:20px 0 0 0;font-size:28px;font-weight:700;text-align:center;">UserVault</h1>
                </td></tr>
                <tr><td style="background:linear-gradient(180deg,rgba(139,92,246,0.1) 0%,rgba(0,0,0,0.8) 100%);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:40px;">
                  <h2 style="color:#ffffff;margin:0 0 16px 0;font-size:22px;text-align:center;">Reset Your Password</h2>
                  <p style="color:#a1a1aa;margin:0 0 30px 0;font-size:16px;line-height:1.6;text-align:center;">Click the button below to reset your password:</p>
                  <div style="text-align:center;margin-bottom:30px;">
                    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#a855f7);color:white;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:600;font-size:16px;">Reset Password</a>
                  </div>
                  <p style="color:#71717a;margin:0 0 20px 0;font-size:14px;text-align:center;">This link is valid for <strong style="color:#a1a1aa;">1 hour</strong>.</p>
                  <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
                    <p style="color:#52525b;font-size:12px;margin:0;text-align:center;">If the button doesn't work, copy this link:<br><a href="${resetUrl}" style="color:#8b5cf6;word-break:break-all;">${resetUrl}</a></p>
                  </div>
                </td></tr>
                <tr><td style="padding-top:30px;text-align:center;">
                  <p style="color:#52525b;font-size:12px;margin:0;">If you didn't request this email, you can safely ignore it.</p>
                  <p style="color:#3f3f46;font-size:11px;margin:16px 0 0 0;">&copy; ${new Date().getFullYear()} UserVault. All rights reserved.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Resend API error: ${res.status} - ${errorText}`)
  }
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json()

    if (!email || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (type !== "signup" && type !== "password_reset") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const code = generateCode()
    const expiresAt = type === "signup"
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
      : new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Insert verification code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        email: normalizedEmail,
        code,
        type,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error("Error inserting verification code:", insertError)
      return NextResponse.json({ error: "Failed to create verification code" }, { status: 500 })
    }

    // Send email
    if (type === "signup") {
      await sendSignupEmail(normalizedEmail, code)
    } else {
      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "https://uservault.cc"
      const resetUrl = `${origin}/auth?type=recovery&email=${encodeURIComponent(normalizedEmail)}&code=${code}`
      await sendPasswordResetEmail(normalizedEmail, code, resetUrl)
    }

    return NextResponse.json({ success: true, message: "Verification code sent" })
  } catch (error: unknown) {
    console.error("Error in generate-verification-code:", error)
    const msg = error instanceof Error ? error.message : "Failed to send verification code"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { action, redirect_uri, frontend_origin } = await req.json()

    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID

    if (!DISCORD_CLIENT_ID) {
      return NextResponse.json({ error: "Discord Client ID not configured" }, { status: 500 })
    }

    if (action === "get_auth_url") {
      const stateData = {
        nonce: crypto.randomUUID(),
        origin: frontend_origin || "https://uservault.cc",
      }
      const state = Buffer.from(JSON.stringify(stateData)).toString("base64")
      const scope = "identify email guilds"

      const authUrl = new URL("https://discord.com/api/oauth2/authorize")
      authUrl.searchParams.set("client_id", DISCORD_CLIENT_ID)
      authUrl.searchParams.set("redirect_uri", redirect_uri)
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("scope", scope)
      authUrl.searchParams.set("state", state)
      authUrl.searchParams.set("prompt", "consent")

      return NextResponse.json({ url: authUrl.toString(), state })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: unknown) {
    console.error("Discord OAuth error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

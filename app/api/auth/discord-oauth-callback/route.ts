import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  email: string | null
  verified: boolean
  global_name: string | null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, state, redirect_uri, mode = "login", user_id } = body

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 })
    }

    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return NextResponse.json({ error: "Discord credentials not configured" }, { status: 500 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect_uri || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/discord-oauth-callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", errorText)
      return NextResponse.json({ error: "Failed to exchange authorization code" }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get Discord user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch Discord user info" }, { status: 400 })
    }

    const discordUser: DiscordUser = await userResponse.json()

    if (!discordUser.email) {
      return NextResponse.json({ error: "Discord account does not have an email" }, { status: 400 })
    }

    if (mode === "link" && user_id) {
      // Link mode
      const { data: existingLink } = await supabaseAdmin
        .from("discord_integrations")
        .select("user_id")
        .eq("discord_id", discordUser.id)
        .single()

      if (existingLink && existingLink.user_id !== user_id) {
        return NextResponse.json({ error: "This Discord account is already linked to another user" }, { status: 400 })
      }

      await supabaseAdmin
        .from("discord_integrations")
        .upsert({
          user_id,
          discord_id: discordUser.id,
          username: discordUser.global_name || discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          show_on_profile: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })

      await supabaseAdmin
        .from("profiles")
        .update({ discord_user_id: discordUser.id })
        .eq("user_id", user_id)

      return NextResponse.json({
        success: true,
        discord_user: {
          id: discordUser.id,
          username: discordUser.global_name || discordUser.username,
          avatar: discordUser.avatar,
        },
      })
    }

    // Login/Register mode
    const { data: existingUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (listUsersError) {
      return NextResponse.json({ error: "Failed to look up existing users" }, { status: 500 })
    }

    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === discordUser.email?.toLowerCase())

    let userId: string
    let isNewUser = false

    if (existingUser) {
      userId = existingUser.id

      await supabaseAdmin
        .from("discord_integrations")
        .upsert({
          user_id: userId,
          discord_id: discordUser.id,
          username: discordUser.global_name || discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          show_on_profile: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })

      await supabaseAdmin
        .from("profiles")
        .update({ discord_user_id: discordUser.id, use_discord_avatar: true })
        .eq("user_id", userId)
    } else {
      isNewUser = true

      let username = (discordUser.global_name || discordUser.username).toLowerCase().replace(/[^a-z0-9]/g, "")
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("username")
        .ilike("username", username)
        .single()

      if (existingProfile) {
        username = `${username}${Math.floor(Math.random() * 9999)}`
      }

      const randomPassword = crypto.randomUUID() + crypto.randomUUID()
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: discordUser.email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          discord_id: discordUser.id,
          discord_username: discordUser.global_name || discordUser.username,
          avatar_url: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
        },
      })

      if (createError || !newUser.user) {
        console.error("Create user error:", createError)
        return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
      }

      userId = newUser.user.id

      await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          username,
          display_name: discordUser.global_name || discordUser.username,
          discord_user_id: discordUser.id,
          use_discord_avatar: true,
          email_verified: true,
        })

      await supabaseAdmin
        .from("discord_integrations")
        .insert({
          user_id: userId,
          discord_id: discordUser.id,
          username: discordUser.global_name || discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          show_on_profile: true,
        })
    }

    // Generate a magic link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: discordUser.email,
    })

    if (linkError || !linkData) {
      console.error("Magic link error:", linkError)
      return NextResponse.json({ error: "Failed to generate login link" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      is_new_user: isNewUser,
      email: discordUser.email,
      action_link: linkData.properties.action_link,
      discord_user: {
        id: discordUser.id,
        username: discordUser.global_name || discordUser.username,
        avatar: discordUser.avatar,
      },
    })
  } catch (error: unknown) {
    console.error("Discord OAuth callback error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

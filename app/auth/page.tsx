"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase, getSupabaseFunctionsUrl } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, Shield } from "lucide-react"

type AuthView =
  | "login"
  | "signup"
  | "verify-email"
  | "forgot-password"
  | "reset-password"
  | "mfa-totp"
  | "mfa-email"
  | "banned"

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background mesh-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AuthPage />
    </Suspense>
  )
}

function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState<AuthView>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [mfaCode, setMfaCode] = useState("")
  const [mfaFactorId, setMfaFactorId] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // Pending session for MFA flow
  const [pendingSession, setPendingSession] = useState<{
    accessToken: string
    refreshToken: string
  } | null>(null)

  const functionsUrl = getSupabaseFunctionsUrl()

  // Handle Discord OAuth callback
  const handleDiscordCallback = useCallback(async (code: string, state: string) => {
    setLoading(true)
    setError("")
    try {
      const redirectUri = `${functionsUrl}/discord-oauth-callback`
      const res = await fetch(`${functionsUrl}/discord-oauth-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state, redirect_uri: redirectUri, mode: "login" }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Discord login failed")
      }
      if (data.action_link) {
        // Use the magic link to sign in
        const url = new URL(data.action_link)
        const tokenHash = url.searchParams.get("token") || url.hash?.split("token=")[1]?.split("&")[0]
        if (tokenHash) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "magiclink",
          })
          if (verifyErr) throw verifyErr
        }
        router.push("/dashboard")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Discord login failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [functionsUrl, router])

  // Handle URL params on mount
  useEffect(() => {
    const discordCode = searchParams.get("discord_code")
    const discordState = searchParams.get("discord_state")
    const errorParam = searchParams.get("error")
    const type = searchParams.get("type")
    const emailParam = searchParams.get("email")
    const codeParam = searchParams.get("code")

    if (errorParam) {
      setError(errorParam)
    }

    if (discordCode && discordState) {
      handleDiscordCallback(discordCode, discordState)
      return
    }

    if (type === "recovery" && emailParam) {
      setView("reset-password")
      setEmail(emailParam)
      if (codeParam) setVerificationCode(codeParam)
    }

    if (type === "signup_confirmed") {
      setMessage("Email verified! You can now sign in.")
      setView("login")
    }

    // Handle Supabase native recovery flow (hash-based tokens)
    const hash = window.location.hash
    if (hash && hash.includes("type=recovery")) {
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setView("reset-password")
          if (emailParam) setEmail(emailParam)
        }
      })
    }
  }, [searchParams, handleDiscordCallback])

  // Login with email/password
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Check ban status first
      const banRes = await fetch(`${functionsUrl}/check-ban-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null, username: email }),
      })
      const banData = await banRes.json()
      if (banData.isBanned) {
        setView("banned")
        setLoading(false)
        return
      }

      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInErr) throw signInErr

      // Check if MFA is required
      if (data.session) {
        const { data: factorsData } = await supabase.auth.mfa.listFactors()
        const totpFactors = factorsData?.totp?.filter((f) => f.status === "verified") || []

        if (totpFactors.length > 0) {
          // MFA required - store session tokens and show MFA view
          setPendingSession({
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          })
          setMfaFactorId(totpFactors[0].id)
          setView("mfa-totp")
          setLoading(false)
          return
        }

        // No MFA, check for email-based MFA
        const { data: profile } = await supabase
          .from("profiles")
          .select("mfa_email_enabled")
          .eq("user_id", data.user?.id)
          .single()

        if (profile?.mfa_email_enabled) {
          setPendingSession({
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          })
          // Send email OTP
          await fetch(`${functionsUrl}/mfa-email-otp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({ action: "send" }),
          })
          setView("mfa-email")
          setLoading(false)
          return
        }
      }

      router.push("/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Signup with email/password
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters")
      setLoading(false)
      return
    }

    try {
      let useEdgeFunction = false

      // Try Edge Function first (custom verification code flow)
      try {
        const res = await fetch(`${functionsUrl}/generate-verification-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            type: "signup",
          }),
        })
        const data = await res.json()
        if (res.ok && !data.error) {
          useEdgeFunction = true
          setMessage("A verification code has been sent to your email.")
          setView("verify-email")
        }
      } catch {
        // Edge Function not available, continue with native flow
      }

      // Fallback: Use Supabase native signup (sends confirmation email automatically)
      if (!useEdgeFunction) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              username: username.trim().toLowerCase(),
              display_name: username.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth?type=signup_confirmed`,
          },
        })

        if (signUpErr) throw signUpErr

        if (signUpData.user && !signUpData.user.identities?.length) {
          throw new Error("An account with this email already exists")
        }

        // If the user is auto-confirmed (no email confirmation required), create profile and redirect
        if (signUpData.session) {
          await supabase.from("profiles").upsert({
            user_id: signUpData.user!.id,
            username: username.trim().toLowerCase(),
            display_name: username.trim(),
            email_verified: true,
          })
          router.push("/dashboard")
          return
        }

        // Otherwise, show message that confirmation email was sent
        setMessage("A confirmation email has been sent. Please check your inbox and click the link to verify your account.")
        setView("verify-email")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Verify email code and complete signup (Edge Function flow)
  async function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (verificationCode) {
        // Edge Function code verification flow
        const verifyRes = await fetch(`${functionsUrl}/verify-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: verificationCode,
            type: "signup",
          }),
        })

        const verifyData = await verifyRes.json()
        if (!verifyRes.ok || verifyData.error) {
          throw new Error(verifyData.error || "Invalid verification code")
        }

        // Code verified, now create the actual account
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              username: username.trim().toLowerCase(),
              display_name: username.trim(),
            },
          },
        })

        if (signUpErr) throw signUpErr

        if (signUpData.user) {
          await supabase.from("profiles").upsert({
            user_id: signUpData.user.id,
            username: username.trim().toLowerCase(),
            display_name: username.trim(),
            email_verified: true,
          })

          const { error: loginErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          })

          if (loginErr) throw loginErr
          router.push("/dashboard")
        }
      } else {
        // Native Supabase flow: user clicked email link, just try to sign in
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })
        if (loginErr) throw loginErr
        router.push("/dashboard")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Forgot password - send reset email
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let sent = false

      // Try the custom Edge Function first (uses Resend + verification_codes table)
      try {
        const res = await fetch(`${functionsUrl}/generate-verification-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            type: "password_reset",
          }),
        })
        const data = await res.json()
        if (res.ok && !data.error) {
          sent = true
          setMessage("A reset code has been sent to your email. Enter it below.")
          setView("reset-password")
        }
      } catch {
        // Edge Function not available
      }

      // Fallback: Use Supabase native password reset
      if (!sent) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/auth?type=recovery&email=${encodeURIComponent(email.trim().toLowerCase())}` }
        )
        if (resetErr) throw resetErr
        setMessage("A password reset link has been sent to your email. Check your inbox.")
        setView("reset-password")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Reset password with code or native recovery
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      if (verificationCode) {
        // Edge Function flow: verify code + reset password via admin API
        const res = await fetch(`${functionsUrl}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: verificationCode,
            newPassword,
          }),
        })

        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || "Password reset failed")
        }
      } else {
        // Supabase native flow: user clicked recovery link, session is active
        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        })
        if (updateErr) throw updateErr
      }

      setMessage("Password updated! You can now log in.")
      setView("login")
      setPassword("")
      setNewPassword("")
      setVerificationCode("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Verify TOTP MFA
  async function handleMfaTotp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!pendingSession) throw new Error("No pending session")

      const res = await fetch(`${functionsUrl}/mfa-verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pendingSession.accessToken}`,
        },
        body: JSON.stringify({
          action: "verify",
          factorId: mfaFactorId,
          code: mfaCode,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "MFA verification failed")
      }

      // Update session with AAL2 tokens if returned
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
      }

      router.push("/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "MFA verification failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Verify Email MFA
  async function handleMfaEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!pendingSession) throw new Error("No pending session")

      const res = await fetch(`${functionsUrl}/mfa-email-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pendingSession.accessToken}`,
        },
        body: JSON.stringify({ action: "verify", code: mfaCode }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Verification failed")
      }

      router.push("/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Discord OAuth login
  async function handleDiscordLogin() {
    setLoading(true)
    setError("")

    try {
      const frontendOrigin = window.location.origin
      const redirectUri = `${functionsUrl}/discord-oauth-callback`

      const res = await fetch(`${functionsUrl}/discord-oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_auth_url",
          redirect_uri: redirectUri,
          frontend_origin: frontendOrigin,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to start Discord login")
      }

      window.location.href = data.url
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Discord login failed"
      setError(msg)
      setLoading(false)
    }
  }

  function resetForm() {
    setError("")
    setMessage("")
    setVerificationCode("")
    setMfaCode("")
    setNewPassword("")
  }

  return (
    <div className="min-h-screen bg-background mesh-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card border-border/50">
        {/* Login */}
        {view === "login" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold gradient-text">Welcome Back</CardTitle>
              <CardDescription>Sign in to What A Match</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}
                {message && <div className="text-sm text-primary bg-primary/10 rounded-lg p-3">{message}</div>}

                <div className="flex flex-col gap-2">
                  <label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full h-10 rounded-lg border border-input bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                      className="w-full h-10 rounded-lg border border-input bg-secondary/50 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { resetForm(); setView("forgot-password") }}
                  className="text-xs text-muted-foreground hover:text-primary self-end transition-colors"
                >
                  Forgot password?
                </button>

                <Button type="submit" className="w-full glow-sm" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-card px-3 text-xs text-muted-foreground">or</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDiscordLogin}
                  disabled={loading}
                >
                  <DiscordIcon />
                  Continue with Discord
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {"Don't have an account? "}
                  <button
                    type="button"
                    onClick={() => { resetForm(); setView("signup") }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </CardContent>
          </>
        )}

        {/* Signup */}
        {view === "signup" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold gradient-text">Create Account</CardTitle>
              <CardDescription>Join What A Match today</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}

                <div className="flex flex-col gap-2">
                  <label htmlFor="signup-username" className="text-sm font-medium text-foreground">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      required
                      minLength={3}
                      className="w-full h-10 rounded-lg border border-input bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="signup-email" className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full h-10 rounded-lg border border-input bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="signup-password" className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="w-full h-10 rounded-lg border border-input bg-secondary/50 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="signup-confirm" className="text-sm font-medium text-foreground">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="signup-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="w-full h-10 rounded-lg border border-input bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full glow-sm" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-card px-3 text-xs text-muted-foreground">or</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDiscordLogin}
                  disabled={loading}
                >
                  <DiscordIcon />
                  Continue with Discord
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { resetForm(); setView("login") }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </CardContent>
          </>
        )}

        {/* Verify Email */}
        {view === "verify-email" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold gradient-text">Verify Email</CardTitle>
              <CardDescription>
                {message?.includes("confirmation email")
                  ? "Check your inbox and click the confirmation link"
                  : `Enter the 6-digit code sent to ${email}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}
                {message && <div className="text-sm text-primary bg-primary/10 rounded-lg p-3">{message}</div>}

                {/* Only show code input if we're using Edge Function flow */}
                {!message?.includes("confirmation email") && (
                  <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="verify-code" className="text-sm font-medium text-foreground">Verification Code</label>
                      <input
                        id="verify-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        required
                        className="w-full h-12 rounded-lg border border-input bg-secondary/50 px-4 text-center text-xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <Button type="submit" className="w-full glow-sm" disabled={loading || verificationCode.length !== 6}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Create Account"}
                    </Button>
                  </form>
                )}

                {/* For native flow, show a "try to login" button */}
                {message?.includes("confirmation email") && (
                  <Button
                    className="w-full glow-sm"
                    onClick={() => { resetForm(); setView("login") }}
                  >
                    Go to Login
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => { resetForm(); setView("signup") }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to signup
                </button>
              </div>
            </CardContent>
          </>
        )}

        {/* Forgot Password */}
        {view === "forgot-password" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold gradient-text">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}

                <div className="flex flex-col gap-2">
                  <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full h-10 rounded-lg border border-input bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full glow-sm" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Email"}
                </Button>

                <button
                  type="button"
                  onClick={() => { resetForm(); setView("login") }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>
              </form>
            </CardContent>
          </>
        )}

        {/* Reset Password (with code) */}
        {view === "reset-password" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold gradient-text">New Password</CardTitle>
              <CardDescription>Enter your new password{verificationCode ? " and the code from your email" : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}
                {message && <div className="text-sm text-primary bg-primary/10 rounded-lg p-3">{message}</div>}

                <div className="flex flex-col gap-2">
                  <label htmlFor="reset-code" className="text-sm font-medium text-foreground">Reset Code (from email)</label>
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full h-12 rounded-lg border border-input bg-secondary/50 px-4 text-center text-xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-foreground">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="w-full h-10 rounded-lg border border-input bg-secondary/50 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full glow-sm" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                </Button>

                <button
                  type="button"
                  onClick={() => { resetForm(); setView("login") }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>
              </form>
            </CardContent>
          </>
        )}

        {/* MFA TOTP */}
        {view === "mfa-totp" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold gradient-text">Two-Factor Auth</CardTitle>
              <CardDescription>Enter the code from your authenticator app</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMfaTotp} className="flex flex-col gap-4">
                {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}

                <div className="flex flex-col gap-2">
                  <label htmlFor="mfa-totp-code" className="text-sm font-medium text-foreground">TOTP Code</label>
                  <input
                    id="mfa-totp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    autoFocus
                    className="w-full h-12 rounded-lg border border-input bg-secondary/50 px-4 text-center text-xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <Button type="submit" className="w-full glow-sm" disabled={loading || mfaCode.length !== 6}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setPendingSession(null)
                    setView("login")
                  }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>
              </form>
            </CardContent>
          </>
        )}

        {/* MFA Email */}
        {view === "mfa-email" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold gradient-text">Email Verification</CardTitle>
              <CardDescription>A code has been sent to your email</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMfaEmail} className="flex flex-col gap-4">
                {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}

                <div className="flex flex-col gap-2">
                  <label htmlFor="mfa-email-code" className="text-sm font-medium text-foreground">Email Code</label>
                  <input
                    id="mfa-email-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    autoFocus
                    className="w-full h-12 rounded-lg border border-input bg-secondary/50 px-4 text-center text-xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <Button type="submit" className="w-full glow-sm" disabled={loading || mfaCode.length !== 6}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!pendingSession) return
                    setLoading(true)
                    try {
                      await fetch(`${functionsUrl}/mfa-email-otp`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${pendingSession.accessToken}`,
                        },
                        body: JSON.stringify({ action: "send" }),
                      })
                      setMessage("A new code has been sent to your email.")
                    } catch {
                      setError("Failed to resend code")
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={loading}
                >
                  Resend code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setPendingSession(null)
                    setView("login")
                  }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>
              </form>
            </CardContent>
          </>
        )}

        {/* Banned */}
        {view === "banned" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-destructive">Account Banned</CardTitle>
              <CardDescription>Your account has been suspended</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 items-center">
              <p className="text-sm text-muted-foreground text-center">
                Your account has been banned. If you believe this is a mistake, please contact support.
              </p>
              <Button
                variant="outline"
                onClick={() => { resetForm(); setView("login") }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}

function DiscordIcon() {
  return (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  )
}

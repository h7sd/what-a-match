"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, ArrowRight, Eye, Users, Gem, Sparkles } from "lucide-react"

function StatCard({
  value,
  label,
  icon: Icon,
  suffix = "+",
}: {
  value: string
  label: string
  icon: React.ElementType
  suffix?: string
}) {
  return (
    <div className="flex-1 min-w-[160px] group">
      <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-6 transition-all duration-500 hover:border-primary/30 hover:bg-card/70">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-3xl md:text-4xl font-bold text-foreground">
              {value}{suffix}
            </p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">{label}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ClaimSection() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setUsername(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 1) {
      setStatus("idle")
      return
    }

    setStatus("checking")
    debounceRef.current = setTimeout(() => {
      // For now just simulate a check - will be connected to Supabase later
      setStatus(value.length >= 3 ? "available" : "taken")
    }, 600)
  }, [])

  const handleClaim = () => {
    if (username.length >= 1) {
      router.push(`/auth?claim=${username}`)
    }
  }

  return (
    <section className="py-32 px-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Join the community</span>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight text-balance">
          Over <span className="gradient-text">1,200+</span> people use UserVault
        </h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty">
          Create feature-rich, customizable and modern link-in-bio pages with UserVault.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <StatCard value="50K" label="Profile Views" icon={Eye} />
          <StatCard value="1,200" label="Active Users" icon={Users} />
          <StatCard value="99.9" label="Uptime" icon={Gem} suffix="%" />
        </div>

        <div className="max-w-lg mx-auto">
          <p className="text-lg font-medium text-foreground mb-6">Claim your username now</p>

          <div className="relative">
            <div className="flex items-center gap-0 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-2 transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/10">
              <div className="flex items-center bg-secondary/50 rounded-xl px-5 py-4 flex-1">
                <span className="text-muted-foreground text-sm font-medium mr-1">
                  uservault.cc/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={handleChange}
                  placeholder="yourname"
                  maxLength={20}
                  className="bg-transparent border-none outline-none text-foreground flex-1 min-w-0 font-medium"
                />
                <div className="ml-3">
                  {status === "checking" && (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  )}
                  {status === "available" && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                  {status === "taken" && (
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                      <X className="w-4 h-4 text-destructive" />
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleClaim}
                disabled={username.length < 1}
                className="ml-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 group"
              >
                <span>Claim</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {status !== "idle" && (
              <div className="mt-4 text-sm font-medium">
                {status === "available" && (
                  <span className="text-emerald-500">This username is available!</span>
                )}
                {status === "taken" && (
                  <span className="text-destructive">This username is already taken</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

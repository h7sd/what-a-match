"use client"

import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-10 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-sm font-medium text-primary">Now with Discord Integration</span>
        </div>

        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] text-balance">
            <span className="text-foreground">Your digital </span>
            <span className="gradient-text">identity.</span>
          </h1>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed text-pretty">
          Create stunning bio pages with live Discord status, immersive effects,
          and seamless social connections. All in one link.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/auth"
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-accent via-primary to-accent text-primary-foreground font-semibold text-lg transition-all hover:shadow-2xl hover:shadow-primary/30 overflow-hidden border border-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10">Start for Free</span>
            <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
          </Link>

          <Link
            href="/uservault"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl border border-primary/30 hover:border-primary/60 text-foreground font-semibold text-lg transition-all hover:bg-primary/5 backdrop-blur-sm bg-foreground/[0.02] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-5 h-5 text-primary" />
            <span>View Demo</span>
          </Link>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex -space-x-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center text-xs font-bold text-primary"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">1,200+</span>{" "}
            creators already joined
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}

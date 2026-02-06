"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Sparkles } from "lucide-react"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/premium" },
  { label: "Discord", href: "https://discord.gg/uservault", external: true },
  { label: "Status", href: "/status" },
  { label: "Market", href: "/marketplace", icon: ShoppingBag },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "py-3" : "py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`flex items-center justify-between px-8 py-4 transition-all duration-500 ${
              isScrolled
                ? "bg-background/80 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20"
                : "bg-transparent"
            }`}
          >
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">UV</span>
              </div>
              <span className="text-foreground font-bold text-lg tracking-tight">
                User<span className="text-primary">Vault</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 bg-secondary/50 backdrop-blur-sm rounded-full px-2 py-1.5">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full transition-all duration-300 inline-flex items-center gap-2"
                  >
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </a>
                ) : link.href.startsWith("#") ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full transition-all duration-300 inline-flex items-center gap-2"
                  >
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full transition-all duration-300 inline-flex items-center gap-2"
                  >
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/auth"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 font-medium hover:bg-foreground/5 rounded-lg"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth"
                  className="relative text-sm px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent to-primary text-primary-foreground font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 overflow-hidden group border border-foreground/10"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </div>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[80px] z-40 md:hidden px-6">
          <div className="bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl p-6 flex flex-col gap-2 shadow-2xl">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground py-3 px-4 rounded-xl hover:bg-foreground/5 transition-colors font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-foreground py-3 px-4 rounded-xl hover:bg-foreground/5 transition-colors font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-4 mt-2 border-t border-border/50 flex flex-col gap-3">
              <Link
                href="/auth"
                className="text-center py-3 text-foreground font-medium hover:bg-foreground/5 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="text-center py-3.5 rounded-xl bg-gradient-to-r from-accent to-primary text-primary-foreground font-semibold border border-foreground/10"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

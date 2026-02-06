"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LayoutDashboard,
  User,
  Palette,
  LinkIcon,
  Award,
  ShoppingBag,
  Settings,
  LogOut,
  Eye,
  Users,
  TrendingUp,
  Save,
  Menu,
  X,
} from "lucide-react"

type TabType =
  | "overview"
  | "profile"
  | "appearance"
  | "links"
  | "badges"
  | "marketplace"
  | "settings"

const navItems: { icon: React.ElementType; label: string; tab: TabType }[] = [
  { icon: LayoutDashboard, label: "Overview", tab: "overview" },
  { icon: User, label: "Profile", tab: "profile" },
  { icon: Palette, label: "Appearance", tab: "appearance" },
  { icon: LinkIcon, label: "Links", tab: "links" },
  { icon: Award, label: "Badges", tab: "badges" },
  { icon: ShoppingBag, label: "Marketplace", tab: "marketplace" },
  { icon: Settings, label: "Settings", tab: "settings" },
]

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="glass-card p-6 group hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
        <p className="text-muted-foreground">Here is your profile overview and stats.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Profile Views" value="2,847" />
        <StatCard icon={Users} label="Link Clicks" value="1,203" />
        <StatCard icon={TrendingUp} label="This Week" value="+12%" />
        <StatCard icon={Award} label="Badges" value="8" />
      </div>

      <div className="glass-card p-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-border/50">
            <Eye className="w-4 h-4 mr-2" />
            View Profile
          </Button>
          <Button variant="outline" className="border-border/50">
            <LinkIcon className="w-4 h-4 mr-2" />
            Add Link
          </Button>
          <Button variant="outline" className="border-border/50">
            <Palette className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProfileTab() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Profile</h2>
        <p className="text-muted-foreground">Manage your public profile information.</p>
      </div>

      <div className="glass-card p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Display Name</Label>
          <Input placeholder="Your display name" className="bg-secondary/50 border-border/50" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Username</Label>
          <Input placeholder="yourname" className="bg-secondary/50 border-border/50" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">Bio</Label>
          <textarea
            placeholder="Tell the world about yourself..."
            rows={4}
            className="flex w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
        <Button className="self-start glow-sm">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="glass-card p-12 flex items-center justify-center">
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />
      case "profile":
        return <ProfileTab />
      case "appearance":
        return (
          <PlaceholderTab
            title="Appearance"
            description="Customize colors, fonts, layouts, and effects."
          />
        )
      case "links":
        return (
          <PlaceholderTab title="Links" description="Manage your social links and connections." />
        )
      case "badges":
        return (
          <PlaceholderTab title="Badges" description="View and manage your profile badges." />
        )
      case "marketplace":
        return (
          <PlaceholderTab
            title="Marketplace"
            description="Browse and purchase themes and items."
          />
        )
      case "settings":
        return (
          <PlaceholderTab
            title="Settings"
            description="Manage your account and preferences."
          />
        )
      default:
        return <OverviewTab />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/30 bg-card/30 backdrop-blur-sm p-6">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">UV</span>
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight">
            User<span className="text-primary">Vault</span>
          </span>
        </Link>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.tab
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-border/30 mt-6">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">UV</span>
          </div>
          <span className="text-foreground font-bold tracking-tight">
            User<span className="text-primary">Vault</span>
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border/30 p-6 pt-20">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.tab}
                  onClick={() => {
                    setActiveTab(item.tab)
                    setSidebarOpen(false)
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.tab
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 md:pt-10 pt-20 overflow-auto">
        <div className="max-w-5xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  )
}

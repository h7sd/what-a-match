import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background mesh-gradient">
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-[85vh] p-8">
        <div className="max-w-4xl text-center space-y-8">
          <div className="space-y-5">
            <h1 className="text-7xl font-bold tracking-tight gradient-text text-balance">
              What A Match
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
              Find your perfect match and connect with people who share your interests. 
              Build meaningful relationships in a vibrant community.
            </p>
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="glow-sm" asChild>
              <a href="/dashboard">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/auth">Sign In</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass-card border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-foreground">Connect</CardTitle>
              <CardDescription>
                Find people who share your interests and values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our advanced matching algorithm helps you discover meaningful connections.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 hover:border-accent/30 transition-colors">
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-accent mb-2" />
              <CardTitle className="text-foreground">Engage</CardTitle>
              <CardDescription>
                Build authentic relationships through conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Chat, share experiences, and grow together in a supportive community.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-foreground">Thrive</CardTitle>
              <CardDescription>
                Create lasting memories with your matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                From friendships to partnerships, discover connections that matter.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

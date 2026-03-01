import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Bug, Zap, Shield, CalendarDays } from "lucide-react";

interface Changelog {
  id: string;
  version: string;
  title: string;
  description: string;
  category: string;
  is_major: boolean;
  published_at: string;
}

const categoryIcons = {
  feature: Sparkles,
  bugfix: Bug,
  improvement: Zap,
  security: Shield,
};

const categoryColors = {
  feature: "from-blue-500 to-red-500",
  bugfix: "from-red-500 to-rose-500",
  improvement: "from-red-500 to-red-500",
  security: "from-yellow-500 to-amber-500",
};

const categoryBadgeColors = {
  feature: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bugfix: "bg-red-500/20 text-red-400 border-red-500/30",
  improvement: "bg-red-500/20 text-red-400 border-red-500/30",
  security: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export function ChangelogSection() {
  const { data: changelogs, isLoading } = useQuery<Changelog[]>({
    queryKey: ["changelogs"],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-changelogs?limit=20`
      );

      if (!response.ok) {
        console.error('Changelog API error:', response.status, await response.text());
        return [];
      }

      const data = await response.json();
      return data.changelogs || [];
    },
  });

  const categories = ["all", "feature", "bugfix", "improvement", "security"];

  const getFilteredChangelogs = (category: string) => {
    if (!changelogs) return [];
    if (category === "all") return changelogs;
    return changelogs.filter((log) => log.category === category);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
            What's New
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stay up to date with the latest features, improvements, and fixes
          </p>
        </motion.div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-card/50 backdrop-blur-sm border border-white/10">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="feature">Features</TabsTrigger>
            <TabsTrigger value="bugfix">Fixes</TabsTrigger>
            <TabsTrigger value="improvement">Improvements</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                </div>
              ) : (
                getFilteredChangelogs(category).map((changelog, index) => {
                  const Icon = categoryIcons[changelog.category as keyof typeof categoryIcons];
                  const gradientClass = categoryColors[changelog.category as keyof typeof categoryColors];
                  const badgeClass = categoryBadgeColors[changelog.category as keyof typeof categoryBadgeColors];

                  return (
                    <motion.div
                      key={changelog.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-white/10 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all group">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="font-mono font-bold text-sm">
                                  {changelog.version}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`${badgeClass} border`}
                                >
                                  {changelog.category}
                                </Badge>
                                {changelog.is_major && (
                                  <Badge
                                    variant="outline"
                                    className="bg-purple-500/20 text-purple-400 border-purple-500/30"
                                  >
                                    Major
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                                  <CalendarDays className="w-3 h-3" />
                                  {formatDate(changelog.published_at)}
                                </span>
                              </div>

                              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                                {changelog.title}
                              </h3>

                              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {changelog.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}

              {!isLoading && getFilteredChangelogs(category).length === 0 && (
                <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      No {category === "all" ? "" : category} updates yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

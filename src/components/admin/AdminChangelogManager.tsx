import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Changelog {
  id: string;
  version: string;
  title: string;
  description: string;
  category: string;
  is_major: boolean;
  published_at: string;
  created_at: string;
}

export function AdminChangelogManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChangelog, setEditingChangelog] = useState<Changelog | null>(null);
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    description: "",
    category: "feature",
    is_major: false,
  });
  const queryClient = useQueryClient();

  const { data: changelogs, isLoading } = useQuery({
    queryKey: ["admin-changelogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("changelogs")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Changelog[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("changelogs")
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-changelogs"] });
      toast.success("Changelog created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create changelog: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("changelogs")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-changelogs"] });
      toast.success("Changelog updated successfully");
      setIsDialogOpen(false);
      setEditingChangelog(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update changelog: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("changelogs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-changelogs"] });
      toast.success("Changelog deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete changelog: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      version: "",
      title: "",
      description: "",
      category: "feature",
      is_major: false,
    });
    setEditingChangelog(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChangelog) {
      updateMutation.mutate({ id: editingChangelog.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (changelog: Changelog) => {
    setEditingChangelog(changelog);
    setFormData({
      version: changelog.version,
      title: changelog.title,
      description: changelog.description,
      category: changelog.category,
      is_major: changelog.is_major,
    });
    setIsDialogOpen(true);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "feature":
        return "bg-blue-500";
      case "bugfix":
        return "bg-red-500";
      case "improvement":
        return "bg-green-500";
      case "security":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Changelog Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Changelog
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingChangelog ? "Edit Changelog" : "Create New Changelog"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    placeholder="v1.2.3"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="New feature added"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of changes..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="bugfix">Bug Fix</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_major"
                    checked={formData.is_major}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_major: checked })
                    }
                  />
                  <Label htmlFor="is_major">Major Update</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingChangelog ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading changelogs...</div>
        ) : (
          <div className="space-y-4">
            {changelogs?.map((changelog) => (
              <Card key={changelog.id} className="border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-bold">
                          {changelog.version}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs text-white ${getCategoryBadgeColor(
                            changelog.category
                          )}`}
                        >
                          {changelog.category}
                        </span>
                        {changelog.is_major && (
                          <span className="px-2 py-1 rounded text-xs bg-purple-500 text-white">
                            Major
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {changelog.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                        {changelog.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Published: {new Date(changelog.published_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(changelog)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this changelog?")) {
                            deleteMutation.mutate(changelog.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {changelogs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No changelogs yet. Create one to get started!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

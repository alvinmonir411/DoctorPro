"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { blog as blogApi } from "@/lib/api";
import { toast } from "sonner";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Health Tips");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPosts = async () => {
    try {
      const res = await blogApi.getAll("publishedOnly=false");
      if (Array.isArray(res)) setPosts(res);
    } catch (err: any) {
      console.error("Failed to load blog posts", err);
      toast.error("Failed to Load Articles", {
        description: err?.message || "Could not fetch health articles.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const openAdd = () => {
    setEditingPost(null);
    setTitle("");
    setCategory("Health Tips");
    setExcerpt("");
    setContent("");
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingPost(p);
    setTitle(p.title);
    setCategory(p.category || "Health Tips");
    setExcerpt(p.excerpt || "");
    setContent(p.content || "");
    setIsPublished(p.isPublished ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPost) {
        await blogApi.update(editingPost.id, {
          title,
          category,
          excerpt,
          content,
          isPublished,
        });
        toast.success("Article Updated", { description: `"${title}" updated.` });
      } else {
        await blogApi.create({
          title,
          category,
          excerpt,
          content,
          isPublished,
        });
        toast.success("Article Published", { description: `"${title}" created.` });
      }
      setModalOpen(false);
      await loadPosts();
    } catch (err: any) {
      toast.error("Failed to Save Article", {
        description: err?.message || "Failed to save post",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await blogApi.delete(id);
      await loadPosts();
      toast.success("Article Deleted");
    } catch (err: any) {
      toast.error("Failed to Delete Article", {
        description: err?.message || "Failed to delete post",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Health Articles & Tips</h1>
          <p className="text-xs text-muted-foreground">Publish medical guides, patient advisories, and wellness articles</p>
        </div>

        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 rounded-xl text-xs">
          <Plus className="mr-1.5 h-4 w-4" /> New Article
        </Button>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6">
          {loading ? (
            <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ) : posts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-medium bg-muted/30">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {posts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground max-w-sm truncate">{p.title}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {p.category || "General"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.isPublished
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(p.createdAt).toISOString().split("T")[0]}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-3">
              <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">No Health Articles Yet</p>
              <p>Write patient education tips to build trust and educate visitors.</p>
              <Button onClick={openAdd} size="sm" className="bg-primary rounded-xl text-xs">
                Write First Article
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingPost ? "Edit Article" : "Write New Health Article"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Article Title *</Label>
              <Input
                placeholder="e.g. Tips for Managing High Blood Pressure"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Input
                  placeholder="e.g. Heart Health, Pediatrics, Nutrition"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <select
                  value={isPublished ? "true" : "false"}
                  onChange={(e) => setIsPublished(e.target.value === "true")}
                  className="w-full h-10 px-3 text-xs rounded-xl border bg-background"
                >
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Short Summary / Excerpt</Label>
              <Textarea
                placeholder="Brief summary appearing on blog preview cards..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="rounded-xl resize-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Full Article Content *</Label>
              <Textarea
                placeholder="Write article content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                required
                className="rounded-xl resize-none text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? "Saving..." : editingPost ? "Save Changes" : "Publish Article"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

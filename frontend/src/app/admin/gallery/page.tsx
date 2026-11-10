"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { gallery as galleryApi } from "@/lib/api";

export default function AdminGalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("Chamber");
  const [saving, setSaving] = useState(false);

  const loadGallery = async () => {
    try {
      const res = await galleryApi.getAll();
      if (Array.isArray(res)) setItems(res);
    } catch (err) {
      console.error("Failed to load gallery items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const openAdd = () => {
    setTitle("");
    setImage("");
    setCategory("Chamber");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await galleryApi.create({ title, image, category });
      setModalOpen(false);
      await loadGallery();
    } catch (err: any) {
      alert(err.message || "Failed to add image");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      await galleryApi.delete(id);
      await loadGallery();
    } catch (err: any) {
      alert(err.message || "Failed to delete photo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clinic Gallery</h1>
          <p className="text-xs text-muted-foreground">Manage showcase photos of medical facilities and consulting chambers</p>
        </div>

        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 rounded-xl text-xs">
          <Plus className="mr-1.5 h-4 w-4" /> Add Photo
        </Button>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6">
          {loading ? (
            <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="relative group rounded-2xl border overflow-hidden bg-card">
                  <div className="h-40 bg-muted relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl space-y-3">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">No Photos Uploaded</p>
              <p>Add photos of your clinic, waiting lounge, and medical equipment.</p>
              <Button onClick={openAdd} size="sm" className="bg-primary rounded-xl text-xs">
                Add Photo Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Clinic Photo</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Photo Title *</Label>
              <Input
                placeholder="e.g. Modern Consultation Chamber 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Image URL *</Label>
              <Input
                placeholder="https://... or /uploads/..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Input
                placeholder="e.g. Chamber, Reception, Diagnostics"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? "Saving..." : "Add to Gallery"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";
import { gallery as galleryApi } from "@/lib/api";

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await galleryApi.getAll("activeOnly=true");
        if (Array.isArray(res)) {
          setItems(res);
        }
      } catch (err) {
        console.error("Failed to load gallery", err);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20">Chamber & Clinic</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Clinic Gallery
          </h1>
          <p className="text-sm text-muted-foreground">
            Take a visual tour of our modern diagnostic center, consultation chambers, and medical facilities.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-60 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all border-border/80">
                <div className="h-56 bg-muted relative overflow-hidden flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="font-semibold text-sm">{item.title}</p>
                    {item.category && <p className="text-[11px] text-white/80">{item.category}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center max-w-md mx-auto space-y-3">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-bold text-base text-foreground">Clinic Gallery</h3>
            <p className="text-xs text-muted-foreground">
              Photos of the chambers and diagnostic units will be showcased here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

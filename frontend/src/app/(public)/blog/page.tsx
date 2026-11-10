"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Calendar, ArrowRight, User } from "lucide-react";
import { blog as blogApi } from "@/lib/api";

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await blogApi.getAll("publishedOnly=true");
        if (Array.isArray(res)) {
          setPosts(res);
        }
      } catch (err) {
        console.error("Failed to load blog posts", err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const filteredPosts = posts.filter((p) => {
    return (
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.content && p.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20">Health & Wellness</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Health Tips & Medical Articles
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay informed with clinical guidance, preventive care advice, and wellness tips from our doctors.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search health tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all border-border/80 flex flex-col justify-between">
                <div className="h-40 bg-gradient-to-br from-primary/15 via-primary/5 to-muted flex items-center justify-center p-6 text-center">
                  <span className="font-bold text-lg text-primary line-clamp-2">{post.title}</span>
                </div>
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {post.category && (
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                    )}
                    <h3 className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug || post.id}`}>{post.title}</Link>
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {post.excerpt || post.content.substring(0, 140) + "..."}
                    </p>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <Button asChild variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto font-semibold hover:bg-transparent">
                      <Link href={`/blog/${post.slug || post.id}`}>
                        Read More <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center max-w-md mx-auto space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-bold text-base text-foreground">Health Articles</h3>
            <p className="text-xs text-muted-foreground">
              Health tips and medical advisories will appear here as soon as published by the clinic team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

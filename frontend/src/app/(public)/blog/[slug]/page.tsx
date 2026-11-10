"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { blog as blogApi } from "@/lib/api";

export default function BlogPostDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      try {
        if (!slug) return;
        const res = await blogApi.getBySlug(slug);
        setPost(res);
      } catch (err) {
        console.error("Failed to load blog post", err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="h-48 max-w-2xl mx-auto rounded-3xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold">Article Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <article className="container mx-auto px-4 max-w-3xl space-y-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> All Health Articles
          </Link>
        </Button>

        <div className="space-y-4">
          {post.category && (
            <Badge variant="secondary" className="text-xs">
              {post.category}
            </Badge>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pb-4 border-b">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-primary" />
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            {post.author && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4 text-primary" />
                {post.author.name}
              </span>
            )}
          </div>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm md:text-base leading-relaxed whitespace-pre-line text-foreground/90">
          {post.content}
        </div>
      </article>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingDisplayProps {
  rating?: number;
  reviewCount?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showCount?: boolean;
  showEmptyLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<StarRatingDisplayProps["size"]>, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRatingDisplay({
  rating = 0,
  reviewCount = 0,
  size = "sm",
  showCount = true,
  showEmptyLabel = true,
  className,
}: StarRatingDisplayProps) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const safeCount = Math.max(0, Number(reviewCount) || 0);
  const iconClass = SIZE_CLASSES[size];

  return (
    <div className={cn("inline-flex items-center gap-1.5 flex-wrap", className)}>
      <div
        className="inline-flex items-center gap-0.5"
        aria-label={
          safeCount > 0
            ? `Rated ${safeRating.toFixed(1)} out of 5 stars from ${safeCount} reviews`
            : "No patient reviews yet"
        }
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const fillFraction = Math.max(0, Math.min(1, safeRating - (starIndex - 1)));
          return (
            <span key={starIndex} className="relative inline-flex shrink-0">
              <Star
                className={cn(iconClass, "text-slate-200 fill-slate-200 dark:text-slate-700 dark:fill-slate-700")}
              />
              {fillFraction > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${Math.round(fillFraction * 100)}%` }}
                >
                  <Star className={cn(iconClass, "text-amber-400 fill-amber-400")} />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showCount && (
        safeCount > 0 ? (
          <span className="text-xs font-semibold text-foreground">
            {safeRating.toFixed(1)}{" "}
            <span className="font-normal text-muted-foreground">
              ({safeCount} {safeCount === 1 ? "review" : "reviews"})
            </span>
          </span>
        ) : showEmptyLabel ? (
          <span className="text-[11px] font-medium text-muted-foreground">
            No reviews yet
          </span>
        ) : null
      )}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

interface InteractiveStarPickerProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function InteractiveStarPicker({
  value,
  onChange,
  disabled = false,
  size = "lg",
}: InteractiveStarPickerProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const displayRating = hoverRating || value;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div
        className="inline-flex items-center gap-1"
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => !disabled && setHoverRating(star)}
              aria-label={`Rate ${star} out of 5 stars (${RATING_LABELS[star]})`}
              className={cn(
                "p-1 rounded-lg transition-transform focus:outline-hidden focus:ring-2 focus:ring-primary/40",
                disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-110",
              )}
            >
              <Star
                className={cn(
                  SIZE_CLASSES[size],
                  active
                    ? "text-amber-400 fill-amber-400 drop-shadow-2xs"
                    : "text-slate-300 fill-slate-100 hover:text-amber-300",
                )}
              />
            </button>
          );
        })}
      </div>
      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
        {displayRating}/5 — {RATING_LABELS[displayRating] || "Select rating"}
      </span>
    </div>
  );
}

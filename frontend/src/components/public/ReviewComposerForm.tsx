"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { InteractiveStarPicker, StarRatingDisplay } from "./StarRating";
import { reviews as reviewsApi } from "@/lib/api";
import { DoctorReview } from "@/types";
import { toast } from "sonner";

interface ReviewComposerFormProps {
  doctorId: string;
  doctorName?: string;
  appointmentId: string;
  phone: string;
  visitLabel?: string;
  compact?: boolean;
  onSubmitted?: (review: DoctorReview) => void;
}

export function ReviewComposerForm({
  doctorId,
  doctorName,
  appointmentId,
  phone,
  visitLabel,
  compact = false,
  onSubmitted,
}: ReviewComposerFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [submittedReview, setSubmittedReview] = useState<DoctorReview | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = comment.trim();
    if (trimmed.length < 3) {
      setError("Please share at least a brief comment (minimum 3 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const created = await reviewsApi.create({
        doctorId,
        appointmentId,
        phone: phone.trim(),
        rating,
        comment: trimmed,
      });
      setSubmittedReview(created);
      setComment("");
      toast.success("Thank you for your verified review!", {
        description: doctorName
          ? `Your ${rating}-star review for ${doctorName} is now published.`
          : "Your verified review is now published.",
      });
      onSubmitted?.(created);
    } catch (err: any) {
      const msg = err?.message || "Unable to submit review. Please try again.";
      setError(msg);
      toast.error("Review Submission Failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReview) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-2">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          Verified Review Published
        </div>
        <StarRatingDisplay
          rating={submittedReview.rating}
          reviewCount={1}
          showCount={false}
          size="sm"
        />
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
          {submittedReview.comment}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Verified Completed Consultation</span>
        </div>
        {visitLabel && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {visitLabel}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground">
          Your Rating *
        </Label>
        <InteractiveStarPicker
          value={rating}
          onChange={setRating}
          disabled={submitting}
          size={compact ? "md" : "lg"}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`review-comment-${appointmentId}`} className="text-xs font-semibold text-foreground">
            Your Consultation Review *
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {comment.length}/1500
          </span>
        </div>
        <Textarea
          id={`review-comment-${appointmentId}`}
          placeholder={
            doctorName
              ? `Share how your consultation with ${doctorName} went...`
              : "Share how your consultation and treatment experience went..."
          }
          rows={compact ? 3 : 4}
          maxLength={1500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={submitting}
          className="rounded-xl bg-background text-sm resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        size={compact ? "sm" : "default"}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing Review...
          </>
        ) : (
          <>
            <MessageSquarePlus className="h-4 w-4 mr-2" /> Submit Verified Review
          </>
        )}
      </Button>
    </form>
  );
}

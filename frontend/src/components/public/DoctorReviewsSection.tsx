"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Phone,
  SearchCheck,
  ShieldCheck,
  Star,
} from "lucide-react";
import { reviews as reviewsApi } from "@/lib/api";
import { DoctorReview, RatingBreakdown, ReviewEligibility } from "@/types";
import { StarRatingDisplay } from "./StarRating";
import { ReviewComposerForm } from "./ReviewComposerForm";

interface DoctorReviewsSectionProps {
  doctorId: string;
  doctorName: string;
  averageRating?: number;
  reviewCount?: number;
  ratingBreakdown?: RatingBreakdown;
  reviews?: DoctorReview[];
  onReviewCreated?: () => void;
}

const EMPTY_BREAKDOWN: RatingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

function formatDateLabel(iso?: string | null): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DoctorReviewsSection({
  doctorId,
  doctorName,
  averageRating = 0,
  reviewCount = 0,
  ratingBreakdown,
  reviews = [],
  onReviewCreated,
}: DoctorReviewsSectionProps) {
  const [phoneInput, setPhoneInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("doctorpro_last_phone");
      if (saved && !phoneInput) {
        setPhoneInput(saved);
      }
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [phoneInput]);

  const breakdown = ratingBreakdown || EMPTY_BREAKDOWN;

  const filteredReviews = useMemo(() => {
    if (ratingFilter === "all") return reviews;
    return reviews.filter((r) => r.rating === ratingFilter);
  }, [reviews, ratingFilter]);

  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phoneInput.trim();
    if (!trimmed) return;

    setChecking(true);
    setEligibility(null);
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("doctorpro_last_phone", trimmed);
        } catch {
          // Ignore storage error
        }
      }
      const res: ReviewEligibility = await reviewsApi.checkEligibility(
        doctorId,
        trimmed,
      );
      setEligibility(res);
      if (res.completedVisits && res.completedVisits.length > 0) {
        setSelectedAppointmentId(res.completedVisits[0].appointmentId);
      } else {
        setSelectedAppointmentId("");
      }
    } catch (err: any) {
      setEligibility({
        doctorId,
        doctorName,
        eligible: false,
        reason: "ERROR",
        message: err?.message || "Could not verify your consultation right now.",
        completedVisits: [],
        reviewedVisits: [],
        pendingVisitCount: 0,
      });
    } finally {
      setChecking(false);
    }
  };

  const handleReviewSuccess = async () => {
    if (phoneInput.trim()) {
      try {
        const refreshed: ReviewEligibility = await reviewsApi.checkEligibility(
          doctorId,
          phoneInput.trim(),
        );
        setEligibility(refreshed);
        setSelectedAppointmentId(
          refreshed.completedVisits?.[0]?.appointmentId || "",
        );
      } catch {
        setEligibility(null);
      }
    }
    onReviewCreated?.();
  };

  return (
    <section id="reviews" className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Verified Patient Reviews & Ratings
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Every review is linked to a completed consultation with {doctorName}.
          </p>
        </div>
        {reviewCount > 0 && (
          <Badge className="self-start sm:self-auto bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-50 px-3 py-1 text-xs font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-1" />
            {averageRating.toFixed(1)} Average ({reviewCount}{" "}
            {reviewCount === 1 ? "Review" : "Reviews"})
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Rating Summary + Write a Review */}
        <div className="md:col-span-5 space-y-6">
          <Card className="rounded-2xl border shadow-xs">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="text-center pr-4 border-r border-border min-w-[84px]">
                  <div className="text-4xl font-black text-foreground leading-none">
                    {reviewCount > 0 ? averageRating.toFixed(1) : "—"}
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1">
                    out of 5.0
                  </p>
                </div>
                <div className="space-y-1">
                  <StarRatingDisplay
                    rating={averageRating}
                    reviewCount={reviewCount}
                    showCount={false}
                    size="md"
                  />
                  <p className="text-xs text-muted-foreground">
                    {reviewCount > 0
                      ? `Based on ${reviewCount} verified ${
                          reviewCount === 1 ? "consultation" : "consultations"
                        }`
                      : "No completed-visit reviews yet"}
                  </p>
                </div>
              </div>

              {/* 5-star breakdown */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = breakdown[star] || 0;
                  const pct =
                    reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                  const isSelected = ratingFilter === star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setRatingFilter((prev) => (prev === star ? "all" : star))
                      }
                      className={`w-full flex items-center gap-2.5 text-xs rounded-lg px-1.5 py-1 transition-colors cursor-pointer ${
                        isSelected ? "bg-amber-50 font-semibold" : "hover:bg-muted/60"
                      }`}
                    >
                      <span className="w-8 text-left font-medium flex items-center gap-0.5 shrink-0">
                        {star}{" "}
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-muted-foreground tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Write a Review Card */}
          <Card className="rounded-2xl border shadow-xs">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Write a Verified Review
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Patients who booked an appointment and completed their visit can rate and review {doctorName}.
                </p>
              </div>

              <form onSubmit={handleCheckEligibility} className="space-y-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="verify-review-phone"
                    className="text-xs font-semibold"
                  >
                    Booking Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="verify-review-phone"
                      type="tel"
                      placeholder="Enter phone used at booking"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="pl-8 h-9 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={checking || !phoneInput.trim()}
                  className="w-full rounded-xl text-xs font-semibold"
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Checking Completed Visit...
                    </>
                  ) : (
                    <>
                      <SearchCheck className="h-3.5 w-3.5 mr-1.5" />
                      Verify Completed Visit
                    </>
                  )}
                </Button>
              </form>

              {eligibility && (
                <div className="pt-2 border-t border-border/60 space-y-3">
                  {eligibility.eligible && eligibility.completedVisits.length > 0 ? (
                    <div className="space-y-3">
                      {eligibility.completedVisits.length > 1 && (
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="select-completed-visit"
                            className="text-xs font-semibold"
                          >
                            Select Completed Consultation
                          </Label>
                          <select
                            id="select-completed-visit"
                            value={selectedAppointmentId}
                            onChange={(e) =>
                              setSelectedAppointmentId(e.target.value)
                            }
                            className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium"
                          >
                            {eligibility.completedVisits.map((visit) => (
                              <option
                                key={visit.appointmentId}
                                value={visit.appointmentId}
                              >
                                {formatDateLabel(visit.date)} • {visit.timeSlot}
                                {visit.serialNumber
                                  ? ` (Serial #${visit.serialNumber})`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {(() => {
                        const activeVisit =
                          eligibility.completedVisits.find(
                            (v) => v.appointmentId === selectedAppointmentId,
                          ) || eligibility.completedVisits[0];

                        return (
                          <ReviewComposerForm
                            doctorId={eligibility.doctorId}
                            doctorName={doctorName}
                            appointmentId={activeVisit.appointmentId}
                            phone={phoneInput}
                            visitLabel={`${formatDateLabel(activeVisit.date)} • ${activeVisit.timeSlot}`}
                            compact
                            onSubmitted={handleReviewSuccess}
                          />
                        );
                      })()}
                    </div>
                  ) : eligibility.reason === "VISIT_NOT_COMPLETED" ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-2 text-xs text-amber-900">
                      <div className="font-bold flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        Consultation Not Completed Yet
                      </div>
                      <p className="leading-relaxed">{eligibility.message}</p>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-7 text-[11px] border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                      >
                        <Link href={`/live-queue?doctorId=${doctorId}`}>
                          Check Live Queue Status
                        </Link>
                      </Button>
                    </div>
                  ) : eligibility.reason === "ALREADY_REVIEWED" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 space-y-1.5 text-xs text-emerald-900">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        Already Reviewed
                      </div>
                      <p className="leading-relaxed">{eligibility.message}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs text-slate-700">
                      <div className="font-bold flex items-center gap-1.5 text-foreground">
                        <AlertCircle className="h-4 w-4 text-slate-500 shrink-0" />
                        Completed Visit Required
                      </div>
                      <p className="leading-relaxed">{eligibility.message}</p>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-7 text-[11px]"
                      >
                        <Link href={`/appointment?doctorId=${doctorId}`}>
                          <Calendar className="h-3 w-3 mr-1" /> Book an Appointment
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Complete Review List */}
        <div className="md:col-span-7 space-y-4">
          {reviewCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRatingFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  ratingFilter === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted text-muted-foreground border-border"
                }`}
              >
                All Reviews ({reviewCount})
              </button>
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const cnt = breakdown[star] || 0;
                if (cnt === 0) return null;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingFilter(star)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                      ratingFilter === star
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-background hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {star}★ ({cnt})
                  </button>
                );
              })}
            </div>
          )}

          {filteredReviews.length === 0 ? (
            <Card className="rounded-2xl border border-dashed">
              <CardContent className="p-8 text-center space-y-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-semibold text-foreground">
                  {reviewCount === 0
                    ? `Be the first verified patient to review ${doctorName}`
                    : `No ${ratingFilter}-star reviews yet`}
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {reviewCount === 0
                    ? "Once you book an appointment and complete your consultation, verify your phone number on the left to share your full review."
                    : "Try selecting another rating filter or view all verified reviews."}
                </p>
                {ratingFilter !== "all" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRatingFilter("all")}
                    className="text-xs mt-1"
                  >
                    Show All Reviews
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review.id} className="rounded-2xl border shadow-xs">
                  <CardContent className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {review.patientName?.charAt(0)?.toUpperCase() || "P"}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {review.patientName}
                            </span>
                            {review.isVerified && (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px] font-semibold">
                                <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
                                Verified Visit
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                            {review.visitDate && (
                              <span>
                                Visited {formatDateLabel(review.visitDate)}
                                {review.visitSlot ? ` (${review.visitSlot})` : ""}
                              </span>
                            )}
                            {review.visitDate && <span>•</span>}
                            <span>Reviewed {formatDateLabel(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <StarRatingDisplay
                        rating={review.rating}
                        reviewCount={1}
                        showCount={false}
                        size="sm"
                      />
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {review.comment}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

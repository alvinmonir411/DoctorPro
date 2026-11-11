"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Star,
  Stethoscope,
} from "lucide-react";
import { doctors as doctorsApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";
import { Doctor } from "@/types";
import { StarRatingDisplay } from "./StarRating";

export function TopRatedDoctorsSlider() {
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTopRated() {
      try {
        const res = await doctorsApi.getAll("activeOnly=true&topRated=true");
        if (!cancelled && Array.isArray(res)) {
          setDoctorsList(res.slice(0, 12));
        }
      } catch (err) {
        console.error("Failed to fetch top rated doctors", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadTopRated();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxIndex = Math.max(0, doctorsList.length - visibleCount);

  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused || maxIndex <= 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  if (!loading && doctorsList.length === 0) {
    return null;
  }

  const totalStops = maxIndex + 1;

  return (
    <section
      id="top-rated-doctors"
      className="py-16 md:py-20 bg-linear-to-b from-slate-50/70 to-white border-t border-slate-100"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              Patient Rated Specialists
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a1e3b]">
              Top Rated Doctors & Chambers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Discover our highest-rated physicians ranked by verified post-visit patient reviews and clinical experience.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-end">
            {totalStops > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous top rated doctors"
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next top rated doctors"
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
            <Link
              href="/doctors"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              View All Doctors <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[420px] rounded-3xl bg-slate-100/80 animate-pulse border border-slate-200/60"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-hidden -mx-3 py-1">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${(activeIndex * 100) / visibleCount}%)`,
                }}
              >
                {doctorsList.map((doc) => {
                  const rating = Number(doc.averageRating) || 0;
                  const reviewCount = Number(doc.reviewCount) || 0;

                  return (
                    <div
                      key={doc.id}
                      className="w-full md:w-1/2 lg:w-1/3 shrink-0 px-3"
                    >
                      <Card className="h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white hover:shadow-lg transition-all duration-300 group flex flex-col">
                        <div className="relative h-64 w-full bg-slate-100 overflow-hidden shrink-0">
                          {doc.image ? (
                            <img
                              src={getMediaUrl(doc.image)}
                              alt={doc.name}
                              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-teal-600/30 bg-teal-50/40">
                              <Stethoscope className="h-16 w-16" />
                            </div>
                          )}

                          {/* Rating Pill Overlay */}
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-amber-200/80 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            {reviewCount > 0 ? (
                              <span>
                                {rating.toFixed(1)}{" "}
                                <span className="font-normal text-slate-500">
                                  ({reviewCount})
                                </span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-700">
                                Top Specialist
                              </span>
                            )}
                          </div>

                          {doc.certificate && (
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                              <FileCheck className="h-3 w-3 text-emerald-600" /> Verified
                            </div>
                          )}
                        </div>

                        <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/doctors/${doc.slug || doc.id}`}
                                className="font-bold text-base text-[#0a1e3b] hover:text-teal-600 transition-colors leading-snug"
                              >
                                {doc.name}
                              </Link>
                              {doc.department && (
                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                  {doc.department.name}
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-teal-600">
                              {doc.specialization}
                            </p>
                            {doc.title && (
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {doc.title}
                              </p>
                            )}

                            <div className="pt-1">
                              <StarRatingDisplay
                                rating={rating}
                                reviewCount={reviewCount}
                                size="xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 flex items-center gap-1">
                                <Award className="h-3.5 w-3.5 text-teal-600" />
                                {doc.experienceYears || 0}+ yrs experience
                              </span>
                              <span className="font-bold text-sm text-[#0a1e3b]">
                                ${doc.consultationFee}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs"
                              >
                                <Link href={`/doctors/${doc.slug || doc.id}`}>
                                  Full Profile
                                </Link>
                              </Button>
                              <Button
                                asChild
                                size="sm"
                                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs"
                              >
                                <Link href={`/appointment?doctorId=${doc.id}`}>
                                  <Calendar className="h-3 w-3 mr-1" /> Book
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {totalStops > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalStops }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Show slide ${idx + 1}`}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeIndex === idx
                        ? "w-7 bg-teal-600"
                        : "w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

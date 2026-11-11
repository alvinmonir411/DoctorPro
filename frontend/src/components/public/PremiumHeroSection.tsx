"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Award,
  Calendar,
  Clock,
  FileCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Doctor } from "@/types";
import { getMediaUrl } from "@/lib/utils";

interface PremiumHeroSectionProps {
  doctors?: Doctor[];
}

const QUICK_SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
];

const FALLBACK_SPOTLIGHT: Partial<Doctor>[] = [
  {
    id: "rohan-karim",
    slug: "dr-rohan-karim",
    name: "Dr. Rohan Karim",
    specialization: "Senior Interventional Cardiologist",
    title: "MBBS, MD (Cardiology), FACC",
    experienceYears: 15,
    consultationFee: 120,
    image: "/images/doctors/dr-01.jpg",
    department: {
      id: "cardio",
      name: "Cardiology",
      slug: "cardiology",
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
  },
  {
    id: "nadia-rahman",
    slug: "dr-nadia-rahman",
    name: "Dr. Nadia Rahman",
    specialization: "Senior Neurologist & Stroke Specialist",
    title: "MBBS, FCPS, MD (Neurology)",
    experienceYears: 12,
    consultationFee: 110,
    image: "/images/doctors/dr-02.jpg",
    department: {
      id: "neuro",
      name: "Neurology",
      slug: "neurology",
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
  },
  {
    id: "farhan-chowdhury",
    slug: "dr-farhan-chowdhury",
    name: "Dr. Farhan Chowdhury",
    specialization: "Consultant Orthopedic Surgeon",
    title: "MBBS, MS (Orthopedics)",
    experienceYears: 14,
    consultationFee: 100,
    image: "/images/doctors/dr-03.jpg",
    department: {
      id: "ortho",
      name: "Orthopedics",
      slug: "orthopedics",
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
  },
];

const AVATAR_STACK = [
  { src: "/images/doctors/dr-01.jpg", alt: "Senior Specialist 1" },
  { src: "/images/doctors/dr-02.jpg", alt: "Senior Specialist 2" },
  { src: "/images/doctors/dr-03.jpg", alt: "Senior Specialist 3" },
  { src: "/images/doctors/dr-04.jpg", alt: "Senior Specialist 4" },
];

export function PremiumHeroSection({ doctors = [] }: PremiumHeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const spotlightDoctors = useMemo(() => {
    const withImages = doctors.filter((d) => Boolean(d.image));
    if (withImages.length > 0) {
      return withImages.slice(0, 4);
    }
    return FALLBACK_SPOTLIGHT as Doctor[];
  }, [doctors]);

  useEffect(() => {
    if (spotlightIndex >= spotlightDoctors.length) {
      setSpotlightIndex(0);
    }
  }, [spotlightDoctors.length, spotlightIndex]);

  useEffect(() => {
    if (isHoveringCard || spotlightDoctors.length <= 1) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlightDoctors.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHoveringCard, spotlightDoctors.length]);

  const reviewStats = useMemo(() => {
    const reviewed = doctors.filter((d) => (d.reviewCount || 0) > 0);
    const totalReviews = reviewed.reduce((acc, d) => acc + (d.reviewCount || 0), 0);
    if (totalReviews === 0) {
      return { totalReviews: 0, averageRating: 0 };
    }
    const weightedSum = reviewed.reduce(
      (acc, d) => acc + (Number(d.averageRating) || 0) * (d.reviewCount || 0),
      0,
    );
    return {
      totalReviews,
      averageRating: Math.round((weightedSum / totalReviews) * 10) / 10,
    };
  }, [doctors]);

  const avatarRing = useMemo(() => {
    const withImgs = doctors.filter((d) => Boolean(d.image)).slice(0, 4);
    if (withImgs.length >= 4) {
      return withImgs.map((d) => ({
        src: getMediaUrl(d.image!),
        alt: d.name,
      }));
    }
    return AVATAR_STACK;
  }, [doctors]);

  const activeDoctor = spotlightDoctors[spotlightIndex] || spotlightDoctors[0];
  const isRealDoctor = doctors.length > 0 && doctors.some((d) => d.id === activeDoctor?.id);
  const activeRating = Number(activeDoctor?.averageRating) || 0;
  const activeReviewCount = Number(activeDoctor?.reviewCount) || 0;
  const totalSpecialistsCount = doctors.length > 0 ? doctors.length : 20;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/doctors?search=${encodeURIComponent(q)}` : "/doctors");
  };

  return (
    <section className="relative overflow-hidden bg-white pt-8 pb-16 sm:pt-12 lg:pt-16 lg:pb-24">
      {/* ─── Atmospheric Architectural Background ───────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {/* Ambient Soft Radial Glows */}
        <div className="absolute -top-32 -left-24 h-[460px] w-[460px] rounded-full bg-sky-200/40 blur-[110px]" />
        <div className="absolute top-12 right-0 h-[440px] w-[440px] rounded-full bg-teal-200/35 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[500px] rounded-full bg-cyan-100/30 blur-[100px]" />

        {/* Subtle Architectural Grid Masked Gently */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,30,59,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,30,59,0.035)_1px,transparent_1px)] bg-[size:48px_48px]"
          style={{
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%)",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* ─── Left Column: Editorial Headline + Search + Trust Bar ─── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Eyebrow Pill */}
            <div className="inline-flex flex-wrap items-center gap-2.5 rounded-full border border-sky-200/80 bg-white/90 backdrop-blur-md px-3.5 py-1.5 shadow-xs">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live Chamber Queue
              </span>
              <span className="h-3 w-px bg-slate-200" />
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0a1e3b]">
                <Sparkles className="h-3 w-3 text-sky-600" />
                {totalSpecialistsCount}+ Board-Certified Specialists
              </span>
            </div>

            {/* Editorial Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black tracking-[-0.03em] text-[#0a1e3b] leading-[1.06]">
              Precision Care for a{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Healthier
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 14"
                  fill="none"
                  className="absolute -bottom-1.5 left-0 w-full h-3 text-teal-500/75"
                >
                  <path
                    d="M3 10.5C58 2.5 148 2 217 8.5"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              Tomorrow.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Consult trusted senior physicians, reserve your chamber slot in seconds, and track your live consultation serial in real time — zero guesswork.
            </p>

            {/* Quick Specialist Search Bar */}
            <div className="max-w-xl space-y-2.5">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl sm:rounded-full bg-white p-2 shadow-[0_20px_50px_-15px_rgba(10,30,59,0.16)] border border-slate-200/90 focus-within:border-sky-400 transition-colors"
              >
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctor, specialty, or department..."
                    aria-label="Search specialist doctor or department"
                    className="w-full h-11 pl-10 pr-3 bg-transparent text-sm text-[#0a1e3b] placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 px-6 rounded-xl sm:rounded-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-600/20 shrink-0 cursor-pointer"
                >
                  Find Doctor
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px]">
                <span className="font-semibold text-slate-400 mr-1">Popular:</span>
                {QUICK_SPECIALTIES.map((spec) => (
                  <Link
                    key={spec}
                    href={`/doctors?search=${encodeURIComponent(spec)}`}
                    className="px-2.5 py-0.5 rounded-full bg-slate-100/80 hover:bg-sky-50 hover:text-sky-700 border border-slate-200/60 hover:border-sky-200 text-slate-600 font-medium transition-colors"
                  >
                    {spec}
                  </Link>
                ))}
              </div>
            </div>

            {/* Dual CTA Actions */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Button
                asChild
                className="h-12 px-7 rounded-full bg-[#0a1e3b] hover:bg-[#07162c] text-white font-semibold text-sm shadow-lg shadow-[#0a1e3b]/20 transition-all hover:-translate-y-0.5"
              >
                <Link href="/appointment" className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-sky-300" />
                  Book Consultation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 px-6 rounded-full border-emerald-200/90 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950 font-semibold text-sm transition-all"
              >
                <Link href="/live-queue" className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Track Live Serial
                </Link>
              </Button>
            </div>

            {/* Verified Specialist Avatar Ring + Clinical Highlights */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 sm:gap-8">
              {/* Doctor Avatars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {avatarRing.map((avatar, i) => (
                    <img
                      key={`${avatar.src}-${i}`}
                      src={avatar.src}
                      alt={avatar.alt}
                      className="h-9 w-9 rounded-full object-cover object-top ring-2 ring-white shadow-xs bg-slate-100"
                    />
                  ))}
                  {totalSpecialistsCount > avatarRing.length && (
                    <div className="h-9 w-9 rounded-full bg-[#0a1e3b] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
                      +{totalSpecialistsCount - avatarRing.length}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className="h-3.5 w-3.5 text-amber-400 fill-amber-400"
                      />
                    ))}
                    {reviewStats.totalReviews > 0 && (
                      <span className="text-xs font-bold text-[#0a1e3b] ml-1">
                        {reviewStats.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {reviewStats.totalReviews > 0
                      ? `From ${reviewStats.totalReviews} verified patient reviews`
                      : "Verified specialists ready to consult"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                      Emergency
                    </span>
                    <strong className="text-[#0a1e3b] text-xs">24/7 Support</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                      Quality
                    </span>
                    <strong className="text-[#0a1e3b] text-xs">Board Certified</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right Column: Luxury Specialist Stage Showcase ─── */}
          <div
            className="lg:col-span-5 relative lg:pl-4"
            onMouseEnter={() => setIsHoveringCard(true)}
            onMouseLeave={() => setIsHoveringCard(false)}
          >
            <div className="relative mx-auto max-w-[460px]">
              {/* Soft Halo Glow */}
              <div
                aria-hidden="true"
                className="absolute -inset-4 rounded-[44px] bg-gradient-to-tr from-sky-200/45 via-cyan-100/30 to-teal-200/45 blur-2xl"
              />

              {/* Frosted Double-Rim Frame */}
              <div className="relative rounded-[34px] bg-white/80 backdrop-blur-xl p-2.5 shadow-[0_32px_70px_-20px_rgba(10,30,59,0.22)] border border-white ring-1 ring-slate-200/70">
                <div className="relative overflow-hidden rounded-[26px] bg-slate-100">
                  <img
                    src={getMediaUrl(activeDoctor?.image || "/images/doctors/dr-01.jpg")}
                    alt={activeDoctor?.name || "Lead Medical Specialist"}
                    className="w-full h-[380px] sm:h-[460px] lg:h-[490px] object-cover object-top transition-all duration-700"
                  />

                  {/* Subtle Editorial Contrast Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e3b]/88 via-[#0a1e3b]/15 to-transparent" />

                  {/* Top-Left Floating Glass Status Pill */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-lg border border-white/80">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[11px] font-bold text-[#0a1e3b]">
                        Chambers Open Today
                      </span>
                    </div>

                    {/* Top-Right Rating / Experience Pill */}
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-lg border border-white/80">
                      {activeReviewCount > 0 ? (
                        <>
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-[#0a1e3b]">
                            {activeRating.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({activeReviewCount})
                          </span>
                        </>
                      ) : (
                        <>
                          <Award className="h-3.5 w-3.5 text-sky-600" />
                          <span className="text-[11px] font-bold text-[#0a1e3b]">
                            {activeDoctor?.experienceYears || 15}+ Yrs Exp
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inside-Image Bottom Spotlight Dock */}
                  <div className="absolute bottom-4 left-4 right-4 space-y-3">
                    <div className="rounded-2xl bg-white/95 backdrop-blur-xl p-4 shadow-2xl border border-white/90">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-full">
                              {activeDoctor?.department?.name || "Featured Specialist"}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                              <FileCheck className="h-3 w-3" /> Verified
                            </span>
                          </div>
                          <Link
                            href={
                              activeDoctor?.slug || activeDoctor?.id
                                ? `/doctors/${activeDoctor.slug || activeDoctor.id}`
                                : "/doctors"
                            }
                            className="block font-extrabold text-sm sm:text-base text-[#0a1e3b] hover:text-sky-600 transition-colors truncate mt-1.5"
                          >
                            {activeDoctor?.name}
                          </Link>
                          <p className="text-[11px] text-slate-500 truncate">
                            {activeDoctor?.specialization}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block text-[10px] text-slate-400 font-medium">
                            Fee
                          </span>
                          <span className="font-black text-base text-[#0a1e3b]">
                            ${activeDoctor?.consultationFee ?? 120}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {spotlightDoctors.length > 1 ? (
                          <div className="flex items-center gap-1.5">
                            {spotlightDoctors.map((doc, idx) => (
                              <button
                                key={doc.id || idx}
                                type="button"
                                aria-label={`Showcase ${doc.name}`}
                                onClick={() => setSpotlightIndex(idx)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                  idx === spotlightIndex
                                    ? "w-6 bg-sky-600"
                                    : "w-1.5 bg-slate-300 hover:bg-slate-400"
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Instant Serial Confirmed
                          </span>
                        )}

                        <Link
                          href={
                            isRealDoctor && activeDoctor?.id
                              ? `/appointment?doctorId=${activeDoctor.id}`
                              : "/appointment"
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0a1e3b] hover:bg-sky-700 text-white text-[11px] font-semibold transition-colors shrink-0"
                        >
                          Book Slot <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

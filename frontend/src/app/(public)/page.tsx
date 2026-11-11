"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  ArrowRight,
  ShieldCheck,
  Clock,
  Users,
  Stethoscope,
  Activity,
  Baby,
  Smile,
  Eye,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  Building2,
  Cpu,
  UserCheck,
  ShieldAlert,
  Calendar,
} from "lucide-react";
import { doctors as doctorsApi, services as servicesApi, blog as blogApi } from "@/lib/api";
import { Doctor } from "@/types";
import { PremiumHeroSection } from "@/components/public/PremiumHeroSection";
import { TopRatedDoctorsSlider } from "@/components/public/TopRatedDoctorsSlider";

// ─── 8 Departments with pastel styling from reference design ───
const DEPARTMENTS = [
  {
    name: "Cardiology",
    slug: "cardiology",
    icon: Heart,
    bg: "bg-rose-50 hover:bg-rose-100/80 border-rose-100",
    iconColor: "text-rose-500",
  },
  {
    name: "Neurology",
    slug: "neurology",
    icon: Activity,
    bg: "bg-sky-50 hover:bg-sky-100/80 border-sky-100",
    iconColor: "text-sky-600",
  },
  {
    name: "Orthopedics",
    slug: "orthopedics",
    icon: Activity,
    bg: "bg-teal-50 hover:bg-teal-100/80 border-teal-100",
    iconColor: "text-teal-600",
  },
  {
    name: "Pediatrics",
    slug: "pediatrics",
    icon: Baby,
    bg: "bg-cyan-50 hover:bg-cyan-100/80 border-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    name: "Gynecology",
    slug: "gynecology",
    icon: Heart,
    bg: "bg-pink-50 hover:bg-pink-100/80 border-pink-100",
    iconColor: "text-pink-500",
  },
  {
    name: "General Medicine",
    slug: "general-medicine",
    icon: Stethoscope,
    bg: "bg-blue-50 hover:bg-blue-100/80 border-blue-100",
    iconColor: "text-blue-600",
  },
  {
    name: "Dermatology",
    slug: "dermatology",
    icon: Sparkles,
    bg: "bg-amber-50 hover:bg-amber-100/80 border-amber-100",
    iconColor: "text-amber-500",
  },
  {
    name: "Oncology",
    slug: "oncology",
    icon: Activity,
    bg: "bg-purple-50 hover:bg-purple-100/80 border-purple-100",
    iconColor: "text-purple-600",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "The care I received at DoctorPro was exceptional. The doctors and staff were kind, professional, and truly cared about my well-being throughout my treatment.",
    name: "Priya Sharma",
    role: "Patient",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    quote:
      "Booking an appointment took less than a minute. No unnecessary waiting, and the consultation was thorough, detailed, and reassuring. Highly recommended!",
    name: "Tanvir Ahmed",
    role: "Patient",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    quote:
      "DoctorPro has the best medical team in the city. The diagnostics are prompt, clean facilities, and the doctors listen with genuine empathy.",
    name: "Sarah Jenkins",
    role: "Patient",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    rating: 5,
  },
];

export default function HomePage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [topDoctors, setTopDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [docsRes, blogsRes] = await Promise.allSettled([
          doctorsApi.getAll("activeOnly=true&topRated=true"),
          blogApi.getAll("publishedOnly=true"),
        ]);
        if (docsRes.status === "fulfilled" && Array.isArray(docsRes.value)) {
          setTopDoctors(docsRes.value);
        }
        if (blogsRes.status === "fulfilled" && Array.isArray(blogsRes.value)) {
          setBlogPosts(blogsRes.value.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDoctorsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
  };
  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const currentStory = TESTIMONIALS[activeTestimonial];

  return (
    <div className="flex flex-col bg-white overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Premium Editorial Clinical Showcase)
      ───────────────────────────────────────────────────────────── */}
      <PremiumHeroSection doctors={topDoctors} />

      {/* ─────────────────────────────────────────────────────────────
          2. OUR DEPARTMENTS SECTION (8 Soft Pastel Cards)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a1e3b]">
                Our Departments
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Comprehensive care for every stage of life.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              View All Departments <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* 8 Department Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              return (
                <Link
                  key={dept.slug}
                  href={`/services?dept=${dept.slug}`}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border ${dept.bg} transition-all duration-200 hover:-translate-y-1 hover:shadow-md text-center group`}
                >
                  <div className={`h-12 w-12 rounded-2xl bg-white shadow-xs flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${dept.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-semibold text-xs text-[#0a1e3b] leading-tight">
                    {dept.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <TopRatedDoctorsSlider
        initialDoctors={topDoctors}
        initialLoading={doctorsLoading}
      />

      {/* ─────────────────────────────────────────────────────────────
          3. "A PRACTICE BUILT AROUND YOU" OVERVIEW SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-slate-50/50 border-y border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Building Architecture Image */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-[28px] shadow-lg border border-slate-200/80">
                <img
                  src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80"
                  alt="Modern DoctorPro Medical Practice Center Building"
                  className="w-full h-80 sm:h-96 object-cover"
                />
              </div>
            </div>

            {/* Middle: Mission Text */}
            <div className="lg:col-span-4 space-y-4">
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-sky-600">
                ADVANCED. COMPASSIONATE. TRUSTED.
              </p>
              <h2 className="text-3xl font-extrabold text-[#0a1e3b] tracking-tight leading-tight">
                A Practice Built Around You
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We combine world-class infrastructure with a human touch to deliver exceptional healthcare for individuals and families.
              </p>
              <div className="pt-2">
                <Button
                  asChild
                  className="h-11 px-6 rounded-full bg-[#0a1e3b] hover:bg-[#07162c] text-white font-semibold text-xs shadow-sm"
                >
                  <Link href="/about" className="flex items-center gap-1.5">
                    About Our Clinic <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: 4 Metrics Grid (2x2) */}
            <div className="lg:col-span-3 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <p className="text-2xl sm:text-3xl font-black text-[#0a1e3b]">50K+</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Patients Treated</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <p className="text-2xl sm:text-3xl font-black text-[#0a1e3b]">100+</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Expert Doctors</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <p className="text-2xl sm:text-3xl font-black text-[#0a1e3b]">15+</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Specialized Depts</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <p className="text-2xl sm:text-3xl font-black text-[#0a1e3b]">24/7</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Emergency Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. DUAL FEATURE BANNERS (Card 1: Light Blue, Card 2: Deep Navy)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* Card 1: Light Soft Blue "Experienced Doctors, Exceptional Care" */}
            <div className="rounded-[32px] bg-[#e6f4fe] border border-sky-100 p-6 sm:p-8 xl:p-10 shadow-xs flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-6 overflow-hidden">
              <div className="w-full sm:flex-1 lg:w-full xl:flex-1 space-y-3 min-w-0">
                <h3 className="text-2xl sm:text-[28px] font-black text-[#0a1e3b] leading-tight">
                  Experienced Doctors, Exceptional Care
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                  Our team of specialists is committed to your well-being.
                </p>
                <div className="pt-3">
                  <Button
                    asChild
                    className="h-11 px-6 rounded-full bg-[#0a1e3b] hover:bg-[#07162c] text-white font-semibold text-xs whitespace-nowrap"
                  >
                    <Link href="/doctors" className="inline-flex items-center gap-1.5">
                      Meet Our Doctors <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="w-full sm:w-56 md:w-64 lg:w-full xl:w-48 shrink-0 overflow-hidden rounded-2xl shadow-sm bg-white/60 ring-1 ring-white/80">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80"
                  alt="Doctor with Stethoscope"
                  className="w-full h-60 sm:h-64 lg:h-60 xl:h-64 object-cover object-top"
                />
              </div>
            </div>

            {/* Card 2: Deep Navy "Emergency Care When You Need It Most" */}
            <div className="rounded-[32px] bg-[#0a1e3b] text-white p-6 sm:p-8 xl:p-10 shadow-md flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-6 overflow-hidden">
              <div className="w-full sm:flex-1 lg:w-full xl:flex-1 space-y-3 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5" /> 24/7 Available
                </div>
                <h3 className="text-2xl sm:text-[28px] font-black text-white leading-tight">
                  Emergency Care When You Need It Most
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                  Our emergency team is always ready to provide fast, reliable, and life-saving care.
                </p>
                <div className="pt-3">
                  <Button
                    asChild
                    className="h-11 px-6 rounded-full bg-white hover:bg-slate-100 text-[#0a1e3b] font-semibold text-xs shadow-sm whitespace-nowrap"
                  >
                    <Link href="/contact" className="inline-flex items-center gap-1.5">
                      View Emergency Services <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative w-full sm:w-56 md:w-64 lg:w-full xl:w-48 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80"
                  alt="Illuminated Emergency Ward"
                  className="w-full h-60 sm:h-64 lg:h-60 xl:h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e3b]/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. "WHY CHOOSE MEDICARE+ / DOCTORPRO" SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-slate-50/40 border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0a1e3b] tracking-tight">
                Why Choose DoctorPro+
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                More than a clinic — a partner in your health journey.
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              Learn More <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-[#0a1e3b]">Patient-Centric Approach</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your comfort, privacy, and well-being always come first.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Cpu className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-[#0a1e3b]">Advanced Technology</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                State-of-the-art clinical facilities for accurate diagnosis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-[#0a1e3b]">Expert Medical Team</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Highly qualified and experienced certified specialists.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-3 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-[#0a1e3b]">Affordable & Transparent</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Quality medical care that is transparent and accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. REAL STORIES, REAL IMPACT + BOOK APPOINTMENT SPLIT BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: Testimonial Card */}
            <div className="lg:col-span-6 rounded-[32px] bg-white border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between shadow-xs">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0a1e3b]">
                      Real Stories, Real Impact
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hear from our patients who trust us with their health.
                    </p>
                  </div>
                  {/* Arrow controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevTestimonial}
                      className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-black transition-colors"
                      aria-label="Previous story"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextTestimonial}
                      className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-black transition-colors"
                      aria-label="Next story"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Quote Text */}
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{currentStory.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Author Info + Stars */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
                <div className="flex items-center gap-3">
                  <img
                    src={currentStory.avatar}
                    alt={currentStory.name}
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#0a1e3b]">{currentStory.name}</p>
                    <p className="text-[11px] text-slate-400">{currentStory.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Book Your Appointment Today Card with Framed Reception Photo */}
            <div className="lg:col-span-6 rounded-[32px] bg-gradient-to-br from-sky-50 via-sky-100/50 to-white border border-sky-100 p-6 sm:p-8 xl:p-10 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-6 shadow-xs overflow-hidden">
              <div className="w-full sm:flex-1 lg:w-full xl:flex-1 space-y-4 min-w-0">
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-sky-600">
                  YOUR HEALTH MATTERS
                </p>
                <h3 className="text-2xl sm:text-[28px] font-black text-[#0a1e3b] leading-tight">
                  Book Your Appointment Today
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                  Take the first step towards a healthier tomorrow with our certified doctors.
                </p>
                <div className="pt-2">
                  <Button
                    asChild
                    className="h-11 px-7 rounded-full bg-[#0a1e3b] hover:bg-[#07162c] text-white font-semibold text-xs shadow-md whitespace-nowrap"
                  >
                    <Link href="/appointment" className="inline-flex items-center gap-2">
                      Book Appointment <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Reception Photo */}
              <div className="w-full sm:w-56 md:w-64 lg:w-full xl:w-48 shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-sky-100">
                <img
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80"
                  alt="Modern Clinic Reception Desk"
                  className="w-full h-52 sm:h-60 lg:h-48 xl:h-64 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. LATEST FROM OUR BLOG SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-slate-50/50 border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0a1e3b] tracking-tight">
                Latest from Our Blog
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Health tips, stories, and updates.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              View All Posts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fallback default clean medical articles */}
            <Card className="rounded-[24px] overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
              <div className="h-48 relative overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80"
                  alt="Healthy Heart Tips"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                    Cardiology
                  </span>
                  <h3 className="font-bold text-base text-[#0a1e3b] hover:text-sky-600 transition-colors">
                    <Link href="/blog">Top 5 Habits for a Strong and Healthy Heart</Link>
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Cardiovascular wellness starts with everyday routines. Learn preventive measures recommended by cardiologists.
                  </p>
                </div>
                <div className="pt-3 border-t text-[11px] text-slate-400 flex items-center justify-between">
                  <span>5 min read</span>
                  <Link href="/blog" className="text-sky-600 font-semibold inline-flex items-center gap-1 hover:underline">
                    Read Story <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
              <div className="h-48 relative overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80"
                  alt="Nutrition Guide"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
                    Wellness
                  </span>
                  <h3 className="font-bold text-base text-[#0a1e3b] hover:text-sky-600 transition-colors">
                    <Link href="/blog">Managing Blood Pressure Naturally Through Diet</Link>
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Simple dietary changes that bring measurable reductions in hypertension and cardiovascular strain.
                  </p>
                </div>
                <div className="pt-3 border-t text-[11px] text-slate-400 flex items-center justify-between">
                  <span>4 min read</span>
                  <Link href="/blog" className="text-sky-600 font-semibold inline-flex items-center gap-1 hover:underline">
                    Read Story <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
              <div className="h-48 relative overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80"
                  alt="Pediatric Health"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                    Pediatrics
                  </span>
                  <h3 className="font-bold text-base text-[#0a1e3b] hover:text-sky-600 transition-colors">
                    <Link href="/blog">Essential Vaccination Schedule for Children</Link>
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    A comprehensive guide for parents to safeguard their children against preventable illnesses.
                  </p>
                </div>
                <div className="pt-3 border-t text-[11px] text-slate-400 flex items-center justify-between">
                  <span>6 min read</span>
                  <Link href="/blog" className="text-sky-600 font-semibold inline-flex items-center gap-1 hover:underline">
                    Read Story <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Search,
  ArrowRight,
  Menu,
  X,
  Phone,
  Stethoscope,
  Activity,
} from "lucide-react";

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const pathname = usePathname();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Departments", href: "/services" },
    { label: "Doctors", href: "/doctors" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100">
      {/* ─── Top Notification Bar (Reference Design Dark Navy) ─────── */}
      {showTopBar && (
        <div className="bg-[#0c1e38] text-white text-xs py-2 px-4 transition-all">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 mx-auto sm:mx-0">
              <span className="text-slate-300 hidden md:inline">
                Need immediate doctor consultation or chamber appointment?
              </span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-sky-400" /> Hotline: +1 (555) 911-0000
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/live-queue"
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors text-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Serial Tracker
              </Link>

              <button
                onClick={() => setShowTopBar(false)}
                className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Header Navigation ──────────────────────────────────── */}
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo with MediCare+ style */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Activity className="h-6 w-6 stroke-[2.5]" />
            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="block h-1.5 w-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-[#0a1e3b]">
              Doctor<span className="text-sky-600">Pro</span>
              <span className="text-cyan-500 font-extrabold">+</span>
            </span>
            <span className="text-[10px] tracking-wide text-slate-500 font-medium -mt-1">
              Better Care, Brighter Tomorrows
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-3.5 py-2 text-[14px] font-medium rounded-full transition-all ${
                isActive(link.href)
                  ? "text-sky-600 font-semibold"
                  : "text-slate-600 hover:text-[#0a1e3b] hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* Search Button */}
          <Link
            href="/doctors"
            className="h-10 w-10 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Search doctors and departments"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Book Appointment CTA Pill (Reference Style Dark Navy) */}
          <Button
            asChild
            className="h-11 px-6 rounded-full bg-[#0a1e3b] hover:bg-[#07162c] text-white font-semibold text-xs tracking-wide shadow-md shadow-slate-900/10 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Link href="/appointment" className="flex items-center gap-2">
              Book Appointment <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white px-6 py-5 shadow-xl animate-in slide-in-from-top-3">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 text-sm font-semibold transition-colors ${
                  isActive(link.href) ? "text-sky-600" : "text-slate-700 hover:text-sky-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t flex flex-col gap-2.5">
              <Button asChild className="w-full h-11 bg-[#0a1e3b] hover:bg-[#07162c] rounded-full text-xs">
                <Link href="/appointment" onClick={() => setMobileMenuOpen(false)}>
                  Book Appointment <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-11 rounded-full text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <Link href="/live-queue" onClick={() => setMobileMenuOpen(false)}>
                  Live Serial Tracker
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

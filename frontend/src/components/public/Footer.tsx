import React from "react";
import Link from "next/link";
import { Activity, Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-[#0c1e38] text-white pt-16 pb-12 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand info (Col 1-4) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-md">
                <Activity className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Doctor<span className="text-sky-400">Pro</span>
                <span className="text-cyan-400 font-extrabold">+</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
              Premium medical practice and diagnostic center. Dedicated to delivering compassionate, evidence-based healthcare for individuals and families.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <span className="text-sky-400 font-semibold">24/7 Support Hotline:</span> +1 (555) 911-0000
            </div>
          </div>

          {/* Quick Links (Col 5-7) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-bold text-xs tracking-wider uppercase text-sky-400">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3 text-sky-400" /> About Our Clinic
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3 text-sky-400" /> Specialist Doctors
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3 text-sky-400" /> Clinical Departments
                </Link>
              </li>
              <li>
                <Link href="/appointment" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3 text-sky-400" /> Book an Appointment
                </Link>
              </li>
              <li>
                <Link href="/live-queue" className="hover:text-white transition-colors flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ArrowRight className="h-3 w-3 text-emerald-400" /> Live Serial & Queue Tracker
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3 text-sky-400" /> Health Tips & Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Consulting Hours (Col 8-9) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-bold text-xs tracking-wider uppercase text-sky-400">
              Clinic Hours
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div>
                <p className="font-semibold text-white">Mon - Sat</p>
                <p className="text-slate-400">8:00 AM - 8:00 PM</p>
              </div>
              <div className="pt-1">
                <p className="font-semibold text-amber-400">Sunday</p>
                <p className="text-slate-400">Emergency & On-Call</p>
              </div>
            </div>
          </div>

          {/* Contact (Col 10-12) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-bold text-xs tracking-wider uppercase text-sky-400">
              Clinic Location
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>450 Lexington Ave, Suite 1400, New York, NY 10017</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-sky-400 shrink-0" />
                <span>Reception: +1 (555) 234-5678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sky-400 shrink-0" />
                <span>contact@doctorpro.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} DoctorPro. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Terms of Care
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

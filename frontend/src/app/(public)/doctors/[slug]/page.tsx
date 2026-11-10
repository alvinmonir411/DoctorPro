"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Award,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Maximize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { doctors as doctorsApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";

const DAYS_MAP = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    async function fetchDoctor() {
      try {
        if (!slug) return;
        const res = await doctorsApi.getBySlug(slug);
        setDoctor(res);
      } catch (err) {
        console.error("Failed to load doctor profile", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctor();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="h-48 max-w-2xl mx-auto rounded-3xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold">Doctor Profile Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested doctor could not be located.</p>
        <Button asChild variant="outline">
          <Link href="/doctors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Doctors
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 space-y-8 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/doctors">
            <ArrowLeft className="mr-2 h-4 w-4" /> All Doctors
          </Link>
        </Button>

        {/* Doctor Header Card */}
        <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {doctor.image ? (
              <div
                className="relative h-44 w-36 md:h-52 md:w-44 rounded-2xl overflow-hidden shrink-0 border border-border shadow-md bg-muted cursor-pointer group"
                onClick={() => setLightboxOpen(true)}
                title="Click to view full uncropped photo"
              >
                <img
                  src={getMediaUrl(doctor.image)}
                  alt={doctor.name}
                  className="h-full w-full object-cover object-top transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-2.5 py-1 rounded-full bg-black/75 text-white text-[11px] font-semibold flex items-center gap-1">
                    <Maximize2 className="h-3 w-3" /> Full View
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-44 w-36 md:h-52 md:w-44 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl shrink-0 border border-primary/20">
                {doctor.name.charAt(0)}
              </div>
            )}

            <div className="space-y-3 flex-1 text-center md:text-left">
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{doctor.name}</h1>
                  {doctor.department && (
                    <Badge variant="secondary">{doctor.department.name}</Badge>
                  )}
                  {doctor.certificate && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 text-xs">
                      <FileCheck className="h-3 w-3 mr-1 text-emerald-600" /> BMDC Verified
                    </Badge>
                  )}
                </div>
                <p className="text-primary font-semibold text-sm mt-0.5">{doctor.specialization}</p>
                <p className="text-xs text-muted-foreground">{doctor.title}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground pt-1">
                {doctor.experienceYears > 0 && (
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-primary" /> {doctor.experienceYears}+ Years Experience
                  </span>
                )}
                {doctor.chamberAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary" /> {doctor.chamberAddress}
                  </span>
                )}
              </div>

              {doctor.certificate && (
                <div className="pt-2">
                  <a
                    href={getMediaUrl(doctor.certificate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
                  >
                    <FileCheck className="h-3.5 w-3.5 text-emerald-600" /> View Doctor Certificate / License <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4 border-t">
                <div>
                  <span className="text-xs text-muted-foreground">Consultation Fee</span>
                  <p className="text-xl font-bold text-foreground">৳{doctor.consultationFee}</p>
                </div>
                <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-8 ml-auto">
                  <Link href={`/appointment?doctorId=${doctor.id}`}>
                    <Calendar className="mr-2 h-4 w-4" /> Book Appointment
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Bio & Schedules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Bio & Qualifications */}
          <div className="md:col-span-7 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> About Doctor
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {doctor.bio || "Dedicated specialist providing personalized clinical treatment and expert healthcare consultation."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Weekly Schedule */}
          <div className="md:col-span-5 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Weekly Schedule
                </h3>

                {doctor.schedules && doctor.schedules.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {doctor.schedules.map((sch: any) => (
                      <div
                        key={sch.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60"
                      >
                        <span className="font-semibold text-foreground">
                          {DAYS_MAP[sch.dayOfWeek] || `Day ${sch.dayOfWeek}`}
                        </span>
                        <span className="text-primary font-medium">
                          {sch.startTime} - {sch.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Consultation available by prior booking. Please click below to choose an available date.
                  </p>
                )}

                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-xs rounded-xl" size="sm">
                  <Link href={`/appointment?doctorId=${doctor.id}`}>
                    Select Date & Time
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Lightbox Dialog to View Full Picture */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-2xl p-4 bg-background/95 backdrop-blur-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-bold flex items-center justify-between">
              <span>{doctor.name}</span>
              <span className="text-xs text-muted-foreground font-normal">{doctor.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/5 p-2">
            {doctor.image && (
              <img
                src={getMediaUrl(doctor.image)}
                alt={doctor.name}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
